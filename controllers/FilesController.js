import { ObjectID } from 'mongodb';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import Queue from 'bull';
import { findUserIdByToken } from '../utils/helpers';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class FilesController {
  /**
   * Create a new file in DB and disk
   */
  static async postUpload(request, response) {
    const fileQueue = new Queue('fileQueue');
    
    // Retrieve the user based on the token
    const userId = await findUserIdByToken(request);
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });

    const { name, type, isPublic = false, parentId = 0, data } = request.body;

    // Validate input data
    if (!name) return response.status(400).json({ error: 'Missing name' });
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return response.status(400).json({ error: 'Invalid type' });
    }
    if (!data && type !== 'folder') return response.status(400).json({ error: 'Missing data' });

    // Handle parentId
    if (parentId !== 0) {
      const parentFile = await dbClient.files.findOne({ _id: ObjectID(parentId) });
      if (!parentFile) return response.status(400).json({ error: 'Parent not found' });
      if (parentFile.type !== 'folder') return response.status(400).json({ error: 'Parent is not a folder' });
    }

    let fileInserted;

    // Insert folder into DB
    if (type === 'folder') {
      fileInserted = await dbClient.files.insertOne({
        userId: ObjectID(userId),
        name,
        type,
        isPublic,
        parentId: parentId === 0 ? parentId : ObjectID(parentId),
      });
    } else {
      // Create directory for files
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

      // Generate a unique filename and store the file
      const filenameUUID = uuidv4();
      const localPath = `${folderPath}/${filenameUUID}`;
      const clearData = Buffer.from(data, 'base64');
      await fs.promises.writeFile(localPath, clearData.toString());

      // Insert file into DB
      fileInserted = await dbClient.files.insertOne({
        userId: ObjectID(userId),
        name,
        type,
        isPublic,
        parentId: parentId === 0 ? parentId : ObjectID(parentId),
        localPath,
      });

      // Handle image-specific processing
      if (type === 'image') {
        await fs.promises.writeFile(localPath, clearData, { flag: 'w+', encoding: 'binary' });
        await fileQueue.add({ userId, fileId: fileInserted.insertedId, localPath });
      }
    }

    // Return the new file
    return response.status(201).json({
      id: fileInserted.ops[0]._id, userId, name, type, isPublic, parentId,
    });
  }

  /**
   * Retrieve file by fileId
   */
  static async getShow(request, response) {
    const userId = await findUserIdByToken(request);
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });

    const fileId = request.params.id || '';
    const fileDocument = await dbClient.files.findOne({ _id: ObjectID(fileId), userId: ObjectID(userId) });
    if (!fileDocument) return response.status(404).json({ error: 'Not found' });

    return response.json({
      id: fileDocument._id,
      userId: fileDocument.userId,
      name: fileDocument.name,
      type: fileDocument.type,
      isPublic: fileDocument.isPublic,
      parentId: fileDocument.parentId,
    });
  }

  /**
   * Retrieve files attached to the user
   */
  static async getIndex(request, response) {
    const userId = await findUserIdByToken(request);
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });

    const parentId = request.query.parentId || '0';
    const page = parseInt(request.query.page, 10) || 0;
    const limit = 20;

    const files = await dbClient.files.aggregate([
      { $match: { parentId: parentId === '0' ? 0 : ObjectID(parentId), userId: ObjectID(userId) } },
      { $skip: page * limit },
      { $limit: limit }
    ]).toArray();

    return response.json(files.map(file => ({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    })));
  }
}

export default FilesController;


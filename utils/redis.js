import redis from 'redis'

class RedisClient {
  constructor() {
    this.client = redis.createClient({
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          // End reconnecting on a specific error and flush all commands with an individual error
          return new Error('The server refused the connection')
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          // End reconnecting after a specific timeout and flush all commands with an individual error
          return new Error('Retry time exhausted')
        }
        if (options.attempt > 10) {
          // End reconnecting with built in error
          return undefined
        }
        // Reconnect after a delay
        return Math.min(options.attempt * 100, 3000)
      },
    })

    this.client.on('error', (error) => {
      console.error(`Redis client error: ${error}`)
    })
  }

  isAlive() {
    return this.client.connected
  }

  async get(key) {
    return new Promise((resolve, reject) => {
      this.client.get(key, (error, reply) => {
        if (error) {
          reject(error)
        } else {
          resolve(reply)
        }
      })
    })
  }

  async set(key, value, durationInSeconds) {
    return new Promise((resolve, reject) => {
      this.client.setex(key, durationInSeconds, value, (error, reply) => {
        if (error) {
          reject(error)
        } else {
          resolve(reply)
        }
      })
    })
  }

  async del(key) {
    return new Promise((resolve, reject) => {
      this.client.del(key, (error, reply) => {
        if (error) {
          reject(error)
        } else {
          resolve(reply)
        }
      })
    })
  }

  // Gracefully quit the Redis connection
  async quit() {
    return new Promise((resolve, reject) => {
      this.client.quit((error, reply) => {
        if (error) {
          reject(error)
        } else {
          resolve(reply)
        }
      })
    })
  }
}

const redisClient = new RedisClient()
export default redisClient


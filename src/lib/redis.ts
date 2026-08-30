import { Redis } from '@upstash/redis'

const redisClientSingleton = () => {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
}

declare const globalThis: {
  redisGlobal: ReturnType<typeof redisClientSingleton>
} & typeof global

const redis = globalThis.redisGlobal ?? redisClientSingleton()

export default redis

if (process.env.NODE_ENV !== 'production') globalThis.redisGlobal = redis

import { Redis } from "@upstash/redis";

declare const globalThis: {
  redisGlobal?: Redis;
} & typeof global;

function createRedisClient(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url) {
    throw new Error("Missing UPSTASH_REDIS_REST_URL");
  }

  if (!token) {
    throw new Error("Missing UPSTASH_REDIS_REST_TOKEN");
  }

  return new Redis({
    url,
    token,
  });
}

export function getRedisClient(): Redis {
  if (globalThis.redisGlobal) {
    return globalThis.redisGlobal;
  }

  const client = createRedisClient();

  if (process.env.NODE_ENV !== "production") {
    globalThis.redisGlobal = client;
  }

  return client;
}

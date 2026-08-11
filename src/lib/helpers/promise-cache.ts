const promiseCache = new Map<string, Promise<unknown>>();

export function getCachedPromise<T>(key: string, factory: () => Promise<T>): Promise<T> {
  const cachedPromise = promiseCache.get(key);

  if (cachedPromise) {
    return cachedPromise as Promise<T>;
  }

  const promise = factory().catch((error: unknown) => {
    promiseCache.delete(key);
    throw error;
  });

  promiseCache.set(key, promise);

  return promise;
}

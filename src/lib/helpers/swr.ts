import { mutate } from "swr";
import { apiRequest } from "src/lib/api-client";

export type CompanyPathKey = readonly [string, string];

export function buildCompanyPathKey(companyId: string | null, path: string | null): CompanyPathKey | null {
  if (!companyId || !path) {
    return null;
  }

  return [companyId, path] as const;
}

export async function companyPathFetcher<T>(_companyId: string, path: string): Promise<T> {
  const response = await apiRequest(path);
  return response.json() as Promise<T>;
}

export async function revalidateCompanyScope(companyId: string, pathPrefixes: string[]): Promise<void> {
  await mutate((key) => {
    if (!Array.isArray(key) || key.length < 2) {
      return false;
    }

    const [keyCompanyId, keyPath] = key as [string, string];

    if (keyCompanyId !== companyId) {
      return false;
    }

    return pathPrefixes.some((pathPrefix) => keyPath.startsWith(pathPrefix));
  });
}

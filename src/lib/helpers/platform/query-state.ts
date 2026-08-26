export function readEnumParam<T extends string>(
  searchParams: URLSearchParams,
  key: string,
  allowedValues: readonly T[],
  fallbackValue: T
): T {
  const value = searchParams.get(key);

  if (!value) {
    return fallbackValue;
  }

  if (allowedValues.includes(value as T)) {
    return value as T;
  }

  return fallbackValue;
}

export function readOptionalEnumParam<T extends string>(
  searchParams: URLSearchParams,
  key: string,
  allowedValues: readonly T[]
): T | undefined {
  const value = searchParams.get(key);

  if (!value) {
    return undefined;
  }

  if (allowedValues.includes(value as T)) {
    return value as T;
  }

  return undefined;
}

export function readPositiveIntegerParam(
  searchParams: URLSearchParams,
  key: string,
  fallbackValue: number
): number {
  const value = searchParams.get(key);

  if (!value) {
    return fallbackValue;
  }

  const parsedValue = Number.parseInt(value, 10);

  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    return fallbackValue;
  }

  return parsedValue;
}

export function readOptionalStringParam(searchParams: URLSearchParams, key: string): string | undefined {
  const value = searchParams.get(key)?.trim();

  if (!value) {
    return undefined;
  }

  return value;
}

export function readOptionalDateParam(searchParams: URLSearchParams, key: string): string | undefined {
  const value = searchParams.get(key)?.trim();

  if (!value) {
    return undefined;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  return undefined;
}

export function createNormalizedSearchParams(
  values: Record<string, string | number | null | undefined>,
  defaults: Record<string, string | number | null | undefined> = {}
): URLSearchParams {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    const defaultValue = defaults[key];

    if (value === undefined || value === null || value === "" || value === defaultValue) {
      continue;
    }

    searchParams.set(key, String(value));
  }

  return searchParams;
}

function normalizeGeminiCatalogValue(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\biibb\b/g, "ingresos brutos")
    .replace(/\bingr brutos\b/g, "ingresos brutos")
    .replace(/\bperc\b/g, "percepcion")
    .replace(/\bpercep\b/g, "percepcion")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildGeminiCatalogTokens(value: string): string[] {
  return normalizeGeminiCatalogValue(value)
    .split(" ")
    .filter((token) => token.length > 2);
}

function hasRequiredGeminiTokens(valueTokens: string[], catalogTokens: string[]): boolean {
  if (!catalogTokens.length) {
    return false;
  }

  return catalogTokens.every((token) => valueTokens.includes(token));
}

export function resolveGeminiCatalogMatch<T extends { name: string }>(
  value: string | undefined,
  items: T[]
): T | undefined {
  if (!value) {
    return undefined;
  }

  const normalizedValue = normalizeGeminiCatalogValue(value);
  const exactMatch = items.find((item) => normalizeGeminiCatalogValue(item.name) === normalizedValue);

  if (exactMatch) {
    return exactMatch;
  }

  const valueTokens = buildGeminiCatalogTokens(value);

  return items.find((item) => {
    return hasRequiredGeminiTokens(valueTokens, buildGeminiCatalogTokens(item.name));
  });
}

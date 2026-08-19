const replacementCharacter = "\uFFFD";

function normalizeLineBreaks(value: string): string {
  return value.replace(/\r\n/g, "\n");
}

function removeInvalidControlCharacters(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

export function normalizeParserText(value: string): string {
  return removeInvalidControlCharacters(normalizeLineBreaks(value)).normalize("NFC");
}

export function hasCorruptedParserText(value: string): boolean {
  return normalizeParserText(value).includes(replacementCharacter);
}

export const inputLimits = {
  maxNameLength: 255,
  maxSearchLength: 255,
  maxFreeTextLength: 5000,
  maxVoucherPosNumberLength: 5,
  maxVoucherNumberLength: 8,
  maxPaymentMethodLength: 100,
  maxBulkItemIds: 1000,
  maxParserFiles: 20,
  maxParserRequestBytes: 24 * 1024 * 1024,
  maxParserTransportBodySize: "32mb",
} as const

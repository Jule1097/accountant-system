type BivariantCallback<TInput, TOutput> = { bivarianceHack(value: TInput): TOutput }["bivarianceHack"]

export interface UrlParameterConfig<T> {
  defaultValue: T
  parse?: (value: string | null) => T
  normalize?: BivariantCallback<T, T>
  serialize?: BivariantCallback<T, string | null>
  allowedValues?: readonly T[]
}

export type UrlParameterConfigs = Record<string, UrlParameterConfig<unknown>>

export type ParsedUrlState<TConfigs extends UrlParameterConfigs> = {
  [TKey in keyof TConfigs]: TConfigs[TKey] extends UrlParameterConfig<infer TValue> ? TValue : never
}

import { ParsedUrlState, UrlParameterConfig, UrlParameterConfigs } from "src/types/shared/url-state"

function parseParameter<T>(value: string | null, config: UrlParameterConfig<T>): T {
  if (value === null) {
    return config.defaultValue
  }

  const parsedValue = config.parse ? config.parse(value) : value as T
  const normalizedValue = config.normalize ? config.normalize(parsedValue) : parsedValue

  if (config.allowedValues && !config.allowedValues.includes(normalizedValue)) {
    return config.defaultValue
  }

  return normalizedValue
}

export function parseUrlState<TConfigs extends UrlParameterConfigs>(searchParams: URLSearchParams, parameters: TConfigs): ParsedUrlState<TConfigs> {
  const state = Object.fromEntries(Object.entries(parameters).map(([key, config]) => [key, parseParameter(searchParams.get(key), config)]))
  return state as ParsedUrlState<TConfigs>
}

export function updateUrlState<TConfigs extends UrlParameterConfigs>(currentSearchParams: URLSearchParams, parameters: TConfigs, values: Partial<ParsedUrlState<TConfigs>>): URLSearchParams {
  const nextSearchParams = new URLSearchParams(currentSearchParams)

  Object.entries(values).forEach(([key, value]) => {
    const config = parameters[key]
    if (!config) {
      return
    }

    const normalizedValue = config.normalize ? config.normalize(value) : value
    const allowedValue = config.allowedValues && !config.allowedValues.includes(normalizedValue) ? config.defaultValue : normalizedValue
    const serializedValue = config.serialize ? config.serialize(allowedValue) : allowedValue === null || allowedValue === undefined ? null : String(allowedValue)

    if (serializedValue === null || serializedValue === "") {
      nextSearchParams.delete(key)
      return
    }

    nextSearchParams.set(key, serializedValue)
  })

  return nextSearchParams
}

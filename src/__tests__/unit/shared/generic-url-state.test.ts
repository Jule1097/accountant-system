import {
  parseUrlState,
  updateUrlState,
} from "src/lib/helpers/shared/url-state"

describe("generic URL state", () => {
  const parameters = {
    page: {
      defaultValue: 1,
      parse: (value: string | null) => Number(value),
      normalize: (value: number) => Number.isInteger(value) && value > 0 ? value : 1,
    },
    sort: {
      defaultValue: "date",
      parse: (value: string | null) => value ?? "date",
      normalize: (value: string) => ["date", "status"].includes(value) ? value : "date",
    },
    search: {
      defaultValue: "",
      parse: (value: string | null) => value ?? "",
      normalize: (value: string) => value.trim(),
      serialize: (value: string) => value || null,
    },
  } as const

  it("parses declared values, applies defaults, and normalizes invalid values", () => {
    const state = parseUrlState(new URLSearchParams("page=invalid&sort=unknown&search=%20acme%20"), parameters)

    expect(state).toEqual({ page: 1, sort: "date", search: "acme" })
  })

  it("supports custom parsing and serialization while preserving unrelated parameters", () => {
    const current = new URLSearchParams("page=3&foreign=keep")
    const updated = updateUrlState(current, parameters, { search: "acme" })

    expect(updated.toString()).toBe("page=3&foreign=keep&search=acme")
  })

  it("removes values serialized as null and keeps the original params untouched", () => {
    const current = new URLSearchParams("page=3&search=old&foreign=keep")
    const updated = updateUrlState(current, parameters, { search: "" })

    expect(updated.toString()).toBe("page=3&foreign=keep")
    expect(current.toString()).toBe("page=3&search=old&foreign=keep")
  })
})

/** @jest-environment jsdom */

import { act, renderHook } from "@testing-library/react"
import { useConciliationRasterPreview } from "src/hooks/conciliation/use-conciliation-raster-preview"

describe("useConciliationRasterPreview", () => {
  it("updates zoom and rotation independently and resets on demand", () => {
    const { result } = renderHook(() => useConciliationRasterPreview())

    act(() => {
      result.current.zoomIn()
      result.current.rotateClockwise()
    })

    expect(result.current.zoom).toBe(1.25)
    expect(result.current.rotation).toBe(90)

    act(() => result.current.reset())

    expect(result.current).toEqual(expect.objectContaining({ zoom: 1, rotation: 0 }))
  })

  it("allows reducing image zoom to twenty-five percent", () => {
    const { result } = renderHook(() => useConciliationRasterPreview())

    act(() => {
      result.current.zoomOut()
      result.current.zoomOut()
      result.current.zoomOut()
    })

    expect(result.current.zoom).toBe(0.25)
  })
})

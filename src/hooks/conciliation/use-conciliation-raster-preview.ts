"use client"

import { useCallback, useState } from "react"
import { conciliationRasterPreview } from "src/lib/constants/conciliation"
import { ConciliationRasterPreviewState } from "src/types/conciliation/conciliation-raster-preview"

export function useConciliationRasterPreview(): ConciliationRasterPreviewState & {
  zoomIn: () => void
  zoomOut: () => void
  rotateClockwise: () => void
  rotateCounterClockwise: () => void
  reset: () => void
} {
  const [state, setState] = useState<ConciliationRasterPreviewState>({ zoom: conciliationRasterPreview.defaultZoom, rotation: 0 })
  const zoomIn = useCallback((): void => setState((current) => ({ ...current, zoom: Math.min(conciliationRasterPreview.maxZoom, current.zoom + conciliationRasterPreview.zoomStep) })), [])
  const zoomOut = useCallback((): void => setState((current) => ({ ...current, zoom: Math.max(conciliationRasterPreview.minZoom, current.zoom - conciliationRasterPreview.zoomStep) })), [])
  const rotateClockwise = useCallback((): void => setState((current) => ({ ...current, rotation: (current.rotation + conciliationRasterPreview.rotationStep) % 360 })), [])
  const rotateCounterClockwise = useCallback((): void => setState((current) => ({ ...current, rotation: (current.rotation - conciliationRasterPreview.rotationStep + 360) % 360 })), [])
  const reset = useCallback((): void => setState({ zoom: conciliationRasterPreview.defaultZoom, rotation: 0 }), [])
  return { ...state, zoomIn, zoomOut, rotateClockwise, rotateCounterClockwise, reset }
}

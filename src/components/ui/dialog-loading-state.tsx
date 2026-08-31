import { LoaderCircle } from "lucide-react"

interface DialogLoadingStateProps {
  title: string
  description?: string
  minHeightClassName?: string
}

export function DialogLoadingState({
  title,
  description,
  minHeightClassName = "min-h-[220px]",
}: DialogLoadingStateProps) {
  return (
    <div className={`flex ${minHeightClassName} flex-col items-center justify-center gap-3 py-6 text-center`}>
      <LoaderCircle className="h-8 w-8 animate-spin text-[#FF5C00]" />
      <div className="space-y-1">
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

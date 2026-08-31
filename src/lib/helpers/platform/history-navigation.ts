export function replaceUrlState(url: string): void {
  if (typeof window === "undefined") {
    return
  }

  window.history.replaceState(null, "", url)
}

export function pushUrlState(url: string): void {
  if (typeof window === "undefined") {
    return
  }

  window.history.pushState(null, "", url)
}

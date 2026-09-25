/** @jest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react"
import { ThemeToggle } from "src/components/layout/theme-toggle"

const mockSetTheme = jest.fn()
const mockUseTheme = jest.fn()

jest.mock("next-themes", () => ({
  useTheme: () => mockUseTheme(),
}))

describe("ThemeToggle", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseTheme.mockReturnValue({ theme: "dark", setTheme: mockSetTheme })
  })

  it("switches from dark to light without opening a menu", () => {
    render(<ThemeToggle />)

    fireEvent.click(screen.getByRole("button", { name: "Alternar tema" }))

    expect(mockSetTheme).toHaveBeenCalledWith("light")
    expect(screen.queryByText("Claro")).not.toBeInTheDocument()
    expect(screen.queryByText("Oscuro")).not.toBeInTheDocument()
  })

  it("switches from light to dark", () => {
    mockUseTheme.mockReturnValue({ theme: "light", setTheme: mockSetTheme })
    render(<ThemeToggle />)

    fireEvent.click(screen.getByRole("button", { name: "Alternar tema" }))

    expect(mockSetTheme).toHaveBeenCalledWith("dark")
  })
})

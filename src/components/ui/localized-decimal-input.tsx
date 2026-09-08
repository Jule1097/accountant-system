import { useEffect, useRef, useState } from "react";
import { Input } from "src/components/ui/input";
import { formatLocalizedDecimal, parseLocalizedDecimal } from "src/lib/helpers/platform/formatting";

interface LocalizedDecimalInputProps extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "onBlur" | "type"> {
  value?: number | null;
  onChange: (value: number) => void;
  onBlur?: () => void;
}

export function LocalizedDecimalInput({ value, onChange, onBlur, ...props }: LocalizedDecimalInputProps) {
  const [displayValue, setDisplayValue] = useState(() => formatLocalizedDecimal(value));
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) setDisplayValue(formatLocalizedDecimal(value));
  }, [value]);

  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      value={displayValue}
      onFocus={() => {
        isFocused.current = true;
      }}
      onChange={(event) => {
        setDisplayValue(event.target.value);
        onChange(parseLocalizedDecimal(event.target.value));
      }}
      onBlur={() => {
        isFocused.current = false;
        const normalizedValue = parseLocalizedDecimal(displayValue);
        setDisplayValue(formatLocalizedDecimal(normalizedValue));
        onChange(normalizedValue);
        onBlur?.();
      }}
    />
  );
}

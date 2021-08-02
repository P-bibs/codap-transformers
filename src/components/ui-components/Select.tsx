import React, { ReactElement } from "react";

interface SelectProps<T extends string | number> {
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  defaultValue: T;
  value: T | null;
  options: {
    value: T;
    title: string;
  }[];
  disabled?: boolean;
  tooltip?: string;
}

export default function Select<T extends string | number>({
  onChange,
  value,
  defaultValue,
  options,
  disabled,
  tooltip,
}: SelectProps<T>): ReactElement {
  const titles = options.map((option) => option.title);

  // Determines if more than one option use the given title
  function ambiguousTitle(title: string): boolean {
    return titles.filter((t) => t === title).length > 1;
  }

  return (
    <select
      onChange={onChange}
      value={value || defaultValue}
      disabled={disabled}
      title={tooltip}
    >
      <option disabled value={defaultValue}>
        {defaultValue}
      </option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {/* disambiguate titles by showing value also if needed */}
          {ambiguousTitle(option.title)
            ? `${option.title} (${option.value})`
            : option.title}
        </option>
      ))}
    </select>
  );
}

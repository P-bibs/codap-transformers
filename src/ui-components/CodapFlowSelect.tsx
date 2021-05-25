import React, { ReactElement } from "react";

interface CodapFlowSelectProps<T extends string | number> {
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  defaultValue: T;
  value: T | null;
  options: {
    value: T;
    title: string;
  }[];
  showValue?: boolean;
}

export default function CodapFlowSelect<T extends string | number>({
  onChange,
  value,
  defaultValue,
  options,
  showValue,
}: CodapFlowSelectProps<T>): ReactElement {
  // showValue is false by default
  if (showValue === undefined || showValue === null) {
    showValue = false;
  }

  return (
    <select
      onChange={onChange}
      defaultValue={defaultValue}
      value={value || defaultValue}
    >
      <option disabled value={defaultValue}>
        {defaultValue}
      </option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {showValue ? `${option.title} (${option.value})` : option.title}
        </option>
      ))}
    </select>
  );
}

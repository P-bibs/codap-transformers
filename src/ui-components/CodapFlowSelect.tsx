import React, { ReactElement } from "react";

interface CodapFlowSelectProps<T extends string | number> {
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  defaultValue: T;
  value: T | null;
  options: {
    value: T;
    title: string;
  }[];
}

export default function CodapFlowSelect<T extends string | number>({
  onChange,
  value,
  defaultValue,
  options,
}: CodapFlowSelectProps<T>): ReactElement {
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
          {option.title} ({option.value})
        </option>
      ))}
    </select>
  );
}

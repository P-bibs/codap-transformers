import React, { ReactElement } from "react";

interface CodapFlowTextInputProps {
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  value: string;
  disabled?: boolean;
  placeholder?: string;
}

export default function CodapFlowTextInput({
  onChange,
  value,
  disabled,
  placeholder,
}: CodapFlowTextInputProps): ReactElement {
  return (
    <input
      type="text"
      placeholder={placeholder}
      onChange={onChange}
      value={value}
      disabled={disabled}
    />
  );
}

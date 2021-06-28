import React, { ReactElement } from "react";
import "./TextInput.css";

interface TextInputProps {
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  value: string;
  disabled?: boolean;
  placeholder?: string;
  onBlur?: () => void;
}

export default function TextInput({
  onChange,
  value,
  disabled,
  placeholder,
  onBlur,
}: TextInputProps): ReactElement {
  return (
    <input
      type="text"
      placeholder={placeholder}
      onChange={onChange}
      value={value}
      disabled={disabled}
      onBlur={onBlur}
    />
  );
}

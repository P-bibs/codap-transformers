import React, { ReactElement } from "react";
import "./TextInput.css";

interface TextInputProps {
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  value: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export default function TextInput({
  onChange,
  value,
  disabled,
  placeholder,
  className,
}: TextInputProps): ReactElement {
  return (
    <input
      type="text"
      placeholder={placeholder}
      onChange={onChange}
      value={value}
      disabled={disabled}
      className={className}
    />
  );
}

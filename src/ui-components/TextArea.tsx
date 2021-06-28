import React, { ReactElement } from "react";

interface TextAreaProps {
  onChange: React.ChangeEventHandler<HTMLTextAreaElement>;
  value: string;
  disabled?: boolean;
  placeholder?: string;
}

export default function TextArea({
  onChange,
  value,
  disabled,
  placeholder,
}: TextAreaProps): ReactElement {
  return (
    <textarea
      onChange={onChange}
      value={value}
      disabled={disabled}
      placeholder={placeholder}
    />
  );
}

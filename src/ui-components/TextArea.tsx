import React, { ReactElement } from "react";

interface TextAreaProps {
  onChange: React.ChangeEventHandler<HTMLTextAreaElement>;
  value: string;
  disabled?: boolean;
  placeholder?: string;
  onBlur?: () => void;
}

export default function TextArea({
  onChange,
  value,
  disabled,
  placeholder,
  onBlur,
}: TextAreaProps): ReactElement {
  return (
    <textarea
      onChange={onChange}
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      onBlur={onBlur}
    />
  );
}

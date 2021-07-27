import React, { ReactElement } from "react";

interface TextAreaProps {
  onChange: React.ChangeEventHandler<HTMLTextAreaElement>;
  value: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  onBlur?: () => void;
}

export default function TextArea({
  onChange,
  value,
  disabled,
  placeholder,
  className,
  onBlur,
}: TextAreaProps): ReactElement {
  return (
    <textarea
      onChange={onChange}
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
      onBlur={onBlur}
    />
  );
}

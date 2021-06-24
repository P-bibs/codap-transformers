import React, { ReactElement } from "react";

interface CodapFlowTextAreaProps {
  onChange: React.ChangeEventHandler<HTMLTextAreaElement>;
  value: string;
  disabled?: boolean;
  placeholder?: string;
}

export default function CodapFlowTextArea({
  onChange,
  value,
  disabled,
  placeholder,
}: CodapFlowTextAreaProps): ReactElement {
  return (
    <textarea
      onChange={onChange}
      value={value}
      disabled={disabled}
      placeholder={placeholder}
    />
  );
}

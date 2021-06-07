import React, { ReactElement } from "react";

interface CodapFlowTextInputProps {
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  value: string;
  disabled?: boolean;
}

export default function CodapFlowTextInput({
  onChange,
  value,
  disabled,
}: CodapFlowTextInputProps): ReactElement {
  return (
    <input type="text" onChange={onChange} value={value} disabled={disabled} />
  );
}

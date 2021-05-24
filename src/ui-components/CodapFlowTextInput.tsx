import React, { ReactElement } from "react";

interface CodapFlowTextInputProps {
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  value: string;
}

export default function CodapFlowTextInput({
  onChange,
  value,
}: CodapFlowTextInputProps): ReactElement {
  return <input type="text" onChange={onChange} value={value} />;
}

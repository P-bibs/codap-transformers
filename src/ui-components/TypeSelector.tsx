import React, { ReactElement } from "react";
import { CodapFlowSelect } from ".";

interface TypeSelectorProps {
  inputTypes: string[];
  selectedInputType: string;
  inputTypeOnChange?: React.ChangeEventHandler<HTMLSelectElement>;
  inputTypeDisabled?: boolean;
  outputTypes: string[];
  selectedOutputType: string;
  outputTypeOnChange?: React.ChangeEventHandler<HTMLSelectElement>;
  outputTypeDisabled?: boolean;
}

export default function TypeSelector({
  inputTypes,
  selectedInputType,
  inputTypeOnChange,
  inputTypeDisabled,
  outputTypes,
  selectedOutputType,
  outputTypeOnChange,
  outputTypeDisabled,
}: TypeSelectorProps): ReactElement {
  return (
    <div style={{ marginTop: "5px" }}>
      <CodapFlowSelect
        defaultValue="Type"
        value={selectedInputType}
        options={inputTypes.map((s) => ({ value: s, title: s }))}
        onChange={inputTypeOnChange}
        disabled={inputTypeDisabled}
      />
      {"->"}
      <CodapFlowSelect
        defaultValue="Type"
        value={selectedOutputType}
        options={outputTypes.map((s) => ({ value: s, title: s }))}
        onChange={outputTypeOnChange}
        disabled={outputTypeDisabled}
      />
    </div>
  );
}

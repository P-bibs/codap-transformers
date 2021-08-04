import React, { ReactElement } from "react";
import { Select } from ".";

interface TypeSelectorProps {
  inputTypes: string[] | string;
  selectedInputType: string;
  inputTypeOnChange?: React.ChangeEventHandler<HTMLSelectElement>;
  inputTypeDisabled?: boolean;
  outputTypes: string[] | string;
  selectedOutputType: string;
  outputTypeOnChange?: React.ChangeEventHandler<HTMLSelectElement>;
  outputTypeDisabled?: boolean;
}

/**
 * A component that renders up to two dropdowns with the interface of a type
 * contract. If a single string is specified for the `inputTypes` or
 * `outputTypes` instead of an array then that string will be displayed instead
 * of a dropdown
 */
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
      Contract:{" "}
      {typeof inputTypes === "object" ? (
        <Select
          defaultValue="Type"
          value={selectedInputType}
          options={inputTypes.map((s) => ({ value: s, title: s }))}
          onChange={inputTypeOnChange}
          disabled={inputTypeDisabled}
          tooltip="The expected input type of the formula."
        />
      ) : (
        <span style={{ fontFamily: "monospace" }}>{inputTypes}</span>
      )}
      {" → "}
      {typeof outputTypes === "object" ? (
        <Select
          defaultValue="Type"
          value={selectedOutputType}
          options={outputTypes.map((s) => ({ value: s, title: s }))}
          onChange={outputTypeOnChange}
          disabled={outputTypeDisabled}
          tooltip="The expected output type of the formula."
        />
      ) : (
        <span style={{ fontFamily: "monospace" }}>{outputTypes}</span>
      )}
    </div>
  );
}

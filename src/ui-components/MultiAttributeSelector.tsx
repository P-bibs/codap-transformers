import React, { ReactElement, useState, useEffect } from "react";
import CodapFlowSelect from "./CodapFlowSelect";
import { useAttributes } from "../utils/hooks";

interface MultiAttributeSelectorProps {
  context: string | null;
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function MultiAttributeSelector({
  context,
  selected,
  onChange,
}: MultiAttributeSelectorProps): ReactElement {
  const attributes = useAttributes(context);

  // If selected contains an outdated value (attribute name that has been)
  // deleted, then filter out the value
  useEffect(() => {
    const attrNames = attributes.map((a) => a.name);
    if (selected.some((a) => !attrNames.includes(a))) {
      onChange(selected.filter((a) => attrNames.includes(a)));
    }
  }, [attributes, selected, onChange]);

  return (
    <>
      {[...Array(selected.length + 1).keys()].map((i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <CodapFlowSelect
            onChange={(e) => {
              const newSelected = [...selected];
              newSelected[i] = e.target.value;
              onChange(newSelected);
            }}
            options={attributes.map((attribute) => ({
              value: attribute.name,
              title: attribute.title,
            }))}
            value={selected[i]}
            defaultValue="Select an attribute"
            showValue={true}
          />
          {i === selected.length ? null : (
            <button
              onClick={() => {
                onChange([...selected.slice(0, i), ...selected.slice(i + 1)]);
              }}
            >
              🗙
            </button>
          )}
        </div>
      ))}
    </>
  );
}

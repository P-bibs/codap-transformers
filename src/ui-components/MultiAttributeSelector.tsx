import React, { ReactElement, useEffect } from "react";
import CodapFlowSelect from "./CodapFlowSelect";
import { useAttributes } from "../utils/hooks";

interface MultiAttributeSelectorProps {
  context: string | null;
  selected: string[];
  setSelected: (selected: string[]) => void;
  disabled?: boolean;
  frozen?: boolean;
}

export default function MultiAttributeSelector({
  context,
  disabled,
  selected,
  setSelected,
}: MultiAttributeSelectorProps): ReactElement {
  const attributes = useAttributes(context);
  const count = selected?.length || 0;

  // If selected contains an outdated value (attribute name that has been)
  // deleted, then filter out the value
  useEffect(() => {
    // Only filter out attributes if this selector is enabled
    if (disabled) {
      return;
    }
    const attrNames = attributes.map((a) => a.name);
    if (selected.some((a) => !attrNames.includes(a))) {
      setSelected(selected.filter((a) => attrNames.includes(a)));
    }
  }, [attributes, selected, setSelected]);

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
              setSelected(newSelected);
            }}
            options={attributes.map((attribute) => ({
              value: attribute.name,
              title: attribute.title,
            }))}
            value={selected[i]}
            defaultValue="Select an attribute"
            disabled={disabled}
          />
          {i === selected.length ? null : (
            <button
              onClick={() => {
                setSelected([
                  ...selected.slice(0, i),
                  ...selected.slice(i + 1),
                ]);
              }}
              disabled={disabled}
            >
              🗙
            </button>
          )}
        </div>
      ))}
    </>
  );
}

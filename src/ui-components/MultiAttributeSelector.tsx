import React, { ReactElement, useEffect } from "react";
import Select from "./Select";
import { useAttributes } from "../lib/utils/hooks";
import "./styles/MultiAttributeSelector.css";

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

  // If selected contains an outdated value (attribute name that has been)
  // deleted, then filter out the value
  useEffect(() => {
    // Only filter out attributes if this selector is enabled
    if (disabled) {
      return;
    }
    // Abort if a context is provided but attrs haven't been loaded yet
    // FIXME: this doesn't work if the table actually has 0 attributes
    if (context !== null && attributes.length === 0) {
      return;
    }
    const attrNames = attributes.filter((a) => !a.hidden).map((a) => a.name);
    if (selected.some((a) => !attrNames.includes(a))) {
      setSelected(selected.filter((a) => attrNames.includes(a)));
    }
  }, [attributes, selected, setSelected, disabled, context]);

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
          <Select
            onChange={(e) => {
              const newSelected = [...selected];
              newSelected[i] = e.target.value;
              setSelected(newSelected);
            }}
            options={attributes
              // filter out hidden attrs (keep attrs that have hidden undefined)
              .filter((attr) => !attr.hidden)
              .map((attribute) => ({
                value: attribute.name,
                title: attribute.title || attribute.name,
              }))
              // Disallow duplicate attributes by filtering
              .filter(
                (option) =>
                  !selected.includes(option.value) ||
                  option.value === selected[i]
              )}
            value={selected[i]}
            defaultValue="Select an attribute"
            disabled={disabled}
          />
          {i === selected.length ? null : (
            <button
              className="deleteButton"
              onClick={() => {
                setSelected([
                  ...selected.slice(0, i),
                  ...selected.slice(i + 1),
                ]);
              }}
              disabled={disabled}
            >
              ✕
            </button>
          )}
        </div>
      ))}
    </>
  );
}

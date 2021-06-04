import React, { ReactElement } from "react";
import CodapFlowSelect from "./CodapFlowSelect";
import { useAttributes } from "../utils/hooks";

interface MultiAttributeSelectorProps {
  context: string | null;
  selected: string[];
  setSelected: (selected: string[]) => void;
  disabled?: boolean;
}

export default function MultiAttributeSelector({
  context,
  disabled,
  selected,
  setSelected,
}: MultiAttributeSelectorProps): ReactElement {
  const attributes = useAttributes(context);
  const count = selected?.length || 0;

  return (
    <>
      {[...Array(count + 1).keys()].map((i) => (
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
            showValue={true}
            disabled={disabled}
          />
          {i === count ? null : (
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

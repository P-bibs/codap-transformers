import React, { ReactElement, useState } from "react";
import { CodapFlowTextArea, CodapFlowTextInput } from ".";
import { SaveTransformationContext } from "../Transformation";
import { TransformationSaveData } from "../transformation-components/types";

interface TransformationSaveButtonProps {
  generateSaveData: () => TransformationSaveData;
  disabled?: boolean;
}

export default function TransformationSaveButton({
  generateSaveData,
  disabled,
}: TransformationSaveButtonProps): ReactElement {
  const [currentName, setCurrentName] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  return (
    <div style={{ marginTop: "5px" }}>
      <hr style={{ marginTop: "15px" }} />
      <h3>Save This Transformation</h3>
      <SaveTransformationContext.Consumer>
        {(saveTransformation) => (
          <div
            style={{
              height: "175px",
              display: "flex",
              marginTop: "2px",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <CodapFlowTextInput
              value={currentName}
              onChange={(e) => setCurrentName(e.target.value)}
              placeholder={"Transformation Name"}
            />
            <CodapFlowTextArea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Purpose Statement"
            />
            <button
              disabled={disabled}
              onClick={() => {
                saveTransformation(
                  currentName,
                  description === "" ? undefined : description,
                  generateSaveData()
                );
                setCurrentName("");
                setDescription("");
              }}
            >
              Save
            </button>
          </div>
        )}
      </SaveTransformationContext.Consumer>
    </div>
  );
}

import React, { ReactElement, useState } from "react";
import { CodapFlowTextArea, CodapFlowTextInput } from ".";
import { BaseTransformationName } from "../transformation-components/transformationList";
import {
  SavedTransformationContent,
  TransformationSaveData,
} from "../transformation-components/types";
import { createDataInteractive } from "../utils/codapPhone";

interface TransformationSaveButtonProps {
  generateSaveData: () => TransformationSaveData;
  base: BaseTransformationName;
  disabled?: boolean;
}

export default function TransformationSaveButton({
  generateSaveData,
  base,
  disabled,
}: TransformationSaveButtonProps): ReactElement {
  const [currentName, setCurrentName] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  function saveTransformation(
    name: string,
    description: string | undefined,
    data: TransformationSaveData
  ) {
    if (name === "") {
      return;
    }

    // Create a new transformation in a new data interactive window
    // TODO: can we do this without casting?
    const content: SavedTransformationContent = {
      base,
      data,
    } as SavedTransformationContent;

    const savedTransformation = { name, description, content };
    const encoded = encodeURIComponent(JSON.stringify(savedTransformation));
    createDataInteractive(name, `http://localhost:3000?transform=${encoded}`);
  }

  return (
    <div style={{ marginTop: "5px" }}>
      <hr style={{ marginTop: "15px" }} />
      <h3>Save This Transformation</h3>
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
    </div>
  );
}

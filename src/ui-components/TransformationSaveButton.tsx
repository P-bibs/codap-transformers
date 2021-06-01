import React, { ReactElement, useState } from "react";
import { SaveTransformationContext } from "../Transformation";
import { TransformationSaveData } from "../transformation-components/types";
import CodapFlowTextInput from "./CodapFlowTextInput";

interface TransformationSaveButtonProps {
  generateSaveData: () => TransformationSaveData;
  disabled?: boolean;
}

export default function TransformationSaveButton({
  generateSaveData,
  disabled,
}: TransformationSaveButtonProps): ReactElement {
  const [currentName, setCurrentName] = useState<string>("");

  return (
    <div style={{ marginTop: "5px" }}>
      <SaveTransformationContext.Consumer>
        {(saveTransformation) => (
          <>
            <CodapFlowTextInput
              value={currentName}
              onChange={(e) => setCurrentName(e.target.value)}
            />
            <button
              disabled={disabled}
              onClick={() =>
                saveTransformation(currentName, generateSaveData())
              }
            >
              Save Transformation
            </button>
          </>
        )}
      </SaveTransformationContext.Consumer>
    </div>
  );
}

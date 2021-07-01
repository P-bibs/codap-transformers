import React, { ReactElement, useEffect, useState } from "react";
import { TextArea, TextInput } from ".";
import { BaseTransformerName } from "../transformer-components/transformerList";
import {
  SavedTransformerContent,
  TransformerSaveData,
} from "../transformer-components/types";
import {
  createDataInteractive,
  getInteractiveFrame,
  notifyInteractiveFrameIsDirty,
} from "../utils/codapPhone";
import {
  addInteractiveStateRequestListener,
  removeInteractiveStateRequestListener,
} from "../utils/codapPhone/listeners";
import { InteractiveState } from "../utils/codapPhone/types";

interface TransformerSaveButtonProps {
  generateSaveData: () => TransformerSaveData;
  base: BaseTransformerName;
  disabled?: boolean;
}

export default function TransformerSaveButton({
  generateSaveData,
  base,
  disabled,
}: TransformerSaveButtonProps): ReactElement {
  const [currentName, setCurrentName] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  function saveTransformer(
    name: string,
    description: string | undefined,
    data: TransformerSaveData
  ) {
    if (name === "") {
      return;
    }

    // Create a new transformer in a new data interactive window
    // TODO: can we do this without casting?
    const content: SavedTransformerContent = {
      base,
      data,
    } as SavedTransformerContent;

    const savedTransformer = { name, description, content };
    const encoded = encodeURIComponent(JSON.stringify(savedTransformer));
    createDataInteractive(name, `http://localhost:3000?transform=${encoded}`);
  }

  // Load saved state from CODAP memory
  useEffect(() => {
    async function fetchSavedState() {
      const savedState = (await getInteractiveFrame()).savedState;
      if (savedState.savedTransformation) {
        setCurrentName(savedState.savedTransformation.name);
        setDescription(savedState.savedTransformation.description);
      }
    }
    fetchSavedState();
  }, []);
  // Register a listener to generate the plugins state
  useEffect(() => {
    const callback = (
      previousInteractiveState: InteractiveState
    ): InteractiveState => {
      return {
        ...previousInteractiveState,
        savedTransformation: { name: currentName, description },
      };
    };

    addInteractiveStateRequestListener(callback);
    return () => removeInteractiveStateRequestListener(callback);
  }, [currentName, description]);
  function notifyStateIsDirty() {
    notifyInteractiveFrameIsDirty();
  }

  return (
    <div style={{ marginTop: "5px" }}>
      <hr style={{ marginTop: "15px" }} />
      <div className="input-group">
        <h3>Save This Transformer</h3>
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
          <TextInput
            value={currentName}
            onChange={(e) => setCurrentName(e.target.value)}
            placeholder={"Transformer Name"}
            onBlur={notifyStateIsDirty}
          />
          <TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Purpose Statement"
            onBlur={notifyStateIsDirty}
          />
          <button
            disabled={disabled}
            onClick={() => {
              saveTransformer(
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
    </div>
  );
}

import React, { ReactElement } from "react";
import { useState } from "react";
import "./TransformerViews.css";
import ErrorDisplay from "../ui-components/Error";
import { SavedTransformer } from "./types";
import { TransformerRenderer } from "./TransformerRenderer";
import { TextArea, TextInput } from "../ui-components";
import {
  getInteractiveFrame,
  notifyInteractiveFrameIsDirty,
} from "../utils/codapPhone";
import { useEffect } from "react";
import { InteractiveState } from "../utils/codapPhone/types";
import {
  addInteractiveStateRequestListener,
  removeInteractiveStateRequestListener,
} from "../utils/codapPhone/listeners";

/**
 * SavedTransformerView wraps a saved transformer in other important info
 * like it's name/purpose statement and an error box
 */
function SavedTransformerView({
  transformer: urlTransformer,
}: {
  transformer: SavedTransformer;
}): ReactElement {
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [editable, setEditable] = useState<boolean>(false);
  const [savedTransformer, setSavedTransformer] = useState(urlTransformer);

  // Load saved state from CODAP memory
  useEffect(() => {
    async function fetchSavedState() {
      const savedState = (await getInteractiveFrame()).savedState;
      if (savedState && savedState.savedTransformation) {
        setSavedTransformer({
          ...savedTransformer,
          name: savedState.savedTransformation.name,
          description: savedState.savedTransformation.description,
        });
      }
    }
    fetchSavedState();
  }, []);

  // Register a listener to generate the plugin's state
  useEffect(() => {
    const callback = (
      previousInteractiveState: InteractiveState
    ): InteractiveState => {
      return {
        ...previousInteractiveState,
        savedTransformation: {
          name: savedTransformer.name,
          description: savedTransformer.description || "",
        },
      };
    };

    addInteractiveStateRequestListener(callback);
    return () => removeInteractiveStateRequestListener(callback);
  }, [savedTransformer]);

  function notifyStateIsDirty() {
    notifyInteractiveFrameIsDirty();
  }

  return (
    <div className="transformer-view">
      {editable ? (
        <TextInput
          value={savedTransformer.name}
          onChange={(e) =>
            setSavedTransformer({ ...savedTransformer, name: e.target.value })
          }
          placeholder={"Transformer Name"}
          onBlur={notifyStateIsDirty}
        />
      ) : (
        <h2>
          {savedTransformer.name}
          <span id="transformerBase"> ({savedTransformer.content.base})</span>
        </h2>
      )}
      {editable ? (
        <TextArea
          value={savedTransformer.description || ""}
          onChange={(e) =>
            setSavedTransformer({
              ...savedTransformer,
              description: e.target.value,
            })
          }
          placeholder="Purpose Statement"
          onBlur={notifyStateIsDirty}
        />
      ) : (
        savedTransformer.description && <p>{savedTransformer.description}</p>
      )}
      <TransformerRenderer
        setErrMsg={setErrMsg}
        errorDisplay={<ErrorDisplay message={errMsg} />}
        transformer={savedTransformer}
        editable={editable}
      />
      <button
        id="edit-button"
        onClick={() => setEditable(!editable)}
        title={
          editable
            ? "Save changes made to this transformer"
            : "Make changes to this transformer"
        }
      >
        {editable ? "Save" : "Edit"}
      </button>
    </div>
  );
}

export default SavedTransformerView;

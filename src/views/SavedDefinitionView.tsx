import React, { ReactElement } from "react";
import { useState } from "react";
import "./styles/Views.css";
import ErrorDisplay, {
  useErrorSetterId,
  useErrorStore,
} from "../components/ui-components/Error";
import { SavedTransformer } from "../components/transformer-template/types";
import { TextArea, TextInput } from "../components/ui-components";
import {
  getInteractiveFrame,
  notifyInteractiveFrameIsDirty,
  updateInteractiveFrame,
} from "../lib/codapPhone";
import { useEffect } from "react";
import { InteractiveState } from "../lib/codapPhone/types";
import {
  addInteractiveStateRequestListener,
  removeInteractiveStateRequestListener,
} from "../lib/codapPhone/listeners";
import "../components/transformer-template/styles/DefinitionCreator.css";
import "./styles/SavedDefinitionView.css";
import {
  useActiveTransformations,
  useEditedOutputs,
} from "../transformerStore";
import { ActionTypes } from "../transformerStore/types";
import { deserializeActiveTransformations } from "../transformerStore/util";
import { TransformerRenderer } from "../components/transformer-template/TransformerRenderer";
import { closePlugin } from "./util";
import { IconButton } from "@material-ui/core";
import { Cancel } from "@material-ui/icons";

/**
 * SavedDefinitionView wraps a saved transformer in other important info
 * like it's name/purpose statement and an error box
 */
function SavedDefinitionView({
  transformer: urlTransformer,
}: {
  transformer: SavedTransformer;
}): ReactElement {
  const [errorStore, setErrMsg] = useErrorStore();
  const errorId = useErrorSetterId();

  const [editable, setEditable] = useState<boolean>(false);
  const [savedTransformer, setSavedTransformer] = useState(urlTransformer);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [editedOutputs, addEditedOutput, setEditedOutputs] = useEditedOutputs();
  const [
    activeTransformations,
    activeTransformationsDispatch,
    wrappedDispatch,
  ] = useActiveTransformations(setErrMsg, editedOutputs, addEditedOutput);

  // Load saved state from CODAP memory
  useEffect(() => {
    async function fetchSavedState() {
      const savedState = (await getInteractiveFrame()).savedState;
      if (savedState === undefined) {
        return;
      }
      if (savedState.savedTransformation) {
        setSavedTransformer({
          ...savedTransformer,
          name: savedState.savedTransformation.name,
          description: savedState.savedTransformation.description,
        });
      }
      if (savedState.activeTransformations) {
        activeTransformationsDispatch({
          type: ActionTypes.SET,
          newTransformations: deserializeActiveTransformations(
            savedState.activeTransformations
          ),
        });
      }
      if (savedState.editedOutputs !== undefined) {
        setEditedOutputs(new Set(savedState.editedOutputs));
      }
    }
    fetchSavedState();

    // Identity of dispatch is stable since it came from useReducer
  }, [activeTransformationsDispatch, savedTransformer, setEditedOutputs]);

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
      {editable && (
        <div className="editing-indicator">
          <p>You are editing this transformer</p>
        </div>
      )}
      {editable ? (
        <TextInput
          value={savedTransformer.name}
          onChange={(e) => {
            setSavedTransformer({ ...savedTransformer, name: e.target.value });
            setSaveErr(null);
          }}
          placeholder={"Transformer Name"}
          className="saved-transformer-name"
          onBlur={notifyStateIsDirty}
        />
      ) : (
        <div className="title-row">
          <h2>
            {savedTransformer.name}
            <span id="transformerBase"> ({savedTransformer.content.base})</span>
          </h2>
          <IconButton
            style={{
              padding: "0",
              marginLeft: "auto",
            }}
            size="medium"
            onClick={() => closePlugin(activeTransformations)}
            title="Close definition"
          >
            <Cancel htmlColor="var(--blue-green)" fontSize="inherit" />
          </IconButton>
        </div>
      )}
      {editable ? (
        <>
          <TextArea
            value={savedTransformer.description || ""}
            onChange={(e) => {
              setSavedTransformer({
                ...savedTransformer,
                description: e.target.value,
              });
              setSaveErr(null);
            }}
            placeholder="Purpose Statement"
            className="purpose-statement"
            onBlur={notifyStateIsDirty}
          />
          <hr className="divider" />
        </>
      ) : (
        savedTransformer.description && <p>{savedTransformer.description}</p>
      )}
      <TransformerRenderer
        setErrMsg={setErrMsg}
        errorDisplay={<ErrorDisplay setErrMsg={setErrMsg} store={errorStore} />}
        transformer={savedTransformer}
        editable={editable}
        activeTransformationsDispatch={wrappedDispatch}
      />
      <button
        id="edit-button"
        onClick={() => {
          // clear the transformer application error message
          setErrMsg(null, errorId);

          // if going to non-editable (saving) and name is blank
          if (editable && savedTransformer.name.trim() === "") {
            setSaveErr("Please choose a name for the transformer");
            return;
          }

          // if saving, update the interactive frame to use the new transformer name
          if (editable) {
            updateInteractiveFrame({
              title: `Transformer: ${savedTransformer.name}`,
            });
          }

          setEditable(!editable);
        }}
        title={
          editable
            ? "Save changes made to this transformer"
            : "Make changes to this transformer"
        }
      >
        {editable ? "Save" : "Edit"}
      </button>
      <ErrorDisplay
        setErrMsg={(err, _id) => setSaveErr(err)}
        store={saveErr === null ? [] : [[0, saveErr]]}
      />
    </div>
  );
}

export default SavedDefinitionView;

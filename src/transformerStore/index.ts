import React, { useState, useReducer, useEffect, useCallback } from "react";
import { default as transformerList } from "../transformerList";
import { tryTitle } from "../transformers/util";
import {
  getComponent,
  getDataContext,
  notifyInteractiveFrameIsDirty,
} from "../lib/codapPhone";
import {
  addInteractiveStateRequestListener,
  removeInteractiveStateRequestListener,
  addContextUpdateHook,
  removeContextUpdateHook,
  addContextDeletedHook,
  removeContextDeletedHook,
  addTextDeletedHook,
  removeTextDeletedHook,
  addOutputTitleChangeHook,
  removeOutputTitleChangeHook,
} from "../lib/codapPhone/listeners";
import { InteractiveState } from "../lib/codapPhone/types";
import {
  ActionTypes,
  ActiveTransformationsAction,
  DatasetCreatorDescription,
  SafeActions,
  SafeActiveTransformationsDispatch,
  TransformationDescription,
} from "./types";
import {
  activeTransformationsReducer,
  serializeActiveTransformations,
  updateFromDescription,
  findTransformation,
} from "./util";

/**
 * useActiveTransformations
 *
 * A record of active transformations which is used to perform updates.
 */
export function useActiveTransformations(
  setErrMsg: (msg: string | null, id: number) => void,
  editedOutputs: Set<string>,
  addEditedOutput: (name: string) => void
): [
  Record<string, TransformationDescription[]>,
  React.Dispatch<ActiveTransformationsAction>,
  React.Dispatch<SafeActions>
] {
  const [activeTransformations, activeTransformationsDispatch] = useReducer(
    activeTransformationsReducer,
    {}
  );

  const wrappedDispatch: SafeActiveTransformationsDispatch = (action) => {
    notifyInteractiveFrameIsDirty();
    activeTransformationsDispatch(action);
  };

  // Add activeTransformations to savedState
  useEffect(() => {
    function callback(
      previousInteractiveState: InteractiveState
    ): InteractiveState {
      return {
        ...previousInteractiveState,
        activeTransformations: serializeActiveTransformations(
          activeTransformations
        ),
      };
    }

    addInteractiveStateRequestListener(callback);
    return () => removeInteractiveStateRequestListener(callback);
  }, [activeTransformations]);

  // Perform updates from transformations
  useEffect(() => {
    async function callback(contextName: string) {
      if (activeTransformations[contextName] === undefined) {
        return;
      }

      for (const description of activeTransformations[contextName]) {
        try {
          setErrMsg(null, description.errorId);
          await updateFromDescription(
            description,
            activeTransformationsDispatch,
            editedOutputs
          );
        } catch (e) {
          if (
            transformerList[description.transformer].componentData
              .transformerFunction.kind === "datasetCreator"
          ) {
            const creatorDescription = description as DatasetCreatorDescription;
            let outputName;
            if (creatorDescription.outputType === "context") {
              // Find context's title
              outputName = tryTitle(
                await getDataContext(creatorDescription.output)
              );
            } else {
              // Find text component's title
              outputName = tryTitle(
                await getComponent(creatorDescription.output)
              );
            }
            setErrMsg(
              `Error updating "${outputName}": ${(e as Error).message}`,
              description.errorId
            );
          } else {
            setErrMsg((e as Error).message, description.errorId);
          }
        }
      }
    }
    addContextUpdateHook(callback);
    return () => removeContextUpdateHook(callback);
  }, [activeTransformations, setErrMsg, editedOutputs]);

  // Delete transformations for deleted contexts
  useEffect(() => {
    async function callback(deletedContext: string) {
      const cloned = { ...activeTransformations };
      for (const input of Object.keys(cloned)) {
        // Remove transformations with newly missing inputs / dependencies
        cloned[input] = cloned[input].filter(
          (description) =>
            !(
              description.inputs.includes(deletedContext) ||
              description.extraDependencies.includes(deletedContext)
            )
        );
      }
      activeTransformationsDispatch({
        type: ActionTypes.SET,
        newTransformations: cloned,
      });
    }
    addContextDeletedHook(callback);
    return () => removeContextDeletedHook(callback);
  }, [activeTransformations]);

  // Delete transformations for deleted text components
  useEffect(() => {
    async function callback(deletedText: string) {
      const cloned = { ...activeTransformations };
      for (const input of Object.keys(cloned)) {
        // Remove transformations that depend on the deleted text component
        cloned[input] = cloned[input].filter(
          (description) => !description.extraDependencies.includes(deletedText)
        );
      }
      activeTransformationsDispatch({
        type: ActionTypes.SET,
        newTransformations: cloned,
      });
    }
    addTextDeletedHook(callback);
    return () => removeTextDeletedHook(callback);
  }, [activeTransformations]);

  useEffect(() => {
    async function callback(outputName: string) {
      const description = findTransformation(activeTransformations, (t) =>
        t.extraDependencies.includes(outputName)
      );
      if (description === undefined) {
        return;
      }
      addEditedOutput(outputName);
    }
    addOutputTitleChangeHook(callback);
    return () => removeOutputTitleChangeHook(callback);
  });

  return [
    activeTransformations,
    activeTransformationsDispatch,
    wrappedDispatch,
  ];
}

export function useEditedOutputs(): [
  Set<string>,
  (output: string) => void,
  (outputs: Set<string>) => void
] {
  const [editedOutputs, setEditedOutputs] = useState(new Set<string>());

  const addEditedOutput = useCallback(
    (outputName: string) => {
      setEditedOutputs(new Set(editedOutputs.add(outputName)));
      notifyInteractiveFrameIsDirty();
    },
    [editedOutputs]
  );

  useEffect(() => {
    function saveStateCallback(
      previousInteractiveState: InteractiveState
    ): InteractiveState {
      return {
        ...previousInteractiveState,
        editedOutputs: [...editedOutputs],
      };
    }
    addInteractiveStateRequestListener(saveStateCallback);
    return () => removeInteractiveStateRequestListener(saveStateCallback);
  }, [editedOutputs]);

  return [editedOutputs, addEditedOutput, setEditedOutputs];
}

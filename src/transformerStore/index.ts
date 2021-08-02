import React, { useReducer, useEffect } from "react";
import { default as transformerList } from "../transformerList";
import { readableName } from "../transformers/util";
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
} from "./util";

/**
 * useActiveTransformations
 *
 * A record of active transformations which is used to perform updates.
 */
export function useActiveTransformations(
  setErrMsg: (msg: string | null) => void
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
      // Clear previous errors before performing update
      setErrMsg(null);
      for (const description of activeTransformations[contextName]) {
        try {
          await updateFromDescription(
            description,
            activeTransformationsDispatch
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
              outputName = readableName(
                await getDataContext(creatorDescription.output)
              );
            } else {
              // Find text component's title
              const text = await getComponent(creatorDescription.output);
              outputName = text.title ? text.title : text.name;
            }
            setErrMsg(`Error updating "${outputName}": ${e.message}`);
          } else {
            setErrMsg(e.message);
          }
        }
      }
    }
    addContextUpdateHook(callback);
    return () => removeContextUpdateHook(callback);
  }, [activeTransformations, setErrMsg]);

  // Delete transformations for deleted contexts
  useEffect(() => {
    async function callback(deletedContext: string) {
      const cloned = { ...activeTransformations };
      for (const input of Object.keys(cloned)) {
        // Remove transformations with newly missing inputs
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

  return [
    activeTransformations,
    activeTransformationsDispatch,
    wrappedDispatch,
  ];
}

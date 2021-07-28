import React, { useReducer, useEffect } from "react";
import { default as transformerList } from "../transformerList";
import { tryTitle } from "../transformers/util";
import {
  getDataContext,
  notifyInteractiveFrameIsDirty,
  updateDataContext,
  getComponent,
  updateComponent,
} from "../lib/codapPhone";
import {
  addInteractiveStateRequestListener,
  removeInteractiveStateRequestListener,
  addContextUpdateHook,
  removeContextUpdateHook,
  addContextDeletedHook,
  removeContextDeletedHook,
  callAllContextListeners,
} from "../lib/codapPhone/listeners";
import { InteractiveState } from "../lib/codapPhone/types";
import {
  ActionTypes,
  ActiveTransformationsAction,
  DatasetCreatorDescription,
  SafeActions,
  SafeActiveTransformationsDispatch,
  TransformationDescription,
  TransformationOutputType,
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
            const context = await getDataContext(
              (description as DatasetCreatorDescription).output
            );
            setErrMsg(`Error updating "${tryTitle(context)}": ${e.message}`);
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
        // Partition transformations based on whether or not one of their input
        // contexts was deleted
        const transformationsWithNewlyMissingInputs = [];
        const restOfTransformations = [];
        for (const description of activeTransformations[input]) {
          if (
            description.inputs.includes(deletedContext) ||
            description.extraDependencies.includes(deletedContext)
          ) {
            transformationsWithNewlyMissingInputs.push(description);
          } else {
            restOfTransformations.push(description);
          }
        }

        // Rename transformations with newly missing inputs to add a [fixed] suffix
        for (const transformation of transformationsWithNewlyMissingInputs) {
          if (transformation.transformer === "Partition") {
            // If the transformer was partition we have to rename each output table
            for (const outputContext of transformation.state.outputContexts) {
              // Do not attempt to rename deleted contexts
              if (outputContext === deletedContext) {
                continue;
              }
              const outputContextData = await getDataContext(outputContext);
              await updateDataContext(outputContext, {
                title: `${outputContextData.title} [fixed]`,
                metadata: {
                  description: `${outputContextData.metadata?.description}\n\n An input to the transformer that created this dataset has been deleted so this dataset will no longer update.`,
                },
              });
            }
          } else if (transformation.transformer === "Editable Copy") {
            // If the transformer was editable copy then we don't have to do anything
          } else {
            // Do not add [fixed] to the output if it's already been deleted
            if (transformation.output === deletedContext) {
              continue;
            }
            if (transformation.outputType === TransformationOutputType.TEXT) {
              // If this is an SV transformer than update the output text component title
              const outputData = await getComponent(transformation.output);
              await updateComponent(transformation.output, {
                title: `${outputData.title} [fixed]`,
              });
            } else if (
              transformation.outputType === TransformationOutputType.CONTEXT
            ) {
              // If this transformer produces a dataset then rename the context
              const outputData = await getDataContext(transformation.output);
              await updateDataContext(transformation.output, {
                title: `${outputData.title} [fixed]`,
                metadata: {
                  description: `${outputData.metadata?.description}\n\n An input to the transformer that created this dataset has been deleted so this dataset will no longer update.`,
                },
              });
            }
          }
        }
        callAllContextListeners();

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

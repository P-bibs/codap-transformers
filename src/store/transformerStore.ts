import React, { useReducer, useEffect } from "react";
import {
  BaseTransformerName,
  default as transformerList,
} from "../transformerList";
import {
  TransformerTemplateState,
  FullOverrideFunction,
} from "../components/transformer-template/TransformerTemplate";
import { readableName } from "../transformers/util";
import {
  DataSetTransformationOutput,
  SingleValueTransformationOutput,
} from "../transformers/types";
import {
  getDataContext,
  updateContextWithDataSet,
  updateText,
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
import { makeDatasetImmutable } from "../transformers/util";
import { InteractiveState } from "../lib/codapPhone/types";
import { PartitionSaveState } from "../transformers/partition";
import { displaySingleValue } from "../transformers/util";

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
            setErrMsg(
              `Error updating "${readableName(context)}": ${e.message}`
            );
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

export enum TransformationOutputType {
  CONTEXT = "context",
  TEXT = "text",
}

interface BaseTransformationDescription {
  inputs: string[];
  extraDependencies: string[];
}

interface DatasetCreatorDescription extends BaseTransformationDescription {
  outputType: TransformationOutputType;
  output: string;
  transformer: Exclude<BaseTransformerName, "Partition">;
  state: TransformerTemplateState;
}

interface PartitionDescription extends BaseTransformationDescription {
  transformer: "Partition";
  state: PartitionSaveState;
}

// Future fullOverride transformers would be added to this union
// NOTE: Editable Copy is not listed here because, by its very nature,
// it does not participate in updates.
type FullOverrideDescription = PartitionDescription;

export type TransformationDescription =
  | DatasetCreatorDescription
  | FullOverrideDescription;

export type ActiveTransformations = Record<string, TransformationDescription[]>;

function serializeActiveTransformations(
  transformations: ActiveTransformations
): TransformationDescription[] {
  const serialized = new Set<TransformationDescription>();
  for (const descriptions of Object.values(transformations)) {
    descriptions.forEach((d) => serialized.add(d));
  }
  return Array.from(serialized);
}

export function deserializeActiveTransformations(
  transformations: TransformationDescription[]
): ActiveTransformations {
  const deserialized: ActiveTransformations = {};
  for (const transform of transformations) {
    for (const input of transform.inputs) {
      if (deserialized[input] === undefined) {
        deserialized[input] = [transform];
      } else {
        deserialized[input].push(transform);
      }
    }
  }
  return deserialized;
}

async function updateFromDescription(
  description: TransformationDescription,
  dispatch: React.Dispatch<ActiveTransformationsAction>
): Promise<void> {
  const transformFunc =
    transformerList[description.transformer].componentData.transformerFunction;
  if (transformFunc.kind === "datasetCreator") {
    description = description as DatasetCreatorDescription;
    if (description.outputType === TransformationOutputType.CONTEXT) {
      await updateContextFromDatasetCreator(
        description.state,
        description.output,
        transformFunc.func as (
          state: TransformerTemplateState
        ) => Promise<DataSetTransformationOutput>
      );
    } else if (description.outputType === TransformationOutputType.TEXT) {
      await updateTextFromDatasetCreator(
        description.state,
        description.output,
        transformFunc.func as (
          state: TransformerTemplateState
        ) => Promise<SingleValueTransformationOutput>
      );
    }
  } else if (transformFunc.kind === "fullOverride") {
    description = description as FullOverrideDescription;
    await updateFromFullOverride(description, dispatch);
  }
}

async function updateContextFromDatasetCreator(
  state: TransformerTemplateState,
  outputName: string,
  transformFunc: (
    state: TransformerTemplateState
  ) => Promise<DataSetTransformationOutput>
): Promise<void> {
  const [transformed] = await transformFunc(state);
  const immutableTransformed = makeDatasetImmutable(transformed);
  await updateContextWithDataSet(outputName, immutableTransformed);
}

async function updateTextFromDatasetCreator(
  state: TransformerTemplateState,
  outputName: string,
  transformFunc: (
    state: TransformerTemplateState
  ) => Promise<SingleValueTransformationOutput>
): Promise<void> {
  const [result] = await transformFunc(state);
  await updateText(outputName, displaySingleValue(result));
}

async function updateFromFullOverride(
  description: FullOverrideDescription,
  dispatch: React.Dispatch<ActiveTransformationsAction>
) {
  const newState = await (
    transformerList[description.transformer].componentData
      .transformerFunction as FullOverrideFunction
  ).updateFunc(description.state);
  dispatch({
    type: ActionTypes.EDIT,
    transformation: description,
    newState,
  });
}

/**
 * Active Transformtions Reducer
 *
 * Reducer function for the activeTransformations object
 */
export function activeTransformationsReducer(
  oldState: ActiveTransformations,
  action: ActiveTransformationsAction
): ActiveTransformations {
  switch (action.type) {
    case ActionTypes.SET:
      return action.newTransformations;
    case ActionTypes.ADD:
      return addTransformation(oldState, action.newTransformation);
    case ActionTypes.EDIT:
      return editTransformation(
        oldState,
        action.transformation,
        action.newState
      );
    case ActionTypes.DELETE:
      return deleteTransformation(oldState, action.transformation);
  }
}

export enum ActionTypes {
  SET,
  ADD,
  EDIT,
  DELETE,
}

// Only allow editing of fullOverride save state, since partition might need to
// update the map from values to context names each time it updates. Don't see
// a reason to update datasetCreator transformations.
type SafeActions = {
  type: ActionTypes.ADD;
  newTransformation: TransformationDescription;
};

type ActiveTransformationsAction =
  | SafeActions
  | {
      type: ActionTypes.DELETE;
      transformation: TransformationDescription;
    }
  | {
      type: ActionTypes.SET;
      newTransformations: ActiveTransformations;
    }
  | {
      type: ActionTypes.EDIT;
      transformation: FullOverrideDescription;
      newState: {
        extraDependencies?: string[];
        state?: Partial<FullOverrideDescription["state"]>;
      };
    };

export type SafeActiveTransformationsDispatch = React.Dispatch<SafeActions>;

function addTransformation(
  transformations: ActiveTransformations,
  newTransformation: TransformationDescription
): ActiveTransformations {
  const cloned = { ...transformations };
  for (const input of newTransformation.inputs) {
    if (cloned[input] === undefined) {
      cloned[input] = [newTransformation];
    } else {
      cloned[input].push(newTransformation);
    }
  }
  return cloned;
}

function editTransformation(
  transformations: ActiveTransformations,
  oldTransformation: FullOverrideDescription,
  newState: {
    extraDependencies?: string[];
    state?: Partial<FullOverrideDescription["state"]>;
  }
): ActiveTransformations {
  const cloned = { ...transformations };
  for (const input of oldTransformation.inputs) {
    cloned[input] = cloned[input].map((description) => {
      if (description === oldTransformation) {
        description = {
          ...description,
          extraDependencies:
            newState.extraDependencies || description.extraDependencies,
          state: { ...description.state, ...newState.state },
        };
      }
      return description;
    });
  }
  return cloned;
}

function deleteTransformation(
  transformations: ActiveTransformations,
  toDelete: TransformationDescription
): ActiveTransformations {
  const cloned = { ...transformations };
  for (const input of toDelete.inputs) {
    cloned[input] = cloned[input].filter((d) => d !== toDelete);
  }
  return cloned;
}

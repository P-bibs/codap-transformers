import React, { useReducer, useEffect } from "react";
import {
  BaseTransformerName,
  default as transformerList,
} from "../transformer-components/transformerList";
import {
  DDTransformerState,
  FullOverrideFunction,
} from "../transformer-components/DataDrivenTransformer";
import {
  DataSetTransformationOutput,
  NumberTransformationOutput,
} from "../transformers/types";
import {
  updateContextWithDataSet,
  updateText,
  notifyInteractiveFrameIsDirty,
} from "./codapPhone";
import {
  addInteractiveStateRequestListener,
  removeInteractiveStateRequestListener,
  addContextUpdateHook,
  removeContextUpdateHook,
  addContextDeletedHook,
  removeContextDeletedHook,
} from "./codapPhone/listeners";
import { InteractiveState } from "./codapPhone/types";
import { PartitionSaveState } from "../transformers/partition";

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
            setErrMsg(
              `Error updating ${
                (description as DatasetCreatorDescription).output
              }: ${e.message}`
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
  state: DDTransformerState;
}

interface PartitionDescription extends BaseTransformationDescription {
  transformer: "Partition";
  state: PartitionSaveState;
}

// Future fullOverride transformers would be added to this union
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
          state: DDTransformerState
        ) => Promise<DataSetTransformationOutput>
      );
    } else if (description.outputType === TransformationOutputType.TEXT) {
      await updateTextFromDatasetCreator(
        description.state,
        description.output,
        transformFunc.func as (
          state: DDTransformerState
        ) => Promise<NumberTransformationOutput>
      );
    }
  } else if (transformFunc.kind === "fullOverride") {
    description = description as FullOverrideDescription;
    await updateFromFullOverride(description, dispatch);
  }
}

async function updateContextFromDatasetCreator(
  state: DDTransformerState,
  outputName: string,
  transformFunc: (
    state: DDTransformerState
  ) => Promise<DataSetTransformationOutput>
): Promise<void> {
  const [transformed] = await transformFunc(state);
  await updateContextWithDataSet(outputName, transformed);
}

async function updateTextFromDatasetCreator(
  state: DDTransformerState,
  outputName: string,
  transformFunc: (
    state: DDTransformerState
  ) => Promise<NumberTransformationOutput>
): Promise<void> {
  const [result] = await transformFunc(state);
  await updateText(outputName, String(result));
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

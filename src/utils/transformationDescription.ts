import React, { useReducer, useEffect } from "react";
import {
  BaseTransformerName,
  default as transformerList,
} from "../transformer-components/transformerList";
import { DDTransformerState } from "../transformer-components/DataDrivenTransformer";
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
} from "./codapPhone/listeners";
import { InteractiveState } from "./codapPhone/types";

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
          await updateFromDescription(description);
        } catch (e) {
          setErrMsg(e.message);
        }
      }
    }
    addContextUpdateHook(callback);
    return () => removeContextUpdateHook(callback);
  }, [activeTransformations, setErrMsg]);

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

export interface TransformationDescription {
  inputs: string[];
  outputType: TransformationOutputType;
  output: string;
  transformer: BaseTransformerName;
  state: DDTransformerState;
}

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
) {
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
  description: TransformationDescription
): Promise<void> {
  const transformFunc =
    transformerList[description.transformer].componentData.transformerFunction;
  if (transformFunc.kind === "datasetCreator") {
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
    // Do nothing for now
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

export enum ActionTypes {
  SET,
  ADD,
  DELETE,
}

type SafeActions = {
  type: ActionTypes.ADD;
  newTransformation: TransformationDescription;
};

type ActiveTransformationsAction =
  | SafeActions
  | {
      type: ActionTypes.DELETE;
    }
  | {
      type: ActionTypes.SET;
      newTransformations: ActiveTransformations;
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

export function activeTransformationsReducer(
  oldState: ActiveTransformations,
  action: ActiveTransformationsAction
): ActiveTransformations {
  switch (action.type) {
    case ActionTypes.SET:
      return action.newTransformations;
    case ActionTypes.ADD:
      return addTransformation(oldState, action.newTransformation);
    default:
      return oldState;
  }
}

import { default as transformerList } from "../transformerList";
import {
  TransformerTemplateState,
  FullOverrideFunction,
} from "../components/transformer-template/TransformerTemplate";
import {
  DataSetTransformationOutput,
  SingleValueTransformationOutput,
} from "../transformers/types";
import { updateContextWithDataSet, updateText } from "../lib/codapPhone";
import { makeDatasetImmutable } from "../transformers/util";
import { displaySingleValue } from "../transformers/util";
import {
  ActionTypes,
  ActiveTransformations,
  ActiveTransformationsAction,
  DatasetCreatorDescription,
  FullOverrideDescription,
  TransformationDescription,
  TransformationOutputType,
} from "./types";

export function serializeActiveTransformations(
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

export async function updateFromDescription(
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

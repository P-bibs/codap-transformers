import { BaseTransformerName } from "../transformerList";
import { TransformerTemplateState } from "../components/transformer-template/TransformerTemplate";
import { PartitionSaveState } from "../transformers/partition";

export enum TransformationOutputType {
  CONTEXT = "context",
  TEXT = "text",
}

export interface BaseTransformationDescription {
  inputs: string[];
  extraDependencies: string[];
}

export interface DatasetCreatorDescription
  extends BaseTransformationDescription {
  outputType: TransformationOutputType;
  output: string;
  transformer: Exclude<BaseTransformerName, "Partition">;
  state: TransformerTemplateState;
}

export interface PartitionDescription extends BaseTransformationDescription {
  transformer: "Partition";
  state: PartitionSaveState;
}

// Future fullOverride transformers would be added to this union
// NOTE: Editable Copy is not listed here because, by its very nature,
// it does not participate in updates.
export type FullOverrideDescription = PartitionDescription;

export type TransformationDescription =
  | DatasetCreatorDescription
  | FullOverrideDescription;

export type ActiveTransformations = Record<string, TransformationDescription[]>;

export enum ActionTypes {
  SET,
  ADD,
  EDIT,
  DELETE,
}

// Only allow editing of fullOverride save state, since partition might need to
// update the map from values to context names each time it updates. Don't see
// a reason to update datasetCreator transformations.
export type SafeActions = {
  type: ActionTypes.ADD;
  newTransformation: TransformationDescription;
};

export type ActiveTransformationsAction =
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

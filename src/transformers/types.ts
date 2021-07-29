import { Collection } from "../lib/codapPhone/types";
import { PartitionSaveState } from "./partition";

/**
 * DataSet represents a data context and all of the actual data
 * contained within it.
 */
export type DataSet = {
  collections: Collection[];
  records: Record<string, unknown>[];
  editable?: boolean;
};

export type CodapLanguageType =
  | "string"
  | "any"
  | "number"
  | "boolean"
  | "boundary";

/**
 * The properties of a CODAP boundary value that are necessary for
 * extracting its name.
 */
export type Boundary = {
  jsonBoundaryObject: {
    properties: {
      NAME: string;
    };
  };
};

/**
 * SingeValue represents the output of a single-value transformer (e.g. median).
 */
export type SingleValue = number | number[];

/**
 * The format for output for most transformations contains three parts:
 *  1) dataset or numeric value (DataSet | number)
 *  2) output context name (string)
 *  3) output context description] (string)
 */
export type DataSetTransformationOutput = [DataSet, string, string];
export type SingleValueTransformationOutput = [SingleValue, string, string];

export type TransformationOutput =
  | DataSetTransformationOutput
  | SingleValueTransformationOutput;

export type FullOverrideSaveState = PartitionSaveState;

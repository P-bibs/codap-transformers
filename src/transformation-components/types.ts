import { ReactElement } from "react";
import { DDTransformationState } from "./DataDrivenTransformation";

/**
 * The content associated with a saved transformation. Includes the base
 * transformation type and the saved data (for instance attribute names,
 * formulas, etc.)
 */
export type SavedTransformationContent = {
  base:
    | "Build Column"
    | "Compare"
    | "Count"
    | "Difference From"
    | "Filter"
    | "Flatten"
    | "Running Sum"
    | "Running Mean"
    | "Running Min"
    | "Running Max"
    | "Running Difference"
    | "Group By"
    | "Pivot Longer"
    | "Pivot Wider"
    | "Select Attributes"
    | "Sort"
    | "Transform Column"
    | "Copy"
    | "Copy Schema"
    | "Join"
    | "Dot Product"
    | "Average"
    | "Combine Cases"
    | "Reduce"
    | "Partition";
  data?: DDTransformationState;
};

/**
 *  All valid values of the `base` field of a saved transformation object
 */
export type BaseTransformations = NonNullable<
  SavedTransformationContent["base"]
>;

/**
 * All valid save data types
 */
export type TransformationSaveData = NonNullable<
  SavedTransformationContent["data"]
>;

/**
 * The type of saved transformations. `name` is the display name and
 * content contains relevant data.
 */
export type SavedTransformation = {
  name: string;
  description?: string;
  content: SavedTransformationContent;
};

export interface TransformationProps {
  setErrMsg: (s: string | null) => void;
  saveData?: TransformationSaveData;
  errorDisplay: ReactElement;
}

export type TransformationComponent = (
  props: TransformationProps
) => ReactElement;

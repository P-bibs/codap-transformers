import { ReactElement } from "react";
import { DDTransformationState } from "./DataDrivenTransformation";
import { BaseTransformationName } from "./transformationList";

/**
 * The content associated with a saved transformation. Includes the base
 * transformation type and the saved data (for instance attribute names,
 * formulas, etc.)
 */
export type SavedTransformationContent = {
  base: BaseTransformationName;
  data?: DDTransformationState;
};

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

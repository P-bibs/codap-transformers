import { ReactElement } from "react";
import { BuildColumnSaveData } from "./BuildColumn";
import { FilterSaveData } from "./Filter";
import { FoldSaveData } from "./Fold";

/**
 * The content associated with a saved transformation. Includes the base
 * transformation type and the saved data (for instance attribute names,
 * formulas, etc.)
 */
export type SavedTransformationContent =
  | {
      base: "Filter";
      data?: FilterSaveData;
    }
  | {
      base: "Build Column";
      data?: BuildColumnSaveData;
    }
  | {
      base: "Running Sum";
      data?: FoldSaveData;
    };
/**
 *  All valid values of the `base` field of a saved transformation object
 */
export type BaseTransformations = NonNullable<
  SavedTransformationContent["base"]
>;

/**
 * The type of saved transformations. `name` is the display name and
 * content contains relevant data.
 */
export type SavedTransformation = {
  name: string;
  content: SavedTransformationContent;
};

export type TransformationSaveData =
  | FilterSaveData
  | BuildColumnSaveData
  | FoldSaveData;

export interface TransformationProps {
  setErrMsg: (s: string | null) => void;
  saveData?: TransformationSaveData;
}

export type TransformationComponent = (
  props: TransformationProps
) => ReactElement;

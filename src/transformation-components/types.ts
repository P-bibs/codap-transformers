import { ReactElement } from "react";
import { BuildColumnSaveData } from "./BuildColumn";
import { CompareSaveData } from "./Compare";
import { CopySaveData } from "./Copy";
import { CountSaveData } from "./Count";
import { DifferenceFromSaveData } from "./DifferenceFrom";
import { EvalSaveData } from "./Eval";
import { FilterSaveData } from "./Filter";
import { FlattenSaveData } from "./Flatten";
import { FoldSaveData } from "./Fold";
import { GroupBySaveData } from "./GroupBy";
import { JoinSaveData } from "./Join";
import { PivotLongerSaveData } from "./PivotLonger";
import { PivotWiderSaveData } from "./PivotWider";
import { SelectAttributesSaveData } from "./SelectAttributes";
import { SortSaveData } from "./Sort";
import { TransformColumnSaveData } from "./TransformColumn";

/**
 * The content associated with a saved transformation. Includes the base
 * transformation type and the saved data (for instance attribute names,
 * formulas, etc.)
 */
export type SavedTransformationContent =
  | {
      base: "Build Column";
      data?: BuildColumnSaveData;
    }
  | {
      base: "Compare";
      data?: CompareSaveData;
    }
  | {
      base: "Count";
      data?: CountSaveData;
    }
  | {
      base: "Difference From";
      data?: DifferenceFromSaveData;
    }
  | {
      base: "Filter";
      data?: FilterSaveData;
    }
  | {
      base: "Flatten";
      data?: FlattenSaveData;
    }
  | {
      base: "Running Sum";
      data?: FoldSaveData;
    }
  | {
      base: "Running Mean";
      data?: FoldSaveData;
    }
  | {
      base: "Running Min";
      data?: FoldSaveData;
    }
  | {
      base: "Running Max";
      data?: FoldSaveData;
    }
  | {
      base: "Running Difference";
      data?: FoldSaveData;
    }
  | {
      base: "Group By";
      data?: GroupBySaveData;
    }
  | {
      base: "Pivot Longer";
      data?: PivotLongerSaveData;
    }
  | {
      base: "Pivot Wider";
      data?: PivotWiderSaveData;
    }
  | {
      base: "Select Attributes";
      data?: SelectAttributesSaveData;
    }
  | {
      base: "Sort";
      data?: SortSaveData;
    }
  | {
      base: "Transform Column";
      data?: TransformColumnSaveData;
    }
  | {
      base: "Copy";
      data?: CopySaveData;
    }
  | {
      base: "Join";
      data?: JoinSaveData;
    }
  | {
      base: "Eval";
      data?: EvalSaveData;
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
  content: SavedTransformationContent;
};

export interface TransformationProps {
  setErrMsg: (s: string | null) => void;
  saveData?: TransformationSaveData;
}

export type TransformationComponent = (
  props: TransformationProps
) => ReactElement;

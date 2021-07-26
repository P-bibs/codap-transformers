import { TransformerTemplateState } from "./TransformerTemplate";
import { BaseTransformerName } from "../../transformerList";

/**
 * The content associated with a saved transformer. Includes the base
 * transformer type and the saved data (for instance attribute names,
 * formulas, etc.)
 */
export type SavedTransformerContent = {
  base: BaseTransformerName;
  data?: TransformerTemplateState;
};

/**
 * All valid save data types
 */
export type TransformerSaveData = NonNullable<SavedTransformerContent["data"]>;

/**
 * The type of saved transformers. `name` is the display name and
 * content contains relevant data.
 */
export type SavedTransformer = {
  name: string;
  description?: string;
  content: SavedTransformerContent;
};

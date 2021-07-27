import {
  DDTransformerProps,
  DDTransformerState,
} from "../transformer-components/DataDrivenTransformer";
import { getContextAndDataSet } from "../utils/codapPhone";
import { applyNewDataSet, readableName } from "../transformer-components/util";
import { makeDatasetMutable } from "../transformers/util";
import { uncheckedCopy } from "./copy";
import { DataSet } from "./types";

export async function editableCopyOverride(
  { setErrMsg }: DDTransformerProps,
  { context1: inputDataCtxt }: DDTransformerState
): Promise<void> {
  setErrMsg(null);

  if (inputDataCtxt === null) {
    setErrMsg("Please choose a valid dataset to transform");
    return;
  }

  const { context, dataset } = await getContextAndDataSet(inputDataCtxt);
  const ctxtName = readableName(context);

  applyNewDataSet(
    uncheckedEditableCopy(dataset),
    `Editable Copy of ${ctxtName}`,
    `An editable copy of the ${ctxtName} dataset that does not update when the \
original dataset is changed.`
  );
}

/**
 * Unchecked version of editable copy. Invokes the Copy transformer and
 * ensures that all attributes on the resulting dataset are marked
 * with editable=true.
 *
 * @param dataset The dataset to make an editable copy of
 * @returns A copy of the input dataset with editable attributes
 */
export function uncheckedEditableCopy(dataset: DataSet): DataSet {
  return makeDatasetMutable(uncheckedCopy(dataset));
}

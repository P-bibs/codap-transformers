import {
  DDTransformerProps,
  DDTransformerState,
} from "../transformer-components/DataDrivenTransformer";
import { getContextAndDataSet } from "../utils/codapPhone";
import { applyNewDataSet, readableName } from "../transformer-components/util";
import { uncheckedCopy } from "./copy";

export async function mutableCloneOverride(
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
    uncheckedCopy(dataset),
    `Clone of ${ctxtName}`,
    `A copy of the ${ctxtName} dataset.`
  );
}

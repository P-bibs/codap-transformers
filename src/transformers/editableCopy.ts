import {
  TransformerTemplateProps,
  TransformerTemplateState,
} from "../components/transformer-template/TransformerTemplate";
import { getContextAndDataSet } from "../lib/codapPhone";
import { applyNewDataSet } from "../components/transformer-template/util";
import { readableName } from "../transformers/util";
import { makeDatasetMutable } from "../transformers/util";
import { uncheckedCopy } from "./copy";

export async function editableCopyOverride(
  { setErrMsg }: TransformerTemplateProps,
  { context1: inputDataCtxt }: TransformerTemplateState
): Promise<void> {
  setErrMsg(null);

  if (inputDataCtxt === null) {
    setErrMsg("Please choose a valid dataset to transform");
    return;
  }

  const { context, dataset } = await getContextAndDataSet(inputDataCtxt);
  const ctxtName = readableName(context);

  applyNewDataSet(
    makeDatasetMutable(uncheckedCopy(dataset)),
    `Editable Copy of ${ctxtName}`,
    `An editable copy of the ${ctxtName} dataset that does not update when the \
original dataset is changed.`
  );
}

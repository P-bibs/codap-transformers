import { TransformerTemplateState } from "../components/transformer-template/TransformerTemplate";
import { tryTitle } from "../transformers/util";
import { getContextAndDataSet } from "../lib/codapPhone";
import { DataSet, EMPTY_MVR, TransformationOutput } from "./types";
import { t } from "../strings";

/**
 * Produces a dataset identical to the original.
 */
export async function copy({
  context1: contextName,
}: TransformerTemplateState): Promise<TransformationOutput> {
  if (contextName === null) {
    throw new Error(t("errors:validation.noDataSet"));
  }

  const { context, dataset } = await getContextAndDataSet(contextName);
  const ctxtName = tryTitle(context);

  return [
    await uncheckedCopy(dataset),
    `UneditableCopy(${ctxtName})`,
    `An uneditable copy of the ${ctxtName} dataset.`,
    EMPTY_MVR,
  ];
}

export function uncheckedCopy(dataset: DataSet): DataSet {
  return {
    collections: dataset.collections,
    records: dataset.records,
  };
}

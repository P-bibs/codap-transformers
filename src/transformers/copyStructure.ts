import { TransformerTemplateState } from "../components/transformer-template/TransformerTemplate";
import { readableName } from "../transformers/util";
import { getContextAndDataSet } from "../lib/codapPhone";
import { DataSet, TransformationOutput } from "./types";
import { t } from "../strings";

/**
 * Produces a dataset with an identical structure (collection hierarchy,
 * attributes) to the input, but with no records.
 */
export async function copyStructure({
  context1: contextName,
}: TransformerTemplateState): Promise<TransformationOutput> {
  if (contextName === null) {
    throw new Error(t("errors:validation.noDataSet"));
  }

  const { context, dataset } = await getContextAndDataSet(contextName);
  const ctxtName = readableName(context);

  return [
    await uncheckedCopyStructure(dataset),
    `CopyStructure(${ctxtName})`,
    `A copy of the collections and attributes of the ${ctxtName} dataset, but with no cases.`,
  ];
}

export function uncheckedCopyStructure(dataset: DataSet): DataSet {
  return {
    collections: dataset.collections,
    records: [],
  };
}

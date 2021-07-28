import { TransformerTemplateState } from "../components/transformer-template/TransformerTemplate";
import { readableName } from "../transformers/util";
import { getContextAndDataSet } from "../lib/codapPhone";
import { DataSet, TransformationOutput } from "./types";

/**
 * Produces a dataset identical to the original.
 */
export async function copy({
  context1: contextName,
}: TransformerTemplateState): Promise<TransformationOutput> {
  if (contextName === null) {
    throw new Error("Please choose a valid dataset to transform.");
  }

  const { context, dataset } = await getContextAndDataSet(contextName);
  const ctxtName = readableName(context);

  return [
    await uncheckedCopy(dataset),
    `Copy(${ctxtName})`,
    `A copy of the ${ctxtName} dataset.`,
    undefined,
  ];
}

export function uncheckedCopy(dataset: DataSet): DataSet {
  return {
    collections: dataset.collections,
    records: dataset.records,
  };
}

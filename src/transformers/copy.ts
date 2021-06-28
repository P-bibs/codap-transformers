import { DDTransformerState } from "../transformer-components/DataDrivenTransformer";
import { readableName } from "../transformer-components/util";
import { getContextAndDataSet } from "../utils/codapPhone";
import { DataSet } from "./types";

/**
 * Produces a dataset identical to the original.
 */
export async function copy({
  context1: contextName,
}: DDTransformerState): Promise<[DataSet, string]> {
  if (contextName === null) {
    throw new Error("Please choose a valid dataset to transform.");
  }

  const { context, dataset } = await getContextAndDataSet(contextName);
  return [await uncheckedCopy(dataset), `Copy of ${readableName(context)}`];
}

function uncheckedCopy(dataset: DataSet): DataSet {
  return {
    collections: dataset.collections,
    records: dataset.records,
  };
}

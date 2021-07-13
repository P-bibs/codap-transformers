import { DataSet, TransformationOutput } from "./types";
import { uncheckedFlatten } from "./flatten";
import { getAttributeDataFromDataset } from "./util";
import { DDTransformerState } from "../transformer-components/DataDrivenTransformer";
import { getContextAndDataSet } from "../utils/codapPhone";
import { readableName } from "../transformer-components/util";
import { uncheckedGroupBy } from "./groupBy";

/**
 * Compares two contexts in a variety of ways
 */
export async function categoricalCompare({
  context1: inputDataContext1,
  attribute1: inputAttribute1,
  attribute2: inputAttribute2,
}: DDTransformerState): Promise<TransformationOutput> {
  if (!inputDataContext1 || !inputAttribute1 || !inputAttribute2) {
    throw new Error("Please choose a dataset and two attributes");
  }

  const { context, dataset } = await getContextAndDataSet(inputDataContext1);

  const contextName = readableName(context);

  return [
    await uncheckedCompare(dataset, inputAttribute1, inputAttribute2),
    `Compare of ${contextName}`,
    `A categorical comparison of the attributes ${inputAttribute1} and ${inputAttribute2} (from ${contextName})`,
  ];
}

function uncheckedCompare(
  dataset: DataSet,
  attributeName1: string,
  attributeName2: string
): DataSet {
  const attribute1Data = getAttributeDataFromDataset(attributeName1, dataset);
  const attribute2Data = getAttributeDataFromDataset(attributeName2, dataset);

  dataset = uncheckedFlatten(dataset);
  const out = uncheckedGroupBy(
    dataset,
    [
      {
        attrName: attribute1Data.name,
        groupedName: `${attribute1Data.name} Category`,
      },
      {
        attrName: attribute2Data.name,
        groupedName: `${attribute2Data.name} Category`,
      },
    ],
    "Comparison"
  );
  return out;
}

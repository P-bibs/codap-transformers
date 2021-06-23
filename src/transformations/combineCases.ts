import { DataSet } from "./types";
import { setEquality } from "../utils/sets";
import { DDTransformationState } from "../transformation-components/DataDrivenTransformation";
import { getContextAndDataSet } from "../utils/codapPhone";
import { readableName } from "../transformation-components/util";
import { eraseFormulas, allAttrNames, cloneCollection } from "./util";

/**
 * Stack combines a top and bottom table which have matching attributes
 * into a single table that has all the top cases, followed by all
 * the bottom cases.
 *
 * NOTE: The output table's schema will match that of the `top` input.
 * The top and bottom must have the same set of attributes for stack
 * to succeed.
 */
export async function combineCases({
  context1: inputDataContext1,
  context2: inputDataContext2,
}: DDTransformationState): Promise<[DataSet, string]> {
  if (!inputDataContext1 || !inputDataContext2) {
    throw new Error("Please choose two datasets to combine.");
  }

  const { context: context1, dataset: dataset1 } = await getContextAndDataSet(
    inputDataContext1
  );
  const { context: context2, dataset: dataset2 } = await getContextAndDataSet(
    inputDataContext2
  );
  return [
    await uncheckedCombineCases(dataset1, dataset2),
    `Combined Cases of ${readableName(context1)} and ${readableName(context2)}`,
  ];
}

function uncheckedCombineCases(base: DataSet, combining: DataSet): DataSet {
  const baseAttrs = allAttrNames(base);
  const combiningAttrs = allAttrNames(combining);

  if (
    !setEquality(baseAttrs, combiningAttrs, (name1, name2) => name1 === name2)
  ) {
    throw new Error(
      `Base and combining tables must have the same attribute names`
    );
  }

  // add combining records
  const records = base.records.concat(combining.records);

  // NOTE: do not preserve base table's formulas. It is possible the combining
  // table's values get clobbered by a formula.
  const collections = base.collections.map(cloneCollection);
  collections.forEach((coll) => eraseFormulas(coll.attrs || []));

  // same schema as base, with combined records
  return {
    collections,
    records,
  };
}

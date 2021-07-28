import { DataSet, EMPTY_MVR, TransformationOutput } from "./types";
import { setEquality } from "../lib/utils/sets";
import { TransformerTemplateState } from "../components/transformer-template/TransformerTemplate";
import { getContextAndDataSet } from "../lib/codapPhone";
import { tryTitle } from "../transformers/util";
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
}: TransformerTemplateState): Promise<TransformationOutput> {
  if (!inputDataContext1 || !inputDataContext2) {
    throw new Error("Please choose two datasets to combine.");
  }

  const { context: context1, dataset: dataset1 } = await getContextAndDataSet(
    inputDataContext1
  );
  const { context: context2, dataset: dataset2 } = await getContextAndDataSet(
    inputDataContext2
  );
  const ctxtName1 = tryTitle(context1);
  const ctxtName2 = tryTitle(context2);

  return [
    await uncheckedCombineCases(dataset1, dataset2),
    `CombinedCases(${ctxtName1}, ${ctxtName2})`,
    `A copy of ${ctxtName1}, containing all of the cases from both ${ctxtName1} and ${ctxtName2}.`,
    EMPTY_MVR,
  ];
}

export function uncheckedCombineCases(
  base: DataSet,
  combining: DataSet
): DataSet {
  const baseAttrs = allAttrNames(base);
  const combiningAttrs = allAttrNames(combining);

  if (
    !setEquality(baseAttrs, combiningAttrs, (name1, name2) => name1 === name2)
  ) {
    throw new Error(
      `Base and combining datasets must have the same attribute names`
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

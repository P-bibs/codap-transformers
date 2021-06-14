import { DataSet } from "./types";
import { setEquality } from "../utils/sets";
import { eraseFormulas } from "./util";

/**
 * Stack combines a top and bottom table which have matching attributes
 * into a single table that has all the top cases, followed by all
 * the bottom cases.
 *
 * NOTE: The output table's schema will match that of the `top` input.
 * The top and bottom must have the same set of attributes for stack
 * to succeed.
 */
export function combineCases(base: DataSet, combining: DataSet): DataSet {
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
  const collections = base.collections.slice();
  collections.forEach((coll) => eraseFormulas(coll.attrs || []));

  // same schema as base, with combined records
  return {
    collections: base.collections.slice(),
    records,
  };
}

/**
 * Extract all attribute names from the given dataset.
 */
function allAttrNames(dataset: DataSet): string[] {
  return dataset.collections
    .map((coll) => coll.attrs || [])
    .flat()
    .map((attr) => attr.name);
}

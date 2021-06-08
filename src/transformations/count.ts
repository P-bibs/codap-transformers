import { DataSet } from "./types";
import { CodapAttribute, Collection } from "../utils/codapPhone/types";
import { eraseFormulas } from "./util";
import { uniqueName } from "../utils/names";

// TODO: allow for two modes:
//  1) treat data like one table, values are counted across all cases
//  2) treat hierarchy as subtables, values are counted *within subtable*

/**
 * Count consumes a dataset and list of attribute names and produces a new
 * dataset that presents a summary of the frequency of all tuples of values
 * from those attributes that are present in the input.
 *
 * The output dataset has one collection containing all the counted attributes
 * (with their distinct tuples), as well as a `count` attribute, which lists
 * the frequency of a given tuple.
 */
export function count(dataset: DataSet, attributes: string[]): DataSet {
  // validate attribute names
  for (const attrName of attributes) {
    if (
      dataset.collections.find((coll) =>
        coll.attrs?.find((attr) => attr.name === attrName)
      ) === undefined
    ) {
      throw new Error(`invalid attribute name: ${attrName}`);
    }
  }

  let countedAttrs: CodapAttribute[] = [];
  for (const coll of dataset.collections) {
    countedAttrs = countedAttrs.concat(
      coll.attrs?.filter((attr) => attributes.includes(attr.name)).slice() || []
    );
  }
  eraseFormulas(countedAttrs);

  // generate a unique attribute name for the `count` column
  const countAttrName = uniqueName(
    "count",
    countedAttrs.map((attr) => attr.name)
  );

  const attributeNames = attributes.join(", ");
  // single collection with copy of counted attributes, plus
  // a new "count" attribute for the frequencies
  const collections: Collection[] = [
    {
      name: `Count (${attributeNames})`,
      labels: {},
      attrs: [
        ...countedAttrs,
        {
          name: countAttrName,
          description: `The frequency of each tuple of (${attributeNames})`,
        },
      ],
    },
  ];

  // make copy of records containing only the attributes to count
  const tuples = dataset.records.map((record) => {
    const copy: Record<string, unknown> = {};
    for (const attrName of attributes) {
      if (record[attrName] === undefined) {
        throw new Error(`invalid attribute name: ${attrName}`);
      }

      copy[attrName] = record[attrName];
    }
    return copy;
  });

  // map from stringified tuples to the tuple itself and its frequency
  const tupleToCount: Record<string, Record<string, unknown>> = {};

  // count frequency of tuples in dataset
  tuples.forEach((tuple) => {
    const key = JSON.stringify(tuple);

    if (tupleToCount[key] === undefined) {
      const withCount = { ...tuple };
      withCount[countAttrName] = 1;
      tupleToCount[key] = withCount;
    } else {
      // the count field is guaranteed to exist because
      // we initialized it with a count of 1
      // eslint-disable-next-line
      (tupleToCount[key] as any)[countAttrName]++;
    }
  });

  // the distinct, counted tuples become the records of the new dataset
  const records = Object.values(tupleToCount);

  return {
    collections,
    records,
  };
}

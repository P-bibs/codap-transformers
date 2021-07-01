import { CodapAttribute, Collection } from "../../utils/codapPhone/types";
import { DataSet } from "../types";
import { cloneCollection, shallowCopy } from "../util";

/**
 * Make a collection object from its pieces.
 */
function makeCollection(name: string, attributes: string[]): Collection {
  return {
    name,
    labels: {},
    attrs: attributes.map((attr) => makeAttribute(attr)),
  };
}

/**
 * Make an attribute object from its pieces.
 */
function makeAttribute(name: string): CodapAttribute {
  return {
    name,
  };
}

/**
 * Make a list of records from the attributes and values for those attributes.
 */
function makeRecords(
  attributes: string[],
  valueLists: unknown[][]
): Record<string, unknown>[] {
  return valueLists.map((valueList) => {
    const map: Record<string, unknown> = {};
    valueList.forEach((value, i) => {
      map[attributes[i]] = value;
    });
    return map;
  });
}

/**
 * Makes a clone of a dataset. 
 */
export function cloneDataSet(dataset: DataSet): DataSet {
  return {
    collections: dataset.collections.map((coll) => cloneCollection(coll)),
    records: dataset.records.map((rec) => shallowCopy(rec)),
  };
}

export const DATASET_A: DataSet = {
  collections: [
    makeCollection("parent", ["A"]),
    makeCollection("child", ["B", "C"]),
  ],
  records: makeRecords(
    ["A", "B", "C"],
    [
      [3, true, 2000],
      [8, true, 2003],
      [10, false, 1998],
      [4, true, 2010],
      [10, false, 2014],
    ]
  ),
};

export const DATASET_B: DataSet = {
  collections: [
    makeCollection("cases", ["Name", "Birth Year", "Current Year", "Grade"]),
  ],
  records: makeRecords(
    ["Name", "Birth Year", "Current Year", "Grade"],
    [
      ["Jon", 1990, 2021, 88],
      ["Sheila", 1995, 2021, 91],
      ["Joseph", 2001, 2021, 100],
      ["Eve", 2000, 2021, 93],
      ["Nick", 1998, 2021, 95],
      ["Paula", 1988, 2021, 81],
    ]
  ),
};

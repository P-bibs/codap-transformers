import { CodapAttribute, Collection } from "../../utils/codapPhone/types";
import { DataSet } from "../types";
import { cloneCollection, shallowCopy } from "../util";

/**
 * Make a collection object from its pieces.
 */
export function makeCollection(name: string, attributes: string[]): Collection {
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
export function makeRecords(
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

/**
 * A small example dataset with attributes A, B, and C across two collections.
 */
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

/**
 * A small example dataset with attributes Name, Birth Year, Current
 * Year, and Grade.
 */
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

/**
 * A dataset with lots of collection/attribute metadata (titles,
 * descriptions, formulas, etc.)
 */
export const DATASET_WITH_META: DataSet = {
  collections: [
    {
      name: "Collection",
      title: "Collection Title",
      description: "A description of the collection.",
      labels: {
        singleCase: "case",
        pluralCase: "cases",
      },
      attrs: [
        {
          name: "A",
          title: "A Attribute",
          type: "numeric",
          description: "Description for A",
          editable: true,
          formula: "B + 7",
          hidden: false,
          precision: 2,
          unit: "ft",
        },
        {
          name: "B",
          title: "B Attribute",
          type: "numeric",
          description: "Description for B",
          editable: false,
          formula: "abs(-7)",
          hidden: true,
          precision: 2,
          unit: "m",
        },
        {
          name: "C",
          title: "C Attribute",
          type: "categorical",
          description: "Description for C",
          editable: false,
          hidden: false,
        },
      ],
    },
  ],
  records: [],
};

/**
 * A dataset with no collections or records.
 */
export const EMPTY_DATASET: DataSet = {
  collections: [],
  records: [],
};

/**
 * A dataset with several collections but no records.
 */
export const EMPTY_RECORDS: DataSet = {
  collections: [
    makeCollection("Collection A", ["A", "B", "C"]),
    makeCollection("Collection B", ["D"]),
    makeCollection("Collection C", ["E", "F"]),
  ],
  records: [],
};

/**
 * A smaller version of the datasets produced by the US Microdata Portal
 * plugin.
 */
export const CENSUS_DATASET: DataSet = {
  collections: [
    {
      name: "places",
      title: "places",
      labels: {},
      attrs: [
        {
          name: "State",
          title: "State",
          type: "categorical",
          description:
            "The state in which the individual lives, using a federal coding scheme that lists states alphabetically. Note that you must select this attribute if you want to display state names in your case table or graphs.",
          editable: true,
          hidden: false,
          precision: 2,
          unit: null,
        },
      ],
    },
    {
      name: "people",
      title: "people",
      labels: {},
      attrs: [
        {
          name: "sample",
          title: "sample",
          type: "categorical",
          description: "sample number",
          editable: true,
          hidden: false,
          precision: 2,
          unit: null,
        },
        {
          name: "Sex",
          title: "Sex",
          type: "categorical",
          description: "Each individual's biological sex as male or female.",
          editable: true,
          hidden: false,
          precision: 2,
          unit: null,
        },
        {
          name: "Age",
          title: "Age",
          type: "numeric",
          description:
            "The individual's age in years as of the last birthday. Values range from 0 (less than 1 year old) to 90 and above.  See codebook for special codes.",
          editable: true,
          hidden: false,
          precision: 2,
          unit: null,
        },
        {
          name: "Year",
          title: "Year",
          type: "categorical",
          description:
            "The four-digit year of the decennial census or ACS for each person's questionnaire responses. Note that you must select this attribute if you want to display year indicators in your case table or graphs.",
          editable: true,
          hidden: false,
          precision: 2,
          unit: null,
        },
      ],
    },
  ],
  records: makeRecords(
    ["State", "sample", "Sex", "Age", "Year"],
    [
      ["Arizona", 1, "Male", 71, 2017],
      ["Arizona", 1, "Male", 11, 2017],
      ["Florida", 1, "Female", 16, 2017],
      ["Florida", 1, "Male", 5, 2017],
      ["Florida", 1, "Female", 52, 2017],
      ["California", 1, "Male", 18, 2017],
      ["California", 1, "Male", 72, 2017],
      ["California", 1, "Female", 22, 2017],
      ["California", 1, "Female", 48, 2017],
      ["Texas", 1, "Female", 18, 2017],
      ["Texas", 1, "Female", 47, 2017],
      ["Texas", 1, "Female", 20, 2017],
      ["Texas", 1, "Female", 4, 2017],
      ["Texas", 1, "Male", 30, 2017],
      ["Texas", 1, "Male", 63, 2017],
      ["South Carolina", 1, "Female", 27, 2017],
      ["South Carolina", 1, "Female", 38, 2017],
      ["Idaho", 1, "Male", 67, 2017],
      ["Idaho", 1, "Female", 47, 2017],
      ["Massachusetts", 1, "Female", 64, 2017],
      ["Massachusetts", 1, "Male", 33, 2017],
      ["Massachusetts", 1, "Female", 83, 2017],
    ]
  ),
};

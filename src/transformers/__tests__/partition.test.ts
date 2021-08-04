import { partition, PartitionDataset } from "../partition";
import { DataSet } from "../types";
import {
  CENSUS_DATASET,
  DATASET_A,
  DATASET_A_SUPERSET,
  DATASET_B,
  DATASET_WITH_MISSING,
  EMPTY_DATASET,
  EMPTY_RECORDS,
  FULLY_FEATURED_DATASET,
  makeRecords,
} from "./data";

/**
 * A wrapper around partition that discards the missing value report.
 */
function partitionWrapper(
  contextTitle: string,
  dataset: DataSet,
  attribute: string
): PartitionDataset[] {
  const [output] = partition(contextTitle, dataset, attribute);
  return output;
}

test("simple partition on small dataset", () => {
  expect(new Set(partitionWrapper("Dataset A", DATASET_A, "B"))).toEqual(
    new Set([
      {
        dataset: {
          ...DATASET_A,
          records: makeRecords(
            ["A", "B", "C"],
            [
              [3, true, 2000],
              [8, true, 2003],
              [4, true, 2010],
            ]
          ),
        },
        distinctValue: true,
        distinctValueAsStr: "true",
      },
      {
        dataset: {
          ...DATASET_A,
          records: makeRecords(
            ["A", "B", "C"],
            [
              [10, false, 1998],
              [10, false, 2014],
            ]
          ),
        },
        distinctValue: false,
        distinctValueAsStr: "false",
      },
    ])
  );
});

test("partition on larger dataset", () => {
  expect(
    new Set(partitionWrapper("Census Dataset", CENSUS_DATASET, "State"))
  ).toEqual(
    new Set([
      {
        dataset: {
          ...CENSUS_DATASET,
          records: makeRecords(
            ["State", "sample", "Sex", "Age", "Year"],
            [
              ["Arizona", 1, "Male", 71, 2017],
              ["Arizona", 1, "Male", 11, 2017],
            ]
          ),
        },
        distinctValue: "Arizona",
        distinctValueAsStr: '"Arizona"',
      },
      {
        dataset: {
          ...CENSUS_DATASET,
          records: makeRecords(
            ["State", "sample", "Sex", "Age", "Year"],
            [
              ["Florida", 1, "Female", 16, 2017],
              ["Florida", 1, "Male", 5, 2017],
              ["Florida", 1, "Female", 52, 2017],
            ]
          ),
        },
        distinctValue: "Florida",
        distinctValueAsStr: '"Florida"',
      },
      {
        dataset: {
          ...CENSUS_DATASET,
          records: makeRecords(
            ["State", "sample", "Sex", "Age", "Year"],
            [
              ["California", 1, "Male", 18, 2017],
              ["California", 1, "Male", 72, 2017],
              ["California", 1, "Female", 22, 2017],
              ["California", 1, "Female", 48, 2017],
            ]
          ),
        },
        distinctValue: "California",
        distinctValueAsStr: '"California"',
      },
      {
        dataset: {
          ...CENSUS_DATASET,
          records: makeRecords(
            ["State", "sample", "Sex", "Age", "Year"],
            [
              ["Texas", 1, "Female", 18, 2017],
              ["Texas", 1, "Female", 47, 2017],
              ["Texas", 1, "Female", 20, 2017],
              ["Texas", 1, "Female", 4, 2017],
              ["Texas", 1, "Male", 30, 2017],
              ["Texas", 1, "Male", 63, 2017],
            ]
          ),
        },
        distinctValue: "Texas",
        distinctValueAsStr: '"Texas"',
      },
      {
        dataset: {
          ...CENSUS_DATASET,
          records: makeRecords(
            ["State", "sample", "Sex", "Age", "Year"],
            [
              ["South Carolina", 1, "Female", 27, 2017],
              ["South Carolina", 1, "Female", 38, 2017],
            ]
          ),
        },
        distinctValue: "South Carolina",
        distinctValueAsStr: '"South Carolina"',
      },
      {
        dataset: {
          ...CENSUS_DATASET,
          records: makeRecords(
            ["State", "sample", "Sex", "Age", "Year"],
            [
              ["Idaho", 1, "Male", 67, 2017],
              ["Idaho", 1, "Female", 47, 2017],
            ]
          ),
        },
        distinctValue: "Idaho",
        distinctValueAsStr: '"Idaho"',
      },
      {
        dataset: {
          ...CENSUS_DATASET,
          records: makeRecords(
            ["State", "sample", "Sex", "Age", "Year"],
            [
              ["Massachusetts", 1, "Female", 64, 2017],
              ["Massachusetts", 1, "Male", 33, 2017],
              ["Massachusetts", 1, "Female", 83, 2017],
            ]
          ),
        },
        distinctValue: "Massachusetts",
        distinctValueAsStr: '"Massachusetts"',
      },
    ])
  );
});

test("partition on attribute with only one value produces copy of input", () => {
  expect(partitionWrapper("Dataset B", DATASET_B, "Current_Year")).toEqual([
    {
      dataset: DATASET_B,
      distinctValue: 2021,
      distinctValueAsStr: "2021",
    },
  ]);
  expect(partitionWrapper("Dataset A Super", DATASET_A_SUPERSET, "D")).toEqual([
    {
      dataset: DATASET_A_SUPERSET,
      distinctValue: "a",
      distinctValueAsStr: '"a"',
    },
  ]);
});

test("partition on dataset with no records produces no datasets", () => {
  expect(partitionWrapper("Empty Records", EMPTY_RECORDS, "E")).toEqual([]);
});

test("missing values are treated as their own value", () => {
  expect(
    partitionWrapper("Dataset with Missing", DATASET_WITH_MISSING, "C")
  ).toContainEqual(
    // This is the output dataset containing all cases for which C was a missing value
    {
      dataset: {
        ...DATASET_WITH_MISSING,
        records: makeRecords(
          ["A", "B", "C"],
          [
            [10, 2, ""],
            ["", "", ""],
          ]
        ),
      },
      distinctValue: "",
      distinctValueAsStr: '""',
    }
  );
});

test("errors on invalid attribute", () => {
  const invalidAttributeErr = /was not found/;
  expect(() =>
    partitionWrapper("Dataset A", DATASET_A, "Not here")
  ).toThrowError(invalidAttributeErr);
  expect(() =>
    partitionWrapper("Dataset B", DATASET_B, "Last Name")
  ).toThrowError(invalidAttributeErr);
  expect(() =>
    partitionWrapper("Census Dataset", CENSUS_DATASET, "Family Size")
  ).toThrowError(invalidAttributeErr);
  expect(() =>
    partitionWrapper("Empty Dataset", EMPTY_DATASET, "Anything")
  ).toThrowError(invalidAttributeErr);
});

/**
 * Some possible pairs of test datasets and an attribute to partition them by.
 * The first element is a descriptor of the test case for use in test messages.
 */
const cases: [string, DataSet, string][] = [
  ["Census / State", CENSUS_DATASET, "State"],
  ["Census / sample", CENSUS_DATASET, "sample"],
  ["Census / Sex", CENSUS_DATASET, "Sex"],
  ["Census / Age", CENSUS_DATASET, "Age"],
  ["Census / Year", CENSUS_DATASET, "Year"],
  ["A / A", DATASET_A, "A"],
  ["A / B", DATASET_A, "B"],
  ["A / C", DATASET_A, "C"],
  ["B / Name", DATASET_B, "Name"],
  ["B / Birth_Year", DATASET_B, "Birth_Year"],
  ["B / Current_Year", DATASET_B, "Current_Year"],
  ["B / Grade", DATASET_B, "Grade"],
  ["Fully featured / Attribute_1", FULLY_FEATURED_DATASET, "Attribute_1"],
  ["Fully featured / Attribute_2", FULLY_FEATURED_DATASET, "Attribute_2"],
  ["Fully featured / Attribute_3", FULLY_FEATURED_DATASET, "Attribute_3"],
  ["Fully featured / Attribute_4", FULLY_FEATURED_DATASET, "Attribute_4"],
  ["Fully featured / Attribute_5", FULLY_FEATURED_DATASET, "Attribute_5"],
];

describe("partitioned datasets have identical collections/attributes to input", () => {
  test.each(cases)("%s", (_, dataset, attribute) => {
    const partitioned = partitionWrapper("Dataset", dataset, attribute);
    expect.assertions(partitioned.length);

    for (const out of partitioned) {
      expect(out.dataset.collections).toEqual(dataset.collections);
    }
  });
});

describe("partitioned datasets contain single homogenous value for partitioned attribute", () => {
  test.each(cases)("%s", (_, dataset, attribute) => {
    const partitioned = partitionWrapper("Dataset", dataset, attribute);
    expect.assertions(partitioned.length);

    for (const out of partitioned) {
      expect(out.dataset.records.map((record) => record[attribute])).toEqual(
        Array(out.dataset.records.length).fill(out.distinctValue)
      );
    }
  });
});

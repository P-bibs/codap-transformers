import { uncheckedSelectAttributes } from "../selectAttributes";
import { eraseFormulas } from "../util";
import {
  CENSUS_DATASET,
  cloneDataSet,
  DATASET_A,
  DATASET_A_SUBSET,
  DATASET_A_SUPERSET,
  DATASET_B,
  DATASET_WITH_META,
  EMPTY_DATASET,
  FULLY_FEATURED_DATASET,
  makeCollection,
  makeRecords,
} from "./data";

test("'select only' extracts ONLY the indicated attributes", () => {
  expect(
    uncheckedSelectAttributes(DATASET_B, ["Name", "Grade"], false)
  ).toEqual({
    collections: [makeCollection("cases", ["Name", "Grade"])],
    records: makeRecords(
      ["Name", "Grade"],
      [
        ["Jon", 88],
        ["Sheila", 91],
        ["Joseph", 100],
        ["Eve", 93],
        ["Nick", 95],
        ["Paula", 81],
      ]
    ),
  });

  expect(uncheckedSelectAttributes(DATASET_A, ["A"], false)).toEqual({
    collections: [makeCollection("parent", ["A"])],
    records: makeRecords(["A"], [[3], [8], [10], [4], [10]]),
  });

  expect(uncheckedSelectAttributes(DATASET_A, ["A", "B"], false)).toEqual(
    DATASET_A_SUBSET
  );
});

test("'select all but' extracts everything EXCEPT the indicated attributes", () => {
  expect(uncheckedSelectAttributes(DATASET_A_SUPERSET, ["D"], true)).toEqual(
    DATASET_A
  );

  expect(
    uncheckedSelectAttributes(
      DATASET_B,
      ["Name", "Current_Year", "Grade"],
      true
    )
  ).toEqual({
    collections: [makeCollection("cases", ["Birth_Year"])],
    records: makeRecords(
      ["Birth_Year"],
      [[1990], [1995], [2001], [2000], [1998], [1988]]
    ),
  });

  expect(uncheckedSelectAttributes(DATASET_A, ["C"], true)).toEqual(
    DATASET_A_SUBSET
  );
});

test("removes collections with no attributes and reparents as necessary", () => {
  const withParents = {
    collections: [
      makeCollection("C1", ["A", "B"]),
      makeCollection("C2", ["C"], "C1"),
      makeCollection("C3", ["D", "E", "F"], "C2"),
    ],
    records: [],
  };
  expect(
    uncheckedSelectAttributes(withParents, ["A", "F", "D"], false)
  ).toEqual({
    collections: [
      makeCollection("C1", ["A"]),
      makeCollection("C3", ["D", "F"], "C1"),
    ],
    records: [],
  });

  const longParentChain = {
    collections: [
      makeCollection("C1", ["A"]),
      makeCollection("C2", ["B"], "C1"),
      makeCollection("C3", ["C"], "C2"),
      makeCollection("C4", ["D"], "C3"),
      makeCollection("C5", ["E"], "C4"),
      makeCollection("C6", ["F"], "C5"),
      makeCollection("C7", ["G"], "C6"),
    ],
    records: [],
  };
  expect(uncheckedSelectAttributes(longParentChain, ["B", "E"], false)).toEqual(
    {
      collections: [
        makeCollection("C2", ["B"]),
        makeCollection("C5", ["E"], "C2"),
      ],
      records: [],
    }
  );
});

test("formulas of selected attributes are erased", () => {
  const withoutFormulas = {
    collections: [makeCollection("Collection", ["A", "B", "C"])],
    records: [],
  };
  // Create copy with formulas added
  const withFormulas = cloneDataSet(withoutFormulas);
  withFormulas.collections.forEach((coll) => {
    coll.attrs?.forEach((attr) => (attr.formula = "1 + 2 + 3"));
  });

  // Selecting all the attributes should just wipe the formulas
  expect(
    uncheckedSelectAttributes(withFormulas, ["A", "B", "C"], false)
  ).toEqual(withoutFormulas);
});

test("all non-formula metadata is preserved in selected attributes", () => {
  const selectedMeta = cloneDataSet(DATASET_WITH_META);

  // Erase formulas but leave all other metadata
  eraseFormulas(selectedMeta.collections[0].attrs || []);
  // Selecting attributes B and C
  selectedMeta.collections[0].attrs = selectedMeta.collections[0].attrs?.filter(
    (attr) => attr.name === "B" || attr.name === "C"
  );

  expect(
    uncheckedSelectAttributes(DATASET_WITH_META, ["B", "C"], false)
  ).toEqual(selectedMeta);
});

test("errors on invalid attribute", () => {
  const invalidAttributeErr = /was not found/;
  expect(() =>
    uncheckedSelectAttributes(
      CENSUS_DATASET,
      ["State", "Age", "Family Size"],
      false
    )
  ).toThrowError(invalidAttributeErr);

  expect(() =>
    uncheckedSelectAttributes(
      FULLY_FEATURED_DATASET,
      ["Attribute_5", "Not here", "Attribute_2", "Attribute_4"],
      false
    )
  ).toThrowError(invalidAttributeErr);
  expect(() =>
    uncheckedSelectAttributes(EMPTY_DATASET, ["Anything"], false)
  ).toThrowError(invalidAttributeErr);
});

test("errors when selecting 0 attributes", () => {
  const noAttributesErr = /must contain at least one attribute/;
  // Selecting only 0 attributes
  expect(() =>
    uncheckedSelectAttributes(CENSUS_DATASET, [], false)
  ).toThrowError(noAttributesErr);

  // Selecting all but all of the attributes
  expect(() =>
    uncheckedSelectAttributes(
      DATASET_B,
      ["Name", "Birth_Year", "Current_Year", "Grade"],
      true
    )
  ).toThrowError(noAttributesErr);
});

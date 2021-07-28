import { DataSet } from "../types";
import { uncheckedEditableCopy } from "../editableCopy";
import {
  CENSUS_DATASET,
  cloneDataSet,
  DATASET_A,
  DATASET_B,
  DATASET_WITH_META,
  DATASET_WITH_UNEDITABLE_ATTRS,
  EMPTY_DATASET,
  EMPTY_RECORDS,
  FULLY_FEATURED_DATASET,
  GRADES_DATASET_LONGER,
  GRADES_DATASET_WIDER,
  TYPES_DATASET,
} from "./data";

/**
 * Determines whether all attributes in a given dataset are marked
 * as editable.
 *
 * @param dataset The dataset to check.
 * @returns true if all attributes are editable, false otherwise.
 */
function isEditable(dataset: DataSet): boolean {
  if (dataset.editable !== true) {
    return false;
  }
  for (const coll of dataset.collections) {
    for (const attr of coll.attrs || []) {
      if (!attr.editable) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Sets the `editable` property on all attributes in a dataset
 * to undefined, so it can be used in comparisons with other datasets
 * while ignoring editability of attributes.
 *
 * @param dataset A dataset to ignore the editability of.
 * @returns A copy of the input with all attribute editability made undefined.
 */
function ignoreEditability(dataset: DataSet): DataSet {
  const copy = cloneDataSet(dataset);

  copy.editable = undefined;

  copy.collections.forEach((coll) => {
    coll.attrs?.forEach((attr) => (attr.editable = undefined));
  });

  return copy;
}

describe("editable copy produces an exact copy of the input (barring attribute editability)", () => {
  test("uneditable dataset", () => {
    expect(
      ignoreEditability(uncheckedEditableCopy(DATASET_WITH_UNEDITABLE_ATTRS))
    ).toEqual(ignoreEditability(DATASET_WITH_UNEDITABLE_ATTRS));
  });
  test("dataset A", () => {
    expect(ignoreEditability(uncheckedEditableCopy(DATASET_A))).toEqual(
      ignoreEditability(DATASET_A)
    );
  });
  test("dataset B", () => {
    expect(ignoreEditability(uncheckedEditableCopy(DATASET_B))).toEqual(
      ignoreEditability(DATASET_B)
    );
  });
  test("grades wider", () => {
    expect(
      ignoreEditability(uncheckedEditableCopy(GRADES_DATASET_WIDER))
    ).toEqual(ignoreEditability(GRADES_DATASET_WIDER));
  });
  test("grades longer", () => {
    expect(
      ignoreEditability(uncheckedEditableCopy(GRADES_DATASET_LONGER))
    ).toEqual(ignoreEditability(GRADES_DATASET_LONGER));
  });
  test("dataset with meta", () => {
    expect(ignoreEditability(uncheckedEditableCopy(DATASET_WITH_META))).toEqual(
      ignoreEditability(DATASET_WITH_META)
    );
  });
  test("dataset with empty records", () => {
    expect(ignoreEditability(uncheckedEditableCopy(EMPTY_RECORDS))).toEqual(
      ignoreEditability(EMPTY_RECORDS)
    );
  });
  test("census dataset", () => {
    expect(ignoreEditability(uncheckedEditableCopy(CENSUS_DATASET))).toEqual(
      ignoreEditability(CENSUS_DATASET)
    );
  });
  test("fully-featured dataset", () => {
    expect(
      ignoreEditability(uncheckedEditableCopy(FULLY_FEATURED_DATASET))
    ).toEqual(ignoreEditability(FULLY_FEATURED_DATASET));
  });
  test("types dataset", () => {
    expect(ignoreEditability(uncheckedEditableCopy(TYPES_DATASET))).toEqual(
      ignoreEditability(TYPES_DATASET)
    );
  });
});

describe("output of editable copy can be edited", () => {
  test("uneditable dataset", () => {
    expect(
      isEditable(uncheckedEditableCopy(DATASET_WITH_UNEDITABLE_ATTRS))
    ).toBe(true);
  });
  test("dataset A", () => {
    expect(isEditable(uncheckedEditableCopy(DATASET_A))).toBe(true);
  });
  test("dataset B", () => {
    expect(isEditable(uncheckedEditableCopy(DATASET_B))).toBe(true);
  });
  test("grades wider", () => {
    expect(isEditable(uncheckedEditableCopy(GRADES_DATASET_WIDER))).toBe(true);
  });
  test("grades longer", () => {
    expect(isEditable(uncheckedEditableCopy(GRADES_DATASET_LONGER))).toBe(true);
  });
  test("dataset with meta", () => {
    expect(isEditable(uncheckedEditableCopy(DATASET_WITH_META))).toBe(true);
  });
  test("dataset with empty records", () => {
    expect(isEditable(uncheckedEditableCopy(EMPTY_RECORDS))).toBe(true);
  });
  test("census dataset", () => {
    expect(isEditable(uncheckedEditableCopy(CENSUS_DATASET))).toBe(true);
  });
  test("fully-featured dataset", () => {
    expect(isEditable(uncheckedEditableCopy(FULLY_FEATURED_DATASET))).toBe(
      true
    );
  });
  test("types dataset", () => {
    expect(isEditable(uncheckedEditableCopy(TYPES_DATASET))).toBe(true);
  });
});

describe("editable copy", () => {
  it("does nothing to fully empty dataset", () => {
    expect(uncheckedEditableCopy(EMPTY_DATASET)).toEqual({
      ...EMPTY_DATASET,
      editable: true,
    });
  });
});

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
function allAttributesAreEditable(dataset: DataSet): boolean {
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
function ignoreAttributeEditability(dataset: DataSet): DataSet {
  const copy = cloneDataSet(dataset);

  copy.collections.forEach((coll) => {
    coll.attrs?.forEach((attr) => (attr.editable = undefined));
  });

  return copy;
}

describe("editable copy produces an exact copy of the input (barring attribute editability)", () => {
  test("uneditable dataset", () => {
    expect(
      ignoreAttributeEditability(
        uncheckedEditableCopy(DATASET_WITH_UNEDITABLE_ATTRS)
      )
    ).toEqual(ignoreAttributeEditability(DATASET_WITH_UNEDITABLE_ATTRS));
  });
  test("dataset A", () => {
    expect(
      ignoreAttributeEditability(uncheckedEditableCopy(DATASET_A))
    ).toEqual(ignoreAttributeEditability(DATASET_A));
  });
  test("dataset B", () => {
    expect(
      ignoreAttributeEditability(uncheckedEditableCopy(DATASET_B))
    ).toEqual(ignoreAttributeEditability(DATASET_B));
  });
  test("grades wider", () => {
    expect(
      ignoreAttributeEditability(uncheckedEditableCopy(GRADES_DATASET_WIDER))
    ).toEqual(ignoreAttributeEditability(GRADES_DATASET_WIDER));
  });
  test("grades longer", () => {
    expect(
      ignoreAttributeEditability(uncheckedEditableCopy(GRADES_DATASET_LONGER))
    ).toEqual(ignoreAttributeEditability(GRADES_DATASET_LONGER));
  });
  test("dataset with meta", () => {
    expect(
      ignoreAttributeEditability(uncheckedEditableCopy(DATASET_WITH_META))
    ).toEqual(ignoreAttributeEditability(DATASET_WITH_META));
  });
  test("dataset with empty records", () => {
    expect(
      ignoreAttributeEditability(uncheckedEditableCopy(EMPTY_RECORDS))
    ).toEqual(ignoreAttributeEditability(EMPTY_RECORDS));
  });
  test("census dataset", () => {
    expect(
      ignoreAttributeEditability(uncheckedEditableCopy(CENSUS_DATASET))
    ).toEqual(ignoreAttributeEditability(CENSUS_DATASET));
  });
  test("fully-featured dataset", () => {
    expect(
      ignoreAttributeEditability(uncheckedEditableCopy(FULLY_FEATURED_DATASET))
    ).toEqual(ignoreAttributeEditability(FULLY_FEATURED_DATASET));
  });
  test("types dataset", () => {
    expect(
      ignoreAttributeEditability(uncheckedEditableCopy(TYPES_DATASET))
    ).toEqual(ignoreAttributeEditability(TYPES_DATASET));
  });
});

describe("output of editable copy can be edited", () => {
  test("uneditable dataset", () => {
    expect(
      allAttributesAreEditable(
        uncheckedEditableCopy(DATASET_WITH_UNEDITABLE_ATTRS)
      )
    ).toBe(true);
  });
  test("dataset A", () => {
    expect(allAttributesAreEditable(uncheckedEditableCopy(DATASET_A))).toBe(
      true
    );
  });
  test("dataset B", () => {
    expect(allAttributesAreEditable(uncheckedEditableCopy(DATASET_B))).toBe(
      true
    );
  });
  test("grades wider", () => {
    expect(
      allAttributesAreEditable(uncheckedEditableCopy(GRADES_DATASET_WIDER))
    ).toBe(true);
  });
  test("grades longer", () => {
    expect(
      allAttributesAreEditable(uncheckedEditableCopy(GRADES_DATASET_LONGER))
    ).toBe(true);
  });
  test("dataset with meta", () => {
    expect(
      allAttributesAreEditable(uncheckedEditableCopy(DATASET_WITH_META))
    ).toBe(true);
  });
  test("dataset with empty records", () => {
    expect(allAttributesAreEditable(uncheckedEditableCopy(EMPTY_RECORDS))).toBe(
      true
    );
  });
  test("census dataset", () => {
    expect(
      allAttributesAreEditable(uncheckedEditableCopy(CENSUS_DATASET))
    ).toBe(true);
  });
  test("fully-featured dataset", () => {
    expect(
      allAttributesAreEditable(uncheckedEditableCopy(FULLY_FEATURED_DATASET))
    ).toBe(true);
  });
  test("types dataset", () => {
    expect(allAttributesAreEditable(uncheckedEditableCopy(TYPES_DATASET))).toBe(
      true
    );
  });
});

describe("editable copy", () => {
  it("does nothing to fully empty dataset", () => {
    expect(uncheckedEditableCopy(EMPTY_DATASET)).toEqual(EMPTY_DATASET);
  });
});

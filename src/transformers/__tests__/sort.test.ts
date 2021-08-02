import { uncheckedSort } from "../sort";
import {
  cloneDataSet,
  DATASET_A,
  DATASET_B,
  EMPTY_RECORDS,
  FULLY_FEATURED_DATASET,
  jsEvalExpression,
  makeCollection,
  makeRecords,
  makeSimpleBoundary,
  TYPES_DATASET,
} from "./data";

test("no change to dataset with no records", async () => {
  expect(
    await uncheckedSort(
      EMPTY_RECORDS,
      "A",
      "any",
      "ascending",
      jsEvalExpression
    )
  ).toEqual(EMPTY_RECORDS);
});

test("sorts numbers", async () => {
  // ascending order
  const sortedByAAscending = cloneDataSet(DATASET_A);
  sortedByAAscending.records.sort(
    (a, b) => (a["A"] as number) - (b["A"] as number)
  );

  expect(
    await uncheckedSort(DATASET_A, "A", "any", "ascending", jsEvalExpression)
  ).toEqual(sortedByAAscending);

  // descending order
  const sortedByADescending = cloneDataSet(DATASET_A);
  sortedByADescending.records.sort(
    (a, b) => (b["A"] as number) - (a["A"] as number)
  );

  expect(
    await uncheckedSort(DATASET_A, "A", "any", "descending", jsEvalExpression)
  ).toEqual(sortedByADescending);
});

test("sorts booleans", async () => {
  // descending is true before false
  const sortedByBDescending = cloneDataSet(DATASET_A);
  sortedByBDescending.records = makeRecords(
    ["A", "B", "C"],
    [
      [3, true, 2000],
      [8, true, 2003],
      [4, true, 2010],
      [10, false, 1998],
      [10, false, 2014],
    ]
  );
  expect(
    await uncheckedSort(DATASET_A, "B", "any", "descending", jsEvalExpression)
  ).toEqual(sortedByBDescending);

  // ascending is true before false
  const sortedByBAscending = cloneDataSet(DATASET_A);
  sortedByBAscending.records = makeRecords(
    ["A", "B", "C"],
    [
      [10, false, 1998],
      [10, false, 2014],
      [3, true, 2000],
      [8, true, 2003],
      [4, true, 2010],
    ]
  );
  expect(
    await uncheckedSort(DATASET_A, "B", "any", "ascending", jsEvalExpression)
  ).toEqual(sortedByBAscending);
});

function sortStr(a: string, b: string): number {
  if (a === b) {
    return 0;
  } else if (a > b) {
    return 1;
  } else {
    return -1;
  }
}

test("sorts strings", async () => {
  const sortedByNameAscending = cloneDataSet(DATASET_B);
  sortedByNameAscending.records.sort((aRec, bRec) =>
    sortStr(aRec["Name"] as string, bRec["Name"] as string)
  );

  expect(
    await uncheckedSort(DATASET_B, "Name", "any", "ascending", jsEvalExpression)
  ).toEqual(sortedByNameAscending);

  const sortedByNameDescending = cloneDataSet(DATASET_B);
  sortedByNameDescending.records.sort((aRec, bRec) =>
    sortStr(bRec["Name"] as string, aRec["Name"] as string)
  );

  expect(
    await uncheckedSort(
      DATASET_B,
      "Name",
      "any",
      "descending",
      jsEvalExpression
    )
  ).toEqual(sortedByNameDescending);
});

test("sorts objects", async () => {
  const withObjects = {
    collections: [makeCollection("Collection", ["Boundaries"])],
    records: makeRecords(
      ["Boundaries"],
      [
        [makeSimpleBoundary(true)],
        [makeSimpleBoundary(true)],
        [makeSimpleBoundary(true)],
        [makeSimpleBoundary(true)],
        [makeSimpleBoundary(true)],
      ]
    ),
  };

  const sortedWithObjectsAsc = cloneDataSet(withObjects);
  sortedWithObjectsAsc.records.sort((a, b) =>
    sortStr(JSON.stringify(a["Boundaries"]), JSON.stringify(b["Boundaries"]))
  );
  expect(
    await uncheckedSort(
      withObjects,
      "Boundaries",
      "any",
      "ascending",
      jsEvalExpression
    )
  ).toEqual(sortedWithObjectsAsc);

  const sortedWithObjectsDesc = cloneDataSet(withObjects);
  sortedWithObjectsDesc.records.sort((a, b) =>
    sortStr(JSON.stringify(b["Boundaries"]), JSON.stringify(a["Boundaries"]))
  );
  expect(
    await uncheckedSort(
      withObjects,
      "Boundaries",
      "any",
      "descending",
      jsEvalExpression
    )
  ).toEqual(sortedWithObjectsDesc);

  // All the boundaries are the same in the TYPES_DATASET
  expect(
    await uncheckedSort(
      TYPES_DATASET,
      "Boundary",
      "any",
      "ascending",
      jsEvalExpression
    )
  ).toEqual(TYPES_DATASET);
  expect(
    await uncheckedSort(
      TYPES_DATASET,
      "Boundary",
      "any",
      "descending",
      jsEvalExpression
    )
  ).toEqual(TYPES_DATASET);
});

test("errors when key expression evaluates to multiple types", async () => {
  expect.assertions(2);
  try {
    await uncheckedSort(
      FULLY_FEATURED_DATASET,
      "Attribute_3",
      "any",
      "ascending",
      jsEvalExpression
    );
  } catch (e) {
    expect(e.message).toMatch(/keys of differing types/);
  }

  try {
    await uncheckedSort(
      FULLY_FEATURED_DATASET,
      "Attribute_5",
      "any",
      "descending",
      jsEvalExpression
    );
  } catch (e) {
    expect(e.message).toMatch(/keys of differing types/);
  }
});

test("sort is stable", async () => {
  const dataset = {
    collections: [makeCollection("Collection", ["Letter", "Number"])],
    records: makeRecords(
      ["Letter", "Number"],
      [
        ["A", 3],
        ["B", 3],
        ["C", 2],
        ["D", 1],
        ["E", 2],
        ["F", 6],
      ]
    ),
  };

  expect(
    await uncheckedSort(dataset, "Number", "any", "ascending", jsEvalExpression)
  ).toEqual({
    collections: dataset.collections,
    records: makeRecords(
      ["Letter", "Number"],
      [
        ["D", 1],
        ["C", 2],
        ["E", 2],
        ["A", 3],
        ["B", 3],
        ["F", 6],
      ]
    ),
  });
});

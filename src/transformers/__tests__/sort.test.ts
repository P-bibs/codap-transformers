import { evalExpression } from "../../lib/codapPhone";
import {
  SortDirection,
  uncheckedSortByAttribute,
  uncheckedSortByExpression,
} from "../sort";
import { CodapLanguageType, DataSet } from "../types";
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

/**
 * A wrapper around unchecked sort that discards the missing value report.
 */
async function uncheckedSortByExpressionWrapper(
  dataset: DataSet,
  keyExpr: string,
  outputType: CodapLanguageType,
  sortDirection: SortDirection,
  evalFormula = evalExpression
): Promise<DataSet> {
  const [output] = await uncheckedSortByExpression(
    dataset,
    keyExpr,
    outputType,
    sortDirection,
    evalFormula
  );
  return output;
}

/**
 * A wrapper around unchecked sort that discards the missing value report.
 */
async function uncheckedSortByAttributeWrapper(
  contextName: string,
  attribute: string,
  dataset: DataSet,
  sortDirection: SortDirection
): Promise<DataSet> {
  const [output] = await uncheckedSortByAttribute(
    contextName,
    dataset,
    attribute,
    sortDirection
  );
  return output;
}

test("no change to dataset with no records", async () => {
  expect(
    await uncheckedSortByExpressionWrapper(
      EMPTY_RECORDS,
      "A",
      "Any",
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
    await uncheckedSortByExpressionWrapper(
      DATASET_A,
      "A",
      "Any",
      "ascending",
      jsEvalExpression
    )
  ).toEqual(sortedByAAscending);

  // descending order
  const sortedByADescending = cloneDataSet(DATASET_A);
  sortedByADescending.records.sort(
    (a, b) => (b["A"] as number) - (a["A"] as number)
  );

  expect(
    await uncheckedSortByExpressionWrapper(
      DATASET_A,
      "A",
      "Any",
      "descending",
      jsEvalExpression
    )
  ).toEqual(sortedByADescending);
});

test("sorts numbers by attribute", async () => {
  // ascending order
  const sortedByAAscending = cloneDataSet(DATASET_A);
  sortedByAAscending.records.sort(
    (a, b) => (a["A"] as number) - (b["A"] as number)
  );

  expect(
    await uncheckedSortByAttributeWrapper("", "A", DATASET_A, "ascending")
  ).toEqual(sortedByAAscending);

  // descending order
  const sortedByADescending = cloneDataSet(DATASET_A);
  sortedByADescending.records.sort(
    (a, b) => (b["A"] as number) - (a["A"] as number)
  );

  expect(
    await uncheckedSortByAttributeWrapper("", "A", DATASET_A, "descending")
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
    await uncheckedSortByExpressionWrapper(
      DATASET_A,
      "B",
      "Any",
      "descending",
      jsEvalExpression
    )
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
    await uncheckedSortByExpressionWrapper(
      DATASET_A,
      "B",
      "Any",
      "ascending",
      jsEvalExpression
    )
  ).toEqual(sortedByBAscending);
});

test("sorts booleans by attribute", async () => {
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
    await uncheckedSortByAttributeWrapper("", "B", DATASET_A, "descending")
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
    await uncheckedSortByAttributeWrapper("", "B", DATASET_A, "ascending")
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
    await uncheckedSortByExpressionWrapper(
      DATASET_B,
      "Name",
      "Any",
      "ascending",
      jsEvalExpression
    )
  ).toEqual(sortedByNameAscending);

  const sortedByNameDescending = cloneDataSet(DATASET_B);
  sortedByNameDescending.records.sort((aRec, bRec) =>
    sortStr(bRec["Name"] as string, aRec["Name"] as string)
  );

  expect(
    await uncheckedSortByExpressionWrapper(
      DATASET_B,
      "Name",
      "Any",
      "descending",
      jsEvalExpression
    )
  ).toEqual(sortedByNameDescending);
});

test("sorts strings by attribute", async () => {
  const sortedByNameAscending = cloneDataSet(DATASET_B);
  sortedByNameAscending.records.sort((aRec, bRec) =>
    sortStr(aRec["Name"] as string, bRec["Name"] as string)
  );

  expect(
    await uncheckedSortByAttributeWrapper("", "Name", DATASET_B, "ascending")
  ).toEqual(sortedByNameAscending);

  const sortedByNameDescending = cloneDataSet(DATASET_B);
  sortedByNameDescending.records.sort((aRec, bRec) =>
    sortStr(bRec["Name"] as string, aRec["Name"] as string)
  );

  expect(
    await uncheckedSortByAttributeWrapper("", "Name", DATASET_B, "descending")
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
    await uncheckedSortByExpressionWrapper(
      withObjects,
      "Boundaries",
      "Any",
      "ascending",
      jsEvalExpression
    )
  ).toEqual(sortedWithObjectsAsc);

  const sortedWithObjectsDesc = cloneDataSet(withObjects);
  sortedWithObjectsDesc.records.sort((a, b) =>
    sortStr(JSON.stringify(b["Boundaries"]), JSON.stringify(a["Boundaries"]))
  );
  expect(
    await uncheckedSortByExpressionWrapper(
      withObjects,
      "Boundaries",
      "Any",
      "descending",
      jsEvalExpression
    )
  ).toEqual(sortedWithObjectsDesc);

  // All the boundaries are the same in the TYPES_DATASET
  expect(
    await uncheckedSortByExpressionWrapper(
      TYPES_DATASET,
      "Boundary",
      "Any",
      "ascending",
      jsEvalExpression
    )
  ).toEqual(TYPES_DATASET);
  expect(
    await uncheckedSortByExpressionWrapper(
      TYPES_DATASET,
      "Boundary",
      "Any",
      "descending",
      jsEvalExpression
    )
  ).toEqual(TYPES_DATASET);
});

test("sorts objects by attribute", async () => {
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
    await uncheckedSortByAttributeWrapper(
      "",
      "Boundaries",
      withObjects,
      "ascending",
    )
  ).toEqual(sortedWithObjectsAsc);

  const sortedWithObjectsDesc = cloneDataSet(withObjects);
  sortedWithObjectsDesc.records.sort((a, b) =>
    sortStr(JSON.stringify(b["Boundaries"]), JSON.stringify(a["Boundaries"]))
  );
  expect(
    await uncheckedSortByAttributeWrapper(
      "",
      "Boundaries",
      withObjects,
      "descending",
    )
  ).toEqual(sortedWithObjectsDesc);

  // All the boundaries are the same in the TYPES_DATASET
  expect(
    await uncheckedSortByAttributeWrapper(
      "",
      "Boundary",
      TYPES_DATASET,
      "ascending",
    )
  ).toEqual(TYPES_DATASET);
  expect(
    await uncheckedSortByAttributeWrapper(
      "",
      "Boundary",
      TYPES_DATASET,
      "descending",
    )
  ).toEqual(TYPES_DATASET);
});

test("errors when key expression evaluates to multiple types", async () => {
  expect.assertions(2);
  try {
    await uncheckedSortByExpressionWrapper(
      FULLY_FEATURED_DATASET,
      "Attribute_3",
      "Any",
      "ascending",
      jsEvalExpression
    );
  } catch (e) {
    expect(e.message).toMatch(/evaluates to the same type/);
  }

  try {
    await uncheckedSortByExpressionWrapper(
      FULLY_FEATURED_DATASET,
      "Attribute_5",
      "Any",
      "descending",
      jsEvalExpression
    );
  } catch (e) {
    expect(e.message).toMatch(/evaluates to the same type/);
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
    await uncheckedSortByExpressionWrapper(
      dataset,
      "Number",
      "Any",
      "ascending",
      jsEvalExpression
    )
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

test("sort is stable by attribute", async () => {
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
    await uncheckedSortByAttributeWrapper(
      "",
      "Number",
      dataset,
      "ascending",
    )
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

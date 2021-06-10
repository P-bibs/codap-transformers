import { DataSet } from "./types";
import { CodapAttribute, Collection } from "../utils/codapPhone/types";
import { diffArrays } from "diff";
import { intersectionWithPredicate, unionWithPredicate } from "../utils/sets";
import { flatten } from "./flatten";
import { eraseFormulas, getAttributeDataFromDataset } from "./util";

const COMPARE_STATUS_COLUMN_NAME = "Compare Status";
const COMPARE_VALUE_COLUMN_NAME = "Difference";
const GREEN = "rgb(0,255,0)";
const RED = "rgb(255,0,0)";
const GREY = "rgb(100,100,100)";

const DECISION_1_COLUMN_NAME = "Category 1";
const DECISION_2_COLUMN_NAME = "Category 2";

export type CompareType = "numeric" | "categorical" | "structural";

/**
 * Filter produces a dataset with certain records excluded
 * depending on a given predicate.
 */
export function compare(
  dataset1: DataSet,
  dataset2: DataSet,
  attributeName1: string,
  attributeName2: string,
  kind: CompareType
): DataSet {
  const attributeData1 = getAttributeDataFromDataset(attributeName1, dataset1);
  const attributeData2 = getAttributeDataFromDataset(attributeName2, dataset2);

  if (kind === "categorical") {
    return compareCategorical(
      dataset1,
      dataset2,
      attributeData1,
      attributeData2
    );
  }

  // Make sure that the two attributes don't have the same name by adding a
  // suffix to attribute 2 if necessary
  const safeAttributeName2 =
    attributeName1 === attributeName2 ? attributeName2 + "(1)" : attributeName2;

  const collections: Collection[] = [
    {
      name: `Comparison of ${attributeName1} and ${attributeName2}`,
      labels: {},
      // copy attributes to compare
      // NOTE: do not copy formulas: formulas may be separated from their
      // dependencies and would be invalid.
      attrs: [
        { ...attributeData1, formula: undefined },
        { ...attributeData2, name: safeAttributeName2, formula: undefined },
      ],
    },
  ];
  // Only add this attribute if this is a numeric diff
  if (kind === "numeric") {
    collections[0].attrs?.push({
      name: COMPARE_VALUE_COLUMN_NAME,
      description: "",
      editable: true,
      hidden: false,
      type: "numeric",
    });
  }
  collections[0].attrs?.push({
    name: COMPARE_STATUS_COLUMN_NAME,
    description: "",
    editable: true,
    hidden: false,
    type: "categorical",
  });

  const values1 = dataset1.records.map((record) => record[attributeName1]);
  const values2 = dataset2.records.map((record) => record[attributeName2]);

  const records =
    kind === "structural"
      ? compareRecordsStructural(
          attributeName1,
          safeAttributeName2,
          values1,
          values2
        )
      : compareRecordsNumerical(
          attributeName1,
          safeAttributeName2,
          values1,
          values2
        );

  return {
    collections,
    records,
  };
}

function compareRecordsStructural(
  attributeName1: string,
  attributeName2: string,
  values1: unknown[],
  values2: unknown[]
): Record<string, unknown>[] {
  const changeObjects = diffArrays(values1, values2);

  const records = [];
  for (let i = 0; i < changeObjects.length; i++) {
    const change = changeObjects[i];
    if (!change.count) {
      throw new Error("Change object had unknown count");
    }
    for (let j = 0; j < change.count; j++) {
      if (change.removed) {
        records.push({
          [attributeName1]: change.value[j],
          [attributeName2]: "",
          [COMPARE_STATUS_COLUMN_NAME]: RED,
        });
      } else if (change.added) {
        records.push({
          [attributeName1]: "",
          [attributeName2]: change.value[j],
          [COMPARE_STATUS_COLUMN_NAME]: GREEN,
        });
      } else {
        records.push({
          [attributeName1]: change.value[j],
          [attributeName2]: change.value[j],
          [COMPARE_STATUS_COLUMN_NAME]: GREY,
        });
      }
    }
  }

  return records;
}

function compareCategorical(
  dataset1: DataSet,
  dataset2: DataSet,
  attribute1Data: CodapAttribute,
  attribute2Data: CodapAttribute
): DataSet {
  dataset1 = flatten(dataset1);
  dataset2 = flatten(dataset2);

  const attributes1 = dataset1.collections[0].attrs;
  if (attributes1 === undefined) {
    throw new Error("First dataset doesn't have any collections");
  }
  const attributes2 = dataset2.collections[0].attrs;
  if (attributes2 === undefined) {
    throw new Error("Second dataset doesn't have any collections");
  }

  const attributesUnion = unionWithPredicate(
    attributes1,
    attributes2,
    (attr1, attr2) => attr1.name === attr2.name
  );
  const attributesIntersection = intersectionWithPredicate(
    attributes1,
    attributes2,
    (attr1, attr2) => attr1.name === attr2.name
  ).filter(
    (attr) =>
      attr.name !== attribute1Data.name && attr.name !== attribute2Data.name
  );
  eraseFormulas(attributesUnion);
  eraseFormulas(attributesIntersection);

  const collections: Collection[] = [
    {
      name: "Decisions",
      labels: {},
      attrs: [
        {
          name: DECISION_1_COLUMN_NAME,
        },
        {
          name: DECISION_2_COLUMN_NAME,
        },
      ],
    },
    {
      name: "Values",
      parent: "Decisions",
      labels: {},
      attrs: attributesIntersection,
    },
  ];

  const records = [];

  // Loop through all records in the first data context
  for (const record1 of dataset1.records) {
    // We consider a record a duplicate between the two contexts if
    // it has equal values for all attributes which the two contexts share
    const duplicate = dataset2.records.find((record2) =>
      objectsAreEqualForKeys(
        record1,
        record2,
        attributesIntersection.map((attr) => attr.name)
      )
    );

    if (duplicate === undefined) {
      // If we didn't find a duplicate then just push the record
      records.push({
        ...record1,
        [DECISION_1_COLUMN_NAME]: record1[attribute1Data.name],
      });
    } else {
      // If we did find a duplicate then merge the records, set the decision
      // attribute values, and push
      records.push({
        ...record1,
        ...duplicate,
        [DECISION_1_COLUMN_NAME]: record1[attribute1Data.name],
        [DECISION_2_COLUMN_NAME]: duplicate[attribute2Data.name],
      });
    }
  }

  // Same logic as above loop
  for (const record2 of dataset2.records) {
    const duplicate = dataset1.records.find((record1) =>
      objectsAreEqualForKeys(
        record1,
        record2,
        attributesIntersection.map((attr) => attr.name)
      )
    );
    if (duplicate !== undefined) {
      // Skip this record since we already added it in the first loop
    } else {
      records.push({
        ...record2,
        [DECISION_2_COLUMN_NAME]: record2[attribute2Data.name],
      });
    }
  }

  return {
    collections,
    records,
  };
}

function objectsAreEqualForKeys(
  object1: Record<string, unknown>,
  object2: Record<string, unknown>,
  keys: string[]
): boolean {
  return keys.every(
    (key) => JSON.stringify(object1[key]) === JSON.stringify(object2[key])
  );
}

function compareRecordsNumerical(
  attributeName1: string,
  attributeName2: string,
  values1: unknown[],
  values2: unknown[]
): Record<string, unknown>[] {
  const records = [];
  for (let i = 0; i < Math.max(values1.length, values2.length); i++) {
    const v1 = values1[i];
    const v2 = values2[i];

    // If either is null/undefined, skip and continue
    if (v1 === null || v2 === null || v1 === undefined || v2 === undefined) {
      records.push({
        [attributeName1]: values1[i],
        [attributeName2]: values2[i],
        [COMPARE_VALUE_COLUMN_NAME]: "",
        [COMPARE_STATUS_COLUMN_NAME]: "",
      });
      continue;
    }

    const parsed1: number = parseFloat(`${values1[i]}`);
    const parsed2: number = parseFloat(`${values2[i]}`);

    // If either is not a number, skip and continue
    if (isNaN(parsed1) || isNaN(parsed2)) {
      records.push({
        [attributeName1]: values1[i],
        [attributeName2]: values2[i],
        [COMPARE_VALUE_COLUMN_NAME]: "",
        [COMPARE_STATUS_COLUMN_NAME]: "",
      });
      continue;
    }

    const difference = parsed2 - parsed1;
    records.push({
      [attributeName1]: values1[i],
      [attributeName2]: values2[i],
      [COMPARE_VALUE_COLUMN_NAME]: difference,
      [COMPARE_STATUS_COLUMN_NAME]:
        difference > 0 ? GREEN : difference < 0 ? RED : GREY,
    });
  }

  return records;
}

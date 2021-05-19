import { DataSet } from "./types";
import { Collection } from "../utils/codapPhone/types";
import { diffArrays } from "diff";

const COMPARE_STATUS_COLUMN_NAME = "Compare Status";
const COMPARE_VALUE_COLUMN_NAME = "Difference";
const GREEN = "rgb(0,255,0)";
const RED = "rgb(255,0,0)";

/**
 * Filter produces a dataset with certain records excluded
 * depending on a given predicate.
 */
export function compare(
  dataset1: DataSet,
  dataset2: DataSet,
  attributeName1: string,
  attributeName2: string,
  isCategorical: boolean
): DataSet {
  let attributeData1;
  for (const collection of dataset1.collections) {
    attributeData1 =
      collection.attrs?.find(
        (attribute) => attribute.name === attributeName1
      ) ?? attributeData1;
  }
  if (!attributeData1) {
    throw new Error(
      "Couldn't find first selected attribute in selected context"
    );
  }
  let attributeData2;
  for (const collection of dataset2.collections) {
    attributeData2 =
      collection.attrs?.find(
        (attribute) => attribute.name === attributeName2
      ) ?? attributeData2;
  }
  if (!attributeData2) {
    throw new Error(
      "Couldn't find second selected attribute in selected context"
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
      attrs: [attributeData1, { ...attributeData2, name: safeAttributeName2 }],
    },
  ];
  // Only add this attribute if this is a categorical diff
  if (!isCategorical) {
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

  const records = isCategorical
    ? compareRecordsCategorical(
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

function compareRecordsCategorical(
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
          [COMPARE_STATUS_COLUMN_NAME]: "",
        });
      }
    }
  }

  return records;
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

    const difference = parsed1 - parsed2;
    records.push({
      [attributeName1]: values1[i],
      [attributeName2]: values2[i],
      [COMPARE_VALUE_COLUMN_NAME]: difference,
      [COMPARE_STATUS_COLUMN_NAME]:
        difference > 0 ? GREEN : difference < 0 ? RED : "",
    });
  }

  return records;
}

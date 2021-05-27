import { DataSet } from "./types";
import { CodapAttribute, Collection } from "../utils/codapPhone/types";
import { diffArrays } from "diff";
import {
  eraseFormulas,
  intersectionWithPredicate,
  symmetricDifferenceWithPredicate,
  unionWithPredicate,
} from "./util";
import { flatten } from "./flatten";

const COMPARE_STATUS_COLUMN_NAME = "Compare Status";
const COMPARE_VALUE_COLUMN_NAME = "Difference";
const GREEN = "rgb(0,255,0)";
const RED = "rgb(255,0,0)";
const GREY = "rgb(100,100,100)";

const DECISION_1_COLUMN_NAME = "Decision 1";
const DECISION_2_COLUMN_NAME = "Decision 2";

export type CompareType = "numeric" | "categorical" | "decision";

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
  let attributeData1: CodapAttribute | undefined;
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
  let attributeData2: CodapAttribute | undefined;
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

  if (kind === "decision") {
    return compareAsDecision(
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
  // Only add this attribute if this is a categorical diff
  if (kind === "categorical") {
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
    kind === "categorical"
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
          [COMPARE_STATUS_COLUMN_NAME]: GREY,
        });
      }
    }
  }

  return records;
}

function compareAsDecision(
  dataset1: DataSet,
  dataset2: DataSet,
  attribute1Data: CodapAttribute,
  attribute2Data: CodapAttribute
): DataSet {
  dataset1 = flatten(dataset1);
  dataset2 = flatten(dataset2);

  const attributes1 = dataset1.collections[0].attrs;
  if (attributes1 === undefined) {
    throw new Error("First data context doesn't have any collections");
  }
  const attributes2 = dataset2.collections[0].attrs;
  if (attributes2 === undefined) {
    throw new Error("Second data context doesn't have any collections");
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

  // const records = [
  //   ...intersectionWithPredicate(
  //     dataset1.records,
  //     dataset1.records,
  //     (elt1, elt2) =>
  //       objectsAreEqualForKeys(
  //         elt1,
  //         elt2,
  //         attributesIntersection.map((attr) => attr.name)
  //       )
  //   ),
  //   ...symmetricDifferenceWithPredicate(
  //     dataset1.records,
  //     dataset1.records,
  //     (elt1, elt2) =>
  //       objectsAreEqualForKeys(
  //         elt1,
  //         elt2,
  //         attributesIntersection.map((attr) => attr.name)
  //       )
  //   ),
  // ];
  // records.forEach((record) => {
  //   if (record[attribute1Data.name] !== undefined) {
  //     record[DECISION_1_COLUMN_NAME] = record[attribute1Data.name];
  //   }
  //   if (record[attribute2Data.name] !== undefined) {
  //     record[DECISION_2_COLUMN_NAME] = record[attribute2Data.name];
  //   }
  // });

  const records = [];

  for (const record1 of dataset1.records) {
    const duplicate = dataset2.records.find((record2) =>
      objectsAreEqualForKeys(
        record1,
        record2,
        attributesIntersection.map((attr) => attr.name)
      )
    );
    if (duplicate !== undefined) {
      records.push({
        ...record1,
        ...duplicate,
      });
    } else {
      records.push(record1);
    }
  }

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
      records.push(record2);
    }
  }

  records.forEach((record) => {
    if (record[attribute1Data.name] !== undefined) {
      record[DECISION_1_COLUMN_NAME] = record[attribute1Data.name];
    }
    if (record[attribute2Data.name] !== undefined) {
      record[DECISION_2_COLUMN_NAME] = record[attribute2Data.name];
    }
  });

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
  return keys.every((key) => object1[key] === object2[key]);
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
        difference > 0 ? GREEN : difference < 0 ? RED : GREY,
    });
  }

  return records;
}

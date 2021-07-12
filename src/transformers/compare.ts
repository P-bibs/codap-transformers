import { DataSet, TransformationOutput } from "./types";
import { CodapAttribute, Collection } from "../utils/codapPhone/types";
import { uncheckedFlatten } from "./flatten";
import { getAttributeDataFromDataset } from "./util";
import { DDTransformerState } from "../transformer-components/DataDrivenTransformer";
import { getContextAndDataSet } from "../utils/codapPhone";
import { readableName } from "../transformer-components/util";
import { uniqueName } from "../utils/names";
import {
  colorToRgbString,
  GREEN,
  GREY,
  interpolateColor,
  RED,
} from "../utils/colors";
import { uncheckedGroupBy } from "./groupBy";

const COMPARE_STATUS_COLUMN_BASE = "Compare Status";
const COMPARE_VALUE_COLUMN_BASE = "Difference";

export type CompareType = "numeric" | "categorical";
function isCompareType(s: unknown): s is CompareType {
  return s === "numeric" || s === "categorical";
}

/**
 * Compares two contexts in a variety of ways
 */
export async function compare({
  context1: inputDataContext1,
  attribute1: inputAttribute1,
  attribute2: inputAttribute2,
  dropdown1: kind,
}: DDTransformerState): Promise<TransformationOutput> {
  if (!inputDataContext1 || !inputAttribute1 || !inputAttribute2) {
    throw new Error("Please choose a dataset and two attributes");
  }
  if (!isCompareType(kind)) {
    throw new Error("Please select a valid compare type");
  }

  const { context, dataset } = await getContextAndDataSet(inputDataContext1);

  const contextName = readableName(context);

  return [
    await uncheckedCompare(dataset, inputAttribute1, inputAttribute2, kind),
    `Compare of ${contextName}`,
    `A ${kind} comparison of the attributes ${inputAttribute1} and ${inputAttribute2} (from ${contextName})`,
  ];
}

function uncheckedCompare(
  dataset: DataSet,
  attributeName1: string,
  attributeName2: string,
  kind: CompareType
): DataSet {
  const attributeData1 = getAttributeDataFromDataset(attributeName1, dataset);
  const attributeData2 = getAttributeDataFromDataset(attributeName2, dataset);

  if (kind === "categorical") {
    return compareCategorical(dataset, attributeData1, attributeData2);
  } else {
    return compareRecordsNumerical(dataset, attributeData1, attributeData2);
  }
}

function compareCategorical(
  dataset: DataSet,
  attribute1Data: CodapAttribute,
  attribute2Data: CodapAttribute
): DataSet {
  dataset = uncheckedFlatten(dataset);
  const out = uncheckedGroupBy(
    dataset,
    [
      {
        attrName: attribute1Data.name,
        groupedName: `${attribute1Data.name} Category`,
      },
      {
        attrName: attribute2Data.name,
        groupedName: `${attribute2Data.name} Group`,
      },
    ],
    "Comparison"
  );
  return out;
}

function compareRecordsNumerical(
  dataset1: DataSet,
  attribute1Data: CodapAttribute,
  attribute2Data: CodapAttribute
): DataSet {
  // Make sure that the two attributes shown in comparison don't have the same name
  const safeAttributeName2 = uniqueName(attribute2Data.name, [
    attribute1Data.name,
  ]);
  const attributeNames = [attribute1Data.name, safeAttributeName2];

  // Ensure generated comparison attributes don't collide with attributes being compared
  const compareValueColumnName = uniqueName(
    COMPARE_VALUE_COLUMN_BASE,
    attributeNames
  );
  const compareStatusColumnName = uniqueName(
    COMPARE_STATUS_COLUMN_BASE,
    attributeNames
  );

  const collections: Collection[] = [
    {
      name: `Comparison of ${attribute1Data.name} and ${attribute2Data.name}`,
      labels: {},
      // copy attributes to compare
      // NOTE: do not copy formulas: formulas may be separated from their
      // dependencies and would be invalid.
      attrs: [
        { ...attribute1Data, formula: undefined },
        { ...attribute2Data, name: safeAttributeName2, formula: undefined },
        {
          name: compareValueColumnName,
          description: "",
          editable: true,
          hidden: false,
          type: "numeric",
        },
        {
          name: compareStatusColumnName,
          description: "",
          editable: true,
          hidden: false,
          type: "categorical",
        },
      ],
    },
  ];

  const values1 = dataset1.records.map((record) => record[attribute1Data.name]);
  const values2 = dataset1.records.map((record) => record[attribute2Data.name]);

  const records = [];

  // Start by looping through all records and finding those that
  // can be numerically compared successfully
  const validIndicesAndValues: Record<number, [number, number]> = {};
  for (let i = 0; i < Math.max(values1.length, values2.length); i++) {
    const v1 = values1[i];
    const v2 = values2[i];

    // If either is null/undefined, skip and continue
    if (v1 === null || v2 === null || v1 === undefined || v2 === undefined) {
      continue;
    }

    const parsed1: number = parseFloat(`${values1[i]}`);
    const parsed2: number = parseFloat(`${values2[i]}`);

    // If either is not a number, skip and continue
    if (isNaN(parsed1) || isNaN(parsed2)) {
      continue;
    }

    validIndicesAndValues[i] = [parsed1, parsed2];
  }

  // Loop through all valid values and find the largest numeric difference
  // (negative or positive)
  let largestDifference = 0;
  for (const [, [v1, v2]] of Object.entries(validIndicesAndValues)) {
    const difference = v2 - v1;
    if (Math.abs(difference) > Math.abs(largestDifference)) {
      largestDifference = difference;
    }
  }

  // Loop through all indices and add records to output dataset. If we've
  // previously seen that a given index has two valid values that can be compared,
  // then compare them and compute a color for the output. Otherwise, just include
  // the values as strings and leave the comparison columns blank.
  for (let i = 0; i < Math.max(values1.length, values2.length); i++) {
    if (i in validIndicesAndValues) {
      const [v1, v2] = validIndicesAndValues[i];
      const difference = v2 - v1;

      const colorScalar = Math.abs(difference / largestDifference);
      let color;
      if (difference > 0) {
        color = colorToRgbString(interpolateColor(GREY, GREEN, colorScalar));
      } else if (difference < 0) {
        color = colorToRgbString(interpolateColor(GREY, RED, colorScalar));
      } else {
        color = colorToRgbString(GREY);
      }
      records.push({
        [attribute1Data.name]: v1,
        [attribute2Data.name]: v2,
        [compareValueColumnName]: difference,
        [compareStatusColumnName]: color,
      });
    } else {
      records.push({
        [attribute1Data.name]: values1[i],
        [attribute2Data.name]: values2[i],
        [compareValueColumnName]: "",
        [compareStatusColumnName]: "",
      });
    }
  }

  return { records, collections };
}

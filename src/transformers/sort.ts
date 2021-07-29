import {
  CodapLanguageType,
  DataSet,
  MissingValueReport,
  TransformationOutput,
} from "./types";
import { evalExpression, getContextAndDataSet } from "../lib/codapPhone";
import {
  codapValueToString,
  isMissing,
  reportTypeErrorsForRecords,
} from "./util";
import { TransformerTemplateState } from "../components/transformer-template/TransformerTemplate";
import { tryTitle } from "../transformers/util";

export type SortDirection = "ascending" | "descending";
function isSortDirection(s: unknown): s is SortDirection {
  return s === "ascending" || s === "descending";
}

function numCompareFn(a: number, b: number) {
  return a - b;
}

function stringCompareFn(a: string, b: string) {
  if (a === b) {
    return 0;
  } else if (a > b) {
    return 1;
  } else {
    return -1;
  }
}

function boolCompareFn(a: boolean, b: boolean) {
  if (a) {
    return b ? 0 : 1;
  } else {
    return b ? -1 : 0;
  }
}

function objectCompareFn(a: unknown, b: unknown) {
  return stringCompareFn(JSON.stringify(a), JSON.stringify(b));
}

function compareFn(a: unknown, b: unknown): number {
  if (typeof a === "number" && typeof b === "number") {
    return numCompareFn(a, b);
  } else if (typeof a === "string" && typeof b === "string") {
    return stringCompareFn(a, b);
  } else if (typeof a === "boolean" && typeof b === "boolean") {
    return boolCompareFn(a, b);
  } else if (typeof a === "object" && typeof b === "object") {
    return objectCompareFn(a, b);
  } else {
    throw new Error(
      `Sort encountered keys of differing types (${codapValueToString(
        a
      )} and ${codapValueToString(
        b
      )}). Keys must have the same type for all cases.`
    );
  }
}

/**
 * Sorts a dataset
 */
export async function sort({
  context1: contextName,
  expression1: expression,
  dropdown1: sortDirection,
  typeContract1: { outputType },
}: TransformerTemplateState): Promise<TransformationOutput> {
  if (contextName === null) {
    throw new Error("Please choose a valid dataset to transform.");
  }
  if (expression.trim() === "") {
    throw new Error("Please enter a non-empty key expression");
  }
  if (!isSortDirection(sortDirection)) {
    throw new Error("Please select a valid sort direction");
  }

  const { context, dataset } = await getContextAndDataSet(contextName);
  const ctxtName = tryTitle(context);

  const [sorted, mvr] = await uncheckedSort(
    dataset,
    expression,
    outputType,
    sortDirection
  );

  mvr.extraInfo = `The key expression formula evaluated to a missing value for ${mvr.missingValues.length} rows.`;

  return [
    sorted,
    `Sort(${ctxtName}, ...)`,
    `A copy of ${ctxtName}, sorted by the value of the key formula: \`${expression}\`.`,
    mvr,
  ];
}

export async function uncheckedSort(
  dataset: DataSet,
  keyExpr: string,
  outputType: CodapLanguageType,
  sortDirection: SortDirection,
  evalFormula = evalExpression
): Promise<[DataSet, MissingValueReport]> {
  const records = dataset.records;
  const keyValues = await evalFormula(keyExpr, records);

  const mvr: MissingValueReport = {
    kind: "formula",
    missingValues: [],
  };

  // Note rows for which the key expression evaluated to a missing value
  keyValues.forEach((value, i) => {
    if (isMissing(value)) {
      mvr.missingValues.push(i + 1);
    }
  });

  // Check for type errors (might throw error and abort transformer)
  reportTypeErrorsForRecords(records, keyValues, outputType);

  const sorted = records
    .map((record, i) => {
      return { record, i };
    })
    .sort(({ i: i1 }, { i: i2 }) => {
      return sortDirection === "ascending"
        ? compareFn(keyValues[i1], keyValues[i2])
        : compareFn(keyValues[i2], keyValues[i1]);
    })
    .map(({ record }) => record);

  return [
    {
      collections: dataset.collections,
      records: sorted,
    },
    mvr,
  ];
}

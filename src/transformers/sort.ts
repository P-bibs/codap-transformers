import {
  CodapLanguageType,
  DataSet,
  MissingValueReport,
  TransformationOutput,
} from "./types";
import { evalExpression, getContextAndDataSet } from "../lib/codapPhone";
import { codapValueToString, isMissing, addToMVR } from "./util";
import { tryTitle } from "../transformers/util";
import { TransformerTemplateState } from "../components/transformer-template/TransformerTemplate";
import { reportTypeErrorsForRecords } from "../lib/utils/typeChecking";
import { t } from "../strings";

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
      t("errors:sort.keysOfDifferentTypes", {
        value1: codapValueToString(a),
        value2: codapValueToString(b),
      })
    );
  }
}

/**
 * Sorts a dataset
 */
export async function sort({
  context1: contextName,
  toggle,
  attribute1: attribute,
  expression1: expression,
  dropdown1: sortDirection,
  typeContract1: { outputType },
}: TransformerTemplateState): Promise<TransformationOutput> {
  if (contextName === null) {
    throw new Error(t("errors:validation.noDataSet"));
  }
  if (!isSortDirection(sortDirection)) {
    throw new Error(t("errors:sort.noSortDirection"));
  }
  if (toggle === "byAttribute") {
    return await sortByAttribute(contextName, attribute, sortDirection);
  }
  if (toggle === "byExpression") {
    return await sortbyExpression(
      contextName,
      expression,
      sortDirection,
      outputType
    );
  }
  throw new Error(t("errors:sort.noSortMethod"));
}

export async function sortbyExpression(
  contextName: string,
  expression: string,
  sortDirection: SortDirection,
  outputType: CodapLanguageType
): Promise<TransformationOutput> {
  if (expression.trim() === "") {
    throw new Error(t("errors:sort.noKeyExpression"));
  }

  const { context, dataset } = await getContextAndDataSet(contextName);
  const ctxtName = tryTitle(context);

  const [sorted, mvr] = await uncheckedSortByExpression(
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

export async function uncheckedSortByExpression(
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
  await reportTypeErrorsForRecords(records, keyValues, outputType, evalFormula);

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

export async function sortByAttribute(
  contextName: string,
  attribute: string | null,
  sortDirection: SortDirection
): Promise<TransformationOutput> {
  if (attribute === null) {
    throw new Error(t("errors:sort.noSortAttribute"));
  }

  const { context, dataset } = await getContextAndDataSet(contextName);
  const ctxtName = tryTitle(context);

  const [sorted, mvr] = await uncheckedSortByAttribute(
    ctxtName,
    dataset,
    attribute,
    sortDirection
  );

  mvr.extraInfo = `The key expression formula evaluated to a missing value for ${mvr.missingValues.length} rows.`;

  return [
    sorted,
    `Sort(${ctxtName}, ...)`,
    `A copy of ${ctxtName}, sorted by the attribute: \`${attribute}\`.`,
    mvr,
  ];
}

export async function uncheckedSortByAttribute(
  contextName: string,
  dataset: DataSet,
  attribute: string,
  sortDirection: SortDirection
): Promise<[DataSet, MissingValueReport]> {
  const records = dataset.records;

  const mvr: MissingValueReport = {
    kind: "input",
    missingValues: [],
  };

  // Note rows for which the key expression evaluated to a missing value
  records.forEach((row, i) => {
    if (isMissing(row[attribute])) {
      addToMVR(mvr, dataset, contextName, attribute, i + 1);
    }
  });

  const sorted = records.sort((r1, r2) => {
    return sortDirection === "ascending"
      ? compareFn(r1[attribute], r2[attribute])
      : compareFn(r2[attribute], r1[attribute]);
  });

  return [
    {
      collections: dataset.collections,
      records: sorted,
    },
    mvr,
  ];
}

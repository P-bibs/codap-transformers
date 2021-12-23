import { CodapLanguageType } from "../../transformers/types";
import { prettyPrintCase } from "./prettyPrint";
import { t } from "../../strings";

/**
 * Enum representing all type checking predicates in CODAP
 */
enum CodapTypePredicateFunctions {
  Boolean = "isBoolean",
  String = "!isBoundary",
  Boundary = "isBoundary",
  Color = "isColor",
  Date = "isDate",
  Missing = "isMissing",
  Number = "isNumber",
  Finite = "isFinite",
}

export async function reportTypeErrorsForRecords(
  records: Record<string, unknown>[],
  values: unknown[],
  type: CodapLanguageType,
  evalFormula: (
    expr: string,
    records: Record<string, unknown>[]
  ) => Promise<unknown[]>
): Promise<void> {
  const errorIndices = await findTypeErrors(values, type, evalFormula);
  if (errorIndices.length !== 0) {
    throw new Error(
      t("errors:typeChecking.typeMismatch", {
        type,
        case: prettyPrintCase(records[errorIndices[0]]),
      })
    );
  }
}

/**
 * Type checks a set of values.
 * @param values list of values to type check
 * @param type type to match against
 * @returns indices that doesn't match the type, or empty list if all
 * values match
 */
export async function findTypeErrors(
  values: unknown[],
  type: CodapLanguageType,
  evalFormula: (
    expr: string,
    records: Record<string, unknown>[]
  ) => Promise<unknown[]>
): Promise<number[]> {
  switch (type) {
    case "Any":
      // All values are allowed for any, so we can return immediately
      return [];
    case "Number":
      return checkTypeOfValues(
        CodapTypePredicateFunctions.Number,
        values,
        evalFormula
      );
    case "String":
      return checkTypeOfValues(
        CodapTypePredicateFunctions.String,
        values,
        evalFormula
      );
    case "Boolean":
      return checkTypeOfValues(
        CodapTypePredicateFunctions.Boolean,
        values,
        evalFormula
      );
    case "Boundary":
      return checkTypeOfValues(
        CodapTypePredicateFunctions.Boundary,
        values,
        evalFormula
      );
  }
}

/**
 * Given a list of values, checks them against the provided type predicate and
 * returns the indices of those which do not match the predicate
 */
export async function checkTypeOfValues(
  predicate: CodapTypePredicateFunctions,
  values: unknown[],
  evalFormula: (
    expr: string,
    records: Record<string, unknown>[]
  ) => Promise<unknown[]>
): Promise<number[]> {
  const expr = `${predicate}(attr)`;
  const records = values.map((value) => ({ attr: value }));
  const results = await evalFormula(expr, records);
  const failingIndices = results
    .filter((result) => result !== true)
    .map((_result, i) => i);

  return failingIndices;
}

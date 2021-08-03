import { DataSet, EMPTY_MVR, TransformationOutput } from "./types";
import { evalExpression, getContextAndDataSet } from "../lib/codapPhone";
import { codapValueToString } from "./util";
import { TransformerTemplateState } from "../components/transformer-template/TransformerTemplate";
import { tryTitle } from "../transformers/util";
import { t } from "../strings";

/**
 * Filter produces a dataset with certain records excluded
 * depending on a given predicate.
 */
export async function filter({
  context1: contextName,
  expression1: predicate,
}: TransformerTemplateState): Promise<TransformationOutput> {
  if (contextName === null) {
    throw new Error(t("errors:validation.noDataSet"));
  }
  if (predicate.trim() === "") {
    throw new Error(t("errors:filter.noExpression"));
  }

  const { context, dataset } = await getContextAndDataSet(contextName);
  const ctxtName = tryTitle(context);

  return [
    await uncheckedFilter(dataset, predicate),
    `Filter(${ctxtName}, ...)`,
    `A copy of ${ctxtName} that only includes the cases for which the predicate \`${predicate}\` is true.`,
    // TODO: MVR? requires analysis of formula
    EMPTY_MVR,
  ];
}

export async function uncheckedFilter(
  dataset: DataSet,
  predicate: string,
  evalFormula = evalExpression
): Promise<DataSet> {
  const filteredRecords: Record<string, unknown>[] = [];

  // evaluate predicate at each case in the dataset
  const predValues = await evalFormula(predicate, dataset.records);

  predValues.forEach((value, i) => {
    if (value !== true && value !== false) {
      throw new Error(
        t("errors:filter.nonBooleanResult", {
          value: codapValueToString(value),
          caseNumber: i + 1,
        })
      );
    }

    if (value) {
      filteredRecords.push({ ...dataset.records[i] });
    }
  });

  return new Promise((resolve) =>
    resolve({
      collections: dataset.collections,
      records: filteredRecords,
    })
  );
}

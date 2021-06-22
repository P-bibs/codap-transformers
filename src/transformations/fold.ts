import { DataSet } from "./types";
import {
  insertColumnInLastCollection,
  insertInRow,
  codapValueToString,
  allAttrNames,
} from "./util";
import { evalExpression, getContextAndDataSet } from "../utils/codapPhone";
import { uniqueName } from "../utils/names";
import { DDTransformationState } from "../transformation-components/DDTransformation";
import {
  parenthesizeName,
  readableName,
} from "../transformation-components/util";

type FoldFunction = (
  dataset: DataSet,
  inputColumnName: string,
  resultColumnName: string,
  resultColumnDescription: string
) => DataSet;

function makeFoldWrapper(label: string, innerFoldFunction: FoldFunction) {
  return async ({
    context1: contextName,
    attribute1: inputAttributeName,
  }: DDTransformationState): Promise<[DataSet, string]> => {
    if (contextName === null) {
      throw new Error("Please choose a valid dataset to transform.");
    }
    if (inputAttributeName === null) {
      throw new Error("Please select an attribute to aggregate");
    }

    const { context, dataset } = await getContextAndDataSet(contextName);
    const attrs = dataset.collections.map((coll) => coll.attrs || []).flat();
    const resultAttributeName = uniqueName(
      `${label} of ${parenthesizeName(inputAttributeName)} from ${readableName(
        context
      )}`,
      attrs.map((attr) => attr.name)
    );
    const resultDescription = `A ${label.toLowerCase()} of the values from the ${inputAttributeName} attribute in the ${readableName(
      context
    )} table.`;

    return [
      await innerFoldFunction(
        dataset,
        inputAttributeName,
        resultAttributeName,
        resultDescription
      ),
      `${label} of ${readableName(context)}`,
    ];
  };
}

function makeNumFold<T>(
  foldName: string,
  base: T,
  f: (acc: T, input: number) => [newAcc: T, result: number]
) {
  return (
    dataset: DataSet,
    inputColumnName: string,
    resultColumnName: string,
    resultColumnDescription: string
  ): DataSet => {
    resultColumnName = uniqueName(resultColumnName, allAttrNames(dataset));
    let acc = base;

    const resultRecords = dataset.records.map((row) => {
      if (row[inputColumnName] === undefined) {
        throw new Error(`Invalid attribute name: ${inputColumnName}`);
      }

      const numValue = Number(row[inputColumnName]);
      if (!isNaN(numValue)) {
        const [newAcc, result] = f(acc, numValue);
        acc = newAcc;

        return insertInRow(row, resultColumnName, result);
      } else {
        throw new Error(
          `${foldName} expected a number, instead got ${codapValueToString(
            row[inputColumnName]
          )}`
        );
      }
    });

    const newCollections = insertColumnInLastCollection(dataset.collections, {
      name: resultColumnName,
      type: "numeric",
      description: resultColumnDescription,
    });

    return {
      collections: newCollections,
      records: resultRecords,
    };
  };
}

export async function genericFold(
  dataset: DataSet,
  base: string,
  expression: string,
  resultColumnName: string,
  accumulatorName: string,
  resultColumnDescription = ""
): Promise<DataSet> {
  resultColumnName = uniqueName(resultColumnName, allAttrNames(dataset));

  let acc = (await evalExpression(base, [{}]))[0];
  const resultRecords = [];

  for (const row of dataset.records) {
    const environment = { ...row };
    if (Object.prototype.hasOwnProperty.call(row, accumulatorName)) {
      throw new Error(
        `Duplicate accumulator name: there is already a column called ${accumulatorName}.`
      );
    }

    environment[accumulatorName] = acc;
    acc = (await evalExpression(expression, [environment]))[0];
    resultRecords.push(insertInRow(row, resultColumnName, acc));
  }

  const newCollections = insertColumnInLastCollection(dataset.collections, {
    name: resultColumnName,
    description: resultColumnDescription,
  });

  return {
    collections: newCollections,
    records: resultRecords,
  };
}

const uncheckedRunningSum = makeNumFold(
  "Running Sum",
  { sum: 0 },
  (acc, input) => {
    const newAcc = { sum: acc.sum + input };
    return [newAcc, newAcc.sum];
  }
);
const uncheckedRunningMean = makeNumFold(
  "Running Mean",
  { sum: 0, count: 0 },
  (acc, input) => {
    const newAcc = { sum: acc.sum + input, count: acc.count + 1 };
    return [newAcc, newAcc.sum / newAcc.count];
  }
);
const uncheckedRunningMin = makeNumFold<{ min: number | null }>(
  "Running Min",
  { min: null },
  (acc, input) => {
    if (acc.min === null || input < acc.min) {
      return [{ min: input }, input];
    } else {
      return [acc, acc.min];
    }
  }
);
const uncheckedRunningMax = makeNumFold<{ max: number | null }>(
  "Running Max",
  { max: null },
  (acc, input) => {
    if (acc.max === null || input > acc.max) {
      return [{ max: input }, input];
    } else {
      return [acc, acc.max];
    }
  }
);
const uncheckedDifference = makeNumFold<{ numAbove: number | null }>(
  "Running Difference",
  { numAbove: null },
  (acc, input) => {
    if (acc.numAbove === null) {
      return [{ numAbove: input }, input];
    } else {
      return [{ numAbove: input }, input - acc.numAbove];
    }
  }
);

export const runningSum = makeFoldWrapper("Running Sum", uncheckedRunningSum);
export const runningMean = makeFoldWrapper(
  "Running Mean",
  uncheckedRunningMean
);
export const runningMin = makeFoldWrapper("Running Min", uncheckedRunningMin);
export const runningMax = makeFoldWrapper("Running Max", uncheckedRunningMax);
export const difference = makeFoldWrapper("Difference", uncheckedDifference);

export function differenceFrom(
  dataset: DataSet,
  inputColumnName: string,
  resultColumnName: string,
  startingValue = 0
): DataSet {
  resultColumnName = uniqueName(resultColumnName, allAttrNames(dataset));
  const resultRecords = dataset.records.map((row) => {
    if (row[inputColumnName] === undefined) {
      throw new Error(`Invalid attribute name: ${inputColumnName}`);
    }

    const numValue = Number(row[inputColumnName]);
    if (!isNaN(numValue)) {
      return insertInRow(row, resultColumnName, numValue - startingValue);
    } else {
      throw new Error(
        `Difference from expected number, instead got ${codapValueToString(
          row[inputColumnName]
        )}`
      );
    }
  });

  const newCollections = insertColumnInLastCollection(dataset.collections, {
    name: resultColumnName,
    type: "numeric",
  });

  return {
    collections: newCollections,
    records: resultRecords,
  };
}

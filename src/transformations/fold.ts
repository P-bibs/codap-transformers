import { DataSet } from "./types";
import {
  insertColumnInLastCollection,
  insertInRow,
  codapValueToString,
} from "./util";
import { evalExpression } from "../utils/codapPhone";

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
    let acc = base;

    const resultRecords = dataset.records.map((row) => {
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
  base: unknown,
  expression: string,
  inputColumnName: string,
  resultColumnName: string,
  accumulatorName: string,
  resultColumnDescription = ""
): Promise<DataSet> {
  let acc = base;
  const resultRecords = [];

  for (const row of dataset.records) {
    const environment = { ...row };
    if (Object.prototype.hasOwnProperty.call(row, accumulatorName)) {
      throw new Error(
        `Duplicate accumulator name: there is already a column called ${accumulatorName}.`
      );
    }

    environment[accumulatorName] = acc;
    acc = await evalExpression(expression, [environment]);
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

export const runningSum = makeNumFold(
  "Running Sum",
  { sum: 0 },
  (acc, input) => {
    const newAcc = { sum: acc.sum + input };
    return [newAcc, newAcc.sum];
  }
);

export const runningMean = makeNumFold(
  "Running Mean",
  { sum: 0, count: 0 },
  (acc, input) => {
    const newAcc = { sum: acc.sum + input, count: acc.count + 1 };
    return [newAcc, newAcc.sum / newAcc.count];
  }
);

export const runningMin = makeNumFold<{ min: number | null }>(
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

export const runningMax = makeNumFold<{ max: number | null }>(
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

export const difference = makeNumFold<{ numAbove: number | null }>(
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

export function differenceFrom(
  dataset: DataSet,
  inputColumnName: string,
  resultColumnName: string,
  startingValue = 0
): DataSet {
  const resultRecords = dataset.records.map((row) => {
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

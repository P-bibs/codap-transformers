import { DataSet } from "./types";
import {
  checkAttrForMissing,
  insertColumnInLastCollection,
  insertInRow,
} from "./util";

function makeNumFold<T>(
  base: T,
  f: (acc: T, input: number) => [newAcc: T, result: number]
) {
  return (
    dataset: DataSet,
    inputColumnName: string,
    resultColumnName: string
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
          `Fold expected number, instead got ${row[inputColumnName]}`
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
  };
}

export const runningSum = makeNumFold({ sum: 0 }, (acc, input) => {
  const newAcc = { sum: acc.sum + input };
  return [newAcc, newAcc.sum];
});

export const runningMean = makeNumFold({ sum: 0, count: 0 }, (acc, input) => {
  const newAcc = { sum: acc.sum + input, count: acc.count + 1 };
  return [newAcc, newAcc.sum / newAcc.count];
});

export const runningMin = makeNumFold<{ min: number | null }>(
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
  if (checkAttrForMissing(dataset.records, inputColumnName)) {
    throw new Error(
      `cannot take difference from attribute with missing values: ${inputColumnName}`
    );
  }

  const resultRecords = dataset.records.map((row) => {
    const numValue = Number(row[inputColumnName]);
    if (!isNaN(numValue)) {
      return insertInRow(row, resultColumnName, numValue - startingValue);
    } else {
      throw new Error(
        `Fold expected number, instead got ${row[inputColumnName]}`
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

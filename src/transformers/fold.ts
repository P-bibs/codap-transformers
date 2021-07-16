import { DataSet, TransformationOutput } from "./types";
import {
  insertColumnInLastCollection,
  insertInRow,
  codapValueToString,
  allAttrNames,
  validateAttribute,
} from "./util";
import { evalExpression, getContextAndDataSet } from "../utils/codapPhone";
import { uniqueName } from "../utils/names";
import { DDTransformerState } from "../transformer-components/DataDrivenTransformer";
import { parenthesizeName, readableName } from "../transformer-components/util";

type FoldFunction = (
  dataset: DataSet,
  inputColumnName: string,
  resultColumnName: string,
  resultColumnDescription: string
) => DataSet;

function makeFoldWrapper(
  label: string,
  innerFoldFunction: FoldFunction,
  makeDescriptions: (
    label: string,
    inputAttribute: string,
    contextName: string
  ) => [string, string]
) {
  return async ({
    context1: contextName,
    attribute1: inputAttributeName,
  }: DDTransformerState): Promise<TransformationOutput> => {
    if (contextName === null) {
      throw new Error("Please choose a valid dataset to transform.");
    }
    if (inputAttributeName === null) {
      throw new Error("Please select an attribute to aggregate");
    }

    const { context, dataset } = await getContextAndDataSet(contextName);
    const resultAttributeName = uniqueName(
      `${label} of ${parenthesizeName(inputAttributeName)} from ${readableName(
        context
      )}`,
      allAttrNames(dataset)
    );

    const ctxtName = readableName(context);

    // Generate a description of the fold by calling the custom maker, or using a default.
    const [attributeDescription, datasetDescription] = makeDescriptions(
      label,
      inputAttributeName,
      ctxtName
    );

    return [
      await innerFoldFunction(
        dataset,
        inputAttributeName,
        resultAttributeName,
        attributeDescription
      ),
      `${label} of ${ctxtName}`,
      datasetDescription,
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
    validateAttribute(dataset.collections, inputColumnName);

    resultColumnName = uniqueName(resultColumnName, allAttrNames(dataset));
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

export async function genericFold({
  context1: contextName,
  textInput1: resultColumnName,
  expression1: base,
  textInput2: accumulatorName,
  expression2: expression,
}: DDTransformerState): Promise<TransformationOutput> {
  if (contextName === null) {
    throw new Error("Please choose a valid dataset to transform.");
  }
  if (resultColumnName.trim() === "") {
    throw new Error("Please enter a name for the new attribute");
  }
  if (expression.trim() === "") {
    throw new Error("Please enter an expression");
  }
  if (base.trim() === "") {
    throw new Error("Please enter a base value");
  }
  if (accumulatorName.trim() === "") {
    throw new Error("Please enter an accumulator name");
  }

  const { context, dataset } = await getContextAndDataSet(contextName);

  const resultDescription = `A reduce of the ${readableName(context)} dataset.`;
  const ctxtName = readableName(context);

  return [
    await uncheckedGenericFold(
      dataset,
      base,
      expression,
      resultColumnName,
      accumulatorName,
      resultDescription
    ),
    `Reduce of ${ctxtName}`,
    `A reduce of the ${ctxtName} dataset, with an attribute ${resultColumnName} ` +
      `whose values are determined by the formula \`${expression}\`. ` +
      `The accumulator is named ${accumulatorName} and its initial value is \`${base}\`.`,
  ];
}

async function uncheckedGenericFold(
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
  "Difference",
  { numAbove: null },
  (acc, input) => {
    if (acc.numAbove === null) {
      return [{ numAbove: input }, input];
    } else {
      return [{ numAbove: input }, input - acc.numAbove];
    }
  }
);

function defaultDescriptions(
  label: string,
  attribute: string,
  contextName: string
): [string, string] {
  const attributeDescription = `A ${label} of the ${attribute} attribute from the ${contextName} dataset.`;
  const datasetDescription = `A copy of the ${contextName} dataset with a new attribute added which contains a ${label} of the ${attribute} attribute.`;

  return [attributeDescription, datasetDescription];
}

export const runningSum = makeFoldWrapper(
  "Running Sum",
  uncheckedRunningSum,
  defaultDescriptions
);
export const runningMean = makeFoldWrapper(
  "Running Mean",
  uncheckedRunningMean,
  defaultDescriptions
);
export const runningMin = makeFoldWrapper(
  "Running Min",
  uncheckedRunningMin,
  defaultDescriptions
);
export const runningMax = makeFoldWrapper(
  "Running Max",
  uncheckedRunningMax,
  defaultDescriptions
);
export const difference = makeFoldWrapper(
  "Difference",
  uncheckedDifference,
  (label: string, attribute: string, contextName: string) => {
    return [
      `The difference of each case with the case above it (from the ${attribute} attribute in the ${contextName} dataset).`,
      `A copy of ${contextName} with a new column whose values are the difference between ` +
        `the value of ${attribute} in the current case and the value of ${attribute} ` +
        `in the case above. The first case subtracts 0 from itself.`,
    ];
  }
);

export async function differenceFrom({
  context1: contextName,
  attribute1: inputAttributeName,
  textInput2: startingValue,
}: DDTransformerState): Promise<TransformationOutput> {
  if (contextName === null) {
    throw new Error("Please choose a valid dataset to transform.");
  }
  if (inputAttributeName === null) {
    throw new Error("Please choose an attribute to take the difference from");
  }
  if (startingValue.trim() === "") {
    throw new Error("Please provide a starting value for the difference.");
  }
  if (isNaN(Number(startingValue))) {
    throw new Error(
      `Expected numeric starting value, instead got ${startingValue}`
    );
  }

  const { context, dataset } = await getContextAndDataSet(contextName);
  const ctxtName = readableName(context);
  const resultAttributeName = uniqueName(
    `Difference From of ${inputAttributeName} in ${ctxtName}`,
    allAttrNames(dataset)
  );

  return [
    await uncheckedDifferenceFrom(
      dataset,
      inputAttributeName,
      resultAttributeName,
      Number(startingValue)
    ),
    `Difference From of ${ctxtName}`,
    `A copy of ${ctxtName} with a new column whose values are the difference between ` +
      `the value of ${inputAttributeName} in the current case and the value of ${inputAttributeName} ` +
      `in the case above. The first case subtracts ${startingValue} from itself.`,
  ];
}

function uncheckedDifferenceFrom(
  dataset: DataSet,
  inputColumnName: string,
  resultColumnName: string,
  startingValue = 0
): DataSet {
  validateAttribute(dataset.collections, inputColumnName);

  // Construct a fold that computes the difference of each case with
  // the case above, but uses the given startingValue to begin
  const differenceFromFold = makeNumFold<{ numAbove: number | null }>(
    "Difference From",
    { numAbove: startingValue },
    (acc, input) => {
      if (acc.numAbove === null) {
        return [{ numAbove: input }, input];
      } else {
        return [{ numAbove: input }, input - acc.numAbove];
      }
    }
  );

  return differenceFromFold(dataset, inputColumnName, resultColumnName, "");
}

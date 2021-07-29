import {
  DataSet,
  EMPTY_MVR,
  MissingValueReport,
  TransformationOutput,
} from "./types";
import {
  insertColumnInLastCollection,
  insertInRow,
  codapValueToString,
  allAttrNames,
  validateAttribute,
  isMissing,
  addToMVR,
} from "./util";
import { evalExpression, getContextAndDataSet } from "../lib/codapPhone";
import { uniqueName } from "../lib/utils/names";
import { TransformerTemplateState } from "../components/transformer-template/TransformerTemplate";
import { parenthesizeName, tryTitle } from "../transformers/util";

type FoldFunction = (
  contextTitle: string,
  dataset: DataSet,
  inputColumnName: string,
  resultColumnName: string,
  resultColumnDescription: string
) => [DataSet, MissingValueReport];

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
  }: TransformerTemplateState): Promise<TransformationOutput> => {
    if (contextName === null) {
      throw new Error("Please choose a valid dataset to transform.");
    }
    if (inputAttributeName === null) {
      throw new Error("Please select an attribute to aggregate");
    }

    const { context, dataset } = await getContextAndDataSet(contextName);
    const resultAttributeName = uniqueName(
      `${label} of ${parenthesizeName(inputAttributeName)}`,
      allAttrNames(dataset)
    );

    const contextTitle = tryTitle(context);

    // Generate a description of the fold by calling the custom maker, or using a default.
    const [attributeDescription, datasetDescription] = makeDescriptions(
      label,
      inputAttributeName,
      contextTitle
    );

    const [folded, mvr] = innerFoldFunction(
      contextTitle,
      dataset,
      inputAttributeName,
      resultAttributeName,
      attributeDescription
    );

    return [
      folded,
      `${label.replace(/\s+/, "")}(${contextTitle}, ...)`,
      datasetDescription,
      mvr,
    ];
  };
}

function makeNumFold<T>(
  foldName: string,
  base: T,
  f: (acc: T, input: number) => [newAcc: T, result: number]
) {
  return (
    contextTitle: string,
    dataset: DataSet,
    inputColumnName: string,
    resultColumnName: string,
    resultColumnDescription: string
  ): [DataSet, MissingValueReport] => {
    validateAttribute(dataset.collections, inputColumnName);

    resultColumnName = uniqueName(resultColumnName, allAttrNames(dataset));

    let acc = base;

    const mvr: MissingValueReport = {
      missingValues: [],
    };

    const resultRecords = dataset.records.map((row, i) => {
      const rowValue = row[inputColumnName];

      if (isMissing(rowValue)) {
        addToMVR(mvr, dataset, contextTitle, inputColumnName, i);
        return insertInRow(row, resultColumnName, "");
      }

      const numValue = Number(rowValue);
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

    mvr.extraInfo =
      `${mvr.missingValues.length} missing values were encountered in the "${inputColumnName}" ` +
      `attribute while taking this ${foldName}. For such rows the output was left missing ` +
      `and continued at the next non-missing row.`;

    return [
      {
        collections: newCollections,
        records: resultRecords,
      },
      mvr,
    ];
  };
}

export async function genericFold({
  context1: contextName,
  textInput1: resultColumnName,
  expression1: base,
  textInput2: accumulatorName,
  expression2: expression,
}: TransformerTemplateState): Promise<TransformationOutput> {
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

  const resultDescription = `A reduce of the ${tryTitle(context)} dataset.`;
  const contextTitle = tryTitle(context);

  return [
    await uncheckedGenericFold(
      dataset,
      base,
      expression,
      resultColumnName,
      accumulatorName,
      resultDescription
    ),
    `Reduce(${contextTitle}, ...)`,
    `A reduce of the ${contextTitle} dataset, with an attribute ${resultColumnName} ` +
      `whose values are determined by the formula \`${expression}\`. ` +
      `The accumulator is named ${accumulatorName} and its initial value is \`${base}\`.`,
    // TODO: needs MVR
    EMPTY_MVR,
  ];
}

async function uncheckedGenericFold(
  dataset: DataSet,
  base: string,
  expression: string,
  resultColumnName: string,
  accumulatorName: string,
  resultColumnDescription = "",
  evalFormula = evalExpression
): Promise<DataSet> {
  resultColumnName = uniqueName(resultColumnName, allAttrNames(dataset));

  let acc = (await evalFormula(base, [{}]))[0];
  const resultRecords = [];

  for (const row of dataset.records) {
    const environment = { ...row };
    if (Object.prototype.hasOwnProperty.call(row, accumulatorName)) {
      throw new Error(
        `Duplicate accumulator name: there is already a column called ${accumulatorName}.`
      );
    }

    environment[accumulatorName] = acc;
    acc = (await evalFormula(expression, [environment]))[0];
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

export const uncheckedRunningSum = makeNumFold(
  "Running Sum",
  { sum: 0 },
  (acc, input) => {
    const newAcc = { sum: acc.sum + input };
    return [newAcc, newAcc.sum];
  }
);
export const uncheckedRunningMean = makeNumFold(
  "Running Mean",
  { sum: 0, count: 0 },
  (acc, input) => {
    const newAcc = { sum: acc.sum + input, count: acc.count + 1 };
    return [newAcc, newAcc.sum / newAcc.count];
  }
);
export const uncheckedRunningMin = makeNumFold<{ min: number | null }>(
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
export const uncheckedRunningMax = makeNumFold<{ max: number | null }>(
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
export const uncheckedDifference = makeNumFold<{ numAbove: number | null }>(
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
}: TransformerTemplateState): Promise<TransformationOutput> {
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
  const contextTitle = tryTitle(context);
  const resultAttributeName = uniqueName(
    `Difference From of ${inputAttributeName}`,
    allAttrNames(dataset)
  );

  const [diffFrom, mvr] = uncheckedDifferenceFrom(
    contextTitle,
    dataset,
    inputAttributeName,
    resultAttributeName,
    `The difference of each case with the case above it (from the ${inputAttributeName} attribute in the ${contextTitle} dataset). ${startingValue} is subtracted from the first case.`,
    Number(startingValue)
  );

  return [
    diffFrom,
    `DifferenceFrom(${contextTitle}, ...)`,
    `A copy of ${contextTitle} with a new column whose values are the difference between ` +
      `the value of ${inputAttributeName} in the current case and the value of ${inputAttributeName} ` +
      `in the case above. The first case subtracts ${startingValue} from itself.`,
    mvr,
  ];
}

export function uncheckedDifferenceFrom(
  contextTitle: string,
  dataset: DataSet,
  inputColumnName: string,
  resultColumnName: string,
  resultColumnDescription: string,
  startingValue = 0
): [DataSet, MissingValueReport] {
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

  return differenceFromFold(
    contextTitle,
    dataset,
    inputColumnName,
    resultColumnName,
    resultColumnDescription
  );
}

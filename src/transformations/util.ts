import { Collection, CodapAttribute } from "../utils/codapPhone/types";
import { Env } from "../language/interpret";
import { Value } from "../language/ast";
import { CodapLanguageType, DataSet } from "./types";
import { prettyPrintCase } from "../utils/prettyPrint";

/**
 * Converts a data item object into an environment for our language. Only
 * includes numeric values.
 *
 * @returns An environment from the fields of the data item.
 */
export function dataItemToEnv(dataItem: Record<string, unknown>): Env {
  return Object.fromEntries(
    Object.entries(dataItem).map(([key, tableValue]) => {
      let value;
      // parse value from CODAP table data
      if (
        tableValue === "true" ||
        tableValue === "false" ||
        tableValue === true ||
        tableValue === false
      ) {
        value = {
          kind: "Bool",
          content: tableValue === "true" || tableValue === true,
        };
      } else if (!isNaN(Number(tableValue))) {
        value = { kind: "Num", content: Number(tableValue) };
      } else {
        value = { kind: "String", content: tableValue };
      }
      return [key, value as Value];
    })
  );
}

/**
 * Reparents any collections that have the given parent, to the
 * parent's parent. This allows the parent to be eliminated.
 *
 * @param collections the collections to reparent
 * @param parent the parent collection being removed
 */
export function reparent(collections: Collection[], parent: Collection): void {
  for (const coll of collections) {
    if (coll.parent === parent.name) {
      coll.parent = parent.parent;
    }
  }
}

/**
 * Inserts a new column into the given collection.
 *
 * @param collection - Collection to insert into
 * @param attr - Attribute to insert
 * @returns A copy of `collection` with `attr` inserted
 */
export function insertColumn(
  collection: Collection,
  attr: CodapAttribute
): Collection {
  let newAttrs;
  if (collection.attrs) {
    newAttrs = [...collection.attrs, attr];
  } else {
    newAttrs = [attr];
  }
  return {
    ...collection,
    attrs: newAttrs,
  };
}

/**
 * Inserts a new column in the last collection of the given collection array.
 *
 * @param collections - Array of collections
 * @param attr - Attribute to insert
 * @returns A copy of `collections` with `attr` inserted
 */
export function insertColumnInLastCollection(
  collections: Collection[],
  attr: CodapAttribute
): Collection[] {
  const newCollections = collections.slice();
  const lastCollection = newCollections[newCollections.length - 1];
  newCollections[newCollections.length - 1] = insertColumn(
    lastCollection,
    attr
  );
  return newCollections;
}

/**
 * Immutably insert a new property into the given object
 *
 * @param newProp - Name of the new property
 * @param newValue - New value to insert
 * @param row - Object to insert into
 * @returns A copy of `row` with `newValue` inserted
 */
export function insertInRow(
  row: Record<string, unknown>,
  newProp: string,
  newValue: unknown
): Record<string, unknown> {
  const newRow = { ...row };
  newRow[newProp] = newValue;
  return newRow;
}

/**
 * Sets `formula` field of all attributes in the given list
 * to undefined. Useful in several transformations where
 * preserving formulas will result in broken formulas.
 */
export function eraseFormulas(attrs: CodapAttribute[]): void {
  attrs.forEach((attr) => (attr.formula = undefined));
}

/**
 * Finds an attribute name with the given base that is unique relative
 * to the given list of attributes.
 */
export function uniqueAttrName(base: string, attrs: CodapAttribute[]): string {
  let name = base;
  let counter = 0;
  let conflicts = true;
  while (conflicts) {
    conflicts = false;
    for (const attr of attrs) {
      if (attr.name === name) {
        conflicts = true;
        break;
      }
    }
    if (conflicts) {
      counter++;
      name = `${base} (${counter})`;
    }
  }
  return name;
}

export function getAttributeDataFromDataset(
  attributeName: string,
  dataset: DataSet
): CodapAttribute {
  let attributeData: CodapAttribute | undefined;
  for (const collection of dataset.collections) {
    attributeData =
      collection.attrs?.find((attribute) => attribute.name === attributeName) ??
      attributeData;
  }
  if (!attributeData) {
    throw new Error(
      "Couldn't find first selected attribute in selected context"
    );
  }

  return attributeData;
}

/**
 * Converts a CODAP cell value into a user-friendly string
 * for printing in error messages.
 *
 * @param codapValue the value to convert to a string for printing
 * @returns string version of the value
 */
export function codapValueToString(codapValue: unknown): string {
  // missing values
  if (codapValue === "") {
    return "a missing value";
  }

  // booleans
  if (
    codapValue === "true" ||
    codapValue === "false" ||
    codapValue === true ||
    codapValue === false
  ) {
    return String(codapValue);
  }

  // numeric values
  if (!isNaN(Number(codapValue))) {
    return String(codapValue);
  }

  // boundaries
  if (isBoundary(codapValue)) {
    return "a boundary";
  }

  // objects
  if (typeof codapValue === "object") {
    return "an object";
  }

  // value must be string
  return `"${codapValue}"`;
}

/**
 * Determines if a given CODAP value is a boundary object.
 */
export function isBoundary(value: unknown): boolean {
  return (
    typeof value === "object" && value !== null && "jsonBoundaryObject" in value
  );
}

export function reportTypeErrorsForRecords(
  records: Record<string, unknown>[],
  values: unknown[],
  type: CodapLanguageType
): void {
  const errorIndex = findTypeErrors(values, type);
  if (errorIndex !== null) {
    throw new Error(
      `Formula did not evaluate to ${type} for case ${prettyPrintCase(
        records[errorIndex]
      )}`
    );
  }
}

/**
 * Extract all attribute names from the given dataset.
 */
export function allAttrNames(dataset: DataSet): string[] {
  return dataset.collections
    .map((coll) => coll.attrs || [])
    .flat()
    .map((attr) => attr.name);
}

/**
 * Type checks a certain attribute within a set of records. These checks are
 * fairly permissive since we can't count on the data returned from CODAP
 * being in a consistent format/type schema
 * @param values list of values to type check
 * @param type type to match against
 * @returns index that doesn't match the type, or null if all
 * values match
 */
export function findTypeErrors(
  values: unknown[],
  type: CodapLanguageType
): number | null {
  switch (type) {
    case "any":
      // All values are allowed for any, so we can return immediately
      return null;
    case "number":
      return findTypeErrorsNumber(values);
    case "string":
      return findTypeErrorsString(values);
    case "boolean":
      return findTypeErrorsBoolean(values);
    case "boundary":
      return findTypeErrorsBoundary(values);
  }
}

/**
 * Type checks for string values. This allows numbers and strings, but disallows others.
 * @returns index that doesn't match the type, or null if all
 * values match
 */
function findTypeErrorsString(values: unknown[]): number | null {
  for (let i = 0; i < values.length; i++) {
    const value = values[i];

    switch (typeof value) {
      case "number":
        // All numbers are valid
        continue;
      case "string":
        // All strings are valid
        continue;
      default:
        // Any other value is an error
        return i;
    }
  }

  return null;
}

/**
 * Type checks for boundary values.
 * @returns index that doesn't match the type, or null if all
 * values match
 */
function findTypeErrorsBoundary(values: unknown[]): number | null {
  for (let i = 0; i < values.length; i++) {
    const value = values[i];

    if (isBoundary(value)) {
      // value is a boundary and we're all set
    } else {
      return i;
    }
  }

  return null;
}

/**
 * Type checks for number values. This allows numbers and strings that
 * parse to numbers, but disallows others.
 * @returns index that doesn't match the type, or null if all
 * values match
 */
function findTypeErrorsNumber(values: unknown[]): number | null {
  // To type-check for numbers, all values must be either strings that can
  // parsed to numbers, or actual numbers
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    switch (typeof value) {
      case "number":
        // All numbers are valid
        continue;
      case "string":
        // Strings are invalid if we can't parse them to numbers
        if (isNaN(parseFloat(value))) {
          return i;
        }
        // Otherwise the string is a valid number
        continue;
      default:
        // Any other value is an error
        return i;
    }
  }
  return null;
}

/**
 * Type checks for boolean values. Many different boolean encodings are allowed,
 * including 0/1, true/false, and yes/no. However, once one boolean encoding
 * is chosen it can't be changed. This means that a valid column can't include
 * both yes/no values and 0/1 values.
 * @returns index that doesn't match the type, or null if all
 * values match
 */
function findTypeErrorsBoolean(values: unknown[]): number | null {
  if (values.length === 0) {
    return null;
  }
  // These are the set of valid booleans that will type check
  const validBooleanSets = [
    ["0", "1"],
    [0, 1],
    [false, true],
    ["false", "true"],
    ["False", "True"],
    ["FALSE", "TRUE"],
    ["yes", "no"],
    ["Yes", "No"],
    ["YES", "NO"],
  ];

  // First we have to determine which boolean set we're using
  let validBooleanSet;
  const firstValue = values[0];
  for (const [firstBool, secondBool] of validBooleanSets) {
    if (firstValue === firstBool || firstValue === secondBool) {
      validBooleanSet = [firstBool, secondBool];
      break;
    }
  }
  // If no boolean set was found then the first record isn't a boolean
  // and we return it as an error
  if (!validBooleanSet) {
    return 0;
  }

  // Search the remaining values and make sure they match the selected
  // boolean set
  for (let i = 0; i < values.length; i++) {
    const value = values[i];

    if (value !== validBooleanSet[0] && value !== validBooleanSet[1]) return i;
  }

  return null;
}

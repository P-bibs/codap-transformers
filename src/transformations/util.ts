import { Collection, CodapAttribute } from "../utils/codapPhone/types";
import { Env } from "../language/interpret";
import { Value } from "../language/ast";
import { CodapLanguageType, DataSet } from "./types";

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
export function codapValueToString(codapValue?: unknown): string {
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

  // objects
  if (typeof codapValue === "object") {
    return "an object";
  }

  // value must be string
  return `"${codapValue}"`;
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
 * @param records list of records to type check
 * @param attribute attribute to type check
 * @param type type to match against
 * @returns a record (row) that doesn't match the type, or null if all
 * records match
 */
export function findTypeErrors(
  records: Record<string, unknown>[],
  attribute: string,
  type: CodapLanguageType
): Record<string, unknown> | null {
  switch (type) {
    case "any":
      // All values are allowed for any, so we can return immediately
      return null;
    case "number":
      return findTypeErrorsNumber(records, attribute);
    case "string":
      return findTypeErrorsString(records, attribute);
    case "boolean":
      return findTypeErrorsBoolean(records, attribute);
  }
}

/**
 * Type checks for string values. This allows numbers and strings, but disallows others.
 * @returns a record (row) that doesn't match the type, or null if all
 * records match
 */
function findTypeErrorsString(
  records: Record<string, unknown>[],
  attribute: string
): Record<string, unknown> | null {
  for (const record of records) {
    const value = record[attribute];
    switch (typeof value) {
      case "number":
        // All numbers are valid
        continue;
      case "string":
        // All strings are valid
        continue;
      default:
        // Any other value is an error
        return record;
    }
  }
  return null;
}

/**
 * Type checks for number values. This allows numbers and strings that
 * parse to numbers, but disallows others.
 * @returns a record (row) that doesn't match the type, or null if all
 * records match
 */
function findTypeErrorsNumber(
  records: Record<string, unknown>[],
  attribute: string
): Record<string, unknown> | null {
  // To type-check for numbers, all values must be either strings that can
  // parsed to numbers, or actual numbers
  for (const record of records) {
    const value = record[attribute];
    switch (typeof value) {
      case "number":
        // All numbers are valid
        continue;
      case "string":
        // Strings are invalid if we can't parse them to numbers
        if (isNaN(parseFloat(value))) {
          return record;
        }
        // Otherwise the string is a valid number
        continue;
      default:
        // Any other value is an error
        return record;
    }
  }
  return null;
}

/**
 * Type checks for boolean values. Many different boolean encodings are allowed,
 * including 0/1, true/false, and yes/no. However, once one boolean encoding
 * is chosen it can't be changed. This means that a valid column can't include
 * both yes/no values and 0/1 values.
 * @returns a record (row) that doesn't match the type, or null if all
 * records match
 */
function findTypeErrorsBoolean(
  records: Record<string, unknown>[],
  attribute: string
): Record<string, unknown> | null {
  if (records.length === 0) {
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
  const firstValue = records[0][attribute];
  for (const [firstBool, secondBool] of validBooleanSets) {
    if (firstValue === firstBool || firstValue === secondBool) {
      validBooleanSet = [firstBool, secondBool];
      break;
    }
  }
  // If no boolean set was found then the first record isn't a boolean
  // and we return it as an error
  if (!validBooleanSet) {
    return records[0];
  }

  // Search the remaining records and make sure they match the selected
  // boolean set
  for (const record of records) {
    if (
      record[attribute] !== validBooleanSet[0] &&
      record[attribute] !== validBooleanSet[1]
    ) {
      return record;
    }
  }

  return null;
}

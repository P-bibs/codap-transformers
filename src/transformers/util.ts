import { Collection, CodapAttribute } from "../utils/codapPhone/types";
import { Env } from "../language/interpret";
import { Value } from "../language/ast";
import { Boundary, CodapLanguageType, DataSet } from "./types";
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
  const newCollections = collections.map(cloneCollection);
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
 * to undefined. Useful in several transformers where
 * preserving formulas will result in broken formulas.
 */
export function eraseFormulas(attrs: CodapAttribute[]): void {
  attrs.forEach((attr) => (attr.formula = undefined));
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
 * Formats a list of strings as a single string listing all the elements,
 * with an 'and' at the end where appropriate.
 */
export function listAsString(words: string[]): string {
  if (words.length === 0) {
    return "";
  }
  if (words.length === 1) {
    return words[0];
  }

  const exceptLast = words.slice(0, words.length - 1).join(", ");
  const last = words[words.length - 1];

  return `${exceptLast} and ${last}`;
}

/**
 * Returns either the singular form or the plural form depending on
 * whether the number of elements in `describing` is singular or plural.
 */
export function plural<T>(
  singular: string,
  plural: string,
  describing: T[]
): string {
  if (describing.length === 1) {
    return singular;
  } else {
    return plural;
  }
}

/**
 * Attaches a simple "-s" pluralSuffix suffix to the given word if
 * the given list it describes has 0 or >1 elements.
 */
export function pluralSuffix<T>(word: string, describing: T[]): string {
  return plural(word, `${word}s`, describing);
}

/**
 * Converts a CODAP cell value into a user-friendly string.
 *
 * @param codapValue the value to convert to a string for printing
 * @returns string version of the value
 */
export function codapValueToString(codapValue: unknown): string {
  // missing values
  if (isMissing(codapValue)) {
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

  // colors
  if (isColor(codapValue)) {
    return `the color ${codapValue}`;
  }

  // boundaries
  if (isBoundary(codapValue)) {
    // Try to extract the name of the boundary, but not all have one.
    const name = (codapValue as Boundary).jsonBoundaryObject.properties.NAME;
    if (name !== undefined) {
      return `a boundary (${name})`;
    } else {
      return "a boundary";
    }
  }

  // boundary maps
  if (isBoundaryMap(codapValue)) {
    return "a boundary map";
  }

  // objects
  if (typeof codapValue === "object") {
    return "an object";
  }

  // value must be string
  return `"${codapValue}"`;
}

/**
 * Maps such as `US_county_boundaries` contain a `map` property that has
 * names as keys and boundary objects as values. These are used to lookup
 * boundaries for a particular name (ie state, province, etc)
 */
export function isBoundaryMap(value: unknown): boolean {
  return typeof value === "object" && value != null && "map" in value;
}

/**
 * Determines if a given CODAP value is a boundary object.
 */
export function isBoundary(value: unknown): boolean {
  return (
    typeof value === "object" && value !== null && "jsonBoundaryObject" in value
  );
}

/**
 * Determines if a given CODAP value is a color.
 */
export function isColor(value: unknown): boolean {
  if (typeof value !== "string") {
    return false;
  }

  const noWhitespace = value.replace(/\s+/g, "");

  // Hex, rgb, and rgba are the allowed syntaxes for defining color values in CODAP.
  // Source: https://github.com/concord-consortium/codap/wiki/CODAP-Data-
  // Interactive-Plugin-API#data-types-and-typeless-data
  return (
    /#[0-9a-fA-F]{6}/.test(noWhitespace) ||
    /rgb\(\d{1,3},\d{1,3},\d{1,3}\)/.test(noWhitespace) ||
    /rgba\(\d{1,3},\d{1,3},\d{1,3},(0|1)?\.\d*\)/.test(noWhitespace)
  );
}

/**
 * Determines if the value represents a missing value in CODAP. These can
 * manifest as either empty string "" or undefined.
 *
 * @param value The value to check for missing-ness
 * @returns Whether or not the value is a missing value
 */
export function isMissing(value: unknown): boolean {
  return value === "" || value === undefined;
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
 * Extract all collection names from the given dataset.
 */
export function allCollectionNames(dataset: DataSet): string[] {
  return dataset.collections.map((coll) => coll.name);
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

export function cloneCollection(c: Collection): Collection {
  return {
    ...c,
    attrs: c.attrs?.map(shallowCopy),
  };
}

export function shallowCopy<T>(x: T): T {
  return { ...x };
}

export const cloneAttribute = shallowCopy;

/**
 * Extracts a list of numbers from an attribute in a dataset that is expected
 * to contain numeric values. Errors if the attribute's values parse to
 * non-numeric. NOTE: This does not validate the given attribute--if the
 * attribute isn't defined for any cases, this will return an empty list.
 *
 * @param dataset The dataset to extract from.
 * @param attribute The attribute containing numeric values.
 * @returns A list of the attributes values parsed to numbers.
 */
export function extractAttributeAsNumeric(
  dataset: DataSet,
  attribute: string
): number[] {
  const numericValues = [];

  for (const record of dataset.records) {
    // Ignore missing values
    if (isMissing(record[attribute])) {
      continue;
    }
    const value = parseFloat(String(record[attribute]));
    if (isNaN(value)) {
      throw new Error(
        `Expected number, instead got ${codapValueToString(record[attribute])}`
      );
    }
    numericValues.push(value);
  }

  return numericValues;
}

/**
 * Verifies that a given attribute (by name) exists in the given dataset. If
 * the attribute is found, returns the collection it is in and the attribute
 * data. Otherwise, throws an error.
 *
 * @param collections Collections within which to search for attribute.
 * @param attributeName The name of the attribute to look for.
 * @param errorMsg A custom error message, to override the default.
 */
export function validateAttribute(
  collections: Collection[],
  attributeName: string,
  errorMsg?: string
): [Collection, CodapAttribute] {
  for (const coll of collections) {
    const attr = coll.attrs?.find((attr) => attr.name === attributeName);

    if (attr) {
      return [coll, attr];
    }
  }

  throw new Error(errorMsg || `Invalid attribute name: ${attributeName}`);
}

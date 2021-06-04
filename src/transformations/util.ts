import { Collection, CodapAttribute } from "../utils/codapPhone/types";
import { Env } from "../language/interpret";
import { Value } from "../language/ast";
import { DataSet } from "./types";

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

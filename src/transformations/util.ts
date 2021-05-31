import { Collection, CodapAttribute } from "../utils/codapPhone/types";
import { Env } from "../language/interpret";
import { Value, Ast } from "../language/ast";
import { lex } from "../language/lex";
import { parse } from "../language/parse";
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

/**
 * Determines if the given records have any missing values under
 * the given attribute.
 */
export function checkAttrForMissing(
  records: Record<string, unknown>[],
  attribute: string
): boolean {
  for (const record of records) {
    if (record[attribute] === "") {
      return true;
    }
  }
  return false;
}

/**
 * Returns a list of attribute names that appear in the formula and
 * have missing values in the given records.
 */
export function checkFormulaForMissing(
  dataset: DataSet,
  formula: string
): string[] {
  const ast = parse(lex(formula));

  // Finds all identifiers in an expression
  function findIdents(expr: Ast): string[] {
    switch (expr.kind) {
      case "Builtin": {
        let idents: string[] = [];
        for (const arg of expr.args) {
          idents = idents.concat(findIdents(arg));
        }
        return idents;
      }
      case "Binop":
        return findIdents(expr.op1).concat(findIdents(expr.op2));
      case "Unop":
        return findIdents(expr.op1);
      case "Identifier":
        return [expr.content];
      default:
        return [];
    }
  }

  // list of distinct identifiers (attributes) used in formula
  const attrsInFormula = new Set(findIdents(ast));

  // get attributes that have missing values in cases
  const attrsWithMissing = new Set();
  for (const coll of dataset.collections) {
    coll.attrs?.forEach((attr) => {
      if (checkAttrForMissing(dataset.records, attr.name)) {
        attrsWithMissing.add(attr.name);
      }
    });
  }

  // return intersection of attrs in formula / attrs with missing values
  return Array.from(
    new Set([...attrsInFormula].filter((attr) => attrsWithMissing.has(attr)))
  );
}

/**
 * Raises an error if there is at least one attribute used
 * in the given formula that has missing values.
 */
export function guardAgainstMissingInFormula(
  dataset: DataSet,
  formula: string
): void {
  const attrsWithMissing = checkFormulaForMissing(dataset, formula);
  for (const attr of attrsWithMissing) {
    throw new Error(
      `cannot use attribute with missing values in formula: ${attr}`
    );
  }
}

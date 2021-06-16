import { Collection, CodapAttribute } from "../utils/codapPhone/types";
import { Env } from "../language/interpret";
import { Value } from "../language/ast";
import { CaseMap, DataSet, DataSetCase } from "./types";

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
  row: DataSetCase,
  newProp: string,
  newValue: unknown
): DataSetCase {
  const newRow = { ...row };
  newRow.values[newProp] = newValue;
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
 * Converts a list of dataset cases into a list of their internal
 * values (the contents of each case)
 */
export function datasetCaseToValues(
  cases: DataSetCase[]
): Record<string, unknown>[] {
  return cases.map((c) => c.values);
}

/**
 * Converts a CaseMap that uses case indices to use case IDs.
 *
 * @param indexMap the map using indices
 * @param inputs pairs of (contextName, dataset) for input contexts
 * @param outputs pairs of (contextName, dataset) for output contexts
 * @returns the new CaseMap using IDs
 */
export function indexMapToIDMap(
  indexMap: CaseMap,
  inputs: [string, DataSet][],
  outputs: [string, DataSet][]
): CaseMap {
  const idMap: CaseMap = new Map();

  console.log(indexMap);

  inputs.forEach(([inContext, inDataset]) => {
    inDataset.records.forEach((record, i) => {
      const mappedTo = indexMap.get(inContext)?.get(i);

      // not every case is mapped
      if (mappedTo !== undefined) {
        const withIDs: [string, number[]][] = mappedTo.map(
          ([outContext, outIndices]) => {
            const outDataset = getDatasetByName(outContext, outputs);
            if (outDataset === undefined) {
              throw new Error(
                `No output dataset with given context name: ${outContext}`
              );
            }

            // map indices to IDs in the output
            return [
              outContext,
              outIndices.map((idx) => getIDFromIndex(idx, outDataset)),
            ];
          }
        );

        // in the new map, map IDs to IDs
        let m = idMap.get(inContext);
        if (m === undefined) {
          m = new Map();
          idMap.set(inContext, m);
        }
        m.set(getIDFromIndex(i, inDataset), withIDs);
      }
    });
  });

  return idMap;
}

/**
 * Gets a dataset from a list of (context, dataset) pairs, given the
 * name of the dataset.
 */
function getDatasetByName(
  context: string,
  datasets: [string, DataSet][]
): DataSet | undefined {
  const out = datasets.find(([ctxt]) => ctxt === context);
  if (out === undefined) {
    return;
  }
  return out[1];
}

function getIDFromIndex(index: number, dataset: DataSet): number {
  const id = dataset.records[index].id;
  if (id === undefined) {
    throw new Error(`Invalid index in case-to-case index map.`);
  }
  return id;
}

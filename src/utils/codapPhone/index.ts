import { IframePhoneRpcEndpoint } from "iframe-phone";
import {
  CodapComponentType,
  CodapResource,
  CodapActions,
  CodapResponse,
  GetContextResponse,
  GetCasesResponse,
  GetCaseResponse,
  CodapPhone,
  CodapInitiatedResource,
  ContextChangeOperation,
  mutatingOperations,
  DocumentChangeOperations,
  CodapInitiatedCommand,
  ReturnedCase,
  Collection,
  ReturnedCollection,
  DataContext,
  ReturnedDataContext,
  CodapListResource,
  CodapIdentifyingInfo,
  CaseTable,
  GetDataListResponse,
  GetFunctionNamesResponse,
  CodapAttribute,
  ExcludeNonObject,
} from "./types";
import {
  callUpdateListenersForContext,
  callAllContextListeners,
} from "./listeners";
import { DataSet } from "../../transformations/types";
import { CodapEvalError } from "./error";
import { uniqueName } from "../names";

export {
  addNewContextListener,
  removeNewContextListener,
  addContextUpdateListener,
  removeContextUpdateListener,
} from "./listeners";

const phone: CodapPhone = new IframePhoneRpcEndpoint(
  codapRequestHandler,
  "data-interactive",
  window.parent,
  null,
  null
);

const DEFAULT_PLUGIN_WIDTH = 300;
const DEFAULT_PLUGIN_HEIGHT = 320;

// Initialize
phone.call(
  {
    action: CodapActions.Update,
    resource: CodapResource.InteractiveFrame,
    values: {
      title: "CODAP Flow",
      dimensions: {
        width: DEFAULT_PLUGIN_WIDTH,
        height: DEFAULT_PLUGIN_HEIGHT,
      },
    },
  },
  (response) => {
    if (!response.success) {
      throw new Error("Failed to update CODAP interactive frame");
    }
  }
);

function resourceFromContext(context: string) {
  return `dataContext[${context}]`;
}

function resourceFromCollection(collection: string) {
  return `collection[${collection}]`;
}
function collectionListFromContext(context: string) {
  return `dataContext[${context}].collectionList`;
}

function attributeListFromCollection(context: string, collection: string) {
  return `dataContext[${context}].collection[${collection}].attributeList`;
}

function itemFromContext(context: string) {
  return `${resourceFromContext(context)}.item`;
}

function collectionFromContext(context: string) {
  return `${resourceFromContext(context)}.collection`;
}

function collectionOfContext(context: string, collection: string) {
  return `${resourceFromContext(context)}.${resourceFromCollection(
    collection
  )}`;
}

// https://github.com/concord-consortium/codap/wiki/CODAP-Data-Interactive-Plugin-API#example-item-get-by-search
function itemSearchAllFromContext(context: string) {
  return `${resourceFromContext(context)}.itemSearch[*]`;
}

// This only works for delete
// https://github.com/concord-consortium/codap/wiki/CODAP-Data-Interactive-Plugin-API#cases
function allCases(context: string, collection: string) {
  return `dataContext[${context}].collection[${collection}].allCases`;
}

// Resource for getting all cases in a collection
function allCasesWithSearch(context: string, collection: string) {
  const contextResource = resourceFromContext(context);
  const collectionResource = resourceFromCollection(collection);
  return `${contextResource}.${collectionResource}.caseFormulaSearch[true]`;
}

function caseById(context: string, id: number) {
  return `${resourceFromContext(context)}.caseByID[${id}]`;
}

const getNewName = (function () {
  let count = 0;
  return () => {
    const name = `CodapFlow_${count}`;
    count += 1;
    return name;
  };
})();

/**
 * Catch notifications from CODAP and call appropriate listeners
 */
function codapRequestHandler(
  command: CodapInitiatedCommand,
  callback: (r: CodapResponse) => void
): void {
  console.group("CODAP");
  console.log(command);
  console.groupEnd();

  if (command.action !== CodapActions.Notify) {
    callback({ success: true });
    return;
  }

  if (
    command.resource === CodapInitiatedResource.DocumentChangeNotice &&
    command.values.operation ===
      DocumentChangeOperations.DataContextCountChanged
  ) {
    callAllContextListeners();
    callback({ success: true });
    return;
  }

  if (
    command.resource.startsWith(
      CodapInitiatedResource.DataContextChangeNotice
    ) &&
    Array.isArray(command.values)
  ) {
    for (const value of command.values) {
      if (mutatingOperations.includes(value.operation)) {
        // Context name is between the first pair of brackets
        const contextName = command.resource.slice(
          command.resource.search("\\[") + 1,
          command.resource.length - 1
        );
        callUpdateListenersForContext(contextName);
        callback({ success: true });
        return;
      }
      if (
        command.values[0].operation === ContextChangeOperation.UpdateContext
      ) {
        callAllContextListeners();
        callback({ success: true });
        return;
      }
    }
  }

  callback({ success: true });
}

export function getAllDataContexts(): Promise<CodapIdentifyingInfo[]> {
  return new Promise<CodapIdentifyingInfo[]>((resolve, reject) =>
    phone.call(
      {
        action: CodapActions.Get,
        resource: CodapResource.DataContextList,
      },
      (response) => {
        if (Array.isArray(response.values)) {
          resolve(response.values);
        } else {
          reject(new Error("Failed to get data contexts."));
        }
      }
    )
  );
}

export function getAllCollections(
  context: string
): Promise<CodapIdentifyingInfo[]> {
  return new Promise<CodapIdentifyingInfo[]>((resolve, reject) =>
    phone.call(
      {
        action: CodapActions.Get,
        resource: collectionListFromContext(context),
      },
      (response: GetDataListResponse) => {
        if (response.success) {
          resolve(response.values);
        } else {
          reject(new Error("Failed to get collections."));
        }
      }
    )
  );
}

function getCaseById(context: string, id: number): Promise<ReturnedCase> {
  return new Promise<ReturnedCase>((resolve, reject) =>
    phone.call(
      {
        action: CodapActions.Get,
        resource: caseById(context, id),
      },
      (response: GetCaseResponse) => {
        if (response.success) {
          resolve(response.values.case);
        } else {
          reject(new Error(`Failed to get case in ${context} with id ${id}`));
        }
      }
    )
  );
}

export async function getAllAttributes(
  context: string
): Promise<CodapIdentifyingInfo[]> {
  // Get the name (as a string) of each collection in the context
  const collections = (await getAllCollections(context)).map(
    (collection) => collection.name
  );

  // Make a request to get the attributes for each collection
  const promises = collections.map(
    (collectionName) =>
      new Promise<CodapIdentifyingInfo[]>((resolve, reject) =>
        phone.call(
          {
            action: CodapActions.Get,
            resource: attributeListFromCollection(context, collectionName),
          },
          (response: GetDataListResponse) => {
            if (response.success) {
              resolve(response.values);
            } else {
              reject(new Error("Failed to get attributes."));
            }
          }
        )
      )
  );

  // Wait for all promises to return
  const attributes = await Promise.all(promises);

  // flatten and return the set of attributes
  // return attributes.reduce((acc, elt) => [...acc, ...elt]);
  return attributes.flat();
}

/**
 * Get data from a data context
 *
 * @param context - The name of the data context
 * @returns An array of the data rows where each row is an object
 */
export async function getDataFromContext(
  context: string
): Promise<Record<string, unknown>[]> {
  const getCaseByIdCached = (function () {
    const caseMap: Record<number, ReturnedCase> = {};
    return async (id: number) => {
      if (caseMap[id] !== undefined) {
        return caseMap[id];
      }
      const result = await getCaseById(context, id);
      caseMap[id] = result;
      return result;
    };
  })();

  async function dataItemFromChildCase(
    c: ReturnedCase
  ): Promise<Record<string, unknown>> {
    if (c.parent === null || c.parent === undefined) {
      return c.values;
    }
    const parent = await getCaseByIdCached(c.parent);
    const results = {
      ...c.values,
      ...(await dataItemFromChildCase(parent)),
    };

    return results;
  }

  const collections = (await getDataContext(context)).collections;
  const childCollection = collections[collections.length - 1];

  return new Promise<Record<string, unknown>[]>((resolve, reject) =>
    phone.call(
      {
        action: CodapActions.Get,
        resource: allCasesWithSearch(context, childCollection.name),
      },
      (response: GetCasesResponse) => {
        if (response.success) {
          resolve(Promise.all(response.values.map(dataItemFromChildCase)));
        } else {
          reject(new Error("Failed to get data items"));
        }
      }
    )
  );
}

/**
 * Retrieves both a context and a dataset constructed from the context,
 * given a context name to lookup.
 */
export async function getContextAndDataSet(contextName: string): Promise<{
  context: DataContext;
  dataset: DataSet;
}> {
  const context = await getDataContext(contextName);
  return {
    context,
    dataset: {
      collections: context.collections,
      records: await getDataFromContext(contextName),
    },
  };
}

export function getDataContext(contextName: string): Promise<DataContext> {
  return new Promise<DataContext>((resolve, reject) =>
    phone.call(
      {
        action: CodapActions.Get,
        resource: resourceFromContext(contextName),
      },
      (response: GetContextResponse) => {
        if (response.success) {
          resolve(normalizeDataContext(response.values));
        } else {
          reject(new Error(`Failed to get context ${contextName}`));
        }
      }
    )
  );
}

// Copies a list of attributes, only copying the fields relevant to our
// representation of attributes and omitting any extra fields (cid, etc).
function copyAttrs(
  attrs: CodapAttribute[] | undefined
): CodapAttribute[] | undefined {
  return attrs?.map((attr) => {
    return {
      name: attr.name,
      title: attr.title,
      type: attr.type,
      colormap: attr.colormap,
      description: attr.description,
      editable: attr.editable,
      formula: attr.formula,
      hidden: attr.hidden,
      precision: attr.type === "numeric" ? attr.precision : undefined,
      unit: attr.type === "numeric" ? attr.unit : undefined,
    };
  }) as CodapAttribute[];
}

// In the returned collections, parents show up as numeric ids, so before
// reusing, we need to look up the names of the parent collections.
function normalizeParentNames(collections: ReturnedCollection[]): Collection[] {
  const normalized = [];
  for (const c of collections) {
    let newParent;
    if (c.parent) {
      newParent = collections.find(
        (collection) => collection.id === c.parent
      )?.name;
    }

    normalized.push({
      name: c.name,
      title: c.title,
      attrs: copyAttrs(c.attrs),
      labels: c.labels,
      parent: newParent,
    });
  }

  return normalized as Collection[];
}

function normalizeDataContext(context: ReturnedDataContext): DataContext {
  return {
    name: context.name,
    title: context.title,
    description: context.description,
    collections: normalizeParentNames(context.collections),
  };
}

async function createDataContext(
  name: string,
  collections: Collection[],
  title?: string
): Promise<CodapIdentifyingInfo> {
  return new Promise<CodapIdentifyingInfo>((resolve, reject) =>
    phone.call(
      {
        action: CodapActions.Create,
        resource: CodapResource.DataContext,
        values: {
          name: name,
          title: title,
          collections: collections,
        },
      },
      (response) => {
        if (response.success) {
          resolve(response.values);
        } else {
          reject(new Error("Failed to create dataset"));
        }
      }
    )
  );
}

export async function createDataInteractive(
  url: string,
  name: string,
): Promise<void> {
  return new Promise<void>((resolve, reject) =>
    phone.call(
      {
        action: CodapActions.Create,
        resource: CodapResource.InteractiveFrame,
        values: {
          url,
          name
        },
      },
      (response) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error("Failed to create data interactive"));
        }
      }
    )
  );
}

export async function createContextWithDataSet(
  dataset: DataSet,
  name: string,
  title?: string
): Promise<CodapIdentifyingInfo> {
  const newDatasetDescription = await createDataContext(
    name,
    dataset.collections,
    title
  );

  await insertDataItems(newDatasetDescription.name, dataset.records);
  return newDatasetDescription;
}

export function insertDataItems(
  contextName: string,
  data: Record<string, unknown>[]
): Promise<void> {
  return new Promise<void>((resolve, reject) =>
    phone.call(
      {
        action: CodapActions.Create,
        resource: itemFromContext(contextName),
        values: data,
      },
      (response) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error("Failed to create dataset with data"));
        }
      }
    )
  );
}

/**
 * Shallow equal
 *
 * Compares two objects for equality. This should not be used as a
 * shallowEquals because of the way it treats `undefined` fields. A canonical
 * shallowEquals will treat a field with a value of `undefined` and a missing
 * field differently, but for our use case, we need to treat them the same. For
 * example, if we send an attribute to CODAP with a missing field, the next
 * time we query that object, it will be returned with the missing fields
 * filled in with `undefined`. This will cause it to not be canonically equal
 * to an identical objects with the undefined fields missing. This version of
 * shallowEquals treats those objects as equal.
 *
 * @param a - The first object
 * @param b - The second object
 * @returns Whether the objects are equal
 */
function shallowEqual<T>(
  a: ExcludeNonObject<T>,
  b: ExcludeNonObject<T>
): boolean {
  // The type signature makes sure that the two arguments passed in have the
  // same type, and that they are not a primitive value (they are objects). The
  // casts allow us to use string keys. This is safe because the keys are
  // obtained through `Object.keys`.
  const aAsRecord = a as unknown as Record<string, unknown>;
  const bAsRecord = b as unknown as Record<string, unknown>;

  if (a === b) {
    return true;
  }

  const allKeys = new Set(Object.keys(a));
  Object.keys(b).forEach((k) => allKeys.add(k));

  for (const key of allKeys) {
    if (aAsRecord[key] !== bAsRecord[key]) {
      return false;
    }
  }

  return true;
}

function attributesEqual(
  attributes1?: CodapAttribute[],
  attributes2?: CodapAttribute[]
): boolean {
  if (attributes1 === undefined || attributes2 === undefined) {
    return attributes1 === attributes2;
  }
  return listEqual(attributes1, attributes2, shallowEqual);
}

/**
 * Fill attribute with defaults
 *
 * These are the defaults that CODAP will automatically fill in.
 * @param attr - Attribute to fill
 * @returns Filled attribute
 */
function fillAttrWithDefaults(attr: CodapAttribute): CodapAttribute {
  const withDefaults = {
    ...attr,
    title: attr.title === undefined ? attr.name : attr.title,
    editable: attr.editable === undefined ? true : attr.editable,
    hidden: attr.hidden === undefined ? false : attr.hidden,
    description: attr.description === undefined ? "" : attr.description,
  };
  if (withDefaults.type === undefined) {
    return {
      ...withDefaults,
      type: null,
    };
  }
  if (withDefaults.type === "numeric") {
    return {
      ...withDefaults,
      precision: 2,
      unit: null,
    };
  }
  return withDefaults;
}

/**
 * Fill collection with defaults
 *
 * If the title is undefined, use the name as the title. Also fill the titles of
 * the attrs.
 * @param c - Collection to fill
 * @returns Filled collection
 */
function fillCollectionWithDefaults(c: Collection): Collection {
  return {
    ...c,
    attrs: c.attrs?.map(fillAttrWithDefaults),
    title: c.title === undefined ? c.name : c.title,
  };
}

function collectionEqual(c1: Collection, c2: Collection): boolean {
  return (
    c1.name === c2.name &&
    c1.title === c2.title &&
    c1.description === c2.description &&
    shallowEqual(c1.labels, c2.labels) &&
    attributesEqual(c1.attrs, c2.attrs)
  );
}

function listEqual<T>(
  l1: T[],
  l2: T[],
  equalityFunc: (a: T, b: T) => boolean
): boolean {
  if (l1.length !== l2.length) {
    return false;
  }

  for (let i = 0; i < l1.length; i++) {
    if (!equalityFunc(l1[i], l2[i])) {
      return false;
    }
  }

  return true;
}

function collectionsEqual(
  collections1: Collection[],
  collections2: Collection[]
) {
  return listEqual(collections1, collections2, collectionEqual);
}

export async function updateContextWithDataSet(
  contextName: string,
  dataset: DataSet
): Promise<void> {
  const context = await getDataContext(contextName);

  for (const collection of context.collections) {
    await deleteAllCases(contextName, collection.name);
  }

  const normalizedCollections = dataset.collections.map(
    fillCollectionWithDefaults
  );

  if (!collectionsEqual(context.collections, normalizedCollections)) {
    console.group("Equality");
    console.log(context.collections);
    console.log(normalizedCollections);
    console.groupEnd();
    const concatNames = (nameAcc: string, collection: Collection) =>
      nameAcc + collection.name;
    const uniqueName =
      context.collections.reduce(concatNames, "") +
      dataset.collections.reduce(concatNames, "");

    // Create placeholder empty collection, since data contexts must have at least
    // one collection
    await createCollections(contextName, [
      {
        name: uniqueName,
        labels: {},
      },
    ]);

    // Delete old collections
    for (const collection of context.collections) {
      await deleteCollection(contextName, collection.name);
    }

    // Insert new collections and delete placeholder
    await createCollections(contextName, dataset.collections);
    await deleteCollection(contextName, uniqueName);
  }

  await insertDataItems(contextName, dataset.records);
}

function createCollections(
  context: string,
  collections: Collection[]
): Promise<void> {
  return new Promise<void>((resolve, reject) =>
    phone.call(
      {
        action: CodapActions.Create,
        resource: collectionFromContext(context),
        values: collections,
      },
      (response) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(`Failed to create collections in ${context}`));
        }
      }
    )
  );
}

function deleteCollection(context: string, collection: string): Promise<void> {
  return new Promise<void>((resolve, reject) =>
    phone.call(
      {
        action: CodapActions.Delete,
        resource: collectionOfContext(context, collection),
      },
      (response) => {
        if (response.success) {
          resolve();
        } else {
          reject(
            new Error(`Failed to delete collection ${collection} in ${context}`)
          );
        }
      }
    )
  );
}

export async function deleteAllCases(
  context: string,
  collection: string
): Promise<void> {
  return new Promise<void>((resolve, reject) =>
    phone.call(
      {
        action: CodapActions.Delete,
        resource: allCases(context, collection),
      },
      (response) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error("Failed to delete all cases"));
        }
      }
    )
  );
}

const DEFAULT_TABLE_WIDTH = 300;
const DEFAULT_TABLE_HEIGHT = 300;
export async function createTable(
  name: string,
  context: string
): Promise<CaseTable> {
  return new Promise<CaseTable>((resolve, reject) =>
    phone.call(
      {
        action: CodapActions.Create,
        resource: CodapResource.Component,
        values: {
          type: CodapComponentType.CaseTable,
          name: name,
          dimensions: {
            width: DEFAULT_TABLE_WIDTH,
            height: DEFAULT_TABLE_HEIGHT,
          },
          dataContext: context,
        },
      },
      (response) => {
        if (response.success) {
          resolve(response.values);
        } else {
          reject(new Error("Failed to create table"));
        }
      }
    )
  );
}

async function ensureUniqueName(
  name: string,
  resourceType: CodapListResource
): Promise<string> {
  // Find list of existing resources of the relevant type
  const resourceList: CodapIdentifyingInfo[] = await new Promise<
    CodapIdentifyingInfo[]
  >((resolve, reject) =>
    phone.call(
      {
        action: CodapActions.Get,
        resource: resourceType,
      },
      (response) => {
        if (response.success) {
          resolve(response.values);
        } else {
          reject(new Error(`Failed to fetch list of existing ${resourceType}`));
        }
      }
    )
  );

  return uniqueName(
    name,
    resourceList.map((x) => x.name)
  );
}

export async function createTableWithDataSet(
  dataset: DataSet,
  name?: string
): Promise<[CodapIdentifyingInfo, CaseTable]> {
  let baseName;
  if (!name) {
    baseName = getNewName();
  } else {
    baseName = name;
  }

  // Generate names
  let contextName = `${baseName} Context`;
  let tableName = `${baseName}`;

  // Ensure names are unique
  contextName = await ensureUniqueName(
    contextName,
    CodapListResource.DataContextList
  );
  tableName = await ensureUniqueName(
    tableName,
    CodapListResource.ComponentList
  );

  // Create context and table;
  const newContext = await createContextWithDataSet(dataset, contextName);

  const newTable = await createTable(tableName, contextName);
  return [newContext, newTable];
}

export function evalExpression(
  expr: string,
  records: Record<string, unknown>[]
): Promise<unknown[]> {
  return new Promise((resolve, reject) =>
    phone.call(
      {
        action: CodapActions.Get,
        resource: CodapResource.EvalExpression,
        values: {
          source: expr,
          records: records,
        },
      },
      (response) => {
        if (response.success) {
          console.group("Eval");
          console.log(response.values);
          console.groupEnd();
          resolve(response.values);
        } else {
          // In this case, values is an error message
          reject(new CodapEvalError(expr, response.values.error));
        }
      }
    )
  );
}

export const getFunctionNames: () => Promise<string[]> = (() => {
  // Remember result
  let names: string[] | null = null;
  return () => {
    return new Promise<string[]>((resolve, reject) => {
      if (names !== null) {
        resolve(names);
        return;
      }
      phone.call(
        {
          action: CodapActions.Get,
          resource: CodapResource.FunctionNames,
        },
        (response: GetFunctionNamesResponse) => {
          if (response.success) {
            names = response.values;
            resolve(response.values);
          } else {
            reject(new Error("Failed to get function names"));
          }
        }
      );
    });
  };
})();

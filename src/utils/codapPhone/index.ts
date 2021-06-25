import { IframePhoneRpcEndpoint } from "iframe-phone";
import {
  CodapComponentType,
  CodapResource,
  CodapActions,
  CodapResponse,
  CodapRequest,
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
} from "./types";
import {
  callUpdateListenersForContext,
  callAllContextListeners,
  removeContextUpdateListenersForContext,
  removeListenersWithDependency,
} from "./listeners";
import {
  resourceFromContext,
  itemFromContext,
  resourceFromComponent,
  collectionListFromContext,
  attributeListFromCollection,
  caseById,
  allCasesWithSearch,
} from "./resource";
import { fillCollectionWithDefaults, collectionsEqual } from "./util";
import { DataSet } from "../../transformations/types";
import { CodapEvalError } from "./error";
import { uniqueName } from "../names";
import * as Actions from "./actions";
import * as Cache from "./cache";

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
export async function initPhone(title: string): Promise<void> {
  return new Promise<void>((resolve, reject) =>
    phone.call(
      {
        action: CodapActions.Update,
        resource: CodapResource.InteractiveFrame,
        values: {
          title,
          dimensions: {
            width: DEFAULT_PLUGIN_WIDTH,
            height: DEFAULT_PLUGIN_HEIGHT,
          },
        },
      },
      (response) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error("Failed to update CODAP interactive frame"));
        }
      }
    )
  );
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

  // notification of which data context was deleted
  if (
    command.resource === CodapInitiatedResource.DocumentChangeNotice &&
    command.values.operation === DocumentChangeOperations.DataContextDeleted
  ) {
    removeContextUpdateListenersForContext(command.values.deletedContext);
    removeListenersWithDependency(command.values.deletedContext);
    callback({ success: true });
    return;
  }

  // data context was added/deleted
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
    // FIXME: Using flags here we can process all notifications in the list
    // without needlessly updating for each one, but this doesn't seem like
    // the most elegant solution.
    let contextUpdate = false;
    let contextListUpdate = false;

    // Context name is between the first pair of brackets
    const contextName = command.resource.slice(
      command.resource.search("\\[") + 1,
      command.resource.length - 1
    );

    for (const value of command.values) {
      contextUpdate =
        contextUpdate || mutatingOperations.includes(value.operation);
      contextListUpdate =
        contextListUpdate ||
        value.operation === ContextChangeOperation.UpdateContext;

      // Check for case update or deletion and invalidate case cache
      if (
        value.operation === ContextChangeOperation.DeleteCases ||
        value.operation === ContextChangeOperation.UpdateCases
      ) {
        const caseIDs = value.result?.caseIDs;
        if (Array.isArray(caseIDs)) {
          caseIDs.map(Cache.invalidateCase);
        }
      }
    }

    if (contextUpdate) {
      Cache.invalidateContext(contextName);
      callUpdateListenersForContext(contextName);
    }

    if (contextListUpdate) {
      callAllContextListeners();
    }
  }

  callback({ success: true });
}

function callMultiple(requests: CodapRequest[]): Promise<CodapResponse[]> {
  return new Promise<CodapResponse[]>((resolve) => {
    phone.call(requests, (responses) => resolve(responses));
  });
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
  return new Promise<ReturnedCase>((resolve, reject) => {
    const cached = Cache.getCase(id);
    if (cached !== undefined) {
      resolve(cached);
      return;
    }
    phone.call(
      {
        action: CodapActions.Get,
        resource: caseById(context, id),
      },
      (response: GetCaseResponse) => {
        if (response.success) {
          const result = response.values.case;
          Cache.setCase(id, result);
          resolve(result);
        } else {
          reject(new Error(`Failed to get case in ${context} with id ${id}`));
        }
      }
    );
  });
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
  const cached = Cache.getRecords(context);
  if (cached !== undefined) {
    return cached;
  }

  async function dataItemFromChildCase(
    c: ReturnedCase
  ): Promise<Record<string, unknown>> {
    if (c.parent === null || c.parent === undefined) {
      return c.values;
    }
    const parent = await getCaseById(context, c.parent);
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
      async (response: GetCasesResponse) => {
        if (response.success) {
          const records = await Promise.all(
            response.values.map(dataItemFromChildCase)
          );
          Cache.setRecords(context, records);
          resolve(records);
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
  return new Promise<DataContext>((resolve, reject) => {
    const cached = Cache.getContext(contextName);
    if (cached !== undefined) {
      resolve(cached);
      return;
    }
    phone.call(
      {
        action: CodapActions.Get,
        resource: resourceFromContext(contextName),
      },
      (response: GetContextResponse) => {
        if (response.success) {
          const context = normalizeDataContext(response.values);
          Cache.setContext(contextName, context);
          resolve(context);
        } else {
          reject(new Error(`Failed to get context ${contextName}`));
        }
      }
    );
  });
}

export async function deleteDataContext(contextName: string): Promise<void> {
  return new Promise<void>((resolve, reject) =>
    phone.call(
      {
        action: CodapActions.Delete,
        resource: resourceFromContext(contextName),
      },
      (response) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error("Failed to delete data context"));
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
          title: title !== undefined ? title : name,
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
  name: string,
  url: string
): Promise<void> {
  return new Promise<void>((resolve, reject) =>
    phone.call(
      {
        action: CodapActions.Create,
        resource: CodapResource.Component,
        values: {
          URL: url,
          name,
          type: "game",
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

export async function updateContextWithDataSet(
  contextName: string,
  dataset: DataSet
): Promise<void> {
  const context = await getDataContext(contextName);
  const requests = [];

  for (const collection of context.collections) {
    requests.push(Actions.deleteAllCases(contextName, collection.name));
  }

  const normalizedCollections = dataset.collections.map(
    fillCollectionWithDefaults
  );

  if (!collectionsEqual(context.collections, normalizedCollections)) {
    const concatNames = (nameAcc: string, collection: Collection) =>
      nameAcc + collection.name;
    const uniqueName =
      context.collections.reduce(concatNames, "") +
      dataset.collections.reduce(concatNames, "");

    // Create placeholder empty collection, since data contexts must have at least
    // one collection
    requests.push(
      Actions.createCollections(contextName, [
        {
          name: uniqueName,
          labels: {},
        },
      ])
    );

    // Delete old collections
    for (const collection of context.collections) {
      requests.push(Actions.deleteCollection(contextName, collection.name));
    }

    // Insert new collections and delete placeholder
    requests.push(Actions.createCollections(contextName, dataset.collections));
    requests.push(Actions.deleteCollection(contextName, uniqueName));
  }

  requests.push(Actions.insertDataItems(contextName, dataset.records));

  const responses = await callMultiple(requests);
  for (const response of responses) {
    if (!response.success) {
      throw new Error(`Failed to update ${contextName}`);
    }
  }
}

function createCollections(
  context: string,
  collections: Collection[]
): Promise<void> {
  return new Promise<void>((resolve, reject) =>
    phone.call(Actions.createCollections(context, collections), (response) => {
      if (response.success) {
        resolve();
      } else {
        reject(new Error(`Failed to create collections in ${context}`));
      }
    })
  );
}

function deleteCollection(context: string, collection: string): Promise<void> {
  return new Promise<void>((resolve, reject) =>
    phone.call(Actions.deleteCollection(context, collection), (response) => {
      if (response.success) {
        resolve();
      } else {
        reject(
          new Error(`Failed to delete collection ${collection} in ${context}`)
        );
      }
    })
  );
}

export async function deleteAllCases(
  context: string,
  collection: string
): Promise<void> {
  return new Promise<void>((resolve, reject) =>
    phone.call(Actions.deleteAllCases(context, collection), (response) => {
      if (response.success) {
        resolve();
      } else {
        reject(new Error("Failed to delete all cases"));
      }
    })
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

const TEXT_WIDTH = 100;
const TEXT_HEIGHT = 100;
const TEXT_FONT_SIZE = 2;
export async function createText(
  name: string,
  content: string
): Promise<string> {
  const textName = await ensureUniqueName(
    name,
    CodapListResource.ComponentList
  );

  return new Promise<string>((resolve, reject) =>
    phone.call(
      {
        action: CodapActions.Create,
        resource: CodapResource.Component,
        values: {
          type: CodapComponentType.Text,
          name: textName,
          dimensions: {
            width: TEXT_WIDTH,
            height: TEXT_HEIGHT,
          },
          text: {
            object: "value",
            data: {
              fontSize: TEXT_FONT_SIZE,
            },
            document: {
              children: [
                {
                  type: "paragraph",
                  children: [
                    {
                      text: content,
                    },
                  ],
                },
              ],
              objTypes: {
                paragraph: "block",
              },
            },
          },
        },
      },
      (response) => {
        if (response.success) {
          resolve(textName);
        } else {
          reject(new Error("Failed to create text"));
        }
      }
    )
  );
}

export async function updateText(name: string, content: string): Promise<void> {
  return new Promise<void>((resolve, reject) =>
    phone.call(
      {
        action: CodapActions.Update,
        resource: resourceFromComponent(name),
        values: {
          dimensions: {
            width: TEXT_WIDTH,
            height: TEXT_HEIGHT,
          },
          text: {
            object: "value",
            data: {
              fontSize: TEXT_FONT_SIZE,
            },
            document: {
              children: [
                {
                  type: "paragraph",
                  children: [
                    {
                      text: content,
                    },
                  ],
                },
              ],
              objTypes: {
                paragraph: "block",
              },
            },
          },
        },
      },
      (response) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error("Failed to update text"));
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

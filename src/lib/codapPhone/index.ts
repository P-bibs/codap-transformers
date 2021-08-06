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
  ContextMetadata,
  DataContext,
  CodapListResource,
  CodapIdentifyingInfo,
  CaseTable,
  GetDataListResponse,
  GetFunctionInfoResponse,
  FunctionInfo,
  CodapAttribute,
  GetInteractiveStateResponse,
  InteractiveFrame,
  CodapComponent,
  GetComponentResponse,
  ComponentListResponse,
} from "./types";
import {
  callUpdateListenersForContext,
  callAllContextListeners,
  removeContextUpdateListenersForContext,
  removeListenersWithDependency,
  callAllInteractiveStateRequestListeners,
  popFromUndoStackAndExecute,
  popFromRedoStackAndExecute,
  clearUndoAndRedoStacks,
  callAllContextUpdateHooks,
  callAllContextDeletedHooks,
  callAllTextDeletedHooks,
} from "./listeners";
import {
  resourceFromContext,
  itemFromContext,
  resourceFromComponent,
  collectionListFromContext,
  caseById,
  allCasesWithSearch,
} from "./resource";
import {
  fillCollectionWithDefaults,
  collectionsEqual,
  normalizeDataContext,
  parseEvalError,
} from "./util";
import { DataSet } from "../../transformers/types";
import { CodapEvalError } from "./error";
import { uniqueName } from "../utils/names";
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

const DEFAULT_PLUGIN_WIDTH = 350;
const DEFAULT_PLUGIN_HEIGHT = 450;
const DEFAULT_SAVED_TRANSFORMER_HEIGHT = 370;

// Initialize the interactive frame with a given title.
export async function initPhone(title: string, saved: boolean): Promise<void> {
  const hasState = (await getInteractiveFrame()).savedState !== undefined;
  // Only resize the plugin to default dimensions if this is it's
  // first time being initialized (no savedState)
  const dimensions = hasState
    ? undefined
    : {
        width: DEFAULT_PLUGIN_WIDTH,
        height: saved
          ? DEFAULT_SAVED_TRANSFORMER_HEIGHT
          : DEFAULT_PLUGIN_HEIGHT,
      };
  return updateInteractiveFrame({
    // Don't update the title if there is save data.
    title: hasState ? undefined : title,
    dimensions,
  });
}

export async function updateInteractiveFrame(
  values: Partial<Omit<InteractiveFrame, "interactiveState">>
): Promise<void> {
  return new Promise<void>((resolve, reject) =>
    phone.call(
      {
        action: CodapActions.Update,
        resource: CodapResource.InteractiveFrame,
        values,
      },
      (response) => {
        if (response) {
          if (response.success) {
            resolve();
          } else {
            reject(new Error("Failed to update CODAP interactive frame"));
          }
        } else {
          reject(
            new Error("Invalid response while updating interactive frame")
          );
        }
      }
    )
  );
}

const getNewName = (function () {
  let count = 0;
  return () => {
    const name = `Transformers ${count}`;
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

  // Request for plugins state
  if (
    command.action === CodapActions.Get &&
    command.resource === CodapInitiatedResource.InteractiveState
  ) {
    const values = callAllInteractiveStateRequestListeners();
    const result: GetInteractiveStateResponse = { success: true, values };
    callback(result);
    return;
  }

  if (command.action !== CodapActions.Notify) {
    callback({ success: true });
    return;
  }

  if (
    command.resource === CodapInitiatedResource.UndoChangeNotice &&
    command.values.operation === "undoAction"
  ) {
    // if CODAP notifies us it's undo time, then fire an undo callback
    popFromUndoStackAndExecute();
    return;
  }

  if (
    command.resource === CodapInitiatedResource.UndoChangeNotice &&
    command.values.operation === "redoAction"
  ) {
    popFromRedoStackAndExecute();
    return;
  }

  if (
    command.resource === CodapInitiatedResource.UndoChangeNotice &&
    command.values.operation === "clearUndo"
  ) {
    clearUndoAndRedoStacks();
  }

  // notification of which data context was deleted
  if (
    command.resource === CodapInitiatedResource.DocumentChangeNotice &&
    command.values.operation === DocumentChangeOperations.DataContextDeleted
  ) {
    const deletedContext = command.values.deletedContext;
    Cache.invalidateContext(deletedContext);
    removeContextUpdateListenersForContext(deletedContext);
    removeListenersWithDependency(deletedContext);
    callAllContextDeletedHooks(deletedContext);
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

  // text component was deleted
  if (
    command.resource === CodapResource.Component &&
    command.values.operation === "delete" &&
    command.values.type === "DG.TextView"
  ) {
    // Call all text deleted hooks with the deleted text's name
    callAllTextDeletedHooks(command.values.name);
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

      // Invalidate all cases in a context if attributes get moved or deleted,
      // etc. Cannot do this more granularly because attribute moves do not
      // give enough information.
      if (
        value.operation === ContextChangeOperation.MoveAttribute ||
        value.operation === ContextChangeOperation.DeleteAttribute ||
        value.operation === ContextChangeOperation.UpdateAttribute
      ) {
        Cache.invalidateCasesInContext(contextName);
      }
    }

    if (contextUpdate) {
      Cache.invalidateContext(contextName);
      callUpdateListenersForContext(contextName);
      callAllContextUpdateHooks(contextName);
    }

    if (contextListUpdate) {
      callAllContextListeners();
    }
  }

  callback({ success: true });
}

function callMultiple(requests: CodapRequest[]): Promise<CodapResponse[]> {
  return new Promise<CodapResponse[]>((resolve, reject) => {
    phone.call(requests, (responses) => {
      if (responses) {
        resolve(responses);
      } else {
        reject(new Error("Invalid response while making multiple requests"));
      }
    });
  });
}

export function getInteractiveFrame(): Promise<InteractiveFrame> {
  return new Promise<InteractiveFrame>((resolve, reject) =>
    phone.call(
      {
        action: CodapActions.Get,
        resource: CodapResource.InteractiveFrame,
      },
      (response) => {
        if (response) {
          if (response.success) {
            resolve(response.values);
          } else {
            reject(new Error("Failed to get interactive frame"));
          }
        } else {
          reject(new Error("Invalid response while getting interactive frame"));
        }
      }
    )
  );
}

export function notifyInteractiveFrameIsDirty(): Promise<void> {
  return new Promise<void>((resolve, reject) =>
    phone.call(
      {
        action: CodapActions.Notify,
        resource: CodapResource.InteractiveFrame,
        values: {
          dirty: true,
        },
      },
      (response) => {
        if (response) {
          if (response.success) {
            resolve();
          } else {
            reject(
              new Error(
                "Failed to notify interactive frame that state is dirty"
              )
            );
          }
        } else {
          reject(
            new Error(
              "Invalid response while notifying interactive frame that state is dirty"
            )
          );
        }
      }
    )
  );
}

/**
 * Sends a request to select (bring to front) the plugin's interactive frame
 */
export async function notifyInteractiveFrameWithSelect(): Promise<void> {
  const id = (await getInteractiveFrame()).id;
  return new Promise<void>((resolve, reject) =>
    phone.call(
      {
        action: CodapActions.Notify,
        resource: resourceFromComponent(`${id}`),
        values: {
          request: "select",
        },
      },
      (response) => {
        if (response) {
          if (response.success) {
            resolve();
          } else {
            reject(new Error("Failed to notify component to select"));
          }
        } else {
          reject(
            new Error("Invalid response while selecting the interactive frame")
          );
        }
      }
    )
  );
}

export function getAllComponents(): Promise<ComponentListResponse["values"]> {
  return new Promise((resolve, reject) =>
    phone.call(
      {
        action: CodapActions.Get,
        resource: CodapListResource.ComponentList,
      },
      (response: ComponentListResponse) => {
        if (response) {
          if (Array.isArray(response.values)) {
            resolve(response.values);
          } else {
            reject(new Error("Failed to get components"));
          }
        } else {
          reject(new Error("Invalid response while getting all components"));
        }
      }
    )
  );
}

export function getComponent(component: string): Promise<CodapComponent> {
  return new Promise<CodapComponent>((resolve, reject) =>
    phone.call(
      {
        action: CodapActions.Get,
        resource: resourceFromComponent(component),
      },
      (response: GetComponentResponse) => {
        if (response) {
          if (response.success) {
            resolve(response.values);
          } else {
            reject(new Error("Failed to get component"));
          }
        } else {
          reject(new Error("Invalid response while getting component"));
        }
      }
    )
  );
}

export function updateComponent(
  component: string,
  values: Partial<CaseTable>
): Promise<void> {
  return new Promise((resolve, reject) =>
    phone.call(
      {
        action: CodapActions.Update,
        resource: resourceFromComponent(component),
        values: values,
      },
      (response) => {
        if (response) {
          if (response.success) {
            resolve();
          } else {
            reject(new Error("Failed to update component"));
          }
        } else {
          reject(new Error("Invalid response while updating component"));
        }
      }
    )
  );
}
export function updateDataContext(
  context: string,
  values: Partial<DataContext>
): Promise<void> {
  return new Promise((resolve, reject) =>
    phone.call(
      {
        action: CodapActions.Update,
        resource: resourceFromContext(context),
        values: values,
      },
      (response) => {
        if (response) {
          if (response.success) {
            resolve();
          } else {
            reject(new Error("Failed to update context"));
          }
        } else {
          reject(new Error("Invalid response while updating data context"));
        }
      }
    )
  );
}

export function getAllDataContexts(): Promise<CodapIdentifyingInfo[]> {
  return new Promise<CodapIdentifyingInfo[]>((resolve, reject) =>
    phone.call(
      {
        action: CodapActions.Get,
        resource: CodapResource.DataContextList,
      },
      (response) => {
        if (response) {
          if (Array.isArray(response.values)) {
            resolve(response.values);
          } else {
            reject(new Error("Failed to get data contexts"));
          }
        } else {
          reject(new Error("Invalid response while getting all data contexts"));
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
        if (response) {
          if (response.success) {
            resolve(response.values);
          } else {
            reject(new Error("Failed to get collections"));
          }
        } else {
          reject(new Error("Invalid response while getting all collections"));
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
        if (response) {
          if (response.success) {
            const result = response.values.case;
            Cache.setCase(context, id, result);
            resolve(result);
          } else {
            reject(new Error(`Failed to get case in ${context} with id ${id}`));
          }
        } else {
          reject(new Error("Invalid response while getting case by ID"));
        }
      }
    );
  });
}

export async function getAllAttributes(
  context: string
): Promise<CodapAttribute[]> {
  const collections = (await getDataContext(context)).collections;

  const attributes: CodapAttribute[] = [];
  collections.forEach((collection) =>
    collection.attrs?.forEach((attr) => attributes.push(attr))
  );

  return attributes;
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
        if (response) {
          if (response.success) {
            const records = await Promise.all(
              response.values.map(dataItemFromChildCase)
            );
            Cache.setRecords(context, records);
            resolve(records);
          } else {
            reject(new Error("Failed to get data items"));
          }
        } else {
          reject(new Error("Invalid response while getting data from context"));
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
        if (response) {
          if (response.success) {
            const context = normalizeDataContext(response.values);
            Cache.setContext(contextName, context);
            resolve(context);
          } else {
            reject(new Error(`Failed to get context ${contextName}`));
          }
        } else {
          reject(new Error("Invalid response while getting data context"));
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
        if (response) {
          if (response.success) {
            resolve();
          } else {
            reject(new Error("Failed to delete data context"));
          }
        } else {
          reject(new Error("Invalid response while deleting data context"));
        }
      }
    )
  );
}

async function createDataContext({
  name,
  title,
  collections,
  metadata,
  preventReorg,
}: DataContext): Promise<CodapIdentifyingInfo> {
  return new Promise<CodapIdentifyingInfo>((resolve, reject) =>
    phone.call(
      {
        action: CodapActions.Create,
        resource: CodapResource.DataContext,
        values: {
          name,
          title: title !== undefined ? title : name,
          collections,
          metadata,
          preventReorg,
        },
      },
      (response) => {
        if (response) {
          if (response.success) {
            resolve(response.values);
          } else {
            reject(new Error("Failed to create data context"));
          }
        } else {
          reject(new Error("Invalid response while creating data context"));
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
        if (response) {
          if (response.success) {
            resolve();
          } else {
            reject(new Error("Failed to create data interactive"));
          }
        } else {
          reject(new Error("Invalid response while creating data interactive"));
        }
      }
    )
  );
}

export async function createContextWithDataSet(
  dataset: DataSet,
  name: string,
  title?: string,
  metadata?: ContextMetadata
): Promise<CodapIdentifyingInfo> {
  const newDatasetDescription = await createDataContext({
    name,
    title,
    metadata,
    collections: dataset.collections,
    preventReorg: !dataset.editable,
  });

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
        if (response) {
          if (response.success) {
            resolve();
          } else {
            reject(new Error("Failed to create dataset with data"));
          }
        } else {
          reject(new Error("Invalid response while inserting data items"));
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

export function createCollections(
  context: string,
  collections: Collection[]
): Promise<void> {
  return new Promise<void>((resolve, reject) =>
    phone.call(Actions.createCollections(context, collections), (response) => {
      if (response) {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(`Failed to create collections in ${context}`));
        }
      } else {
        reject(new Error("Invalid response while creating collections"));
      }
    })
  );
}

export function deleteCollection(
  context: string,
  collection: string
): Promise<void> {
  return new Promise<void>((resolve, reject) =>
    phone.call(Actions.deleteCollection(context, collection), (response) => {
      if (response) {
        if (response.success) {
          resolve();
        } else {
          reject(
            new Error(`Failed to delete collection ${collection} in ${context}`)
          );
        }
      } else {
        reject(new Error("Invalid response while deleting collection"));
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
      if (response) {
        if (response.success) {
          resolve();
        } else {
          reject(new Error("Failed to delete all cases"));
        }
      } else {
        reject(new Error("Invalid response while deleting all cases"));
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
        if (response) {
          if (response.success) {
            resolve(response.values);
          } else {
            reject(new Error("Failed to create table"));
          }
        } else {
          reject(new Error("Invalid response while creating table"));
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
  content: string,
  fontSize?: number,
  width?: number,
  height?: number
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
            width: width ? width : TEXT_WIDTH,
            height: height ? height : TEXT_HEIGHT,
          },
          text: {
            object: "value",
            data: {
              fontSize: fontSize ? fontSize : TEXT_FONT_SIZE,
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
        if (response) {
          if (response.success) {
            resolve(textName);
          } else {
            reject(new Error("Failed to create text"));
          }
        } else {
          reject(new Error("Invalid response while creating text"));
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
        if (response) {
          if (response.success) {
            resolve();
          } else {
            reject(new Error("Failed to update text"));
          }
        } else {
          reject(new Error("Invalid response while updating text"));
        }
      }
    )
  );
}

export async function deleteText(name: string): Promise<void> {
  return new Promise<void>((resolve, reject) =>
    phone.call(
      {
        action: CodapActions.Delete,
        resource: resourceFromComponent(name),
      },
      (response) => {
        if (response) {
          if (response.success) {
            resolve();
          } else {
            reject(new Error("Failed to delete text"));
          }
        } else {
          reject(new Error("Invalid response while deleting text"));
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
        if (response) {
          if (response.success) {
            resolve(response.values);
          } else {
            reject(
              new Error(`Failed to fetch list of existing ${resourceType}`)
            );
          }
        } else {
          reject(new Error("Invalid response while getting resource list"));
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
  name?: string,
  description?: string
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
  const newContext = await createContextWithDataSet(
    dataset,
    contextName,
    contextName,
    {
      description,
    }
  );

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
        action: CodapActions.Notify,
        resource: CodapResource.FormulaEngine,
        values: {
          request: "evalExpression",
          source: expr,
          records: records,
        },
      },
      (response) => {
        if (response) {
          if (response.success) {
            console.group("Eval");
            console.log(response.values);
            console.groupEnd();
            resolve(response.values);
          } else {
            // In this case, values is an error message
            reject(
              new CodapEvalError(expr, parseEvalError(response.values.error))
            );
          }
        } else {
          reject(new Error("Invalid response while evaluating expression"));
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
          resource: CodapResource.FormulaEngine,
        },
        (response: GetFunctionInfoResponse) => {
          if (response) {
            if (response.success) {
              const allFunctions: FunctionInfo[] = Object.values(
                response.values
              ).flatMap(Object.values);
              names = allFunctions.map((f) => f.name);
              resolve(names);
            } else {
              reject(new Error("Failed to get function names"));
            }
          } else {
            reject(new Error("Invalid response while getting function names"));
          }
        }
      );
    });
  };
})();

export function notifyUndoableActionPerformed(message: string): Promise<void> {
  return new Promise((resolve, reject) =>
    phone.call(
      {
        action: CodapActions.Notify,
        resource: CodapResource.UndoChangeNotice,
        values: {
          operation: "undoableActionPerformed",
          logMessage: message,
        },
      },
      (response) => {
        if (response) {
          if (response.success) {
            resolve();
          } else {
            reject(
              new Error("Failed notifying about undoable action performed")
            );
          }
        } else {
          reject(
            new Error(
              "Invalid response while notifying about undoable action performed"
            )
          );
        }
      }
    )
  );
}

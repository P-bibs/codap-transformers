import { IframePhoneRpcEndpoint } from "iframe-phone";
import {
  CodapComponentType,
  CodapResource,
  CodapActions,
  CodapResponse,
  CodapPhone,
  CodapInitiatedResource,
  mutatingOperations,
  DocumentChangeOperations,
  CodapInitiatedCommand,
  DataContext,
  CodapAttribute,
} from "./types";
import { newContextListeners, contextUpdateListeners } from "./listeners";

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

function resourceFromContext(context: string) {
  return `dataContext[${context}]`;
}

function itemFromContext(context: string) {
  return `dataContext[${context}].item`;
}

// https://github.com/concord-consortium/codap/wiki/CODAP-Data-Interactive-Plugin-API#example-item-get-by-search
function itemSearchAllFromContext(context: string) {
  return `dataContext[${context}].itemSearch[*]`;
}

function collectionNameFromContext(context: string) {
  return `${context}_collection`;
}

function caseFromContext(context: string) {
  const collectionName = collectionNameFromContext(context);
  return `dataContext[${context}].collection[${collectionName}].case`;
}

function allCasesFromContext(context: string) {
  const collectionName = collectionNameFromContext(context);
  return `dataContext[${context}].collection[${collectionName}].allCases`;
}

const getNewName = (function () {
  let count = 0;
  return () => {
    const name = `codapflow_${count}`;
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
    return;
  }

  if (
    command.resource === CodapInitiatedResource.DocumentChangeNotice &&
    command.values.operation ===
      DocumentChangeOperations.DataContextCountChanged
  ) {
    for (const f of newContextListeners) {
      f();
    }
    return;
  }

  if (
    command.resource.startsWith(
      CodapInitiatedResource.DataContextChangeNotice
    ) &&
    Array.isArray(command.values) &&
    command.values.length > 0 &&
    mutatingOperations.includes(command.values[0].operation)
  ) {
    const contextName = command.resource.slice(
      command.resource.search("\\[") + 1,
      command.resource.length - 1
    );
    if (contextUpdateListeners[contextName]) {
      contextUpdateListeners[contextName]();
    }
    return;
  }
}

export function getAllDataContexts(): Promise<DataContext[]> {
  return new Promise<DataContext[]>((resolve, reject) =>
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

export function getDataFromContext(
  context: string
): Promise<Record<string, unknown>[]> {
  return new Promise<Record<string, unknown>[]>((resolve, reject) =>
    phone.call(
      {
        action: CodapActions.Get,
        resource: itemSearchAllFromContext(context),
      },
      (response) => {
        if (Array.isArray(response.values)) {
          resolve(response.values.map((v) => v.values));
        } else {
          reject(new Error("Failed to get data items"));
        }
      }
    )
  );
}

function createBareDataset(
  label: string,
  attrs: CodapAttribute[]
): Promise<DataContext> {
  const newName = getNewName();
  const newCollectionName = collectionNameFromContext(newName);

  return new Promise<DataContext>((resolve, reject) =>
    phone.call(
      {
        action: CodapActions.Create,
        resource: CodapResource.DataContext,
        values: {
          name: newName,
          collections: [
            {
              name: newCollectionName,
              labels: {
                singleCase: label,
              },
              attrs: attrs,
            },
          ],
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

/**
 * Make CODAP attributes from given list of objects. Assumes objects have
 * the same fields
 */
function makeAttrsFromData(data: Record<string, unknown>[]): CodapAttribute[] {
  if (data.length === 0) {
    return [];
  }

  return Object.keys(data[0]).map((key) => ({ name: key }));
}

export async function createDataset(
  label: string,
  data: Record<string, unknown>[]
): Promise<DataContext> {
  if (data.length === 0) {
    return await createBareDataset(label, []);
  }

  // Create a bare dataset and insert given data into it
  const attrs = makeAttrsFromData(data);
  const newDatasetDescription = await createBareDataset(label, attrs);

  // return itemIDs
  return new Promise<DataContext>((resolve, reject) =>
    phone.call(
      {
        action: CodapActions.Create,
        resource: itemFromContext(newDatasetDescription.name),
        values: data,
      },
      (response) => {
        if (response.success) {
          resolve(newDatasetDescription);
        } else {
          reject(new Error("Failed to create dataset with data"));
        }
      }
    )
  );
}

export async function setContextItems(
  contextName: string,
  items: Record<string, unknown>[]
): Promise<void> {
  await deleteAllCases(contextName);

  return new Promise<void>((resolve, reject) =>
    phone.call(
      {
        action: CodapActions.Create,
        resource: itemFromContext(contextName),
        values: items,
      },
      (response) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error("Failed to update context with new items"));
        }
      }
    )
  );
}

export async function deleteAllCases(context: string): Promise<void> {
  return new Promise<void>((resolve, reject) =>
    phone.call(
      {
        action: CodapActions.Delete,
        resource: allCasesFromContext(context),
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
export async function createTable(context: string): Promise<void> {
  return new Promise<void>((resolve, reject) =>
    phone.call(
      {
        action: CodapActions.Create,
        resource: CodapResource.Component,
        values: {
          type: CodapComponentType.CaseTable,
          name: getNewName(),
          dimensions: {
            width: DEFAULT_TABLE_WIDTH,
            height: DEFAULT_TABLE_HEIGHT,
          },
          dataContext: context,
        },
      },
      (response) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error("Failed to create table"));
        }
      }
    )
  );
}

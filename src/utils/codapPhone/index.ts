import { IframePhoneRpcEndpoint } from "iframe-phone";
import {
  CodapComponentType,
  CodapResource,
  CodapActions,
  CodapResponse,
  CodapResponseValues,
  CodapResponseItemIDs,
  CodapPhone,
  CodapInitiatedResource,
  ContextChangeOperation,
  mutatingOperations,
  CodapInitiatedCommand,
  DataSetDescription,
  CodapAttribute,
  CodapListResource,
  CodapComponent,
  CaseTable,
} from "./types";
import {
  newContextListeners,
  contextUpdateListeners,
  callAllContextListeners,
} from "./listeners";

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
    const name = `CodapFlow_${count}`;
    count += 1;
    return name;
  };
})();

enum DocumentChangeOperations {
  DataContextCountChanged = "dataContextCountChanged",
}

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
    callAllContextListeners();
    return;
  }

  if (
    command.resource.startsWith(
      CodapInitiatedResource.DataContextChangeNotice
    ) &&
    command.values.length > 0
  ) {
    if (mutatingOperations.includes(command.values[0].operation)) {
      const contextName = command.resource.slice(
        command.resource.search("\\[") + 1,
        command.resource.length - 1
      );
      if (contextUpdateListeners[contextName]) {
        contextUpdateListeners[contextName]();
      }
      return;
    }
    if (command.values[0].operation === ContextChangeOperation.UpdateContext) {
      callAllContextListeners();
      return;
    }
  }
}

export function getAllDataContexts(): Promise<DataSetDescription[]> {
  return new Promise<DataSetDescription[]>((resolve, reject) =>
    phone.call<CodapResponseValues>(
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

export function getDataFromContext(context: string) {
  return new Promise<Record<string, unknown>[]>((resolve, reject) =>
    phone.call<CodapResponseValues>(
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

function createBareDataset(name: string, attrs: CodapAttribute[]) {
  const newCollectionName = collectionNameFromContext(name);

  return new Promise<DataSetDescription>((resolve, reject) =>
    phone.call<CodapResponseValues>(
      {
        action: CodapActions.Create,
        resource: CodapResource.DataContext,
        values: {
          name: name,
          collections: [
            {
              name: newCollectionName,
              labels: {
                singleCase: name,
              },
              attrs: attrs,
            },
          ],
        },
      },
      (response) => {
        if (response.success) {
          resolve(response.values as DataSetDescription);
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
) {
  if (data.length === 0) {
    return await createBareDataset(label, []);
  }

  // Create a bare dataset and insert given data into it
  const attrs = makeAttrsFromData(data);
  const newDatasetDescription = await createBareDataset(label, attrs);

  // return itemIDs
  return new Promise<DataSetDescription>((resolve, reject) =>
    phone.call<CodapResponseItemIDs>(
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
) {
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

export async function deleteAllCases(context: string) {
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
export async function createTable(
  name: string,
  context: string
): Promise<CaseTable> {
  return new Promise<CaseTable>((resolve, reject) =>
    phone.call<CodapResponseValues>(
      {
        action: CodapActions.Create,
        resource: CodapResource.Component,
        values: {
          type: CodapComponentType.Table,
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
  const resourceList: CodapComponent[] = await new Promise<CodapComponent[]>(
    (resolve, reject) =>
      phone.call<CodapResponseValues>(
        {
          action: CodapActions.Get,
          resource: resourceType,
        },
        (response) => {
          if (response.success) {
            resolve(response.values);
          } else {
            reject(
              new Error(`Failed to fetch list of existing ${resourceType}`)
            );
          }
        }
      )
  );

  const names = resourceList.map((x) => x.name);

  // If the name doesn't already exist we can return it as is
  if (!names.includes(name)) {
    return name;
  }

  // Otherwise find a suffix for the name that makes it unique
  let i = 1;
  while (names.includes(`${name}_(${i})`)) {
    i += 1;
  }
  return `${name}_(${i})`;
}

export async function createTableWithData(
  data: Record<string, unknown>[],
  name?: string
): Promise<[DataSetDescription, CaseTable]> {
  let baseName;
  if (!name) {
    baseName = getNewName();
  } else {
    baseName = name;
  }

  // Generate names
  let contextName = `${baseName}_context`;
  let tableName = `${baseName}_table`;

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
  const newContext = await createDataset(contextName, data);
  const newTable = await createTable(tableName, contextName);
  return [newContext, newTable];
}

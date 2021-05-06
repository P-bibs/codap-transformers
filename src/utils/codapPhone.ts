import { IframePhoneRpcEndpoint } from "iframe-phone";

enum CodapComponent {
  Graph = "graph",
  Table = "caseTable",
  Map = "map",
}

enum CodapResource {
  DataContext = "dataContext",
  DataContextList = "dataContextList",
}

enum CodapActions {
  Create = "create",
  Update = "update",
  Delete = "delete",
  Get = "get",
  Notify = "notify",
}

type CodapRequest = {
  action: CodapActions;
  resource: string;
  values?: any;
}

interface CodapResponse {
  success: boolean;
}

interface CodapResponseValues extends CodapResponse {
  values?: any;
}

interface CodapResponseItemIDs extends CodapResponse {
  itemIDs?: string[];
}

type CodapPhone = {
  call<T extends CodapResponse>(r: CodapRequest, cb: (r: T) => any): void;
}

type CodapInitiatedCommand = {
  action: CodapActions;
  resource: "interactiveState" | "undoChangeNotice" | "documentChangeNotice";
  values?: any;
}

type DataSetDescription = {
  name: string;
  id: number;
  title: string;
}

interface BaseAttribute {
  name: string;
  title?: string;
  colormap?: Object;
  description?: string;
  editable?: boolean;
  formula?: string;
  hidden?: boolean;
}

interface CategoricalAttribute extends BaseAttribute {
  type: "categorical";
}

interface NumericAttribute extends BaseAttribute {
  type: "numeric";
  precision?: number;
  unit?: string;
}

type CodapAttribute = BaseAttribute | CategoricalAttribute | NumericAttribute;

const phone: CodapPhone = new IframePhoneRpcEndpoint(codapRequestHandler,
                                                     "data-interactive",
                                                     window.parent,
                                                     null,
                                                     null);

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

const getNewContextName = (function() {
  let count = 0;
  return () => {
    const name = `codapflow_${count}`;
    count += 1;
    return name;
  };
})();

/**
 * Mock request handler for requests initiated by CODAP.
 */
function codapRequestHandler(command: CodapInitiatedCommand,
                             callback: (r: CodapResponse) => void) {
  callback({ success: false });
}

export function getAllDataContexts() {
  return new Promise<string[]>((resolve, reject) =>
    phone.call<CodapResponseValues>({
      action: CodapActions.Get,
      resource: CodapResource.DataContextList
    }, response => {
      if (Array.isArray(response.values)) {
        resolve(response.values.map(v => v.name));
      } else {
        reject(new Error("Failed to get data contexts."));
      }
    }));
}

export function getDataFromContext(context: string) {
  return new Promise<Object[]>((resolve, reject) =>
    phone.call<CodapResponseValues>({
      action: CodapActions.Get,
      resource: itemSearchAllFromContext(context)
    }, response => {
      if (Array.isArray(response.values)) {
        resolve(response.values.map(v => v.values));
      } else {
        reject(new Error("Failed to get data items"));
      }
    }));
}

function createBareDataset(label: string, attrs: CodapAttribute[]) {
  const newName = getNewContextName();
  const newCollectionName = collectionNameFromContext(newName);

  return new Promise<DataSetDescription>((resolve, reject) =>
    phone.call<CodapResponseValues>({
      action: CodapActions.Create,
      resource: CodapResource.DataContext,
      values: {
        name: newName,
        collections: [{
          name: newCollectionName,
          labels: {
            singleCase: label
          },
          attrs: attrs
        }]
      }
    }, response => {
      if (response.success) {
        resolve(response.values as DataSetDescription);
      } else {
        reject(new Error("Failed to create dataset"));
      }
    }));
}

function makeAttrsFromData(data: Object[]): CodapAttribute[] {
  if (data.length === 0) {
    return [];
  }

  return Object.keys(data[0]).map(key => ({ name: key }));
}

export async function createDataset(label: string, data: Object[]) {
  if (data.length === 0) {
    return await createBareDataset(label, []);
  }

  // Create a bare dataset and insert given data into it
  const attrs = makeAttrsFromData(data);
  const newDatasetDescription = await createBareDataset(label, attrs);

  // return itemIDs
  return new Promise<string[]>((resolve, reject) =>
    phone.call<CodapResponseItemIDs>({
      action: CodapActions.Create,
      resource: itemFromContext(newDatasetDescription.name),
      values: data
    }, response => {
      if (response.success) {
        resolve(response.itemIDs!);
      } else {
        reject(new Error("Failed to create dataset with data"));
      }
    }));
}

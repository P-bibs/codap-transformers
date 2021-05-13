export enum CodapResource {
  DataContext = "dataContext",
  DataContextList = "dataContextList",
  Component = "component",
  Collection = "collection",
  CollectionList = "collectionList",
}

export enum CodapListResource {
  DataContextList = "dataContextList",
  ComponentList = "componentList",
}

export enum CodapActions {
  Create = "create",
  Update = "update",
  Delete = "delete",
  Get = "get",
  Notify = "notify",
}

type GetContextListRequest = {
  action: CodapActions.Get;
  resource: CodapResource.DataContextList;
};

type GetRequest = {
  action: CodapActions.Get;
  resource: string;
};

type GetListRequest = {
  action: CodapActions.Get;
  resource: CodapListResource;
};

type CreateContextRequest = {
  action: CodapActions.Create;
  resource: CodapResource.DataContext;
  values: {
    name: string;
    title?: string;
    collections: Collection[];
  };
};

type CreateDataItemsRequest = {
  action: CodapActions.Create;
  resource: string;
  values: Record<string, unknown>[];
};

type DeleteRequest = {
  action: CodapActions.Delete;
  resource: string;
};

type CreateTableRequest = {
  action: CodapActions.Create;
  resource: CodapResource.Component;
  values: CaseTable;
};

export interface CodapResponse {
  success: boolean;
}

interface CreateContextResponse extends CodapResponse {
  values: DataContext;
}

interface GetListResponse extends CodapResponse {
  values: CodapIdentifyingInfo[];
}

interface GetDataResponse extends CodapResponse {
  values: {
    values: Record<string, unknown>;
  }[];
}

export interface GetCasesResponse extends CodapResponse {
  values: Case[];
}

export interface GetContextResponse extends CodapResponse {
  values: DataContext;
}

interface TableResponse extends CodapResponse {
  values: CaseTable;
}

export type CodapPhone = {
  call(r: GetContextListRequest, cb: (r: GetListResponse) => void): void;
  call(r: GetListRequest, cb: (r: GetListResponse) => void): void;
  call(r: GetRequest, cb: (r: GetDataResponse) => void): void;
  call(r: GetRequest, cb: (r: GetContextResponse) => void): void;
  call(r: GetRequest, cb: (r: GetCasesResponse) => void): void;
  call(r: CreateContextRequest, cb: (r: CreateContextResponse) => void): void;
  call(r: CreateDataItemsRequest, cb: (r: CodapResponse) => void): void;
  call(r: DeleteRequest, cb: (r: CodapResponse) => void): void;
  call(r: CreateTableRequest, cb: (r: TableResponse) => void): void;
};

export enum CodapInitiatedResource {
  InteractiveState = "interactiveState",
  UndoChangeNotice = "undoChangeNotice",
  DocumentChangeNotice = "documentChangeNotice",
  DataContextChangeNotice = "dataContextChangeNotice",
}

export enum ContextChangeOperation {
  UpdateCases = "updateCases",
  CreateCases = "createCases",
  DeleteCases = "deleteCases",
  SelectCases = "selectCases",
  UpdateContext = "updateDataContext",
}

export const mutatingOperations = [
  ContextChangeOperation.UpdateCases,
  ContextChangeOperation.CreateCases,
  ContextChangeOperation.DeleteCases,
];

export enum DocumentChangeOperations {
  DataContextCountChanged = "dataContextCountChanged",
}

export type CodapInitiatedCommand =
  | {
      action: CodapActions.Get;
      resource: CodapInitiatedResource.InteractiveState;
    }
  | {
      action: CodapActions.Notify;
      resource: CodapInitiatedResource.UndoChangeNotice;
      values: {
        operation: string;
        canUndo: boolean;
        canRedo: boolean;
      };
    }
  | {
      action: CodapActions.Notify;
      resource: CodapInitiatedResource.DocumentChangeNotice;
      values: {
        operation: DocumentChangeOperations;
      };
    }
  | {
      action: CodapActions.Notify;
      resource: CodapInitiatedResource.DataContextChangeNotice;
      values: {
        operation: ContextChangeOperation;
      }[];
    };

// https://github.com/concord-consortium/codap/wiki/CODAP-Data-Interactive-Plugin-API#datacontexts
export interface DataContext {
  name: string;
  title?: string;
  description?: string;
  collections: ReturnedCollection[];
}

// https://github.com/concord-consortium/codap/wiki/CODAP-Data-Interactive-Plugin-API#collections
export interface Collection {
  name: string;
  title?: string;
  description?: string;
  parent?: string;
  attrs?: BaseAttribute[];
  labels: {
    singleCase?: string;
    pluralCase?: string;
    singleCaseWithArticle?: string;
    setOfCases?: string;
    setOfCasesWithArticle?: string;
  };
}

export interface ReturnedCollection extends Omit<Collection, "parent"> {
  id: number;
  parent?: number;
}

// https://github.com/concord-consortium/codap/wiki/CODAP-Data-Interactive-Plugin-API#attributes
export type CodapAttribute =
  | BaseAttribute
  | CategoricalAttribute
  | NumericAttribute;

export interface BaseAttribute {
  name: string;
  title?: string;
  type?: "numeric" | "categorical";
  colormap?:
    | Record<string, string>
    | {
        "high-attribute-color": string;
        "low-attribute-color": string;
        "attribute-color": string;
      };
  description?: string;
  editable?: boolean;
  formula?: string;
  hidden?: boolean;
  precision?: number;
  unit?: string;
}

export interface CategoricalAttribute extends BaseAttribute {
  type: "categorical";
  colormap?: Record<string, string>;
}

export interface NumericAttribute extends BaseAttribute {
  type: "numeric";
  precision?: number;
  unit?: string;
  colormap?: {
    "high-attribute-color": string;
    "low-attribute-color": string;
    "attribute-color": string;
  };
}

// https://github.com/concord-consortium/codap/wiki/CODAP-Data-Interactive-Plugin-API#attributelocations
export interface AttributeLocation {
  collection: string;
  position: number;
}

// https://github.com/concord-consortium/codap/wiki/CODAP-Data-Interactive-Plugin-API#cases
export interface Case {
  id: number;
  parent?: string;
  collection?: Collection;
  values: Record<string, unknown>[];
}

// https://github.com/concord-consortium/codap/wiki/CODAP-Data-Interactive-Plugin-API#selectionlists
export type SelectionList = number[];

// https://github.com/concord-consortium/codap/wiki/CODAP-Data-Interactive-Plugin-API#components
export enum CodapComponentType {
  Graph = "graph",
  CaseTable = "caseTable",
  Map = "map",
  Slider = "slider",
  Calculator = "calculator",
  Text = "text",
  WebView = "webView",
  Guide = "guideView",
}

// https://github.com/concord-consortium/codap/wiki/CODAP-Data-Interactive-Plugin-API#example-collection-list-get
// https://github.com/concord-consortium/codap/wiki/CODAP-Data-Interactive-Plugin-API#example-get-data-context-list
export type CodapIdentifyingInfo = {
  id: number;
  name: string;
  title: string;
};

type CodapPosition = "top" | "bottom" | { left: number; top: number };

export interface CodapComponent {
  type: CodapComponentType;
  name: string;
  title?: string;
  dimensions: {
    width: number;
    height: number;
  };
  position?: CodapPosition;
}

// https://github.com/concord-consortium/codap/wiki/CODAP-Data-Interactive-Plugin-API#the-graph-object
export interface Graph extends CodapComponent {
  type: CodapComponentType.Graph;
  cannotClose: boolean;
  dataContext: string;
  xAttributeName: string;
  yAttributeName: string;
  y2AttributeName: string;
  legendAttributeName: string;
  enableNumberToggle: boolean;
  numberToggleLastMode: boolean;
}

// https://github.com/concord-consortium/codap/wiki/CODAP-Data-Interactive-Plugin-API#the-casetable-object
export interface CaseTable extends CodapComponent {
  type: CodapComponentType.CaseTable;
  cannotClose?: boolean;
  dataContext: string;
  horizontalScrollOffset?: number;
  isIndexHidden?: boolean;
}

// https://github.com/concord-consortium/codap/wiki/CODAP-Data-Interactive-Plugin-API#the-map-object
export interface Map extends CodapComponent {
  type: CodapComponentType.Map;
  cannotClose: boolean;
  dataContext: string;
  legendAttributeName: string;
  center: [number, number];
  zoom: number;
}

// https://github.com/concord-consortium/codap/wiki/CODAP-Data-Interactive-Plugin-API#the-slider-object
export interface Slider extends CodapComponent {
  type: CodapComponentType.Slider;
  cannotClose: boolean;
  globalValueName: string;
  animationDirection: number;
  animationMode: number;
  lowerBound: number;
  upperBound: number;
}

// https://github.com/concord-consortium/codap/wiki/CODAP-Data-Interactive-Plugin-API#the-calculator-object
export interface Calculator extends CodapComponent {
  type: CodapComponentType.Calculator;
  cannotClose: boolean;
}

// https://github.com/concord-consortium/codap/wiki/CODAP-Data-Interactive-Plugin-API#the-text-object
export interface Text extends CodapComponent {
  type: CodapComponentType.Text;
  cannotClose: boolean;
  text: string;
}

// https://github.com/concord-consortium/codap/wiki/CODAP-Data-Interactive-Plugin-API#the-webview-object
export interface WebView extends CodapComponent {
  type: CodapComponentType.WebView;
  cannotClose: boolean;
  URL: string;
}

// https://github.com/concord-consortium/codap/wiki/CODAP-Data-Interactive-Plugin-API#the-guide-object
export interface Guide extends CodapComponent {
  type: CodapComponentType.Guide;
  cannotClose: boolean;
  isVisible: boolean;
  currentItemIndex: number;
  items: {
    itemTitle: string;
    url: string;
  }[];
}

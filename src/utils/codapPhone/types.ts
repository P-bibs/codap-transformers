export enum CodapResource {
  InteractiveFrame = "interactiveFrame",
  DataContext = "dataContext",
  DataContextList = "dataContextList",
  Component = "component",
  Collection = "collection",
  CollectionList = "collectionList",
  EvalExpression = "evalExpression",
  FunctionNames = "functionNames",
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

export type CodapRequest =
  | CreateInteractiveFrameRequest
  | UpdateInteractiveFrameRequest
  | GetContextListRequest
  | GetListRequest
  | GetRequest
  | CreateContextRequest
  | CreateDataItemsRequest
  | CreateCollectionsRequest
  | DeleteRequest
  | CreateTableRequest
  | CreateTextRequest
  | UpdateTextRequest
  | EvalExpressionRequest
  | GetFunctionNamesRequest;

export type CreateInteractiveFrameRequest = {
  action: CodapActions.Create;
  resource: CodapResource.Component;

  values: { URL: string; name: string; type: "game" };
};

export type UpdateInteractiveFrameRequest = {
  action: CodapActions.Update;
  resource: CodapResource.InteractiveFrame;

  // We are not allowed to set interactiveState
  values: Partial<Omit<InteractiveFrame, "interactiveState">>;
};

export type GetContextListRequest = {
  action: CodapActions.Get;
  resource: CodapResource.DataContextList;
};

export type GetRequest = {
  action: CodapActions.Get;
  resource: string;
};

export type GetListRequest = {
  action: CodapActions.Get;
  resource: CodapListResource;
};

export type CreateContextRequest = {
  action: CodapActions.Create;
  resource: CodapResource.DataContext;
  values: DataContext;
};

export type CreateCollectionsRequest = {
  action: CodapActions.Create;
  resource: string;
  values: Collection[];
};

export type CreateDataItemsRequest = {
  action: CodapActions.Create;
  resource: string;
  values: Record<string, unknown>[];
};

export type DeleteRequest = {
  action: CodapActions.Delete;
  resource: string;
};

export type CreateTableRequest = {
  action: CodapActions.Create;
  resource: CodapResource.Component;
  values: CaseTable;
};

export interface CreateTextRequest {
  action: CodapActions.Create;
  resource: CodapResource.Component;
  values: Text;
}

export interface UpdateTextRequest {
  action: CodapActions.Update;
  resource: string;
  values: Partial<Text>;
}

export interface EvalExpressionRequest {
  action: CodapActions.Get;
  resource: CodapResource.EvalExpression;
  values: {
    source: string;
    records: Record<string, unknown>[];
  };
}

export interface GetFunctionNamesRequest {
  action: CodapActions.Get;
  resource: CodapResource.FunctionNames;
}

export interface CodapResponse {
  success: boolean;
}

interface CreateContextResponse extends CodapResponse {
  values: CodapIdentifyingInfo;
}

interface ListResponse extends CodapResponse {
  values: CodapIdentifyingInfo[];
}

interface GetDataResponse extends CodapResponse {
  values: {
    values: Record<string, unknown>;
  }[];
}

export interface GetDataListResponse extends CodapResponse {
  values: CodapIdentifyingInfo[];
}

export interface GetCasesResponse extends CodapResponse {
  values: ReturnedCase[];
}

export interface GetCaseResponse extends CodapResponse {
  values: {
    case: ReturnedCase;
  };
}

export interface GetContextResponse extends CodapResponse {
  values: ReturnedDataContext;
}

interface TableResponse extends CodapResponse {
  values: CaseTable;
}

export interface GetFunctionNamesResponse extends CodapResponse {
  values: string[];
}

type EvalExpressionResponse =
  | {
      success: true;
      values: unknown[];
    }
  | {
      success: false;
      values: {
        error: string;
      };
    };

export type CodapPhone = {
  call(r: CreateInteractiveFrameRequest, cb: (r: CodapResponse) => void): void;
  call(r: UpdateInteractiveFrameRequest, cb: (r: CodapResponse) => void): void;
  call(r: GetContextListRequest, cb: (r: ListResponse) => void): void;
  call(r: GetListRequest, cb: (r: ListResponse) => void): void;
  call(r: GetRequest, cb: (r: GetDataResponse) => void): void;
  call(r: GetRequest, cb: (r: GetContextResponse) => void): void;
  call(r: GetRequest, cb: (r: GetDataListResponse) => void): void;
  call(r: GetRequest, cb: (r: GetCasesResponse) => void): void;
  call(r: GetRequest, cb: (r: GetCaseResponse) => void): void;
  call(r: CreateContextRequest, cb: (r: CreateContextResponse) => void): void;
  call(r: CreateDataItemsRequest, cb: (r: CodapResponse) => void): void;
  call(r: CreateCollectionsRequest, cb: (r: ListResponse) => void): void;
  call(r: DeleteRequest, cb: (r: CodapResponse) => void): void;
  call(r: CreateTableRequest, cb: (r: TableResponse) => void): void;
  call(r: CreateTextRequest, cb: (r: CodapResponse) => void): void;
  call(r: UpdateTextRequest, cb: (r: CodapResponse) => void): void;
  call(r: EvalExpressionRequest, cb: (r: EvalExpressionResponse) => void): void;
  call(
    r: GetFunctionNamesRequest,
    cb: (r: GetFunctionNamesResponse) => void
  ): void;
  call(r: CodapRequest[], cb: (r: CodapResponse[]) => void): void;
};

export enum CodapInitiatedResource {
  InteractiveState = "interactiveState",
  UndoChangeNotice = "undoChangeNotice",
  DocumentChangeNotice = "documentChangeNotice",
  DataContextChangeNotice = "dataContextChangeNotice",
}

// https://github.com/concord-consortium/codap/wiki/CODAP-Data-Interactive-Plugin-API#case-change-notifications
// https://github.com/concord-consortium/codap/wiki/CODAP-Data-Interactive-Plugin-API#example-collection-delete
export enum ContextChangeOperation {
  UpdateCases = "updateCases",
  CreateCases = "createCases",
  DeleteCases = "deleteCases",
  SelectCases = "selectCases",
  UpdateContext = "updateDataContext",

  // Triggered when sorting a column.
  MoveCases = "moveCases",

  // Despite the documentation, the first five of these are plural, while the
  // last is singular
  CreateAttribute = "createAttributes",
  UpdateAttribute = "updateAttributes",
  DeleteAttribute = "deleteAttributes",
  HideAttribute = "hideAttributes",
  UnhideAttribute = "unhideAttributes",
  MoveAttribute = "moveAttribute",

  // Not sure where this is documented, but it is triggered when a collection
  // is renamed, for example
  UpdateCollection = "updateCollection",

  CreateCollection = "createCollection",
  DeleteCollection = "deleteCollection",

  // Not sure where this is documented either, but it is triggered when
  // attribute dependencies change (e.g. when moving an attribute from one
  // collection to another).
  DependentCases = "dependentCases",
}

export const mutatingOperations = [
  ContextChangeOperation.UpdateCases,
  ContextChangeOperation.CreateCases,
  ContextChangeOperation.DeleteCases,
  ContextChangeOperation.MoveCases,
  ContextChangeOperation.CreateAttribute,
  ContextChangeOperation.UpdateAttribute,
  ContextChangeOperation.DeleteAttribute,
  ContextChangeOperation.MoveAttribute,
  ContextChangeOperation.UpdateCollection,
  ContextChangeOperation.CreateCollection,
  ContextChangeOperation.DeleteCollection,
  ContextChangeOperation.DependentCases,
  ContextChangeOperation.HideAttribute,
  ContextChangeOperation.UnhideAttribute,
];

export enum DocumentChangeOperations {
  DataContextCountChanged = "dataContextCountChanged",
  DataContextDeleted = "dataContextDeleted",
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
        operation: DocumentChangeOperations.DataContextCountChanged;
      };
    }
  | {
      action: CodapActions.Notify;
      resource: CodapInitiatedResource.DocumentChangeNotice;
      values: {
        operation: DocumentChangeOperations.DataContextDeleted;
        deletedContext: string;
      };
    }
  | {
      action: CodapActions.Notify;
      resource: CodapInitiatedResource.DataContextChangeNotice;
      values: {
        operation: ContextChangeOperation;
        result?: Record<string, unknown>;
      }[];
    };

// The `metadata` property of data contexts is undocumented but described here:
// https://codap.concord.org/forums/topic/accessing-dataset-description-through-plugin-api/
export interface ContextMetadata {
  description?: string;
  importDate?: string;
  source?: string;
}

// https://github.com/concord-consortium/codap/wiki/CODAP-Data-Interactive-Plugin-API#datacontexts
export interface DataContext {
  name: string;
  title?: string;
  description?: string;
  collections: Collection[];
  metadata?: ContextMetadata;
}

export interface ReturnedDataContext extends Omit<DataContext, "collections"> {
  collections: ReturnedCollection[];
}

// https://github.com/concord-consortium/codap/wiki/CODAP-Data-Interactive-Plugin-API#collections
export interface Collection {
  name: string;
  title?: string;
  description?: string;
  parent?: string;
  attrs?: CodapAttribute[];
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

export interface RawAttribute {
  name: string;
  title?: string;
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
}

export interface BaseAttribute extends RawAttribute {
  type?: null;
}

export interface CategoricalAttribute extends RawAttribute {
  type?: "categorical";
  colormap?: Record<string, string>;
}

export interface NumericAttribute extends RawAttribute {
  type?: "numeric";
  precision?: number;
  unit?: string | null;
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
  values: Record<string, unknown>;
}

export interface ReturnedCase extends Omit<Case, "parent"> {
  parent?: number | null;
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
  cannotClose?: boolean;
  dataContext: string;
  legendAttributeName: string;
  center: [number, number];
  zoom: number;
}

// https://github.com/concord-consortium/codap/wiki/CODAP-Data-Interactive-Plugin-API#the-slider-object
export interface Slider extends CodapComponent {
  type: CodapComponentType.Slider;
  cannotClose?: boolean;
  globalValueName: string;
  animationDirection: number;
  animationMode: number;
  lowerBound: number;
  upperBound: number;
}

// https://github.com/concord-consortium/codap/wiki/CODAP-Data-Interactive-Plugin-API#the-calculator-object
export interface Calculator extends CodapComponent {
  type: CodapComponentType.Calculator;
  cannotClose?: boolean;
}

// https://github.com/concord-consortium/codap/wiki/CODAP-Data-Interactive-Plugin-API#the-text-object
export interface Text extends CodapComponent {
  type: CodapComponentType.Text;
  cannotClose?: boolean;
  text: Record<string, unknown>;
}

// https://github.com/concord-consortium/codap/wiki/CODAP-Data-Interactive-Plugin-API#the-webview-object
export interface WebView extends CodapComponent {
  type: CodapComponentType.WebView;
  cannotClose?: boolean;
  URL: string;
}

// https://github.com/concord-consortium/codap/wiki/CODAP-Data-Interactive-Plugin-API#the-guide-object
export interface Guide extends CodapComponent {
  type: CodapComponentType.Guide;
  cannotClose?: boolean;
  isVisible: boolean;
  currentItemIndex: number;
  items: {
    itemTitle: string;
    url: string;
  }[];
}

// https://github.com/concord-consortium/codap/wiki/CODAP-Data-Interactive-Plugin-API#the-interactiveframe-object
type InteractiveFrame = {
  name: string;
  title: string;
  version: string;
  dimensions: {
    width: number;
    height: number;
  };
  preventBringToFront: boolean;
  preventDataContextReorg: boolean;
  externalUndoAvailable: boolean;
  standaloneUndoModeAvailable: boolean;
  cannotClose?: boolean;
  isResizable: {
    width: boolean;
    height: boolean;
  };
  savedState: Record<string, unknown>;
};

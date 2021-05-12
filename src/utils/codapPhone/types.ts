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

export type CodapRequest = {
  action: CodapActions;
  resource: string;
  values?: any;
};

export interface CodapResponse {
  success: boolean;
}

export interface CodapResponseValues extends CodapResponse {
  values?: any;
}

export interface CodapResponseItemIDs extends CodapResponse {
  itemIDs?: string[];
}

export type CodapPhone = {
  call<T extends CodapResponse>(r: CodapRequest, cb: (r: T) => any): void;
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

export type CodapInitiatedCommand = {
  action: CodapActions;
  resource: string;
  values?: any;
};

// https://github.com/concord-consortium/codap/wiki/CODAP-Data-Interactive-Plugin-API#datacontexts
export interface DataContext {
  name: string;
  title?: string;
  description?: string;
  collections?: Collection[];
}

// https://github.com/concord-consortium/codap/wiki/CODAP-Data-Interactive-Plugin-API#collections
export interface Collection {
  name: string;
  title?: string;
  description?: string;
  parent: string;
  attrs?: BaseAttribute[];
  labels: {
    singleCase?: string;
    pluralCase?: string;
    singleCaseWithArticle?: string;
    setOfCases?: string;
    setOfCasesWithArticle?: string;
  };
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

export interface CodapComponent {
  type: CodapComponentType;
  name: string;
  title?: string;
  dimensions: {
    width: number;
    height: number;
  };
  position: "top" | "bottom" | { left: number; top: number };
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
  cannotClose: boolean;
  dataContext: string;
  horizontalScrollOffset: number;
  isIndexHidden: boolean;
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

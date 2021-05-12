export enum CodapResource {
  DataContext = "dataContext",
  DataContextList = "dataContextList",
  Component = "component",
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

export type DataSetDescription = {
  name: string;
  id: number;
  title: string;
};

interface BaseAttribute {
  name: string;
  title?: string;
  colormap?: Record<string, string | undefined>;
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

export type CodapAttribute =
  | BaseAttribute
  | CategoricalAttribute
  | NumericAttribute;

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

export interface CaseTable extends CodapComponent {
  type: CodapComponentType.CaseTable;
  cannotClose: boolean;
  dataContext: string;
  horizontalScrollOffset: number;
  isIndexHidden: boolean;
}

export interface Map extends CodapComponent {
  type: CodapComponentType.Map;
  cannotClose: boolean;
  dataContext: string;
  legendAttributeName: string;
  center: [number, number];
  zoom: number;
}

export interface Slider extends CodapComponent {
  type: CodapComponentType.Slider;
  cannotClose: boolean;
  globalValueName: string;
  animationDirection: number;
  animationMode: number;
  lowerBound: number;
  upperBound: number;
}

export interface Calculator extends CodapComponent {
  type: CodapComponentType.Calculator;
  cannotClose: boolean;
}

export interface Text extends CodapComponent {
  type: CodapComponentType.Text;
  cannotClose: boolean;
  text: string;
}

export interface WebView extends CodapComponent {
  type: CodapComponentType.WebView;
  cannotClose: boolean;
  URL: string;
}

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

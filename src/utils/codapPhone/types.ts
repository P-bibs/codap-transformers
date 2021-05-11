export enum CodapComponent {
  Graph = "graph",
  Table = "caseTable",
  Map = "map",
}

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
}

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
}

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
  SelectCases = "selectCases"
}

export const mutatingOperations = [
  ContextChangeOperation.UpdateCases,
  ContextChangeOperation.CreateCases,
  ContextChangeOperation.DeleteCases
];

export type CodapInitiatedCommand = {
  action: CodapActions;
  resource: string;
  values?: any;
}

export type DataSetDescription = {
  name: string;
  id: number;
  title: string;
}

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

export type CodapAttribute = BaseAttribute | CategoricalAttribute | NumericAttribute;

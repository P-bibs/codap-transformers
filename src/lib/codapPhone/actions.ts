import {
  CodapActions,
  Collection,
  DeleteRequest,
  CreateCollectionsRequest,
  CreateDataItemsRequest,
} from "./types";
import {
  allCases,
  collectionFromContext,
  collectionOfContext,
  itemFromContext,
} from "./resource";

export function deleteAllCases(
  context: string,
  collection: string
): DeleteRequest {
  return {
    action: CodapActions.Delete,
    resource: allCases(context, collection),
  };
}

export function createCollections(
  context: string,
  collections: Collection[]
): CreateCollectionsRequest {
  return {
    action: CodapActions.Create,
    resource: collectionFromContext(context),
    values: collections,
  };
}

export function deleteCollection(
  context: string,
  collection: string
): DeleteRequest {
  return {
    action: CodapActions.Delete,
    resource: collectionOfContext(context, collection),
  };
}

export function insertDataItems(
  contextName: string,
  data: Record<string, unknown>[]
): CreateDataItemsRequest {
  return {
    action: CodapActions.Create,
    resource: itemFromContext(contextName),
    values: data,
  };
}

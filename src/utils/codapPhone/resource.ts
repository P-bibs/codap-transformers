export function resourceFromContext(context: string): string {
  return `dataContext[${context}]`;
}

export function resourceFromCollection(collection: string): string {
  return `collection[${collection}]`;
}

export function resourceFromComponent(component: string): string {
  return `component[${component}]`;
}

export function collectionListFromContext(context: string): string {
  return `dataContext[${context}].collectionList`;
}

export function attributeListFromCollection(
  context: string,
  collection: string
): string {
  return `dataContext[${context}].collection[${collection}].attributeList`;
}

export function itemFromContext(context: string): string {
  return `${resourceFromContext(context)}.item`;
}

export function collectionFromContext(context: string): string {
  return `${resourceFromContext(context)}.collection`;
}

export function collectionOfContext(
  context: string,
  collection: string
): string {
  return `${resourceFromContext(context)}.${resourceFromCollection(
    collection
  )}`;
}

// https://github.com/concord-consortium/codap/wiki/CODAP-Data-Interactive-Plugin-API#example-item-get-by-search
export function itemSearchAllFromContext(context: string): string {
  return `${resourceFromContext(context)}.itemSearch[*]`;
}

// This only works for delete
// https://github.com/concord-consortium/codap/wiki/CODAP-Data-Interactive-Plugin-API#cases
export function allCases(context: string, collection: string): string {
  return `dataContext[${context}].collection[${collection}].allCases`;
}

// Resource for getting all cases in a collection
export function allCasesWithSearch(
  context: string,
  collection: string
): string {
  const contextResource = resourceFromContext(context);
  const collectionResource = resourceFromCollection(collection);
  return `${contextResource}.${collectionResource}.caseFormulaSearch[true]`;
}

export function caseById(context: string, id: number): string {
  return `${resourceFromContext(context)}.caseByID[${id}]`;
}

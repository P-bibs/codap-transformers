import { DataSet } from "./types";
import { CodapAttribute, Collection } from "../utils/codapPhone/types";

/**
 * Groups a dataset by the indicated attributes, by removing them from
 * their current positions and putting them all together in a new
 * parent collection. CODAP handles the grouping of cases with the
 * same content for us.
 *
 * @param dataset the dataset to group
 * @param groupByAttrs the attributes to separate into a parent collection
 * @param newParentName the name of newly-created parent collection
 * @returns the grouped dataset
 */
export function groupBy(
  dataset: DataSet,
  attrNames: string[],
  newParentName: string
): DataSet {
  const groupedAttrs: CodapAttribute[] = [];
  const collections = dataset.collections.slice();

  // extract attributes from collections into a list
  for (const attrName of attrNames) {
    for (const coll of collections) {
      const attr = coll.attrs?.find((attr) => attr.name === attrName);

      if (attr !== undefined) {
        groupedAttrs.push(attr);
        coll.attrs?.splice(coll.attrs?.indexOf(attr), 1);
        break;
      }
    }
  }

  // remove any collections with no attributes after the group,
  // and reparent collections that referenced them.
  const nonEmptyColls = [];
  for (const coll of collections) {
    if (coll.attrs !== undefined && coll.attrs.length === 0) {
      reparent(collections, coll);
    } else {
      nonEmptyColls.push(coll);
    }
  }

  const collection: Collection = {
    name: newParentName,
    attrs: groupedAttrs,
    labels: {},
  };

  // XXX: WHY does putting the collection at the end put it at the front?
  nonEmptyColls.push(collection);

  return {
    collections: nonEmptyColls,
    records: dataset.records,
  };
}

/**
 * Reparents any collections that have the given parent, to the
 * parent's parent. This allows the parent to be eliminated.
 *
 * @param collections the collections to reparent
 * @param parent the parent collection being removed
 */
function reparent(collections: Collection[], parent: Collection) {
  for (const coll of collections) {
    if (coll.parent === parent.name) {
      coll.parent = parent.parent;
    }
  }
}

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
  let collections = dataset.collections.slice();

  // extract attributes from collections into a list
  attrLoop: for (const attrName of attrNames) {
    for (const coll of collections) {
      const attr = coll.attrs?.find((attr) => attr.name === attrName);

      if (attr !== undefined) {
        groupedAttrs.push(attr);
        coll.attrs?.splice(coll.attrs?.indexOf(attr), 1);
        continue attrLoop;
      }
    }

    // attribute was not found in any collection
    throw new Error(`bad attribute name: ${attrName}`);
  }

  // remove any collections with no attributes after the group,
  // and reparent collections that referenced them.
  collections = collections
    .map((coll) => {
      // make topmost parent collection child of the new parent
      if (coll.parent === undefined) {
        coll.parent = newParentName;
      }
      return coll;
    })
    .filter((coll) => {
      // remove any collections that now lack attributes
      const keep = coll.attrs === undefined || coll.attrs.length > 0;
      if (!keep) {
        reparent(collections, coll);
      }
      return keep;
    });

  const collection: Collection = {
    name: newParentName,
    attrs: groupedAttrs,
    labels: {},
  };

  return {
    collections: [collection].concat(collections),
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

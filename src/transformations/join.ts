import { CodapAttribute, Collection } from "../utils/codapPhone/types";
import { DataSet } from "./types";
import { uniqueName } from "../utils/names";
import { DDTransformationState } from "../transformation-components/DDTransformation";
import { getContextAndDataSet } from "../utils/codapPhone";
import { readableName } from "../transformation-components/util";

/**
 * Joins two datasets together, using the baseDataset as a starting point
 * and incorporating values from the joiningDataset for any cases whose
 * value for baseAttr matches the value for joiningAttr of a case in the
 * joiningDataset.
 */
export async function join({
  context1: inputDataContext1,
  context2: inputDataContext2,
  attribute1: inputAttribute1,
  attribute2: inputAttribute2,
}: DDTransformationState): Promise<[DataSet, string]> {
  if (
    !inputDataContext1 ||
    !inputDataContext2 ||
    !inputAttribute1 ||
    !inputAttribute2
  ) {
    throw new Error("Please choose two datasets and two attributes");
  }

  const { context: context1, dataset: dataset1 } = await getContextAndDataSet(
    inputDataContext1
  );
  const { context: context2, dataset: dataset2 } = await getContextAndDataSet(
    inputDataContext2
  );

  return [
    await uncheckedJoin(dataset1, inputAttribute1, dataset2, inputAttribute2),
    `Join of ${readableName(context1)} and ${readableName(context2)}`,
  ];
}

/**
 * Joins two datasets together, using the baseDataset as a starting point
 * and incorporating values from the joiningDataset for any cases whose
 * value for baseAttr matches the value for joiningAttr of a case in the
 * joiningDataset.
 *
 * @param baseDataset dataset to which cases from joiningDataset will be added
 * @param baseAttr attribute to join on from the baseDataset
 * @param joiningDataset dataset to take cases from and add to baseDataset
 * @param joiningAttr attribute to join on from joiningDataset
 */
export function uncheckedJoin(
  baseDataset: DataSet,
  baseAttr: string,
  joiningDataset: DataSet,
  joiningAttr: string
): DataSet {
  // find collection containing joining attribute in joining dataset
  const joiningCollection = findCollectionWithAttr(
    joiningDataset.collections,
    joiningAttr
  );
  if (
    joiningCollection === undefined ||
    joiningCollection.attrs === undefined
  ) {
    throw new Error(`Invalid joining attribute: ${joiningAttr}`);
  }

  const addedAttrs = joiningCollection.attrs.slice();
  const addedAttrOriginalNames = addedAttrs.map((attr) => attr.name);

  const collections = baseDataset.collections.slice();
  const baseCollection = findCollectionWithAttr(collections, baseAttr);
  if (baseCollection === undefined || baseCollection.attrs === undefined) {
    throw new Error(`Invalid base attribute: ${baseAttr}`);
  }

  // list of attributes whose names cannot be duplicated by the added attrs
  const namesToAvoid = baseDataset.collections
    .reduce((acc, coll) => acc.concat(coll.attrs || []), [] as CodapAttribute[])
    .map((attr) => attr.name);

  // ensure added attribute names are unique relative to attribute
  // names in base dataset (as well as all other added attributes)
  // NOTE: this renames the addedAttrs
  const attrToUnique: Record<string, string> = {};
  for (const attr of addedAttrs) {
    attrToUnique[attr.name] = uniqueName(attr.name, namesToAvoid);
    attr.name = attrToUnique[attr.name];
    namesToAvoid.push(attr.name);
  }

  // add the attrs from the joining collection into the collection being joined into
  baseCollection.attrs = baseCollection.attrs.concat(addedAttrs);

  // start with a copy of the base dataset's records
  const records = baseDataset.records.slice();

  // copy into the joined table the first matching record from
  // joiningDataset for each record from baseDataset.
  for (const record of records) {
    const matchingRecord = joiningDataset.records.find(
      (rec) => rec[joiningAttr] === record[baseAttr]
    );

    if (matchingRecord !== undefined) {
      // copy values for added attrs in matching record into current record
      for (const attrName of addedAttrOriginalNames) {
        const unique = attrToUnique[attrName];
        record[unique] = matchingRecord[attrName];
      }
    }
  }

  return {
    collections,
    records,
  };
}

/**
 * Finds a collection which contains an attribute of the given name,
 * or undefined if no such collection exists.
 */
function findCollectionWithAttr(
  collections: Collection[],
  attribute: string
): Collection | undefined {
  return collections.find((coll) =>
    coll.attrs?.find((attr) => attr.name === attribute)
  );
}

import { DataSet, MissingValueReport, TransformationOutput } from "./types";
import { uniqueName } from "../lib/utils/names";
import { TransformerTemplateState } from "../components/transformer-template/TransformerTemplate";
import { getContextAndDataSet } from "../lib/codapPhone";
import { addToMVR, isMissing, tryTitle } from "../transformers/util";
import {
  shallowCopy,
  cloneCollection,
  cloneAttribute,
  allAttrNames,
  eraseFormulas,
  validateAttribute,
} from "./util";
import { t } from "../strings";

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
}: TransformerTemplateState): Promise<TransformationOutput> {
  if (
    !inputDataContext1 ||
    !inputDataContext2 ||
    !inputAttribute1 ||
    !inputAttribute2
  ) {
    throw new Error(t("errors:join.noDataSetOrAttribute"));
  }

  const { context: context1, dataset: dataset1 } = await getContextAndDataSet(
    inputDataContext1
  );
  const { context: context2, dataset: dataset2 } = await getContextAndDataSet(
    inputDataContext2
  );

  const ctxtName1 = tryTitle(context1);
  const ctxtName2 = tryTitle(context2);

  const [joined, mvr] = uncheckedJoin(
    ctxtName1,
    dataset1,
    inputAttribute1,
    dataset2,
    inputAttribute2
  );

  mvr.extraInfo =
    `${mvr.missingValues.length} missing values were encountered in the base ` +
    `attribute. The copied attributes from the joining dataset were left missing ` +
    `for such rows with missing values.`;

  return [
    joined,
    `Join(${ctxtName1}, ${ctxtName2}, ...)`,
    `A copy of ${ctxtName1}, with all the attributes/values from the collection ` +
      `containing ${inputAttribute2} in ${ctxtName2} added into the collection ` +
      `containing ${inputAttribute1} in ${ctxtName1}.`,
    mvr,
  ];
}

/**
 * Joins two datasets together, using the baseDataset as a starting point
 * and incorporating values from the joiningDataset for any cases whose
 * value for baseAttr matches the value for joiningAttr of a case in the
 * joiningDataset.
 *
 * @param baseContextTitle Context title of base dataset
 * @param baseDataset dataset to which cases from joiningDataset will be added
 * @param baseAttr attribute to join on from the baseDataset
 * @param joiningDataset dataset to take cases from and add to baseDataset
 * @param joiningAttr attribute to join on from joiningDataset
 */
export function uncheckedJoin(
  baseContextTitle: string,
  baseDataset: DataSet,
  baseAttr: string,
  joiningDataset: DataSet,
  joiningAttr: string
): [DataSet, MissingValueReport] {
  // find collection containing joining attribute in joining dataset
  const [joiningCollection] = validateAttribute(
    joiningDataset.collections,
    joiningAttr,
    t("errors:join.invalidJoiningAttribute", { name: joiningAttr })
  );

  const addedAttrs = joiningCollection.attrs?.map(cloneAttribute) || [];
  const addedAttrOriginalNames = addedAttrs.map((attr) => attr.name);

  const collections = baseDataset.collections.map(cloneCollection);
  const [baseCollection] = validateAttribute(
    collections,
    baseAttr,
    t("errors:join.invalidBaseAttribute", { name: baseAttr })
  );

  // list of attributes whose names cannot be duplicated by the added attrs
  const namesToAvoid = allAttrNames(baseDataset);

  // ensure added attribute names are unique relative to attribute
  // names in base dataset (as well as all other added attributes)
  // NOTE: this renames the addedAttrs
  const attrToUnique: Record<string, string> = {};
  for (const attr of addedAttrs) {
    attrToUnique[attr.name] = uniqueName(attr.name, namesToAvoid);
    attr.name = attrToUnique[attr.name];
    namesToAvoid.push(attr.name);
  }

  // Erase formulas of attributes that are copied from the joining dataset,
  // since they might depend on an attribute in another collection (which is
  // not being copied) and would break.
  eraseFormulas(addedAttrs);

  // add the attrs from the joining collection into the collection being joined into
  baseCollection.attrs = (baseCollection.attrs || []).concat(addedAttrs);

  const mvr: MissingValueReport = {
    kind: "input",
    missingValues: [],
  };

  // start with a copy of the base dataset's records
  const records = baseDataset.records.map(shallowCopy);

  // copy into the joined table the first matching record from
  // joiningDataset for each record from baseDataset.
  for (const [i, record] of records.entries()) {
    let matchingRecord = joiningDataset.records.find(
      (rec) => rec[joiningAttr] === record[baseAttr]
    );

    if (isMissing(record[baseAttr])) {
      addToMVR(mvr, baseDataset, baseContextTitle, baseAttr, i);

      // Do not match missing values in the base attribute with missing values
      // in the joining attribute.
      matchingRecord = undefined;
    }

    for (const attrName of addedAttrOriginalNames) {
      const unique = attrToUnique[attrName];

      // Copy values for added attrs in matching record into current record.
      // Or, if there is no matching record, make these explicit missing values.
      record[unique] =
        matchingRecord !== undefined ? matchingRecord[attrName] : "";
    }
  }

  return [
    {
      collections,
      records,
    },
    mvr,
  ];
}

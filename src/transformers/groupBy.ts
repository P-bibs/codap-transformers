import { DataSet, TransformationOutput } from "./types";
import { CodapAttribute, Collection } from "../lib/codapPhone/types";
import { readableName } from "../transformers/util";
import { getContextAndDataSet } from "../lib/codapPhone";
import { TransformerTemplateState } from "../components/transformer-template/TransformerTemplate";
import {
  reparent,
  cloneCollection,
  shallowCopy,
  listAsString,
  pluralSuffix,
  allCollectionNames,
  allAttrNames,
  validateAttribute,
} from "./util";
import { uniqueName } from "../lib/utils/names";
import { t } from "../strings";

/**
 * Groups a dataset by the indicated attributes, by removing them from
 * their current positions and putting them all together in a new
 * parent collection. CODAP handles the grouping of cases with the
 * same content for us.
 */
export async function groupBy({
  context1: contextName,
  attributeSet1: attributes,
}: TransformerTemplateState): Promise<TransformationOutput> {
  if (contextName === null) {
    throw new Error(t("errors:validation.noDataSet"));
  }
  if (attributes.length === 0) {
    throw new Error(t("errors:groupBy.noAttribute"));
  }

  const { context, dataset } = await getContextAndDataSet(contextName);
  const attributeNames = listAsString(attributes);
  const parentName = uniqueName(
    `Grouped by ${attributeNames}`,
    allCollectionNames(dataset)
  );
  const ctxtName = readableName(context);
  const attrNames = attributes.map((name) => ({
    attrName: name,
    groupedName: `${name} Group`,
  }));

  return [
    await uncheckedGroupBy(dataset, attrNames, parentName),
    `GroupBy(${ctxtName}, ...)`,
    `A copy of ${ctxtName} with a new parent collection added ` +
      `which contains a copy of the ${pluralSuffix(
        "attribute",
        attributes
      )} ${attributeNames}.`,
  ];
}

/**
 * Groups a dataset by the indicated attributes, by removing them from
 * their current positions and putting them all together in a new
 * parent collection. CODAP handles the grouping of cases with the
 * same content for us.
 *
 * @param dataset the dataset to group
 * @param attrNames a list of attributes to separate into a parent collection
 * and names for the new copies of those attributes
 * @param newParentName the name of newly-created parent collection
 * @returns the grouped dataset
 */
export function uncheckedGroupBy(
  dataset: DataSet,
  attrNames: { attrName: string; groupedName: string }[],
  newParentName: string
): DataSet {
  for (const { attrName } of attrNames) {
    validateAttribute(dataset.collections, attrName);
  }

  const groupedAttrs: CodapAttribute[] = [];
  let collections = dataset.collections.map(cloneCollection);
  const allAttributes = allAttrNames(dataset);
  const attrToGroupedName: Record<string, string> = {};

  // extract attributes from collections into a list
  attrLoop: for (let { attrName, groupedName } of attrNames) {
    for (const coll of collections) {
      const attr = coll.attrs?.find((attr) => attr.name === attrName);

      // attribute was found in this collection
      if (attr !== undefined) {
        // Generate a unique name for this grouped copy of this attribute
        groupedName = uniqueName(groupedName, allAttributes);
        allAttributes.push(groupedName);
        attrToGroupedName[attrName] = groupedName;

        // copy and rename grouped attribute
        // NOTE: formulas cannot be safely copied into a parent collection.
        // This is because formulas might reference child attributes, which
        // causes an error in CODAP. Instead, we copy values of the formula
        // in the original attribute, and group by these values in the copied
        // attribute.
        groupedAttrs.push({
          ...attr,
          name: groupedName,
          formula: undefined, // do not copy formulas
          description: `All values of the ${attrName} attribute that appear in distinct tuples.`,
        });
        continue attrLoop;
      }
    }

    // attribute was not found in any collection
    throw new Error(
      t("errors:validation.invalidAttribute", { name: attrName })
    );
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
  };

  const records = dataset.records.map(shallowCopy);
  for (const record of records) {
    for (const { attrName } of attrNames) {
      // make copy of record data from original attr into grouped attr
      record[attrToGroupedName[attrName]] = record[attrName];
    }
  }

  return {
    collections: [collection].concat(collections),
    records,
  };
}

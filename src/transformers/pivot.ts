import { TransformerTemplateState } from "../components/transformer-template/TransformerTemplate";
import { readableName } from "../transformers/util";
import { getContextAndDataSet } from "../lib/codapPhone";
import { uniqueName } from "../lib/utils/names";
import { DataSet, TransformationOutput } from "./types";
import {
  eraseFormulas,
  codapValueToString,
  listAsString,
  pluralSuffix,
  plural,
  validateAttribute,
} from "./util";
import { t } from "../strings";

/**
 * Turns selected attribute names into values of a new attribute, reorganizing
 * the values under the original attributes into a new column, thus making the
 * dataset "longer" (more cases), but less wide (fewer attributes).
 */
export async function pivotLonger({
  context1: contextName,
  attributeSet1: attributes,
  textInput1: namesTo,
  textInput2: valuesTo,
}: TransformerTemplateState): Promise<TransformationOutput> {
  if (contextName === null) {
    throw new Error(t("errors:validation.noDataSet"));
  }
  if (attributes.length === 0) {
    throw new Error(t("errors:pivot.noAttribute"));
  }
  if (namesTo.trim() === "") {
    throw new Error(t("errors:pivot.noNameForNamesTo"));
  }
  if (valuesTo.trim() === "") {
    throw new Error(t("errors:pivot.noNameForValuesTo"));
  }

  const { context, dataset } = await getContextAndDataSet(contextName);
  const ctxtName = readableName(context);
  const attributeNames = listAsString(attributes);

  return [
    await uncheckedPivotLonger(dataset, attributes, namesTo, valuesTo),
    `PivotLonger(${ctxtName}, ...)`,
    `A copy of ${ctxtName} with the ${pluralSuffix(
      "attribute",
      attributes
    )} ${attributeNames} turned ` +
      `into ${plural(
        "a value",
        "values",
        attributes
      )} under a new attribute (${namesTo}), and the values previously ` +
      `under ${attributeNames} moved under a new attribute (${valuesTo}).`,
  ];
}

/**
 * Turns selected attribute names into values of a new attribute, reorganizing
 * the values under the original attributes into a new column, thus making the
 * dataset "longer" (more cases), but less wide (fewer attributes).
 *
 * @param dataset the dataset to pivot
 * @param toPivot list of attribute names that should become values
 * @param namesTo name of attribute under which toPivot names will go
 * @param valuesTo name of attribute under which *values* of the toPivot
 *  attributes will go
 * @returns pivoted dataset
 */
export function uncheckedPivotLonger(
  dataset: DataSet,
  toPivot: string[],
  namesTo: string,
  valuesTo: string
): DataSet {
  for (const attr of toPivot) {
    validateAttribute(dataset.collections, attr);
  }

  if (dataset.collections.length !== 1) {
    throw new Error(t("errors:pivot.pivotLongerOnlySingleCollection"));
  }
  if (namesTo === valuesTo) {
    throw new Error(t("errors:pivot.namesToValuesToSameName"));
  }

  // remove pivoting attributes
  const collection = { ...dataset.collections[0] };
  collection.attrs =
    collection.attrs?.filter((attr) => !toPivot.includes(attr.name)) || [];

  // NOTE: do not copy formulas: dependencies may be removed by the pivot
  eraseFormulas(collection.attrs);

  const toPivotNames = listAsString(toPivot);

  // Ensure names to / values to are unique relative to attributes
  // that will be included in pivoted table.
  const remainingAttrs = collection.attrs?.map((attr) => attr.name) || [];
  namesTo = uniqueName(namesTo, remainingAttrs);
  valuesTo = uniqueName(valuesTo, remainingAttrs);

  // add namesTo and valuesTo attributes
  // NOTE: valuesTo might hold values of different types
  // so we can't be sure it's either numeric / categorical
  collection.attrs.push(
    {
      name: namesTo,
      type: "categorical",
      description: `Contains the names of attributes (${toPivotNames}) that were pivoted into values.`,
    },
    {
      name: valuesTo,
      description: `Contains the values previously under the ${toPivotNames} attributes.`,
    }
  );

  const records = [];
  for (const record of dataset.records) {
    for (const toPivotAttr of toPivot) {
      // remove attributes being pivoted
      const shortRecord = removeFields({ ...record }, toPivot);

      // put pivoted attribute name under namesTo attribute,
      // value of record at toPivotAttr under valuesTo attribute
      shortRecord[namesTo] = toPivotAttr;
      shortRecord[valuesTo] = record[toPivotAttr];

      records.push(shortRecord);
    }
  }

  return {
    collections: [collection],
    records,
  };
}

/**
 * Extracts the values of the namesFrom attribute into new attributes,
 * with the values from the valuesFrom attribute as their values. The dataset
 * gets "wider" (more attributes), but less long (fewer cases).
 */
export async function pivotWider({
  context1: contextName,
  attribute1: namesFrom,
  attribute2: valuesFrom,
}: TransformerTemplateState): Promise<TransformationOutput> {
  if (contextName === null) {
    throw new Error(t("errors:validation.noDataSet"));
  }
  if (namesFrom === null) {
    throw new Error(t("errors:pivot.noNamesFrom"));
  }
  if (valuesFrom === null) {
    throw new Error(t("errors:pivot.noValuesFrom"));
  }

  const { context, dataset } = await getContextAndDataSet(contextName);
  const ctxtName = readableName(context);
  return [
    await uncheckedPivotWider(dataset, namesFrom, valuesFrom),
    `PivotWider(${ctxtName}, ...)`,
    `A copy of ${ctxtName} with the values in attribute ${namesFrom} converted ` +
      `into new attributes, which get their values from the attribute ${valuesFrom}.`,
  ];
}

/**
 * Extracts the values of the namesFrom attribute into new attributes,
 * with the values from the valuesFrom attribute as their values. The dataset
 * gets "wider" (more attributes), but less long (fewer cases).
 *
 * @param dataset the dataset to pivot
 * @param namesFrom name of attribute from which to extract new attribute names
 * @param valuesFrom name of attribute holding the values that will go
 *  under the new attribute names
 */
export function uncheckedPivotWider(
  dataset: DataSet,
  namesFrom: string,
  valuesFrom: string
): DataSet {
  validateAttribute(dataset.collections, namesFrom);
  validateAttribute(dataset.collections, valuesFrom);

  if (dataset.collections.length !== 1) {
    throw new Error(t("errors:pivot.pivotWiderOnlySingleCollection"));
  }

  const collection = { ...dataset.collections[0] };

  // get list of names to make attributes for
  const newAttrs = Array.from(
    new Set(
      dataset.records.map((rec, i) => {
        if (typeof rec[namesFrom] === "object") {
          throw new Error(
            t("errors:pivot.cannotUseAsAttributeName", {
              value: codapValueToString(rec[namesFrom]),
              attributeName: namesFrom,
              caseNumber: i + 1,
            })
          );
        }

        // NOTE: If rec[namesFrom] is undefined (missing), this returns ""
        return rec[namesFrom] === undefined ? "" : String(rec[namesFrom]);
      })
    )
  );

  // find attribute to take values from
  const [, valuesFromAttr] = validateAttribute(
    [collection],
    valuesFrom,
    t("errors:pivot.invalidAttributeForValuesFrom", { name: valuesFrom })
  );

  // remove namesFrom/valuesFrom attributes from collection
  collection.attrs =
    collection.attrs?.filter(
      (attr) => ![namesFrom, valuesFrom].includes(attr.name)
    ) || [];

  // NOTE: do not copy any formulas from attributes: formula
  // dependencies may have been removed by the pivot.
  eraseFormulas(collection.attrs);

  // create one new attribute per unique value from namesFrom column
  for (const attrName of newAttrs) {
    // NOTE: each new attribute inherits its properties from
    // the former valuesFrom attribute, because they are the
    // attributes which will now hold the same data.
    // However, do not copy formulas across all new attributes.
    collection.attrs.push({
      ...valuesFromAttr,
      formula: undefined,
      name: attrName,
      description: `Attribute created by pivoting the values of ${namesFrom} into separate attributes.`,
    });
  }

  const wideRecords = [];
  for (const record of dataset.records) {
    // find the collapsed record that is equivalent to this
    // original record in all fields except namesFrom / valuesFrom
    let collapsed: undefined | Record<string, unknown> = wideRecords.find(
      (wide) =>
        equivExcept(record, wide, newAttrs.concat([namesFrom, valuesFrom]))
    );

    // no collapsed record exists yet for this class of records, create one
    if (collapsed === undefined) {
      collapsed = removeFields({ ...record }, [namesFrom, valuesFrom]);
      wideRecords.push(collapsed);
    }

    if (collapsed[record[namesFrom] as string] !== undefined) {
      throw new Error(
        t("errors:pivot.multipleValuesForSameNamesFrom", {
          valuesFrom,
          value1: codapValueToString(collapsed[record[namesFrom] as string]),
          value2: codapValueToString(record[valuesFrom]),
          namesFrom,
          namesFromValue: codapValueToString(record[namesFrom]),
        })
      );
    }

    // update existing collapsed record under attribute record[namesFrom]
    collapsed[record[namesFrom] as string] = record[valuesFrom];
  }

  return {
    collections: [collection],
    records: wideRecords,
  };
}

/**
 * Determines if the two records are equivalent, ignoring the indicated fields.
 */
function equivExcept(
  recA: Record<string, unknown>,
  recB: Record<string, unknown>,
  except: string[]
): boolean {
  // NOTE: assumes the records have the same fields to begin with.
  // This should be true when comparing between records from same data context.
  for (const key of Object.keys(recA)) {
    if (except.includes(key)) {
      continue;
    }
    if (recA[key] !== recB[key]) {
      return false;
    }
  }

  return true;
}

/**
 * Removes the indicated fields from the given record.
 */
function removeFields(
  record: Record<string, unknown>,
  fields: string[]
): Record<string, unknown> {
  for (const field of fields) {
    delete record[field];
  }
  return record;
}

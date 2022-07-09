import { DataSet, MissingValueReport, TransformationOutput } from "./types";
import { uniqueName } from "../lib/utils/names";
import { TransformerTemplateState } from "../components/transformer-template/TransformerTemplate";
import { getContextAndDataSet } from "../lib/codapPhone";
import { addToMVR, isMissing, tryTitle } from "../transformers/util";
import { Collection } from "../lib/codapPhone/types";
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
 * Performs an inner join on two datasets: cases where baseAttr and joiningAttr
 * have the same values will be joined and included in the resulting dataset,
 * but cases where the values do not match will not be in the result. If there
 * are multiple matches, each will become its own case in the result.
 */
export async function innerJoin({
  context1: inputDataContext1,
  context2: inputDataContext2,
  attribute1: inputAttribute1,
  attribute2: inputAttribute2,
  name,
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

  const [joined, mvr] = uncheckedInnerJoin(
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

  name = name || "InnerJoin";

  return [
    joined,
    `${name}(${ctxtName1}, ${ctxtName2}, ...)`,
    `A copy of ${ctxtName1}, with all the attributes/values from the collection ` +
      `containing ${inputAttribute2} in ${ctxtName2} added into the collection ` +
      `containing ${inputAttribute1} in ${ctxtName1}.`,
    mvr,
  ];
}

/**
 * Performs an inner join on two datasets: cases where baseAttr and joiningAttr
 * have the same values will be joined and included in the resulting dataset,
 * but cases where the values do not match will not be in the result. If there
 * are multiple matches, each will become its own case in the result.
 *
 * @param baseContextTitle Context title of base dataset
 * @param baseDataset dataset to which cases from joiningDataset will be added
 * @param baseAttr attribute to join on from the baseDataset
 * @param joiningDataset dataset to take cases from and add to baseDataset
 * @param joiningAttr attribute to join on from joiningDataset
 */
export function uncheckedInnerJoin(
  baseContextTitle: string,
  baseDataset: DataSet,
  baseAttr: string,
  joiningDataset: DataSet,
  joiningAttr: string
): [DataSet, MissingValueReport] {
  // find collection containing joining attribute in joining dataset
  const [collections, addedAttrOriginalNames, attrToUnique] = joinAttributes(
    baseDataset,
    baseAttr,
    joiningDataset,
    joiningAttr
  );

  const records: Record<string, unknown>[] = [];

  const mvr: MissingValueReport = {
    kind: "input",
    missingValues: [],
  };

  // For each (base record, matching record) pair, add a new record into the
  // result dataset.
  baseDataset.records
    .flatMap((baseRecord, i) => {
      if (isMissing(baseRecord[baseAttr])) {
        addToMVR(mvr, baseDataset, baseContextTitle, baseAttr, i);

        // Do not match missing values in the base attribute with missing values
        // in the joining attribute.
        return [];
      }
      return joiningDataset.records
        .filter((r) => r[joiningAttr] === baseRecord[baseAttr])
        .map((matchingRecord) => [baseRecord, matchingRecord]);
    })
    .forEach(([record, matchingRecord]) => {
      const newRecord = shallowCopy(record);
      for (const attrName of addedAttrOriginalNames) {
        const unique = attrToUnique[attrName];
        newRecord[unique] = matchingRecord[attrName];
      }
      records.push(newRecord);
    });

  return [
    {
      collections,
      records,
    },
    mvr,
  ];
}

enum OuterJoinKinds {
  Left = "left",
  Full = "full",
}

/**
 * Performs two kinds of outer joins. The left outer join takes all cases from
 * the baseDataset, plus cases where joiningAttr in the joining dataset match
 * the baseAttr in the baseDataset. The full outer join takes all cases from
 * both datasets, matching up cases where the baseAttr and joiningAttr are the
 * same, and leaving other cases as is.
 */
export async function outerJoin({
  context1: inputDataContext1,
  context2: inputDataContext2,
  attribute1: inputAttribute1,
  attribute2: inputAttribute2,
  dropdown1: kind,
  name: transformerName,
}: TransformerTemplateState): Promise<TransformationOutput> {
  if (
    !inputDataContext1 ||
    !inputDataContext2 ||
    !inputAttribute1 ||
    !inputAttribute2
  ) {
    throw new Error("Please choose two datasets and two attributes");
  }

  if (!kind) {
    throw new Error(
      "Please choose which kind of outer join you would like to perform"
    );
  }

  const { context: context1, dataset: dataset1 } = await getContextAndDataSet(
    inputDataContext1
  );
  const { context: context2, dataset: dataset2 } = await getContextAndDataSet(
    inputDataContext2
  );

  const ctxtName1 = tryTitle(context1);
  const ctxtName2 = tryTitle(context2);

  transformerName = transformerName || "OuterJoin";
  const name = `${transformerName}(${ctxtName1}, ${ctxtName2}, ...)`;
  const description =
    `A copy of ${ctxtName1}, with all the attributes/values from the collection ` +
    `containing ${inputAttribute2} in ${ctxtName2} added into the collection ` +
    `containing ${inputAttribute1} in ${ctxtName1}.`;

  let joined;
  let mvr;

  // Safe cast since these are the only options in the dropdown
  switch (kind as OuterJoinKinds) {
    case OuterJoinKinds.Left:
      [joined, mvr] = uncheckedLeftJoin(
        ctxtName1,
        dataset1,
        inputAttribute1,
        dataset2,
        inputAttribute2
      );
      break;
    case OuterJoinKinds.Full:
      [joined, mvr] = uncheckedFullJoin(
        ctxtName1,
        dataset1,
        inputAttribute1,
        dataset2,
        inputAttribute2
      );
      break;
  }

  mvr.extraInfo =
    `${mvr.missingValues.length} missing values were encountered in the base ` +
    `attribute. The copied attributes from the joining dataset were left missing ` +
    `for such rows with missing values.`;

  return [joined, name, description, mvr];
}

export function uncheckedLeftJoin(
  baseContextTitle: string,
  baseDataset: DataSet,
  baseAttr: string,
  joiningDataset: DataSet,
  joiningAttr: string
): [DataSet, MissingValueReport] {
  const [collections, addedAttrOriginalNames, attrToUnique] = joinAttributes(
    baseDataset,
    baseAttr,
    joiningDataset,
    joiningAttr
  );

  const records: Record<string, unknown>[] = [];

  const mvr: MissingValueReport = {
    kind: "input",
    missingValues: [],
  };

  // For each (base record, matching record) pair, add a new record into the
  // result dataset.
  baseDataset.records
    .flatMap((baseRecord, i): [
      Record<string, unknown>,
      Record<string, unknown>?
    ][] => {
      if (isMissing(baseRecord[baseAttr])) {
        addToMVR(mvr, baseDataset, baseContextTitle, baseAttr, i);

        // Do not match missing values in the base attribute with missing values
        // in the joining attribute.
        return [[baseRecord, undefined]];
      }

      const matchingRecords = joiningDataset.records.filter(
        (r) => r[joiningAttr] === baseRecord[baseAttr]
      );

      if (matchingRecords.length === 0) {
        // If there are no matching records, just include the base record
        return [[baseRecord, undefined]];
      } else {
        return matchingRecords.map((matchingRecord) => [
          baseRecord,
          matchingRecord,
        ]);
      }
    })
    .forEach(([record, matchingRecord]) => {
      records.push(
        mergeRecords(
          record,
          matchingRecord,
          addedAttrOriginalNames,
          attrToUnique
        )
      );
    });

  return [
    {
      collections,
      records,
    },
    mvr,
  ];
}

export function uncheckedFullJoin(
  baseContextTitle: string,
  baseDataset: DataSet,
  baseAttr: string,
  joiningDataset: DataSet,
  joiningAttr: string
): [DataSet, MissingValueReport] {
  const [collections, addedAttrOriginalNames, attrToUnique] = joinAttributes(
    baseDataset,
    baseAttr,
    joiningDataset,
    joiningAttr
  );

  const records: Record<string, unknown>[] = [];

  const mvr: MissingValueReport = {
    kind: "input",
    missingValues: [],
  };

  // For each (base record, matching record) pair, add a new record into the
  // result dataset.
  baseDataset.records
    .flatMap((baseRecord, i): [
      Record<string, unknown>,
      Record<string, unknown>?
    ][] => {
      if (isMissing(baseRecord[baseAttr])) {
        addToMVR(mvr, baseDataset, baseContextTitle, baseAttr, i);

        // Do not match missing values in the base attribute with missing values
        // in the joining attribute.
        return [[baseRecord, undefined]];
      }

      const matchingRecords = joiningDataset.records.filter(
        (joiningRecord) => joiningRecord[joiningAttr] === baseRecord[baseAttr]
      );

      if (matchingRecords.length === 0) {
        return [[baseRecord, undefined]];
      } else {
        return matchingRecords.map((matchingRecord) => [
          baseRecord,
          matchingRecord,
        ]);
      }
    })
    .forEach(([record, matchingRecord]) => {
      records.push(
        mergeRecords(
          record,
          matchingRecord,
          addedAttrOriginalNames,
          attrToUnique
        )
      );
    });

  // Add all records in the joining dataset that does not match up with any
  // records in the base dataset
  joiningDataset.records
    .filter(
      (joiningRecord) =>
        baseDataset.records.find(
          (baseRecord) => baseRecord[baseAttr] === joiningRecord[joiningAttr]
        ) === undefined
    )
    .forEach((r) => {
      const newRecord: Record<string, unknown> = {};
      for (const attrName of addedAttrOriginalNames) {
        const unique = attrToUnique[attrName];
        newRecord[unique] = r[attrName];
      }
      for (const attrName of allAttrNames(baseDataset)) {
        newRecord[attrName] = "";
      }
      records.push(newRecord);
    });

  return [
    {
      collections,
      records,
    },
    mvr,
  ];
}

/**
 * Takes two datasets to join together and produces the collections of the
 * resulting dataset, the original names of the attributes to be added, and a
 * map from those original names to their counterparts in the resulting dataset.
 */
function joinAttributes(
  baseDataset: DataSet,
  baseAttr: string,
  joiningDataset: DataSet,
  joiningAttr: string
): [Collection[], string[], Record<string, string>] {
  // Find the collection in the joining dataset that contains joiningAttr
  const [joiningCollection] = validateAttribute(
    joiningDataset.collections,
    joiningAttr,
    t("errors:join.invalidJoiningAttribute", { name: joiningAttr })
  );

  const collections = baseDataset.collections.map(cloneCollection);

  // Find the collection in the base dataset that contains baseAttr
  const [baseCollection] = validateAttribute(
    collections,
    baseAttr,
    t("errors:join.invalidBaseAttribute", { name: baseAttr })
  );

  const addedAttrs = joiningCollection.attrs?.map(cloneAttribute) || [];
  const addedAttrOriginalNames = addedAttrs.map((attr) => attr.name);

  // Erase formulas of attributes that are copied from the joining dataset,
  // since they might depend on an attribute in another collection (which is
  // not being copied) and would break.
  eraseFormulas(addedAttrs);

  const namesToAvoid = allAttrNames(baseDataset);

  // A lookup table from attribute names in the joining dataset to their
  // counterparts in the result dataset. Ensures added attribute names are
  // unique relative to attribute names in base dataset (as well as all other
  // added attributes)
  const attrToUnique: Record<string, string> = {};
  for (const attr of addedAttrs) {
    attrToUnique[attr.name] = uniqueName(attr.name, namesToAvoid);
    attr.name = attrToUnique[attr.name];
    namesToAvoid.push(attr.name);
  }

  // add the attrs from the joining collection into the collection being joined into
  baseCollection.attrs = (baseCollection.attrs || []).concat(addedAttrs);

  return [collections, addedAttrOriginalNames, attrToUnique];
}

function mergeRecords(
  baseRecord: Record<string, unknown>,
  joiningRecord: Record<string, unknown> | undefined,
  originalAttrs: string[],
  attrToUnique: Record<string, string>
) {
  const newRecord = shallowCopy(baseRecord);
  for (const attrName of originalAttrs) {
    const unique = attrToUnique[attrName];
    newRecord[unique] =
      joiningRecord !== undefined ? joiningRecord[attrName] : "";
  }
  return newRecord;
}

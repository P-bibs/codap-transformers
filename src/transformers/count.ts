import { DataSet, MissingValueReport, TransformationOutput } from "./types";
import { CodapAttribute, Collection } from "../lib/codapPhone/types";
import {
  listAsString,
  eraseFormulas,
  shallowCopy,
  pluralSuffix,
  validateAttribute,
  isMissing,
  addToMVR,
} from "./util";
import { uniqueName } from "../lib/utils/names";
import { TransformerTemplateState } from "../components/transformer-template/TransformerTemplate";
import { getContextAndDataSet } from "../lib/codapPhone";
import { tryTitle } from "../transformers/util";
import { t } from "../strings";

/**
 * Count consumes a dataset and list of attribute names and produces a new
 * dataset that presents a summary of the frequency of all tuples of values
 * from those attributes that are present in the input.
 *
 * The output dataset has one collection containing all the counted attributes
 * (with their distinct tuples), as well as a `count` attribute, which lists
 * the frequency of a given tuple.
 */
export async function count({
  context1: contextName,
  attributeSet1: attributes,
}: TransformerTemplateState): Promise<TransformationOutput> {
  if (contextName === null) {
    throw new Error(t("errors:validation.noDataSet"));
  }
  if (attributes.length === 0) {
    throw new Error(t("errors:count.noAttribute"));
  }

  const { context, dataset } = await getContextAndDataSet(contextName);
  const contextTitle = tryTitle(context);
  const attributeNames = listAsString(attributes);

  const [counted, mvr] = uncheckedCount(contextTitle, dataset, attributes);

  mvr.extraInfo = `${mvr.missingValues.length} missing values were encountered in the counted attributes.`;

  return [
    counted,
    `Count(${contextTitle}, ...)`,
    `A summary of the frequency of all tuples of the ${pluralSuffix(
      "attribute",
      attributes
    )} ${attributeNames} that appear in ${contextTitle}.`,
    mvr,
  ];
}

export function uncheckedCount(
  contextTitle: string,
  dataset: DataSet,
  attributes: string[]
): [DataSet, MissingValueReport] {
  // validate attribute names
  for (const attrName of attributes) {
    validateAttribute(dataset.collections, attrName);
  }

  let countedAttrs: CodapAttribute[] = [];
  for (const coll of dataset.collections) {
    countedAttrs = countedAttrs.concat(
      coll.attrs
        ?.filter((attr) => attributes.includes(attr.name))
        .map(shallowCopy) || []
    );
  }
  eraseFormulas(countedAttrs);

  // generate a unique attribute name for the `count` column
  const countAttrName = uniqueName(
    "Count",
    countedAttrs.map((attr) => attr.name)
  );

  const attributeNames = attributes.join(", ");
  // single collection with copy of counted attributes, plus
  // a new "count" attribute for the frequencies
  const collections: Collection[] = [
    {
      name: `Count (${attributeNames})`,
      attrs: [
        ...countedAttrs,
        {
          name: countAttrName,
          description: `The frequency of each tuple of (${attributeNames})`,
        },
      ],
    },
  ];

  const mvr: MissingValueReport = {
    kind: "input",
    missingValues: [],
  };

  // make copy of records containing only the attributes to count
  const tuples = dataset.records.map((record, i) => {
    const copy: Record<string, unknown> = {};
    for (const attrName of attributes) {
      if (isMissing(record[attrName])) {
        addToMVR(mvr, dataset, contextTitle, attrName, i);
      }

      copy[attrName] = record[attrName];
    }
    return copy;
  });

  // map from stringified tuples to the tuple itself and its frequency
  const tupleToCount: Record<string, Record<string, unknown>> = {};

  // count frequency of tuples in dataset
  tuples.forEach((tuple) => {
    const key = JSON.stringify(tuple);

    if (tupleToCount[key] === undefined) {
      const withCount = { ...tuple };
      withCount[countAttrName] = 1;
      tupleToCount[key] = withCount;
    } else {
      // the count field is guaranteed to exist because
      // we initialized it with a count of 1
      // eslint-disable-next-line
      (tupleToCount[key] as any)[countAttrName]++;
    }
  });

  // the distinct, counted tuples become the records of the new dataset
  const records = Object.values(tupleToCount);

  return [
    {
      collections,
      records,
    },
    mvr,
  ];
}

import { DataSet } from "./types";
import { dataItemToEnv } from "./util";
import { evaluate } from "../language";
import { CodapAttribute, Collection } from "../utils/codapPhone/types";

const DIFF_COLUMN_NAME = "Diff Status";
const GREEN = "rgb(0,255,0)";

/**
 * Filter produces a dataset with certain records excluded
 * depending on a given predicate.
 */
export function diff(
  dataset1: DataSet,
  dataset2: DataSet,
  attributeName1: string,
  attributeName2: string
): DataSet {
  let attributeData1;
  for (const collection of dataset1.collections) {
    attributeData1 =
      collection.attrs?.find(
        (attribute) => attribute.name === attributeName1
      ) ?? attributeData1;
  }
  if (!attributeData1) {
    throw new Error(
      "Couldn't find first selected attribute in selected context"
    );
  }
  let attributeData2;
  for (const collection of dataset2.collections) {
    attributeData2 =
      collection.attrs?.find(
        (attribute) => attribute.name === attributeName2
      ) ?? attributeData2;
  }
  if (!attributeData2) {
    throw new Error(
      "Couldn't find second selected attribute in selected context"
    );
  }

  const collections: Collection[] = [
    {
      name: `Diff of ${attributeName1} and ${attributeName2}`,
      labels: {},
      attrs: [
        attributeData1,
        attributeData2,
        {
          name: DIFF_COLUMN_NAME,
          description: "",
          editable: true,
          hidden: false,
          type: "categorical",
        },
      ],
    },
  ];

  const values1 = dataset1.records.map((record) => record[attributeName1]);
  const values2 = dataset2.records.map((record) => record[attributeName2]);

  const length = Math.max(values1.length, values2.length);

  const records = [];
  for (let i = 0; i < length; i++) {
    records.push({
      [attributeName1]: values1[i],
      [attributeName2]: values2[i],
      [DIFF_COLUMN_NAME]: "rgb(100,100,100)",
    });
  }

  console.group("OUTPUT");
  console.log(collections);
  console.log(records);
  console.groupEnd();
  return {
    collections,
    records,
  };
}

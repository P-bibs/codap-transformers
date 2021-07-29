import {
  DataSet,
  MissingValueReport,
  MISSING_VALUE_SCARE_SYMBOL,
} from "../../transformers/types";
import { createTableWithDataSet, createText } from "../../lib/codapPhone";

/**
 * This function takes a dataset as well as a `doUpdate` flag and either
 * creates a new table for the dataset or updates an existing one accordingly.
 *
 * @returns The name of the newly created context.
 */
export async function applyNewDataSet(
  dataSet: DataSet,
  name: string | undefined,
  description: string | undefined
): Promise<string> {
  // if doUpdate is true then we should update a previously created table
  // rather than creating a new one
  const [newContext] = await createTableWithDataSet(dataSet, name, description);
  return newContext.name;
}

/**
 * Converts a location identifying a missing value into a string.
 *
 * @param loc The location to convert
 * @returns A string describing the location
 */
// function missingValueLocToString(loc: MissingValueLocation): string {
//   return `${loc.itemIndex}, "${loc.attribute}", "${loc.collection}"`;
// }

/**
 * Creates a CODAP element that displays the given missing value report
 * with a given name (ensured unique).
 *
 * @param mvr The missing value report to display
 * @param outputName Name of component produced by this transformer.
 * @returns [contextName, textName], where contextName is the name of the
 * context created for storing missing value info, and textName is the name
 * of the report textbox.
 */
export async function createMVRDisplay(
  mvr: MissingValueReport,
  outputName: string
): Promise<[string, string]> {
  // Construct a dataset containing the missing value info
  let missingValuesDataset: DataSet;

  if (mvr.kind === "input") {
    missingValuesDataset = {
      collections: [
        {
          name: "Missing Values",
          attrs: [
            {
              name: "Row Number",
              description:
                "Indicates which rows, in a flattened version of the input dataset, " +
                "contain this missing value.",
            },
            {
              name: "Attribute",
            },
            {
              name: "Collection",
            },
            {
              name: "Dataset",
            },
          ],
        },
      ],
      records: mvr.missingValues.map(
        ({ itemIndex, attribute, collection, context }) => ({
          "Row Number": itemIndex,
          Attribute: attribute,
          Collection: collection,
          Dataset: context,
        })
      ),
    };
  } else {
    missingValuesDataset = {
      collections: [
        {
          name: "Missing Values",
          attrs: [
            {
              name: "Row Number",
              description:
                "Indicates the rows, in a flattened version of the input dataset, " +
                "for which the formula evaluated to a missing value.",
            },
          ],
        },
      ],
      records: mvr.missingValues.map((row) => ({
        "Row Number": row,
      })),
    };
  }

  const [context] = await createTableWithDataSet(
    missingValuesDataset,
    `Missing Values (${outputName})`
  );

  // const locs = mvr.missingValues
  // .map((loc) => missingValueLocToString(loc))
  // .join("\n");

  const reportContent = `${MISSING_VALUE_SCARE_SYMBOL}\n${mvr.extraInfo || ""}`;
  // [
  //   mvr.extraInfo ? `${mvr.extraInfo}\n` : "",
  //   "Missing Values:",
  //   "Item, Attribute, Collection",
  //   locs,
  // ]
  //   .filter((s) => s !== "")
  //   .join("\n");

  const textName = await createText(
    `Missing Value Report for ${outputName}`,
    reportContent,
    1,
    300,
    150
  );

  // Return names of generated components
  return [context.name, textName];
}

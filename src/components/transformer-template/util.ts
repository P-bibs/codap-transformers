import { DataSet, MissingValueReport } from "../../transformers/types";
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
  const missingValuesDataset: DataSet = {
    collections: [
      {
        name: "Missing Values",
        attrs: [
          {
            name: "Item Number",
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
        "Item Number": itemIndex,
        Attribute: attribute,
        Collection: collection,
        Dataset: context,
      })
    ),
  };

  const [context] = await createTableWithDataSet(
    missingValuesDataset,
    `Missing Values (${outputName})`
  );

  // const locs = mvr.missingValues
  // .map((loc) => missingValueLocToString(loc))
  // .join("\n");

  const reportContent = mvr.extraInfo || "";
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
    reportContent
  );

  // Return names of generated components
  return [context.name, textName];
}

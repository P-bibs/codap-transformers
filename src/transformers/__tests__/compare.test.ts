import {
  uncheckedCategoricalCompare,
  uncheckedNumericCompare,
} from "../compare";
import { DataSet } from "../types";
import {
  cloneDataSet,
  DATASET_A,
  DATASET_WITH_MISSING,
  EMPTY_DATASET,
  EMPTY_RECORDS,
  makeCollection,
  TYPES_DATASET,
} from "./data";

/**
 * A wrapper around uncheckedNumericCompare which discards the missing value
 * report and just returns the output dataset.
 */
function uncheckedNumericCompareWrapper(
  contextTitle: string,
  dataset: DataSet,
  attributeName1: string,
  attributeName2: string
): DataSet {
  const [output] = uncheckedNumericCompare(
    contextTitle,
    dataset,
    attributeName1,
    attributeName2
  );
  return output;
}

/**
 * A wrapper around uncheckedCategoricalCompare which discards the missing value
 * report and just returns the output.
 */
function uncheckedCategoricalCompareWrapper(
  contextTitle: string,
  dataset: DataSet,
  attributeName1: string,
  attributeName2: string
): DataSet {
  const [output] = uncheckedCategoricalCompare(
    contextTitle,
    dataset,
    attributeName1,
    attributeName2
  );
  return output;
}

describe("numeric compare", () => {
  it("errors on bad first attribute", () => {
    expect(() =>
      uncheckedNumericCompareWrapper(
        "Dataset A",
        DATASET_A,
        "BadAttributeName",
        "EvenBadderAttributeName"
      )
    ).toThrow("first");
  });

  it("errors on bad second attribute", () => {
    expect(() =>
      uncheckedNumericCompareWrapper(
        "Dataset A",
        DATASET_A,
        "A",
        "EvenBadderAttributeName"
      )
    ).toThrow("second");
  });

  it("errors on first attribute if dataset has no attributes", () => {
    expect(() =>
      uncheckedNumericCompareWrapper("Empty Dataset", EMPTY_DATASET, "A", "B")
    ).toThrow("first");
  });

  it("creates empty output when provided empty input", () => {
    const withCompareAttributes = cloneDataSet(EMPTY_RECORDS);
    withCompareAttributes.collections[0].attrs.push({
      description: "",
      editable: true,
      hidden: false,
      name: "Difference",
      type: "numeric",
    });
    withCompareAttributes.collections[0].attrs.push({
      description: "",
      editable: true,
      hidden: false,
      name: "Compare Status",
      type: "categorical",
    });
    expect(
      uncheckedNumericCompareWrapper("Empty Records", EMPTY_RECORDS, "A", "B")
    ).toEqual(withCompareAttributes);
  });

  describe("rejects invalid types", () => {
    test("boundaries", () => {
      expect(() =>
        uncheckedNumericCompareWrapper(
          "Types Dataset",
          TYPES_DATASET,
          "Number",
          "Boundary"
        )
      ).toThrow("instead got a boundary");
    });
    test("booleans", () => {
      expect(() =>
        uncheckedNumericCompareWrapper(
          "Types Dataset",
          TYPES_DATASET,
          "Number",
          "Boolean"
        )
      ).toThrow("instead got true");
    });
    test("strings", () => {
      expect(() =>
        uncheckedNumericCompareWrapper(
          "Types Dataset",
          TYPES_DATASET,
          "Number",
          "String"
        )
      ).toThrow('instead got "abc"');
    });
  });

  describe("accepts valid types", () => {
    test("numeric", () => {
      const output = cloneDataSet(TYPES_DATASET);
      output.collections[0].attrs.push({
        description: "",
        editable: true,
        hidden: false,
        name: "Difference",
        type: "numeric",
      });
      output.collections[0].attrs.push({
        description: "",
        editable: true,
        hidden: false,
        name: "Compare Status",
        type: "categorical",
      });
      output.records.forEach((record) => {
        record["Difference"] = 0;
        record["Compare Status"] = "rgb(230,230,230)";
      });

      expect(
        uncheckedNumericCompareWrapper(
          "Types Dataset",
          TYPES_DATASET,
          "Number",
          "Number"
        )
      ).toEqual(output);
    });

    test("numeric strings", () => {
      const output = cloneDataSet(TYPES_DATASET);
      output.collections[0].attrs.push({
        description: "",
        editable: true,
        hidden: false,
        name: "Difference",
        type: "numeric",
      });
      output.collections[0].attrs.push({
        description: "",
        editable: true,
        hidden: false,
        name: "Compare Status",
        type: "categorical",
      });
      output.records.forEach((record) => {
        record["Difference"] =
          parseFloat(record["NumericString"]) - record["Number"];
        record["Compare Status"] = undefined;
      });
      const result = cloneDataSet(
        uncheckedNumericCompareWrapper(
          "Types Dataset",
          TYPES_DATASET,
          "Number",
          "NumericString"
        )
      );
      // Don't bother comparing the rbg values
      result.records.forEach((record) => {
        record["Compare Status"] = undefined;
      });

      expect(result).toEqual(output);
    });

    test("missing", () => {
      const output = cloneDataSet(TYPES_DATASET);
      output.collections[0].attrs.push({
        description: "",
        editable: true,
        hidden: false,
        name: "Difference",
        type: "numeric",
      });
      output.collections[0].attrs.push({
        description: "",
        editable: true,
        hidden: false,
        name: "Compare Status",
        type: "categorical",
      });
      output.records.forEach((record) => {
        record["Difference"] = "";
        record["Compare Status"] = "";
      });

      expect(
        uncheckedNumericCompareWrapper(
          "Types Dataset",
          TYPES_DATASET,
          "Number",
          "Missing"
        )
      ).toEqual(output);
    });
  });

  test("fails if second attribute is non-numeric even if first attribute is missing value", () => {
    expect(() =>
      uncheckedNumericCompareWrapper(
        "Types Dataset",
        TYPES_DATASET,
        "Missing",
        "String"
      )
    ).toThrow("Expected number");
  });
});

describe("categorical compare", () => {
  it("errors on bad first attribute", () => {
    expect(() =>
      uncheckedCategoricalCompareWrapper(
        "Dataset A",
        DATASET_A,
        "BadAttributeName",
        "EvenBadderAttributeName"
      )
    ).toThrow("first");
  });

  it("errors on bad second attribute", () => {
    expect(() =>
      uncheckedCategoricalCompareWrapper(
        "Dataset A",
        DATASET_A,
        "A",
        "EvenBadderAttributeName"
      )
    ).toThrow("second");
  });

  it("errors on first attribute if dataset has no attributes", () => {
    expect(() =>
      uncheckedCategoricalCompareWrapper(
        "Empty Dataset",
        EMPTY_DATASET,
        "A",
        "B"
      )
    ).toThrow("first");
  });

  it("includes missing values in output group", () => {
    const output = {
      collections: [
        {
          name: "Comparison",
          attrs: [
            {
              name: "A Category",
              description:
                "All values of the A attribute that appear in distinct tuples.",
              formula: undefined,
            },
            {
              name: "B Category",
              description:
                "All values of the B attribute that appear in distinct tuples.",
              formula: undefined,
            },
          ],
        },
        makeCollection("Collection", ["A", "B", "C"], "Comparison"),
      ],
      records: DATASET_WITH_MISSING.records,
    };
    // Add new records from comparison
    output.records.forEach((record) => {
      record["A Category"] = record["A"];
      record["B Category"] = record["B"];
    });

    expect(
      uncheckedCategoricalCompareWrapper(
        "Dataset with Missing",
        DATASET_WITH_MISSING,
        "A",
        "B"
      )
    ).toEqual(output);
  });

  it("works properly on multi-collection input", () => {
    const output = {
      collections: [
        {
          name: "Comparison",
          attrs: [
            {
              name: "A Category",
              description:
                "All values of the A attribute that appear in distinct tuples.",
              formula: undefined,
            },
            {
              name: "B Category",
              description:
                "All values of the B attribute that appear in distinct tuples.",
              formula: undefined,
            },
          ],
        },
        makeCollection("parent + child", ["A", "B", "C"], "Comparison"),
      ],
      records: DATASET_A.records,
    };
    // Add new records from comparison
    output.records.forEach((record) => {
      record["A Category"] = record["A"];
      record["B Category"] = record["B"];
    });

    expect(
      uncheckedCategoricalCompareWrapper("Dataset A", DATASET_A, "A", "B")
    ).toEqual(output);
  });
});

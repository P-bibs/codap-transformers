import {
  uncheckedCategoricalCompare,
  uncheckedNumericCompare,
} from "../compare";
import {
  cloneDataSet,
  DATASET_A,
  DATASET_WITH_MISSING,
  EMPTY_DATASET,
  EMPTY_RECORDS,
  makeCollection,
  TYPES_DATASET,
} from "./data";

describe("numeric compare", () => {
  it("errors on bad first attribute", () => {
    expect(() =>
      uncheckedNumericCompare(
        DATASET_A,
        "BadAttributeName",
        "EvenBadderAttributeName"
      )
    ).toThrow("first");
  });

  // TODO: update this when attribute check changes are merged
  it("errors on bad second attribute", () => {
    expect(() =>
      uncheckedNumericCompare(DATASET_A, "A", "EvenBadderAttributeName")
    ).toThrow("second");
  });

  it("errors on first attribute if dataset has no attributes", () => {
    expect(() => uncheckedNumericCompare(EMPTY_DATASET, "A", "B")).toThrow(
      "first"
    );
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
    expect(uncheckedNumericCompare(EMPTY_RECORDS, "A", "B")).toEqual(
      withCompareAttributes
    );
  });

  describe("rejects invalid types", () => {
    test("boundaries", () => {
      expect(() =>
        uncheckedNumericCompare(TYPES_DATASET, "Number", "Boundary")
      ).toThrow("instead got a boundary");
    });
    test("booleans", () => {
      expect(() =>
        uncheckedNumericCompare(TYPES_DATASET, "Number", "Boolean")
      ).toThrow("instead got true");
    });
    test("strings", () => {
      expect(() =>
        uncheckedNumericCompare(TYPES_DATASET, "Number", "String")
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
        uncheckedNumericCompare(TYPES_DATASET, "Number", "Number")
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
      let result = cloneDataSet(
        uncheckedNumericCompare(TYPES_DATASET, "Number", "NumericString")
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
        uncheckedNumericCompare(TYPES_DATASET, "Number", "Missing")
      ).toEqual(output);
    });
  });

  test("fails if second attribute is non-numeric even if first attribute is missing value", () => {
    expect(() =>
      uncheckedNumericCompare(TYPES_DATASET, "Missing", "String")
    ).toThrow("Expected number");
  });
});

describe("categorical compare", () => {
  it("errors on bad first attribute", () => {
    expect(() =>
      uncheckedCategoricalCompare(
        DATASET_A,
        "BadAttributeName",
        "EvenBadderAttributeName"
      )
    ).toThrow("first");
  });

  // TODO: update this when attribute check changes are merged
  it("errors on bad second attribute", () => {
    expect(() =>
      uncheckedCategoricalCompare(DATASET_A, "A", "EvenBadderAttributeName")
    ).toThrow("second");
  });

  it("errors on first attribute if dataset has no attributes", () => {
    expect(() => uncheckedCategoricalCompare(EMPTY_DATASET, "A", "B")).toThrow(
      "first"
    );
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

    expect(uncheckedCategoricalCompare(DATASET_WITH_MISSING, "A", "B")).toEqual(
      output
    );
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

    expect(uncheckedCategoricalCompare(DATASET_A, "A", "B")).toEqual(output);
  });
});

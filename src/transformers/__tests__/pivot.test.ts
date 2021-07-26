import { uncheckedPivotLonger, uncheckedPivotWider } from "../pivot";
import {
  CENSUS_DATASET,
  cloneDataSet,
  DATASET_A,
  EMPTY_RECORDS,
  GRADES_DATASET_LONGER,
  GRADES_DATASET_WIDER,
  TYPES_DATASET,
} from "./data";

describe("pivot wider", () => {
  it("errors on dataset with more than 1 collection", () => {
    expect(() => uncheckedPivotWider(DATASET_A, "A", "B")).toThrow(
      "single-collection"
    );
  });
  it("errors on bad namesFrom attribute", () => {
    expect(() =>
      uncheckedPivotWider(DATASET_A, "AttributeThatDoesNotExist", "A")
    ).toThrow("AttributeThatDoesNotExist");
  });
  it("errors on bad valuesFrom attribute", () => {
    expect(() =>
      uncheckedPivotWider(DATASET_A, "A", "AttributeThatDoesNotExist")
    ).toThrow("AttributeThatDoesNotExist");
  });
  it("errors on empty dataset", () => {
    const EMPTY_RECORDS_SINGLE_COLLECTION = cloneDataSet(EMPTY_RECORDS);
    EMPTY_RECORDS_SINGLE_COLLECTION.collections = [
      EMPTY_RECORDS_SINGLE_COLLECTION.collections[0],
    ];
    const output = {
      collections: [
        {
          attrs: [{ formula: undefined, name: "C" }],
          name: "Collection A",
          parent: undefined,
        },
      ],
      records: [],
    };
    expect(
      uncheckedPivotWider(EMPTY_RECORDS_SINGLE_COLLECTION, "A", "B")
    ).toEqual(output);
  });

  it("errors on non-displayable value in  namesFrom attribute", () => {
    expect(() =>
      uncheckedPivotWider(TYPES_DATASET, "Boundary", "Number")
    ).toThrow("Cannot use a boundary");
  });
  it("allows non-displayable value in  valuesFrom attribute", () => {
    expect(() =>
      uncheckedPivotWider(TYPES_DATASET, "Number", "Boundary")
    ).not.toThrow();
  });

  it("errors with multiple values for same name", () => {
    const CENSUS_DATASET_SINGLE_COLLECTION = cloneDataSet(CENSUS_DATASET);
    CENSUS_DATASET_SINGLE_COLLECTION.collections = [
      CENSUS_DATASET_SINGLE_COLLECTION.collections[1],
    ];
    expect(() =>
      uncheckedPivotWider(CENSUS_DATASET_SINGLE_COLLECTION, "Sex", "Age")
    ).toThrow("Case has multiple Age values");
  });

  it("works with multiple namesFrom values", () => {
    const output = cloneDataSet(GRADES_DATASET_WIDER);
    output.collections[0].attrs?.forEach((attr) => (attr.formula = undefined));
    output.collections[0].attrs[1].description =
      "Attribute created by pivoting the values of Assessment into separate attributes.";
    output.collections[0].attrs[2].description =
      "Attribute created by pivoting the values of Assessment into separate attributes.";
    output.collections[0].attrs[3].description =
      "Attribute created by pivoting the values of Assessment into separate attributes.";

    expect(
      uncheckedPivotWider(GRADES_DATASET_LONGER, "Assessment", "Grades")
    ).toEqual(output);
  });
});

describe("pivot longer", () => {
  it("errors on dataset with more than 1 collection", () => {
    expect(() => uncheckedPivotLonger(DATASET_A, [], "A", "B")).toThrow(
      "single-collection"
    );
  });
  it("errors on duplicate namesTo and valuesTo values", () => {
    const DATASET_A_SINGLE_COLLECTION = cloneDataSet(DATASET_A);
    DATASET_A_SINGLE_COLLECTION.collections = [
      DATASET_A_SINGLE_COLLECTION.collections[0],
    ];
    expect(() =>
      uncheckedPivotLonger(DATASET_A_SINGLE_COLLECTION, [], "A", "A")
    ).toThrow("choose distinct names");
  });

  it("works with multiple pivot values", () => {
    const output = cloneDataSet(GRADES_DATASET_LONGER);
    output.collections[0].attrs[1].description =
      "Contains the names of attributes (quiz1, quiz2 and test1) that were pivoted into values.";
    output.collections[0].attrs[1].type = "categorical";
    output.collections[0].attrs[2].description =
      "Contains the values previously under the quiz1, quiz2 and test1 attributes.";

    expect(
      uncheckedPivotLonger(
        GRADES_DATASET_WIDER,
        ["quiz1", "quiz2", "test1"],
        "Assessment",
        "Grades"
      )
    ).toEqual(output);
  });
});

describe("pairing pivot longer and pivot wider results in identity transform", () => {
  test("pivot wider then pivot longer", () => {
    const output = cloneDataSet(GRADES_DATASET_LONGER);
    output.collections[0].attrs[1].description =
      "Contains the names of attributes (quiz1, quiz2 and test1) that were pivoted into values.";
    output.collections[0].attrs[1].type = "categorical";
    output.collections[0].attrs[2].description =
      "Contains the values previously under the quiz1, quiz2 and test1 attributes.";

    expect(
      uncheckedPivotLonger(
        uncheckedPivotWider(GRADES_DATASET_LONGER, "Assessment", "Grades"),
        ["quiz1", "quiz2", "test1"],
        "Assessment",
        "Grades"
      )
    ).toEqual(output);
  });

  test("pivot longer then pivot wider", () => {
    const output = cloneDataSet(GRADES_DATASET_WIDER);
    output.collections[0].attrs[1].description =
      "Attribute created by pivoting the values of Assessment into separate attributes.";
    output.collections[0].attrs[2].description =
      "Attribute created by pivoting the values of Assessment into separate attributes.";
    output.collections[0].attrs[3].description =
      "Attribute created by pivoting the values of Assessment into separate attributes.";

    expect(
      uncheckedPivotWider(
        uncheckedPivotLonger(
          GRADES_DATASET_WIDER,
          ["quiz1", "quiz2", "test1"],
          "Assessment",
          "Grades"
        ),
        "Assessment",
        "Grades"
      )
    ).toEqual(output);
  });
});

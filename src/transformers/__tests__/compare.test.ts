import { uncheckedNumericCompare } from "../compare";
import { DATASET_A } from "./data";

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
  it("errors on bad second attribute", () => {
    expect(() =>
      uncheckedNumericCompare(DATASET_A, "A", "EvenBadderAttributeName")
    ).toThrow("second");
  });
});

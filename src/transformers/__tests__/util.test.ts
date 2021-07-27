import { findTypeErrors } from "../util";

describe("findTypeErrorsNumber", () => {
  it("allows empty list", () => {
    expect(findTypeErrors([], "number")).toStrictEqual(null);
  });
  it("allows numeric strings", () => {
    expect(
      findTypeErrors(["1.0", "1", "0", "0.1", " 1 "], "number")
    ).toStrictEqual(null);
  });
  it("allows numbers", () => {
    expect(findTypeErrors([1, 0, 0.1 + 0.2, 0.5, NaN], "number")).toStrictEqual(
      null
    );
  });
  it("errors on numeric strings with extra whitespace or characters", () => {
    expect(findTypeErrors([""], "number")).toStrictEqual(0);
  });
  it("errors on non-numeric strings", () => {
    expect(findTypeErrors(["a", "b", "c"], "number")).toStrictEqual(0);
    expect(findTypeErrors(["1", "b", "c"], "number")).toStrictEqual(1);
    expect(findTypeErrors(["1", "2", "c"], "number")).toStrictEqual(2);
  });
});

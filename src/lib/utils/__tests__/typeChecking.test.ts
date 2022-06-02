import { inferType, inferTypeSingle } from "../typeChecking";

test("infer basic number type", () => {
  expect(inferTypeSingle(30)).toBe("Number");
});

test("infer string number type", () => {
  expect(inferTypeSingle("30")).toBe("Number");
  expect(inferTypeSingle("0.1")).toBe("Number");
});

test("infer basic boolean type", () => {
  expect(inferTypeSingle(true)).toBe("Boolean");
  expect(inferTypeSingle(false)).toBe("Boolean");
});

test("infer string boolean type", () => {
  expect(inferTypeSingle("true")).toBe("Boolean");
  expect(inferTypeSingle("false")).toBe("Boolean");
});

test("infer string that starts with number", () => {
  expect(inferTypeSingle("10hello")).toBe("String");
});

test("infer singleton array with number", () => {
  expect(inferType([30])).toBe("Number");
  expect(inferType(["30"])).toBe("Number");
});

test("infer multiple numbers", () => {
  expect(inferType([10, 20, 30, 0.1])).toBe("Number");
  expect(inferType([10, 20, "0.1", 50])).toBe("Number");
  expect(inferType(["20", "35.2", 20])).toBe("Number");
  expect(inferType(["10", "20", "3.5", "50", "100"])).toBe("Number");
  expect(inferType(["10", "20"])).toBe("Number");
});

test("infer mixed numbers and strings", () => {
  expect(inferType(["10", "Not a number"])).toBe("String");

  // This is not a string since the first few elements are actually numbers
  expect(inferType([20, 50, 40, "10startswithnumber"])).toBe("Any");
});

import { uncheckedBuildColumn } from "../buildColumn";
import { DATASET_A } from "./data";

// TODO: how to test because buildColumn evaluates expressions

test("throws error when non-existent collection given", () => {
  expect.assertions(1);
  return uncheckedBuildColumn(
    DATASET_A,
    "New Col",
    "not here",
    "C + 1",
    "number"
  ).catch((e) => expect(e.message).toMatch(/Invalid collection/));
});

test("throws error when new attribute collides with existing", () => {
  expect.assertions(1);
  return uncheckedBuildColumn(DATASET_A, "A", "child", "C + 1", "number").catch(
    (e) => expect(e.message).toMatch(/name already in use/)
  );
});

import { uncheckedGroupBy } from "../groupBy";
import {
  makeCollection,
  DATASET_B,
  EMPTY_RECORDS,
  FULLY_FEATURED_DATASET,
  DATASET_WITH_META,
} from "./data";

describe("groupBy", () => {
  test("groupBy of dataset with no records", () => {
    const groupedCollection = {
      name: "Parent",
      attrs: [
        {
          name: "Grouped D",
          description:
            "All values of the D attribute that appear in distinct tuples.",

          // Formula gets overwritten
          formula: undefined,
        },
      ],
    };
    expect(
      uncheckedGroupBy(
        EMPTY_RECORDS,
        [{ attrName: "D", groupedName: "Grouped D" }],
        "Parent"
      )
    ).toEqual({
      collections: [
        groupedCollection,
        makeCollection("Collection A", ["A", "B", "C"], "Parent"),
        makeCollection("Collection B", ["D"], "Collection A"),
        makeCollection("Collection C", ["E", "F"], "Collection B"),
      ],
      records: [],
    });
  });

  test("groupBy erases formula", () => {
    const attrA = {
      name: "A",
      formula: "B + 1",
    };
    const attrB = { name: "B" };
    expect(
      uncheckedGroupBy(
        {
          collections: [{ name: "Cases", attrs: [attrA, attrB] }],
          records: [
            {
              A: 2,
              B: 1,
            },
            {
              A: 5,
              B: 4,
            },
          ],
        },
        [
          { attrName: "A", groupedName: "A Group" },
          { attrName: "B", groupedName: "B Group" },
        ],
        "grouped"
      )
    ).toEqual({
      collections: [
        {
          name: "grouped",
          attrs: [
            {
              name: "A Group",
              description:
                "All values of the A attribute that appear in distinct tuples.",
              formula: undefined,
            },
            {
              name: "B Group",
              description:
                "All values of the B attribute that appear in distinct tuples.",
              formula: undefined,
            },
          ],
        },
        {
          name: "Cases",
          attrs: [attrA, attrB],
          parent: "grouped",
        },
      ],
      records: [
        { "A Group": 2, "B Group": 1, A: 2, B: 1 },
        { "A Group": 5, "B Group": 4, A: 5, B: 4 },
      ],
    });
  });

  test("Grouping by boundary", () => {
    expect(
      uncheckedGroupBy(
        FULLY_FEATURED_DATASET,
        [{ attrName: "Attribute_3", groupedName: "Attribute_3 Group" }],
        "Parent"
      )
    ).toEqual({
      collections: [
        {
          name: "Parent",
          attrs: [
            {
              name: "Attribute_3 Group",
              description:
                "All values of the Attribute_3 attribute that appear in distinct tuples.",
              formula: undefined,
            },
          ],
        },
        {
          ...FULLY_FEATURED_DATASET.collections[0],
          parent: "Parent",
        },
        ...FULLY_FEATURED_DATASET.collections.slice(1),
      ],
      records: FULLY_FEATURED_DATASET.records.map((r) => ({
        ...r,
        "Attribute_3 Group": r["Attribute_3"],
      })),
    });
  });

  test("Grouping by nonexistant attribute throws error", () => {
    expect(() =>
      uncheckedGroupBy(
        DATASET_B,
        [{ attrName: "NOT_EXIST", groupedName: "Grouped" }],
        "Grouped"
      )
    ).toThrow(/Invalid attribute name/);
  });

  test("Grouping by multiple attributes, one invalid throws error", () => {
    expect(() =>
      uncheckedGroupBy(
        DATASET_B,
        [
          { attrName: "Name", groupedName: "Name Group" },
          { attrName: "NOT_EXIST", groupedName: "Grouped" },
        ],
        "Grouped"
      )
    ).toThrow(/Invalid attribute name/);
  });

  test("Groupby does not erase metadata besides description and formula", () => {
    expect(
      uncheckedGroupBy(
        DATASET_WITH_META,
        [{ attrName: "A", groupedName: "A Group" }],
        "Grouped Collection Name"
      )
    ).toEqual({
      collections: [
        {
          name: "Grouped Collection Name",
          attrs: [
            {
              name: "A Group",
              title: "A Attribute",
              description:
                "All values of the A attribute that appear in distinct tuples.",
              formula: undefined,
              type: "numeric",
              editable: true,
              hidden: false,
              precision: 2,
              unit: "ft",
            },
          ],
        },
        {
          ...DATASET_WITH_META.collections[0],
          parent: "Grouped Collection Name",
        },
      ],
      records: [],
    });
  });
});

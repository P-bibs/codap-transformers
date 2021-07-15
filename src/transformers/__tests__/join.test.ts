import { uncheckedJoin } from "../join";
import { DATASET_A, DATASET_B, makeCollection, makeRecords } from "./data";

test("join with all cases from both datasets matched", () => {
  const joining = {
    collections: [makeCollection("cases", ["Name", "State"])],
    records: makeRecords(
      ["Name", "State"],
      [
        ["Joseph", "Washington"],
        ["Eve", "Arizona"],
        ["Paula", "Arizona"],
        ["Jon", "Massachusetts"],
        ["Nick", "California"],
        ["Sheila", "North Carolina"],
      ]
    ),
  };

  expect(uncheckedJoin(DATASET_B, "Name", joining, "Name")).toEqual({
    collections: [
      makeCollection("cases", [
        "Name",
        "Birth_Year",
        "Current_Year",
        "Grade",
        "Name {1}",
        "State",
      ]),
    ],
    records: makeRecords(
      ["Name", "Birth_Year", "Current_Year", "Grade", "Name {1}", "State"],
      [
        ["Jon", 1990, 2021, 88, "Jon", "Massachusetts"],
        ["Sheila", 1995, 2021, 91, "Sheila", "North Carolina"],
        ["Joseph", 2001, 2021, 100, "Joseph", "Washington"],
        ["Eve", 2000, 2021, 93, "Eve", "Arizona"],
        ["Nick", 1998, 2021, 95, "Nick", "California"],
        ["Paula", 1988, 2021, 81, "Paula", "Arizona"],
      ]
    ),
  });
});

test("join with some cases from base dataset unmatched", () => {
  const joining = {
    collections: [makeCollection("cases", ["Name", "State"])],
    records: makeRecords(
      ["Name", "State"],
      [
        // Only some names have corresponding cases here
        ["Joseph", "Washington"],
        ["Eve", "Arizona"],
        ["Sheila", "North Carolina"],
      ]
    ),
  };

  expect(uncheckedJoin(DATASET_B, "Name", joining, "Name")).toEqual({
    collections: [
      makeCollection("cases", [
        "Name",
        "Birth_Year",
        "Current_Year",
        "Grade",
        "Name {1}",
        "State",
      ]),
    ],
    records: makeRecords(
      ["Name", "Birth_Year", "Current_Year", "Grade", "Name {1}", "State"],
      [
        ["Jon", 1990, 2021, 88, "", ""],
        ["Sheila", 1995, 2021, 91, "Sheila", "North Carolina"],
        ["Joseph", 2001, 2021, 100, "Joseph", "Washington"],
        ["Eve", 2000, 2021, 93, "Eve", "Arizona"],
        ["Nick", 1998, 2021, 95, "", ""],
        ["Paula", 1988, 2021, 81, "", ""],
      ]
    ),
  });
});

test("join with some cases from joining dataset unmatched", () => {
  const joining = {
    collections: [makeCollection("cases", ["Name", "State"])],
    records: makeRecords(
      ["Name", "State"],
      [
        ["Joseph", "Washington"],
        ["Eve", "Arizona"],
        ["Paula", "Arizona"],
        ["Jon", "Massachusetts"],
        ["Extra Name 1", "Rhode Island"],
        ["Nick", "California"],
        ["Sheila", "North Carolina"],
        ["Extra Name 2", "Oklahoma"],
        ["Extra Name 3", "Vermont"],
      ]
    ),
  };

  expect(uncheckedJoin(DATASET_B, "Name", joining, "Name")).toEqual({
    collections: [
      makeCollection("cases", [
        "Name",
        "Birth_Year",
        "Current_Year",
        "Grade",
        "Name {1}",
        "State",
      ]),
    ],
    records: makeRecords(
      ["Name", "Birth_Year", "Current_Year", "Grade", "Name {1}", "State"],
      [
        // Extra Names 1, 2, and 3 do not appear here because they
        // have no corresponding cases in the base dataset.
        ["Jon", 1990, 2021, 88, "Jon", "Massachusetts"],
        ["Sheila", 1995, 2021, 91, "Sheila", "North Carolina"],
        ["Joseph", 2001, 2021, 100, "Joseph", "Washington"],
        ["Eve", 2000, 2021, 93, "Eve", "Arizona"],
        ["Nick", 1998, 2021, 95, "Nick", "California"],
        ["Paula", 1988, 2021, 81, "Paula", "Arizona"],
      ]
    ),
  });
});

test("*first* matching case in joining dataset is copied", () => {
  const joining = {
    collections: [makeCollection("cases", ["B", "Extra_Attribute"])],
    records: makeRecords(
      ["B", "Extra_Attribute"],
      [
        [true, "Extra 1"], // first true case
        [true, "Extra 2"],
        [false, "Extra 3"], // first false case
        [true, "Extra 4"],
        [false, "Extra 5"],
        [false, "Extra 6"],
        [true, "Extra 7"],
      ]
    ),
  };

  expect(uncheckedJoin(DATASET_A, "B", joining, "B")).toEqual({
    collections: [
      makeCollection("parent", ["A"]),
      makeCollection("child", ["B", "C", "B {1}", "Extra_Attribute"], "parent"),
    ],
    records: makeRecords(
      ["A", "B", "C", "B {1}", "Extra_Attribute"],
      [
        [3, true, 2000, true, "Extra 1"],
        [8, true, 2003, true, "Extra 1"],
        [10, false, 1998, false, "Extra 3"],
        [4, true, 2010, true, "Extra 1"],
        [10, false, 2014, false, "Extra 3"],
      ]
    ),
  });
});

test("attributes from joining attr's collection are copied into collection of base attr", () => {
  const base = {
    collections: [
      makeCollection("C1", ["A"]),
      makeCollection("C2", ["B"], "C1"),
      makeCollection("C3", ["C"], "C2"),
      makeCollection("C4", ["D"], "C3"),
    ],
    records: makeRecords(["A", "B", "C", "D"], [[1, 2, 3, 4]]),
  };
  const joining = {
    collections: [
      makeCollection("C1", ["A"]),
      makeCollection("C2", ["B"], "C1"),
      makeCollection("C3", ["C"], "C2"),
    ],
    records: makeRecords(["A", "B", "C"], [[1, 2, 3]]),
  };

  expect(uncheckedJoin(base, "C", joining, "C").collections).toEqual([
    makeCollection("C1", ["A"]),
    makeCollection("C2", ["B"], "C1"),
    // This is the only collection where an attribute is added, and
    // only C from joining is added.
    makeCollection("C3", ["C", "C {1}"], "C2"),
    makeCollection("C4", ["D"], "C3"),
  ]);
});

// - join dataset with itself
// - base and joining attrs don't have to be same name
// - cases with no matching cases in the joining ds have missing values
// - copies attributes from collection of joining attribute to collection of base attribute
// - empty dataset?

// - errors on invalid base attribute
// - errors on invalid joining attribute
// - ensures unique names!

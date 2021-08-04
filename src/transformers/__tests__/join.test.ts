import {
  uncheckedInnerJoin,
  uncheckedLeftJoin,
  uncheckedFullJoin,
} from "../join";
import {
  CENSUS_DATASET,
  DATASET_A,
  DATASET_B,
  DATASET_WITH_META,
  EMPTY_DATASET,
  EMPTY_RECORDS,
  makeCollection,
  makeRecords,
  TYPES_DATASET,
} from "./data";
import { CodapAttribute } from "../../utils/codapPhone/types";
import { DataSet } from "../types";

function makeJoinWrapper(joinFunc: typeof uncheckedInnerJoin) {
  return (
    baseContextTitle: string,
    baseDataset: DataSet,
    baseAttr: string,
    joiningDataset: DataSet,
    joiningAttr: string
  ) => {
    const [output] = joinFunc(
      baseContextTitle,
      baseDataset,
      baseAttr,
      joiningDataset,
      joiningAttr
    );
    return output;
  };
}

const uncheckedJoinWrapper = makeJoinWrapper(uncheckedInnerJoin);
const uncheckedLeftJoinWrapper = makeJoinWrapper(uncheckedLeftJoin);
const uncheckedFullJoinWrapper = makeJoinWrapper(uncheckedFullJoin);

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

  const expected = {
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
  };

  expect(
    uncheckedJoinWrapper("Dataset B", DATASET_B, "Name", joining, "Name")
  ).toEqual(expected);
  expect(
    uncheckedLeftJoinWrapper("Dataset B", DATASET_B, "Name", joining, "Name")
  ).toEqual(expected);
  expect(
    uncheckedFullJoinWrapper("Dataset B", DATASET_B, "Name", joining, "Name")
  ).toEqual(expected);
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

  expect(
    uncheckedJoinWrapper("Dataset B", DATASET_B, "Name", joining, "Name")
  ).toEqual({
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
        ["Sheila", 1995, 2021, 91, "Sheila", "North Carolina"],
        ["Joseph", 2001, 2021, 100, "Joseph", "Washington"],
        ["Eve", 2000, 2021, 93, "Eve", "Arizona"],
      ]
    ),
  });
});

test("left/full join with some cases from base dataset unmatched", () => {
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

  const expected = {
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
  };

  expect(
    uncheckedLeftJoinWrapper("Dataset B", DATASET_B, "Name", joining, "Name")
  ).toEqual(expected);
  expect(
    uncheckedFullJoinWrapper("Dataset B", DATASET_B, "Name", joining, "Name")
  ).toEqual(expected);
});

test("join/left join with some cases from joining dataset unmatched", () => {
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

  const expected = {
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
  };

  expect(
    uncheckedJoinWrapper("Dataset B", DATASET_B, "Name", joining, "Name")
  ).toEqual(expected);
  expect(
    uncheckedLeftJoinWrapper("Dataset B", DATASET_B, "Name", joining, "Name")
  ).toEqual(expected);
});

test("full join with some cases from joining dataset unmatched", () => {
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

  expect(
    uncheckedFullJoinWrapper("Dataset B", DATASET_B, "Name", joining, "Name")
  ).toEqual({
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
        ["", "", "", "", "Extra Name 1", "Rhode Island"],
        ["", "", "", "", "Extra Name 2", "Oklahoma"],
        ["", "", "", "", "Extra Name 3", "Vermont"],
      ]
    ),
  });
});

test("join on larger dataset", () => {
  const joining = {
    collections: [makeCollection("cases", ["State", "Population"])],
    records: makeRecords(
      ["State", "Population"],
      [
        ["Massachusetts", 6.893],
        ["North Carolina", 10.49],
        ["South Carolina", 5.149],
        ["Arizona", 7.279],
        ["Florida", 21.48],
        ["Virginia", 8.536],
        ["California", 39.51],
        ["Idaho", 1.787],
        ["Texas", 29],
      ]
    ),
  };

  const expected = {
    collections: [
      {
        ...CENSUS_DATASET.collections[0],
        attrs: [
          ...(CENSUS_DATASET.collections[0].attrs || []),
          {
            name: "State {1}",
          },
          {
            name: "Population",
          },
        ],
      },
      { ...CENSUS_DATASET.collections[1] },
    ],
    records: makeRecords(
      ["State", "sample", "Sex", "Age", "Year", "State {1}", "Population"],
      [
        ["Arizona", 1, "Male", 71, 2017, "Arizona", 7.279],
        ["Arizona", 1, "Male", 11, 2017, "Arizona", 7.279],
        ["Florida", 1, "Female", 16, 2017, "Florida", 21.48],
        ["Florida", 1, "Male", 5, 2017, "Florida", 21.48],
        ["Florida", 1, "Female", 52, 2017, "Florida", 21.48],
        ["California", 1, "Male", 18, 2017, "California", 39.51],
        ["California", 1, "Male", 72, 2017, "California", 39.51],
        ["California", 1, "Female", 22, 2017, "California", 39.51],
        ["California", 1, "Female", 48, 2017, "California", 39.51],
        ["Texas", 1, "Female", 18, 2017, "Texas", 29],
        ["Texas", 1, "Female", 47, 2017, "Texas", 29],
        ["Texas", 1, "Female", 20, 2017, "Texas", 29],
        ["Texas", 1, "Female", 4, 2017, "Texas", 29],
        ["Texas", 1, "Male", 30, 2017, "Texas", 29],
        ["Texas", 1, "Male", 63, 2017, "Texas", 29],
        ["South Carolina", 1, "Female", 27, 2017, "South Carolina", 5.149],
        ["South Carolina", 1, "Female", 38, 2017, "South Carolina", 5.149],
        ["Idaho", 1, "Male", 67, 2017, "Idaho", 1.787],
        ["Idaho", 1, "Female", 47, 2017, "Idaho", 1.787],
        ["Massachusetts", 1, "Female", 64, 2017, "Massachusetts", 6.893],
        ["Massachusetts", 1, "Male", 33, 2017, "Massachusetts", 6.893],
        ["Massachusetts", 1, "Female", 83, 2017, "Massachusetts", 6.893],
      ]
    ),
  };

  expect(
    uncheckedJoinWrapper(
      "Census Dataset",
      CENSUS_DATASET,
      "State",
      joining,
      "State"
    )
  ).toEqual(expected);
  expect(
    uncheckedLeftJoinWrapper(
      "Census Dataset",
      CENSUS_DATASET,
      "State",
      joining,
      "State"
    )
  ).toEqual(expected);
});

test("full join on larger dataset", () => {
  const joining = {
    collections: [makeCollection("cases", ["State", "Population"])],
    records: makeRecords(
      ["State", "Population"],
      [
        ["Massachusetts", 6.893],
        ["North Carolina", 10.49],
        ["South Carolina", 5.149],
        ["Arizona", 7.279],
        ["Florida", 21.48],
        ["Virginia", 8.536],
        ["California", 39.51],
        ["Idaho", 1.787],
        ["Texas", 29],
      ]
    ),
  };

  expect(
    uncheckedFullJoinWrapper(
      "Census Dataset",
      CENSUS_DATASET,
      "State",
      joining,
      "State"
    )
  ).toEqual({
    collections: [
      {
        ...CENSUS_DATASET.collections[0],
        attrs: [
          ...(CENSUS_DATASET.collections[0].attrs || []),
          {
            name: "State {1}",
          },
          {
            name: "Population",
          },
        ],
      },
      { ...CENSUS_DATASET.collections[1] },
    ],
    records: makeRecords(
      ["State", "sample", "Sex", "Age", "Year", "State {1}", "Population"],
      [
        ["Arizona", 1, "Male", 71, 2017, "Arizona", 7.279],
        ["Arizona", 1, "Male", 11, 2017, "Arizona", 7.279],
        ["Florida", 1, "Female", 16, 2017, "Florida", 21.48],
        ["Florida", 1, "Male", 5, 2017, "Florida", 21.48],
        ["Florida", 1, "Female", 52, 2017, "Florida", 21.48],
        ["California", 1, "Male", 18, 2017, "California", 39.51],
        ["California", 1, "Male", 72, 2017, "California", 39.51],
        ["California", 1, "Female", 22, 2017, "California", 39.51],
        ["California", 1, "Female", 48, 2017, "California", 39.51],
        ["Texas", 1, "Female", 18, 2017, "Texas", 29],
        ["Texas", 1, "Female", 47, 2017, "Texas", 29],
        ["Texas", 1, "Female", 20, 2017, "Texas", 29],
        ["Texas", 1, "Female", 4, 2017, "Texas", 29],
        ["Texas", 1, "Male", 30, 2017, "Texas", 29],
        ["Texas", 1, "Male", 63, 2017, "Texas", 29],
        ["South Carolina", 1, "Female", 27, 2017, "South Carolina", 5.149],
        ["South Carolina", 1, "Female", 38, 2017, "South Carolina", 5.149],
        ["Idaho", 1, "Male", 67, 2017, "Idaho", 1.787],
        ["Idaho", 1, "Female", 47, 2017, "Idaho", 1.787],
        ["Massachusetts", 1, "Female", 64, 2017, "Massachusetts", 6.893],
        ["Massachusetts", 1, "Male", 33, 2017, "Massachusetts", 6.893],
        ["Massachusetts", 1, "Female", 83, 2017, "Massachusetts", 6.893],
        ["", "", "", "", "", "North Carolina", 10.49],
        ["", "", "", "", "", "Virginia", 8.536],
      ]
    ),
  });
});

test("all matching cases in joining dataset are copied", () => {
  const joining = {
    collections: [makeCollection("cases", ["B", "Extra_Attribute"])],
    records: makeRecords(
      ["B", "Extra_Attribute"],
      [
        [true, "Extra 1"],
        [true, "Extra 2"],
        [false, "Extra 3"],
        [true, "Extra 4"],
        [false, "Extra 5"],
        [false, "Extra 6"],
        [true, "Extra 7"],
      ]
    ),
  };
  const expected = {
    collections: [
      makeCollection("parent", ["A"]),
      makeCollection("child", ["B", "C", "B {1}", "Extra_Attribute"], "parent"),
    ],
    records: makeRecords(
      ["A", "B", "C", "B {1}", "Extra_Attribute"],
      [
        [3, true, 2000, true, "Extra 1"],
        [3, true, 2000, true, "Extra 2"],
        [3, true, 2000, true, "Extra 4"],
        [3, true, 2000, true, "Extra 7"],
        [8, true, 2003, true, "Extra 1"],
        [8, true, 2003, true, "Extra 2"],
        [8, true, 2003, true, "Extra 4"],
        [8, true, 2003, true, "Extra 7"],
        [10, false, 1998, false, "Extra 3"],
        [10, false, 1998, false, "Extra 5"],
        [10, false, 1998, false, "Extra 6"],
        [4, true, 2010, true, "Extra 1"],
        [4, true, 2010, true, "Extra 2"],
        [4, true, 2010, true, "Extra 4"],
        [4, true, 2010, true, "Extra 7"],
        [10, false, 2014, false, "Extra 3"],
        [10, false, 2014, false, "Extra 5"],
        [10, false, 2014, false, "Extra 6"],
      ]
    ),
  };

  expect(
    uncheckedJoinWrapper("Dataset A", DATASET_A, "B", joining, "B")
  ).toEqual(expected);
  expect(
    uncheckedLeftJoinWrapper("Dataset A", DATASET_A, "B", joining, "B")
  ).toEqual(expected);
  expect(
    uncheckedFullJoinWrapper("Dataset A", DATASET_A, "B", joining, "B")
  ).toEqual(expected);
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
  const expectedResult = [
    makeCollection("C1", ["A"]),
    makeCollection("C2", ["B"], "C1"),
    // This is the only collection where an attribute is added, and
    // only C from joining is added.
    makeCollection("C3", ["C", "C {1}"], "C2"),
    makeCollection("C4", ["D"], "C3"),
  ];

  expect(
    uncheckedJoinWrapper("base dataset", base, "C", joining, "C").collections
  ).toEqual(expectedResult);
  expect(
    uncheckedLeftJoinWrapper("base dataset", base, "C", joining, "C")
      .collections
  ).toEqual(expectedResult);
  expect(
    uncheckedFullJoinWrapper("base dataset", base, "C", joining, "C")
      .collections
  ).toEqual(expectedResult);
});

test("base and joining attributes can have different names", () => {
  const joining = {
    collections: [makeCollection("cases", ["Not_Birth_Year"])],
    records: makeRecords(["Not_Birth_Year"], [[2001], [2000], [40], [1988]]),
  };
  const expectedCollections = [
    makeCollection("cases", [
      "Name",
      "Birth_Year",
      "Current_Year",
      "Grade",
      "Not_Birth_Year",
    ]),
  ];

  expect(
    uncheckedJoinWrapper(
      "Dataset B",
      DATASET_B,
      "Birth_Year",
      joining,
      "Not_Birth_Year"
    )
  ).toEqual({
    collections: expectedCollections,
    records: makeRecords(
      ["Name", "Birth_Year", "Current_Year", "Grade", "Not_Birth_Year"],
      [
        ["Joseph", 2001, 2021, 100, 2001],
        ["Eve", 2000, 2021, 93, 2000],
        ["Paula", 1988, 2021, 81, 1988],
      ]
    ),
  });

  expect(
    uncheckedLeftJoinWrapper(
      "Dataset B",
      DATASET_B,
      "Birth_Year",
      joining,
      "Not_Birth_Year"
    )
  ).toEqual({
    collections: expectedCollections,
    records: makeRecords(
      ["Name", "Birth_Year", "Current_Year", "Grade", "Not_Birth_Year"],
      [
        ["Jon", 1990, 2021, 88, ""],
        ["Sheila", 1995, 2021, 91, ""],
        ["Joseph", 2001, 2021, 100, 2001],
        ["Eve", 2000, 2021, 93, 2000],
        ["Nick", 1998, 2021, 95, ""],
        ["Paula", 1988, 2021, 81, 1988],
      ]
    ),
  });
  expect(
    uncheckedFullJoinWrapper(
      "Dataset B",
      DATASET_B,
      "Birth_Year",
      joining,
      "Not_Birth_Year"
    )
  ).toEqual({
    collections: expectedCollections,
    records: makeRecords(
      ["Name", "Birth_Year", "Current_Year", "Grade", "Not_Birth_Year"],
      [
        ["Jon", 1990, 2021, 88, ""],
        ["Sheila", 1995, 2021, 91, ""],
        ["Joseph", 2001, 2021, 100, 2001],
        ["Eve", 2000, 2021, 93, 2000],
        ["Nick", 1998, 2021, 95, ""],
        ["Paula", 1988, 2021, 81, 1988],
        ["", "", "", "", 40],
      ]
    ),
  });
});

test("can join dataset with itself", () => {
  const result = {
    collections: [
      makeCollection("parent", ["A"]),
      makeCollection("child", ["B", "C", "B {1}", "C {1}"], "parent"),
    ],
    records: makeRecords(
      ["A", "B", "C", "B {1}", "C {1}"],
      [
        [3, true, 2000, true, 2000],
        [8, true, 2003, true, 2003],
        [10, false, 1998, false, 1998],
        [4, true, 2010, true, 2010],
        [10, false, 2014, false, 2014],
      ]
    ),
  };
  expect(
    uncheckedJoinWrapper("Dataset A", DATASET_A, "C", DATASET_A, "C")
  ).toEqual(result);
  expect(
    uncheckedLeftJoinWrapper("Dataset A", DATASET_A, "C", DATASET_A, "C")
  ).toEqual(result);
  expect(
    uncheckedFullJoinWrapper("Dataset A", DATASET_A, "C", DATASET_A, "C")
  ).toEqual(result);
});

test("inner joining with empty base/joining datasets produces empty dataset", () => {
  expect(
    uncheckedJoinWrapper("Dataset B", DATASET_B, "Name", EMPTY_RECORDS, "E")
  ).toEqual({
    collections: [
      makeCollection("cases", [
        "Name",
        "Birth_Year",
        "Current_Year",
        "Grade",
        "E",
        "F",
      ]),
    ],
    records: [],
  });

  expect(
    uncheckedJoinWrapper("Empty Records", EMPTY_RECORDS, "D", DATASET_A, "A")
  ).toEqual({
    collections: [
      makeCollection("Collection A", ["A", "B", "C"]),
      makeCollection("Collection B", ["D", "A {1}"], "Collection A"),
      makeCollection("Collection C", ["E", "F"], "Collection B"),
    ],
    records: [],
  });
});

test("left joining with empty base/joining dataset", () => {
  expect(
    uncheckedLeftJoinWrapper("Dataset B", DATASET_B, "Name", EMPTY_RECORDS, "E")
  ).toEqual({
    collections: [
      makeCollection("cases", [
        "Name",
        "Birth_Year",
        "Current_Year",
        "Grade",
        "E",
        "F",
      ]),
    ],
    records: makeRecords(
      ["Name", "Birth_Year", "Current_Year", "Grade", "E", "F"],
      [
        ["Jon", 1990, 2021, 88, "", ""],
        ["Sheila", 1995, 2021, 91, "", ""],
        ["Joseph", 2001, 2021, 100, "", ""],
        ["Eve", 2000, 2021, 93, "", ""],
        ["Nick", 1998, 2021, 95, "", ""],
        ["Paula", 1988, 2021, 81, "", ""],
      ]
    ),
  });

  expect(
    uncheckedLeftJoinWrapper(
      "Empty Records",
      EMPTY_RECORDS,
      "D",
      DATASET_A,
      "A"
    )
  ).toEqual({
    collections: [
      makeCollection("Collection A", ["A", "B", "C"]),
      makeCollection("Collection B", ["D", "A {1}"], "Collection A"),
      makeCollection("Collection C", ["E", "F"], "Collection B"),
    ],
    records: [],
  });
});

test("full joining with empty base/joining dataset", () => {
  expect(
    uncheckedFullJoinWrapper("Dataset B", DATASET_B, "Name", EMPTY_RECORDS, "E")
  ).toEqual({
    collections: [
      makeCollection("cases", [
        "Name",
        "Birth_Year",
        "Current_Year",
        "Grade",
        "E",
        "F",
      ]),
    ],
    records: makeRecords(
      ["Name", "Birth_Year", "Current_Year", "Grade", "E", "F"],
      [
        ["Jon", 1990, 2021, 88, "", ""],
        ["Sheila", 1995, 2021, 91, "", ""],
        ["Joseph", 2001, 2021, 100, "", ""],
        ["Eve", 2000, 2021, 93, "", ""],
        ["Nick", 1998, 2021, 95, "", ""],
        ["Paula", 1988, 2021, 81, "", ""],
      ]
    ),
  });

  expect(
    uncheckedFullJoinWrapper(
      "Empty Records",
      EMPTY_RECORDS,
      "D",
      DATASET_A,
      "A"
    )
  ).toEqual({
    collections: [
      makeCollection("Collection A", ["A", "B", "C"]),
      makeCollection("Collection B", ["D", "A {1}"], "Collection A"),
      makeCollection("Collection C", ["E", "F"], "Collection B"),
    ],
    records: makeRecords(
      ["A", "B", "C", "D", "A {1}", "E", "F"],
      [
        ["", "", "", "", 3, "", ""],
        ["", "", "", "", 8, "", ""],
        ["", "", "", "", 10, "", ""],
        ["", "", "", "", 4, "", ""],
        ["", "", "", "", 10, "", ""],
      ]
    ),
  });
});

test("all attribute metadata except formulas is copied from joining", () => {
  const base = {
    collections: [makeCollection("collection", ["attr"])],
    records: [],
  };

  // Attributes from DATASET_WITH_META but without formulas
  const metaAttrsWithoutFormulas: CodapAttribute[] =
    DATASET_WITH_META.collections[0].attrs?.map((attr) => {
      return { ...attr, formula: undefined };
    }) as CodapAttribute[];

  const expected = {
    collections: [
      {
        name: "collection",
        attrs: [
          {
            name: "attr",
          },
          // All attribute metadata is copied (barring formulas)
          ...metaAttrsWithoutFormulas,
        ],
      },
    ],
    records: [],
  };

  expect(
    uncheckedJoinWrapper("Base Dataset", base, "attr", DATASET_WITH_META, "A")
  ).toEqual(expected);
  expect(
    uncheckedLeftJoinWrapper(
      "Base Dataset",
      base,
      "attr",
      DATASET_WITH_META,
      "A"
    )
  ).toEqual(expected);
  expect(
    uncheckedFullJoinWrapper(
      "Base Dataset",
      base,
      "attr",
      DATASET_WITH_META,
      "A"
    )
  ).toEqual(expected);
});

test("errors on invalid base attribute", () => {
  const invalidBaseAttrErr = /was not found/;

  function expectThrow(joinFunc: typeof uncheckedJoinWrapper) {
    expect(() =>
      joinFunc("Census Dataset", CENSUS_DATASET, "Nonexistent", DATASET_A, "A")
    ).toThrowError(invalidBaseAttrErr);

    expect(() =>
      joinFunc("Dataset B", DATASET_B, "Last Name", DATASET_A, "A")
    ).toThrowError(invalidBaseAttrErr);
  }

  expectThrow(uncheckedJoinWrapper);
  expectThrow(uncheckedLeftJoinWrapper);
  expectThrow(uncheckedFullJoinWrapper);
});

test("errors on invalid joining attribute", () => {
  const invalidJoiningAttrErr = /was not found/;

  function expectThrow(joinFunc: typeof uncheckedJoinWrapper) {
    expect(() =>
      joinFunc("Dataset B", DATASET_B, "Name", CENSUS_DATASET, "Not here")
    ).toThrowError(invalidJoiningAttrErr);

    expect(() =>
      joinFunc("Dataset A", DATASET_A, "C", TYPES_DATASET, "Bad attribute")
    ).toThrowError(invalidJoiningAttrErr);

    expect(() =>
      joinFunc(
        "Dataset with Meta",
        DATASET_WITH_META,
        "A",
        EMPTY_DATASET,
        "Any Attribute"
      )
    ).toThrowError(invalidJoiningAttrErr);
  }

  expectThrow(uncheckedJoinWrapper);
  expectThrow(uncheckedLeftJoinWrapper);
  expectThrow(uncheckedFullJoinWrapper);
});

test("ensures unique attribute names when copying", () => {
  const base = {
    collections: [
      makeCollection("parent", ["abc", "def"]),
      makeCollection("child", ["ghi"], "parent"),
    ],
    records: [],
  };
  const joining = {
    collections: [makeCollection("parent", ["abc", "def", "ghi"])],
    records: [],
  };
  const expectedCollections = [
    makeCollection("parent", ["abc", "def"]),
    makeCollection("child", ["ghi", "abc {1}", "def {1}", "ghi {1}"], "parent"),
  ];

  expect(
    uncheckedJoinWrapper("Base Dataset", base, "ghi", joining, "ghi")
      .collections
  ).toEqual(expectedCollections);
  expect(
    uncheckedLeftJoinWrapper("Base Dataset", base, "ghi", joining, "ghi")
      .collections
  ).toEqual(expectedCollections);
  expect(
    uncheckedFullJoinWrapper("Base Dataset", base, "ghi", joining, "ghi")
      .collections
  ).toEqual(expectedCollections);
});

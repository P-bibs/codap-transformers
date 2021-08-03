import {
  uncheckedRunningSum,
  uncheckedRunningMean,
  uncheckedRunningMin,
  uncheckedRunningMax,
  uncheckedDifference,
  uncheckedDifferenceFrom,
} from "../fold";
import { DataSet } from "../types";
import {
  makeCollection,
  makeRecords,
  DATASET_B,
  EMPTY_RECORDS,
  DATASET_WITH_MISSING,
} from "./data";

const SINGLE_COLLECTION_NUMBERS = {
  collections: [makeCollection("Cases", ["A"])],
  records: makeRecords(["A"], [[1], [2], [-3], [-5], [10], [15]]),
};

/**
 * A wrapper around unchecked running sum that discards the missing value report.
 */
function uncheckedRunningSumWrapper(
  contextTitle: string,
  dataset: DataSet,
  inputColumnName: string,
  resultColumnName: string,
  resultColumnDescription: string
): DataSet {
  const [output] = uncheckedRunningSum(
    contextTitle,
    dataset,
    inputColumnName,
    resultColumnName,
    resultColumnDescription
  );
  return output;
}

describe("Running sum", () => {
  test("Sums up just numbers", () => {
    expect(
      uncheckedRunningSumWrapper(
        "Single Collection Numbers",
        SINGLE_COLLECTION_NUMBERS,
        "A",
        "Running Sum of A",
        ""
      )
    ).toEqual({
      collections: [
        {
          name: "Cases",
          attrs: [
            {
              name: "A",
            },
            {
              name: "Running Sum of A",
              description: "",
              type: "numeric",
            },
          ],
        },
      ],
      records: makeRecords(
        ["A", "Running Sum of A"],
        [
          [1, 1],
          [2, 3],
          [-3, 0],
          [-5, -5],
          [10, 5],
          [15, 20],
        ]
      ),
    });
  });

  test("Running sum errors on non-number", () => {
    expect(() =>
      uncheckedRunningSumWrapper(
        "Dataset B",
        DATASET_B,
        "Name",
        "Running Sum of Name",
        ""
      )
    ).toThrow(/expected a number/);
  });

  test("Puts attribute at the end of the collection", () => {
    const description = "Nonsensical running sum of each person's birth year.";
    expect(
      uncheckedRunningSumWrapper(
        "Dataset B",
        DATASET_B,
        "Birth_Year",
        "Running Sum of Birth_Year",
        description
      )
    ).toEqual({
      collections: [
        {
          ...DATASET_B.collections[0],
          attrs: [
            ...(DATASET_B.collections[0].attrs || []),
            {
              name: "Running Sum of Birth_Year",
              description,
              type: "numeric",
            },
          ],
        },
      ],
      records: makeRecords(
        [
          "Name",
          "Birth_Year",
          "Current_Year",
          "Grade",
          "Running Sum of Birth_Year",
        ],
        [
          ["Jon", 1990, 2021, 88, 1990],
          ["Sheila", 1995, 2021, 91, 3985],
          ["Joseph", 2001, 2021, 100, 5986],
          ["Eve", 2000, 2021, 93, 7986],
          ["Nick", 1998, 2021, 95, 9984],
          ["Paula", 1988, 2021, 81, 11972],
        ]
      ),
    });
  });

  test("Running sum of table with no records", () => {
    expect(
      uncheckedRunningSumWrapper(
        "Empty Records",
        EMPTY_RECORDS,
        "D",
        "Running Sum of D",
        ""
      )
    ).toEqual({
      collections: [
        ...EMPTY_RECORDS.collections.slice(0, 2),
        {
          name: "Collection C",
          attrs: [
            { name: "E" },
            { name: "F" },
            { name: "Running Sum of D", description: "", type: "numeric" },
          ],
          parent: "Collection B",
        },
      ],
      records: [],
    });
  });

  test("Running sum errors on invalid attribute", () => {
    expect(() =>
      uncheckedRunningSumWrapper(
        "Dataset B",
        DATASET_B,
        "Nonexistant Attribute",
        "Sum",
        "Will error"
      )
    ).toThrow(/Invalid attribute name/);
  });

  test("Running sum ignores missing values", () => {
    expect(
      uncheckedRunningSumWrapper(
        "Dataset with Missing",
        DATASET_WITH_MISSING,
        "A",
        "Sum",
        ""
      )
    ).toEqual({
      collections: [
        {
          ...DATASET_WITH_MISSING.collections[0],
          attrs: [
            ...(DATASET_WITH_MISSING.collections[0].attrs || []),
            {
              name: "Sum",
              description: "",
              type: "numeric",
            },
          ],
        },
      ],
      records: makeRecords(
        ["A", "B", "C", "Sum"],
        [
          [6, "", 10, 6],
          [3, 12, 1, 9],
          ["", "", 4, ""],
          [10, 2, "", 19],
          ["", "", "", ""],
          [5, 2, 3, 24],
        ]
      ),
    });
  });
});

/**
 * A wrapper around unchecked running mean that discards the missing value report.
 */
function uncheckedRunningMeanWrapper(
  contextTitle: string,
  dataset: DataSet,
  inputColumnName: string,
  resultColumnName: string,
  resultColumnDescription: string
): DataSet {
  const [output] = uncheckedRunningMean(
    contextTitle,
    dataset,
    inputColumnName,
    resultColumnName,
    resultColumnDescription
  );
  return output;
}

describe("Running mean", () => {
  test("Single collection just numbers", () => {
    const runningMeanDescription = "Running mean description";
    expect(
      uncheckedRunningMeanWrapper(
        "Dataset",
        {
          collections: [makeCollection("Cases", ["A"])],
          records: makeRecords(["A"], [[1], [1], [4], [-2], [11]]),
        },
        "A",
        "Running Mean of A",
        runningMeanDescription
      )
    ).toEqual({
      collections: [
        {
          name: "Cases",
          attrs: [
            {
              name: "A",
            },
            {
              name: "Running Mean of A",
              description: runningMeanDescription,
              type: "numeric",
            },
          ],
        },
      ],
      records: makeRecords(
        ["A", "Running Mean of A"],
        [
          [1, 1],
          [1, 1],
          [4, 2],
          [-2, 1],
          [11, 3],
        ]
      ),
    });
  });

  test("Single collection non-number", () => {
    expect(() =>
      uncheckedRunningMeanWrapper(
        "Dataset B",
        DATASET_B,
        "Name",
        "Running Mean of Name",
        ""
      )
    ).toThrow(/expected a number/);
  });

  test("Puts attribute at the end of the collection", () => {
    const description = "Running mean of each person's birth year.";
    expect(
      uncheckedRunningMeanWrapper(
        "Dataset B",
        DATASET_B,
        "Birth_Year",
        "Running Mean of Birth_Year",
        description
      )
    ).toEqual({
      collections: [
        {
          ...DATASET_B.collections[0],
          attrs: [
            ...(DATASET_B.collections[0].attrs || []),
            {
              name: "Running Mean of Birth_Year",
              description,
              type: "numeric",
            },
          ],
        },
      ],
      records: makeRecords(
        [
          "Name",
          "Birth_Year",
          "Current_Year",
          "Grade",
          "Running Mean of Birth_Year",
        ],
        [
          ["Jon", 1990, 2021, 88, 1990],
          ["Sheila", 1995, 2021, 91, (1990 + 1995) / 2],
          ["Joseph", 2001, 2021, 100, (1990 + 1995 + 2001) / 3],
          ["Eve", 2000, 2021, 93, (1990 + 1995 + 2001 + 2000) / 4],
          ["Nick", 1998, 2021, 95, (1990 + 1995 + 2001 + 2000 + 1998) / 5],
          [
            "Paula",
            1988,
            2021,
            81,
            (1990 + 1995 + 2001 + 2000 + 1998 + 1988) / 6,
          ],
        ]
      ),
    });
  });

  test("Running mean of table with no records", () => {
    expect(
      uncheckedRunningMeanWrapper(
        "Empty Records",
        EMPTY_RECORDS,
        "D",
        "D Running Mean",
        ""
      )
    ).toEqual({
      collections: [
        ...EMPTY_RECORDS.collections.slice(0, 2),
        {
          name: "Collection C",
          attrs: [
            { name: "E" },
            { name: "F" },
            { name: "D Running Mean", description: "", type: "numeric" },
          ],
          parent: "Collection B",
        },
      ],
      records: [],
    });
  });

  test("Running mean errors on invalid attribute", () => {
    expect(() =>
      uncheckedRunningMeanWrapper(
        "Dataset B",
        DATASET_B,
        "Nonexistant Attribute",
        "Mean",
        "Will error"
      )
    ).toThrow(/Invalid attribute name/);
  });

  test("Running mean ignores missing values", () => {
    expect(
      uncheckedRunningMeanWrapper(
        "Dataset with Missing",
        DATASET_WITH_MISSING,
        "A",
        "Mean",
        ""
      )
    ).toEqual({
      collections: [
        {
          ...DATASET_WITH_MISSING.collections[0],
          attrs: [
            ...(DATASET_WITH_MISSING.collections[0].attrs || []),
            {
              name: "Mean",
              description: "",
              type: "numeric",
            },
          ],
        },
      ],
      records: makeRecords(
        ["A", "B", "C", "Mean"],
        [
          [6, "", 10, 6],
          [3, 12, 1, (6 + 3) / 2],
          ["", "", 4, ""],
          [10, 2, "", (6 + 3 + 10) / 3],
          ["", "", "", ""],
          [5, 2, 3, (6 + 3 + 10 + 5) / 4],
        ]
      ),
    });
  });
});

/**
 * A wrapper around unchecked running min that discards the missing value report.
 */
function uncheckedRunningMinWrapper(
  contextTitle: string,
  dataset: DataSet,
  inputColumnName: string,
  resultColumnName: string,
  resultColumnDescription: string
): DataSet {
  const [output] = uncheckedRunningMin(
    contextTitle,
    dataset,
    inputColumnName,
    resultColumnName,
    resultColumnDescription
  );
  return output;
}

describe("Running min", () => {
  test("Finds minimum of just numbers", () => {
    expect(
      uncheckedRunningMinWrapper(
        "Single Collection Numbers",
        SINGLE_COLLECTION_NUMBERS,
        "A",
        "Running Min of A",
        ""
      )
    ).toEqual({
      collections: [
        {
          name: "Cases",
          attrs: [
            {
              name: "A",
            },
            {
              name: "Running Min of A",
              description: "",
              type: "numeric",
            },
          ],
        },
      ],
      records: makeRecords(
        ["A", "Running Min of A"],
        [
          [1, 1],
          [2, 1],
          [-3, -3],
          [-5, -5],
          [10, -5],
          [15, -5],
        ]
      ),
    });
  });

  test("Running min errors on non-number", () => {
    expect(() =>
      uncheckedRunningMinWrapper(
        "Dataset B",
        DATASET_B,
        "Name",
        "Running Min of Name",
        ""
      )
    ).toThrow(/expected a number/);
  });

  test("Finds minimum of positive numbers with missing value", () => {
    expect(
      uncheckedRunningMinWrapper(
        "Dataset",
        {
          collections: [makeCollection("Cases", ["A"])],
          records: makeRecords(["A"], [[1], [""], [2], [3], [1], [5]]),
        },
        "A",
        "Running Min of A",
        ""
      )
    ).toEqual({
      collections: [
        {
          name: "Cases",
          attrs: [
            {
              name: "A",
            },
            {
              name: "Running Min of A",
              description: "",
              type: "numeric",
            },
          ],
          parent: undefined,
        },
      ],
      records: makeRecords(
        ["A", "Running Min of A"],
        [
          [1, 1],
          ["", ""],
          [2, 1],
          [3, 1],
          [1, 1],
          [5, 1],
        ]
      ),
    });
  });

  test("Finds minimum of numbers with missing value", () => {
    expect(
      uncheckedRunningMinWrapper(
        "Dataset",
        {
          collections: [makeCollection("Cases", ["A"])],
          records: makeRecords(["A"], [[1], [""], [2], [-3], [""], [5]]),
        },
        "A",
        "Running Min of A",
        ""
      )
    ).toEqual({
      collections: [
        {
          name: "Cases",
          attrs: [
            {
              name: "A",
            },
            {
              name: "Running Min of A",
              description: "",
              type: "numeric",
            },
          ],
          parent: undefined,
        },
      ],
      records: makeRecords(
        ["A", "Running Min of A"],
        [
          [1, 1],
          ["", ""],
          [2, 1],
          [-3, -3],
          ["", ""],
          [5, -3],
        ]
      ),
    });
  });

  test("Puts attribute at the end of the collection", () => {
    const description = "Running min of each person's birth year.";
    expect(
      uncheckedRunningMinWrapper(
        "Dataset B",
        DATASET_B,
        "Birth_Year",
        "Running Min of Birth_Year",
        description
      )
    ).toEqual({
      collections: [
        {
          ...DATASET_B.collections[0],
          attrs: [
            ...(DATASET_B.collections[0].attrs || []),
            {
              name: "Running Min of Birth_Year",
              description,
              type: "numeric",
            },
          ],
        },
      ],
      records: makeRecords(
        [
          "Name",
          "Birth_Year",
          "Current_Year",
          "Grade",
          "Running Min of Birth_Year",
        ],
        [
          ["Jon", 1990, 2021, 88, 1990],
          ["Sheila", 1995, 2021, 91, 1990],
          ["Joseph", 2001, 2021, 100, 1990],
          ["Eve", 2000, 2021, 93, 1990],
          ["Nick", 1998, 2021, 95, 1990],
          ["Paula", 1988, 2021, 81, 1988],
        ]
      ),
    });
  });

  test("Running min of table with no records", () => {
    expect(
      uncheckedRunningMinWrapper(
        "Empty Records",
        EMPTY_RECORDS,
        "D",
        "Running Min of D",
        ""
      )
    ).toEqual({
      collections: [
        ...EMPTY_RECORDS.collections.slice(0, 2),
        {
          name: "Collection C",
          attrs: [
            { name: "E" },
            { name: "F" },
            { name: "Running Min of D", description: "", type: "numeric" },
          ],
          parent: "Collection B",
        },
      ],
      records: [],
    });
  });

  test("Running min errors on invalid attribute", () => {
    expect(() =>
      uncheckedRunningMinWrapper(
        "Dataset B",
        DATASET_B,
        "Nonexistant Attribute",
        "Min",
        "Will error"
      )
    ).toThrow(/Invalid attribute name/);
  });
});

/**
 * A wrapper around unchecked running max that discards the missing value report.
 */
function uncheckedRunningMaxWrapper(
  contextTitle: string,
  dataset: DataSet,
  inputColumnName: string,
  resultColumnName: string,
  resultColumnDescription: string
): DataSet {
  const [output] = uncheckedRunningMax(
    contextTitle,
    dataset,
    inputColumnName,
    resultColumnName,
    resultColumnDescription
  );
  return output;
}

describe("Running max", () => {
  test("Finds maximum of just numbers", () => {
    expect(
      uncheckedRunningMaxWrapper(
        "Single Collection Numbers",
        SINGLE_COLLECTION_NUMBERS,
        "A",
        "Running Max of A",
        ""
      )
    ).toEqual({
      collections: [
        {
          name: "Cases",
          attrs: [
            {
              name: "A",
            },
            {
              name: "Running Max of A",
              description: "",
              type: "numeric",
            },
          ],
          parent: undefined,
        },
      ],
      records: makeRecords(
        ["A", "Running Max of A"],
        [
          [1, 1],
          [2, 2],
          [-3, 2],
          [-5, 2],
          [10, 10],
          [15, 15],
        ]
      ),
    });
  });

  test("Running max errors on non-number", () => {
    expect(() =>
      uncheckedRunningMaxWrapper(
        "Dataset B",
        DATASET_B,
        "Name",
        "Running max of Name",
        ""
      )
    ).toThrow(/expected a number/);
  });

  test("Finds maximum of negative numbers with missing value", () => {
    expect(
      uncheckedRunningMaxWrapper(
        "Dataset",
        {
          collections: [makeCollection("Cases", ["A"])],
          records: makeRecords(["A"], [[-1], [""], [-3], [-5], [-2], [-1]]),
        },
        "A",
        "Running Max of A",
        ""
      )
    ).toEqual({
      collections: [
        {
          name: "Cases",
          attrs: [
            {
              name: "A",
            },
            {
              name: "Running Max of A",
              description: "",
              type: "numeric",
            },
          ],
          parent: undefined,
        },
      ],
      records: makeRecords(
        ["A", "Running Max of A"],
        [
          [-1, -1],
          ["", ""],
          [-3, -1],
          [-5, -1],
          [-2, -1],
          [-1, -1],
        ]
      ),
    });
  });

  test("Finds maximum of numbers with missing value", () => {
    expect(
      uncheckedRunningMaxWrapper(
        "Dataset",
        {
          collections: [makeCollection("Cases", ["A"])],
          records: makeRecords(["A"], [[1], [""], [2], [-3], [""], [5]]),
        },
        "A",
        "Running Max of A",
        ""
      )
    ).toEqual({
      collections: [
        {
          name: "Cases",
          attrs: [
            {
              name: "A",
            },
            {
              name: "Running Max of A",
              description: "",
              type: "numeric",
            },
          ],
          parent: undefined,
        },
      ],
      records: makeRecords(
        ["A", "Running Max of A"],
        [
          [1, 1],
          ["", ""],
          [2, 2],
          [-3, 2],
          ["", ""],
          [5, 5],
        ]
      ),
    });
  });

  test("Puts attribute at the end of the collection", () => {
    const description = "Running max of each person's birth year.";
    expect(
      uncheckedRunningMaxWrapper(
        "Dataset B",
        DATASET_B,
        "Birth_Year",
        "Running Max of Birth_Year",
        description
      )
    ).toEqual({
      collections: [
        {
          ...DATASET_B.collections[0],
          attrs: [
            ...(DATASET_B.collections[0].attrs || []),
            {
              name: "Running Max of Birth_Year",
              description,
              type: "numeric",
            },
          ],
        },
      ],
      records: makeRecords(
        [
          "Name",
          "Birth_Year",
          "Current_Year",
          "Grade",
          "Running Max of Birth_Year",
        ],
        [
          ["Jon", 1990, 2021, 88, 1990],
          ["Sheila", 1995, 2021, 91, 1995],
          ["Joseph", 2001, 2021, 100, 2001],
          ["Eve", 2000, 2021, 93, 2001],
          ["Nick", 1998, 2021, 95, 2001],
          ["Paula", 1988, 2021, 81, 2001],
        ]
      ),
    });
  });

  test("Running max of table with no records", () => {
    expect(
      uncheckedRunningMaxWrapper(
        "Empty Records",
        EMPTY_RECORDS,
        "D",
        "Running Max of D",
        ""
      )
    ).toEqual({
      collections: [
        ...EMPTY_RECORDS.collections.slice(0, 2),
        {
          name: "Collection C",
          attrs: [
            { name: "E" },
            { name: "F" },
            { name: "Running Max of D", description: "", type: "numeric" },
          ],
          parent: "Collection B",
        },
      ],
      records: [],
    });
  });

  test("Running max errors on invalid attribute", () => {
    expect(() =>
      uncheckedRunningMaxWrapper(
        "Dataset B",
        DATASET_B,
        "Nonexistant Attribute",
        "Max",
        "Will error"
      )
    ).toThrow(/Invalid attribute name/);
  });
});

/**
 * A wrapper around unchecked difference that discards the missing value report.
 */
function uncheckedDifferenceWrapper(
  contextTitle: string,
  dataset: DataSet,
  inputColumnName: string,
  resultColumnName: string,
  resultColumnDescription: string
): DataSet {
  const [output] = uncheckedDifference(
    contextTitle,
    dataset,
    inputColumnName,
    resultColumnName,
    resultColumnDescription
  );
  return output;
}

describe("Difference", () => {
  test("Difference of just numbers", () => {
    expect(
      uncheckedDifferenceWrapper(
        "Single Collection Numbers",
        SINGLE_COLLECTION_NUMBERS,
        "A",
        "Difference of A",
        ""
      )
    ).toEqual({
      collections: [
        {
          name: "Cases",
          attrs: [
            {
              name: "A",
            },
            {
              name: "Difference of A",
              description: "",
              type: "numeric",
            },
          ],
        },
      ],
      records: makeRecords(
        ["A", "Difference of A"],
        [
          [1, 1],
          [2, 1],
          [-3, -5],
          [-5, -2],
          [10, 15],
          [15, 5],
        ]
      ),
    });
  });

  test("Difference errors on non-number", () => {
    expect(() =>
      uncheckedDifferenceWrapper(
        "Dataset B",
        DATASET_B,
        "Name",
        "Difference of Name",
        ""
      )
    ).toThrow(/expected a number/);
  });

  test("Puts attribute at the end of the collection", () => {
    const description = "Difference of each person's birth year.";
    expect(
      uncheckedDifferenceWrapper(
        "Dataset B",
        DATASET_B,
        "Birth_Year",
        "Difference of Birth_Year",
        description
      )
    ).toEqual({
      collections: [
        {
          ...DATASET_B.collections[0],
          attrs: [
            ...(DATASET_B.collections[0].attrs || []),
            {
              name: "Difference of Birth_Year",
              description,
              type: "numeric",
            },
          ],
        },
      ],
      records: makeRecords(
        [
          "Name",
          "Birth_Year",
          "Current_Year",
          "Grade",
          "Difference of Birth_Year",
        ],
        [
          ["Jon", 1990, 2021, 88, 1990],
          ["Sheila", 1995, 2021, 91, 5],
          ["Joseph", 2001, 2021, 100, 6],
          ["Eve", 2000, 2021, 93, -1],
          ["Nick", 1998, 2021, 95, -2],
          ["Paula", 1988, 2021, 81, -10],
        ]
      ),
    });
  });

  test("Difference of table with no records", () => {
    expect(
      uncheckedDifferenceWrapper(
        "Empty Records",
        EMPTY_RECORDS,
        "D",
        "Difference of D",
        ""
      )
    ).toEqual({
      collections: [
        ...EMPTY_RECORDS.collections.slice(0, 2),
        {
          name: "Collection C",
          attrs: [
            { name: "E" },
            { name: "F" },
            { name: "Difference of D", description: "", type: "numeric" },
          ],
          parent: "Collection B",
        },
      ],
      records: [],
    });
  });

  test("Difference errors on invalid attribute", () => {
    expect(() =>
      uncheckedDifferenceWrapper(
        "Dataset B",
        DATASET_B,
        "Nonexistant Attribute",
        "Difference",
        "Will error"
      )
    ).toThrow(/Invalid attribute name/);
  });

  test("Difference ignores missing values", () => {
    expect(
      uncheckedDifferenceWrapper(
        "Dataset with Missing",
        DATASET_WITH_MISSING,
        "A",
        "Difference",
        ""
      )
    ).toEqual({
      collections: [
        {
          ...DATASET_WITH_MISSING.collections[0],
          attrs: [
            ...(DATASET_WITH_MISSING.collections[0].attrs || []),
            {
              name: "Difference",
              description: "",
              type: "numeric",
            },
          ],
        },
      ],
      records: makeRecords(
        ["A", "B", "C", "Difference"],
        [
          [6, "", 10, 6],
          [3, 12, 1, -3],
          ["", "", 4, ""],
          [10, 2, "", 7],
          ["", "", "", ""],
          [5, 2, 3, -5],
        ]
      ),
    });
  });
});

/**
 * A wrapper around unchecked difference from that discards the missing value report.
 */
function uncheckedDifferenceFromWrapper(
  contextTitle: string,
  dataset: DataSet,
  inputColumnName: string,
  resultColumnName: string,
  resultColumnDescription: string,
  startingValue?: number
): DataSet {
  const [output] = uncheckedDifferenceFrom(
    contextTitle,
    dataset,
    inputColumnName,
    resultColumnName,
    resultColumnDescription,
    startingValue
  );
  return output;
}

describe("Difference from", () => {
  test("Difference from of just numbers", () => {
    expect(
      uncheckedDifferenceFromWrapper(
        "Single Collection Numbers",
        SINGLE_COLLECTION_NUMBERS,
        "A",
        "Difference of A",
        "",
        10
      )
    ).toEqual({
      collections: [
        {
          name: "Cases",
          attrs: [
            {
              name: "A",
            },
            {
              name: "Difference of A",
              description: "",
              type: "numeric",
            },
          ],
        },
      ],
      records: makeRecords(
        ["A", "Difference of A"],
        [
          [1, -9],
          [2, 1],
          [-3, -5],
          [-5, -2],
          [10, 15],
          [15, 5],
        ]
      ),
    });
  });

  test("Difference errors on non-number", () => {
    expect(() =>
      uncheckedDifferenceFromWrapper(
        "Dataset B",
        DATASET_B,
        "Name",
        "Difference of Name",
        "",
        100
      )
    ).toThrow(/expected a number/);
  });

  test("Puts attribute at the end of the collection", () => {
    const description = "Difference of each person's birth year.";
    expect(
      uncheckedDifferenceFromWrapper(
        "Dataset B",
        DATASET_B,
        "Birth_Year",
        "Difference of Birth_Year",
        description,
        2000
      )
    ).toEqual({
      collections: [
        {
          ...DATASET_B.collections[0],
          attrs: [
            ...(DATASET_B.collections[0].attrs || []),
            {
              name: "Difference of Birth_Year",
              description,
              type: "numeric",
            },
          ],
        },
      ],
      records: makeRecords(
        [
          "Name",
          "Birth_Year",
          "Current_Year",
          "Grade",
          "Difference of Birth_Year",
        ],
        [
          ["Jon", 1990, 2021, 88, -10],
          ["Sheila", 1995, 2021, 91, 5],
          ["Joseph", 2001, 2021, 100, 6],
          ["Eve", 2000, 2021, 93, -1],
          ["Nick", 1998, 2021, 95, -2],
          ["Paula", 1988, 2021, 81, -10],
        ]
      ),
    });
  });

  test("Difference of table with no records", () => {
    expect(
      uncheckedDifferenceFromWrapper(
        "Empty Records",
        EMPTY_RECORDS,
        "D",
        "Difference of D",
        "",
        100
      )
    ).toEqual({
      collections: [
        ...EMPTY_RECORDS.collections.slice(0, 2),
        {
          name: "Collection C",
          attrs: [
            { name: "E" },
            { name: "F" },
            { name: "Difference of D", description: "", type: "numeric" },
          ],
          parent: "Collection B",
        },
      ],
      records: [],
    });
  });

  test("Difference errors on invalid attribute", () => {
    expect(() =>
      uncheckedDifferenceFromWrapper(
        "Dataset B",
        DATASET_B,
        "Nonexistant Attribute",
        "Difference",
        "Will error",
        -10
      )
    ).toThrow(/Invalid attribute name/);
  });

  test("Difference ignores missing values", () => {
    expect(
      uncheckedDifferenceFromWrapper(
        "Dataset with Missing",
        DATASET_WITH_MISSING,
        "A",
        "Difference",
        "",
        10
      )
    ).toEqual({
      collections: [
        {
          ...DATASET_WITH_MISSING.collections[0],
          attrs: [
            ...(DATASET_WITH_MISSING.collections[0].attrs || []),
            {
              name: "Difference",
              description: "",
              type: "numeric",
            },
          ],
        },
      ],
      records: makeRecords(
        ["A", "B", "C", "Difference"],
        [
          [6, "", 10, -4],
          [3, 12, 1, -3],
          ["", "", 4, ""],
          [10, 2, "", 7],
          ["", "", "", ""],
          [5, 2, 3, -5],
        ]
      ),
    });
  });
});

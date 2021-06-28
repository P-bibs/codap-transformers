import { DDTransformerInit, TransformFunction } from "./DataDrivenTransformer";
import { filter } from "../transformers/filter";
import { buildColumn } from "../transformers/buildColumn";
import { flatten } from "../transformers/flatten";
import { groupBy } from "../transformers/groupBy";
import { selectAttributes } from "../transformers/selectAttributes";
import { count } from "../transformers/count";
import { compare } from "../transformers/compare";
import { sort } from "../transformers/sort";
import { pivotLonger, pivotWider } from "../transformers/pivot";
import { join } from "../transformers/join";
import { copy } from "../transformers/copy";
import { copySchema } from "../transformers/copySchema";
import { combineCases } from "../transformers/combineCases";
import {
  difference,
  differenceFrom,
  genericFold,
  runningMax,
  runningMean,
  runningMin,
  runningSum,
} from "../transformers/fold";
import { dotProduct } from "../transformers/dotProduct";
import { average } from "../transformers/average";
import { partitionOverride } from "../transformers/partition";

export type TransformerGroup =
  | "Structural Transformers"
  | "Combining Transformers"
  | "Summarizing Transformers"
  | "Running Aggregators"
  | "Copy Transformers"
  | "Aggregators"
  | "Others";

/**
 *  All valid values of the `base` field of a saved transformer object
 */
export type BaseTransformerName =
  | "Build Column"
  | "Compare"
  | "Count"
  | "Difference From"
  | "Filter"
  | "Flatten"
  | "Running Sum"
  | "Running Mean"
  | "Running Min"
  | "Running Max"
  | "Running Difference"
  | "Group By"
  | "Pivot Longer"
  | "Pivot Wider"
  | "Select Attributes"
  | "Sort"
  | "Transform Column"
  | "Copy"
  | "Copy Schema"
  | "Join"
  | "Dot Product"
  | "Average"
  | "Combine Cases"
  | "Reduce"
  | "Partition";

export type TransformerList = Record<
  BaseTransformerName,
  {
    group: TransformerGroup;
    componentData: {
      init: DDTransformerInit;
      transformerFunction: TransformFunction;
    };
  }
>;

const transformerList: TransformerList = {
  Partition: {
    group: "Structural Transformers",
    componentData: {
      init: {
        context1: {
          title: "Table to Partition",
        },
        attribute1: {
          title: "Attribute to Partition By",
        },
      },
      transformerFunction: {
        kind: "fullOverride",
        func: partitionOverride,
      },
    },
  },
  Flatten: {
    group: "Structural Transformers",
    componentData: {
      init: {
        context1: {
          title: "Table to Flatten",
        },
      },
      transformerFunction: { kind: "datasetCreator", func: flatten },
    },
  },
  "Group By": {
    group: "Structural Transformers",
    componentData: {
      init: {
        context1: {
          title: "Table to Group",
        },
        attributeSet1: {
          title: "Attributes to Group By",
        },
      },
      transformerFunction: { kind: "datasetCreator", func: groupBy },
    },
  },
  "Pivot Longer": {
    group: "Structural Transformers",
    componentData: {
      init: {
        context1: {
          title: "Table to Pivot",
        },
        attributeSet1: {
          title: "Attributes to Pivot",
        },
        textInput1: {
          title: "Names to",
        },
        textInput2: {
          title: "Values to",
        },
      },
      transformerFunction: { kind: "datasetCreator", func: pivotLonger },
    },
  },
  "Pivot Wider": {
    group: "Structural Transformers",
    componentData: {
      init: {
        context1: {
          title: "Table to Pivot",
        },
        attribute1: {
          title: "Names From",
        },
        attribute2: {
          title: "Values From",
        },
      },
      transformerFunction: { kind: "datasetCreator", func: pivotWider },
    },
  },
  Join: {
    group: "Combining Transformers",
    componentData: {
      init: {
        context1: {
          title: "Base Table",
        },
        context2: {
          title: "Joining Table",
        },
        attribute1: {
          title: "Base Attribute",
        },
        attribute2: {
          title: "Joining Attribute",
        },
      },
      transformerFunction: { kind: "datasetCreator", func: join },
    },
  },
  "Combine Cases": {
    group: "Combining Transformers",
    componentData: {
      init: {
        context1: {
          title: "Base Table",
        },
        context2: {
          title: "Combining Table",
        },
      },
      transformerFunction: {
        kind: "datasetCreator",
        func: combineCases,
      },
    },
  },
  Count: {
    group: "Summarizing Transformers",
    componentData: {
      init: {
        context1: {
          title: "Table to Count",
        },
        attributeSet1: {
          title: "Attributes to Count",
        },
      },
      transformerFunction: { kind: "datasetCreator", func: count },
    },
  },
  Compare: {
    group: "Summarizing Transformers",
    componentData: {
      init: {
        context1: {
          title: "First Table to Compare",
        },
        context2: {
          title: "Second Table to Compare",
        },
        attribute1: {
          title: "First attribute to Compare",
        },
        attribute2: {
          title: "Second attribute to Compare",
        },
        dropdown1: {
          title: "What kind of Comparison?",
          options: [
            { value: "categorical", title: "Categorical" },
            { value: "numeric", title: "Numeric" },
            { value: "structural", title: "Structural" },
          ],
          defaultValue: "Select a type",
        },
      },
      transformerFunction: { kind: "datasetCreator", func: compare },
    },
  },
  "Running Sum": {
    group: "Running Aggregators",
    componentData: {
      init: {
        context1: {
          title: "Table to calculate running sum on",
        },
        attribute1: {
          title: "Attribute to Aggregate",
        },
      },
      transformerFunction: { kind: "datasetCreator", func: runningSum },
    },
  },
  "Running Mean": {
    group: "Running Aggregators",
    componentData: {
      init: {
        context1: {
          title: "Table to calculate running mean on",
        },
        attribute1: {
          title: "Attribute to Aggregate",
        },
      },
      transformerFunction: { kind: "datasetCreator", func: runningMean },
    },
  },
  "Running Min": {
    group: "Running Aggregators",
    componentData: {
      init: {
        context1: {
          title: "Table to calculate running min on",
        },
        attribute1: {
          title: "Attribute to Aggregate",
        },
      },
      transformerFunction: { kind: "datasetCreator", func: runningMin },
    },
  },
  "Running Max": {
    group: "Running Aggregators",
    componentData: {
      init: {
        context1: {
          title: "Table to calculate running max on",
        },
        attribute1: {
          title: "Attribute to Aggregate",
        },
      },
      transformerFunction: { kind: "datasetCreator", func: runningMax },
    },
  },
  "Running Difference": {
    group: "Running Aggregators",
    componentData: {
      init: {
        context1: {
          title: "Table to calculate running difference on",
        },
        attribute1: {
          title: "Attribute to Aggregate",
        },
      },
      transformerFunction: { kind: "datasetCreator", func: difference },
    },
  },
  Reduce: {
    group: "Running Aggregators",
    componentData: {
      init: {
        context1: {
          title: "Table to reduce",
        },
        textInput1: {
          title: "Result Attribute Name",
        },
        expression1: {
          title: "Starting Value",
        },
        textInput2: {
          title: "Accumulator Name",
        },
        expression2: {
          title: "Formula for Next Accumulator",
        },
      },
      transformerFunction: { kind: "datasetCreator", func: genericFold },
    },
  },
  Copy: {
    group: "Copy Transformers",
    componentData: {
      init: {
        context1: {
          title: "Table to Copy",
        },
      },
      transformerFunction: { kind: "datasetCreator", func: copy },
    },
  },
  "Copy Schema": {
    group: "Copy Transformers",
    componentData: {
      init: {
        context1: {
          title: "Table to Copy",
        },
      },
      transformerFunction: { kind: "datasetCreator", func: copySchema },
    },
  },
  "Dot Product": {
    group: "Aggregators",
    componentData: {
      init: {
        context1: {
          title: "Table to Take Dot Product of",
        },
        attributeSet1: {
          title: "Attributes to Take Dot Product of",
        },
      },
      transformerFunction: { kind: "datasetCreator", func: dotProduct },
    },
  },

  Average: {
    group: "Aggregators",
    componentData: {
      init: {
        context1: {
          title: "Table to Take Average of",
        },
        attribute1: {
          title: "Attribute to Average",
        },
      },
      transformerFunction: { kind: "datasetCreator", func: average },
    },
  },
  Filter: {
    group: "Others",
    componentData: {
      init: {
        context1: {
          title: "Table to Filter",
        },
        typeContract1: {
          title: "How to Filter",
          inputTypes: ["Row"],
          outputTypes: ["boolean"],
          inputTypeDisabled: true,
          outputTypeDisabled: true,
        },
        expression1: { title: "" },
      },
      transformerFunction: { kind: "datasetCreator", func: filter },
    },
  },
  "Transform Column": {
    group: "Others",
    componentData: {
      init: {
        context1: {
          title: "Table to Transform Column Of",
        },
        attribute1: {
          title: "Attribute to Transform",
        },
        typeContract1: {
          title: "Formula for Transformed Values",
          inputTypes: ["Row"],
          outputTypes: ["any", "string", "number", "boolean", "boundary"],
          inputTypeDisabled: true,
        },
        expression1: { title: "" },
      },
      transformerFunction: { kind: "datasetCreator", func: buildColumn },
    },
  },
  "Build Column": {
    group: "Others",
    componentData: {
      init: {
        context1: {
          title: "Table to Add Attribute To",
        },
        textInput1: {
          title: "Name of New Attribute",
        },
        collection1: {
          title: "Collection to Add To",
        },
        typeContract1: {
          title: "Formula for Attribute Values",
          inputTypes: ["Row"],
          outputTypes: ["any", "string", "number", "boolean", "boundary"],
          inputTypeDisabled: true,
        },
        expression1: { title: "" },
      },
      transformerFunction: { kind: "datasetCreator", func: buildColumn },
    },
  },
  "Select Attributes": {
    group: "Others",
    componentData: {
      init: {
        context1: {
          title: "Table to Select Attributes From",
        },
        textInput1: {
          title: "Name of New Attribute",
        },
        dropdown1: {
          title: "Mode",
          options: [
            {
              value: "selectOnly",
              title: "Select only the following attributes",
            },
            {
              value: "selectAllBut",
              title: "Select all but the following attributes",
            },
          ],
          defaultValue: "Mode",
        },
        attributeSet1: {
          title: "Attributes",
        },
      },
      transformerFunction: {
        kind: "datasetCreator",
        func: selectAttributes,
      },
    },
  },

  "Difference From": {
    group: "Others",
    componentData: {
      init: {
        context1: {
          title: "Table to calculate difference on",
        },
        attribute1: {
          title: "Attribute to take difference from",
        },
        textInput1: {
          title: "Result Attribute Name",
        },
        textInput2: {
          title: "Starting value for difference",
        },
      },
      transformerFunction: {
        kind: "datasetCreator",
        func: differenceFrom,
      },
    },
  },
  Sort: {
    group: "Others",
    componentData: {
      init: {
        context1: {
          title: "Table to sort",
        },
        typeContract1: {
          title: "Key expression",
          inputTypes: ["Row"],
          outputTypes: ["any", "string", "number", "boolean", "boundary"],
          inputTypeDisabled: true,
        },
        expression1: { title: "" },
        dropdown1: {
          title: "Direction",
          options: [
            { value: "descending", title: "descending" },
            { value: "ascending", title: "ascending" },
          ],
          defaultValue: "Select a sort direction",
        },
      },
      transformerFunction: { kind: "datasetCreator", func: sort },
    },
  },
};

export default transformerList;

import {
  DDTransformerInit,
  DDTransformerState,
  TransformFunction,
} from "./DataDrivenTransformer";
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
import { copyStructure } from "../transformers/copyStructure";
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

export type TransformersInteractiveState = {
  transformerREPL?: {
    transformer: BaseTransformerName;
  };
  DDTransformation?: DDTransformerState;
  savedTransformation?: {
    name: string;
    description: string;
  };
};

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
  | "Filter"
  | "Flatten"
  | "Running Sum"
  | "Running Mean"
  | "Running Min"
  | "Running Max"
  | "Difference"
  | "Difference From"
  | "Group By"
  | "Pivot Longer"
  | "Pivot Wider"
  | "Select Attributes"
  | "Sort"
  | "Transform Column"
  | "Copy"
  | "Copy Structure"
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
      info: {
        summary: string;
        inputs: string;
        outputs: string;
      };
    };
  }
>;

const transformerList: TransformerList = {
  Partition: {
    group: "Structural Transformers",
    componentData: {
      init: {
        context1: {
          title: "Dataset to Partition",
        },
        attribute1: {
          title: "Attribute to Partition By",
        },
      },
      transformerFunction: {
        kind: "fullOverride",
        func: partitionOverride,
      },
      info: {
        summary:
          "Splits a single dataset into multiple datasets based on the values of a given \
        attribute. Each output dataset contains only cases that share the same distinct value \
        of that attribute.",
        inputs:
          "A dataset to split into multiple, and an attribute to determine how to split.",
        outputs: "One dataset per unique value of the indicated attribute.",
      },
    },
  },
  Flatten: {
    group: "Structural Transformers",
    componentData: {
      init: {
        context1: {
          title: "Dataset to Flatten",
        },
      },
      transformerFunction: { kind: "datasetCreator", func: flatten },
      info: {
        summary:
          "Takes a dataset with multiple collections and collapses \
        it into a dataset with a single collection containing all of the attributes.",
        inputs: "A dataset with many collections.",
        outputs: "A dataset with a single collection.",
      },
    },
  },
  "Group By": {
    group: "Structural Transformers",
    componentData: {
      init: {
        context1: {
          title: "Dataset to Group",
        },
        attributeSet1: {
          title: "Attributes to Group By",
        },
      },
      transformerFunction: { kind: "datasetCreator", func: groupBy },
      info: {
        summary:
          "Produces a dataset that is grouped by combinations of \
        the given attributes, by adding a new parent collection that contains \
        copies of these attributes.",
        inputs: "A dataset to group and a list of attributes to group by.",
        outputs:
          "A copy of the input dataset whose cases are grouped by the given attributes.",
      },
    },
  },
  "Pivot Longer": {
    group: "Structural Transformers",
    componentData: {
      init: {
        context1: {
          title: "Dataset to Pivot",
        },
        attributeSet1: {
          title: "Attributes to Pivot",
        },
        textInput1: {
          title: "Names To",
        },
        textInput2: {
          title: "Values To",
        },
      },
      transformerFunction: { kind: "datasetCreator", func: pivotLonger },
      info: {
        summary:
          "Pivots a dataset to make it longer and narrower. \
        It does this by turning indicated attribute names into values under a \
        single attribute, and putting the values formerly under those attributes \
        under a new attribute. A single case in the input is thus split into \
        multiple cases (making the dataset 'longer').",
        inputs:
          "A dataset to pivot, a list of attributes that should become \
        values, and names for both the attribute that will contain the former \
        attribute names ('Names To') and the attribute that will contain the \
        values that were under those attributes ('Values To').",
        outputs:
          "A pivoted copy of the input, usually with more cases and \
        less attributes.",
      },
    },
  },
  "Pivot Wider": {
    group: "Structural Transformers",
    componentData: {
      init: {
        context1: {
          title: "Dataset to Pivot",
        },
        attribute1: {
          title: "Names From",
        },
        attribute2: {
          title: "Values From",
          context: "context1",
        },
      },
      transformerFunction: { kind: "datasetCreator", func: pivotWider },
      info: {
        summary:
          "Pivots a dataset to make it shorter and wider. \
        It does this by turning the values of an indicated attribute into \
        attribute names, and using the values of another attribute as values \
        for these new attributes.",
        inputs:
          "A dataset to pivot, an attribute that contains values which \
        should be turned into attribute names ('Names From'), and an attribute containing \
        values which should be moved under the newly created attributes ('Values From').",
        outputs:
          "A pivoted copy of the input, usually with less cases and \
        more attributes.",
      },
    },
  },
  Join: {
    group: "Combining Transformers",
    componentData: {
      init: {
        context1: {
          title: "Base Dataset",
        },
        context2: {
          title: "Joining Dataset",
        },
        attribute1: {
          title: "Base Attribute",
        },
        attribute2: {
          title: "Joining Attribute",
        },
      },
      transformerFunction: { kind: "datasetCreator", func: join },
      info: {
        summary:
          "Combines two datasets into one, based on values \
        that are shared between the datasets. The output is a copy of \
        the base dataset, but the collection containing the base attribute also \
        contains copies of the attributes from the collection containing the \
        joining attribute in the joining dataset.\n\
        The copied attributes hold values from the first case in the joining \
        dataset whose value for the joining attribute matched the value of the \
        base attribute (or are missing if there is no such case).",
        inputs:
          "Two datasets to join (one base and one joining), and an attribute \
        from each whose shared values will determine which cases are joined to \
        each other.",
        outputs:
          "A single dataset containing all collections/attributes from \
        the base dataset, as well as some cases copied in from the joining dataset \
        where the joining and base attributes matched.",
      },
    },
  },
  "Combine Cases": {
    group: "Combining Transformers",
    componentData: {
      init: {
        context1: {
          title: "Base Dataset",
        },
        context2: {
          title: "Combining Dataset",
        },
      },
      transformerFunction: {
        kind: "datasetCreator",
        func: combineCases,
      },
      info: {
        summary:
          "Takes two datasets that share the same attributes \
        and produces a dataset that has all of their cases.",
        inputs:
          "Two datasets (a base and a combining dataset) that have the \
        same attribute names.",
        outputs:
          "A single dataset that has the structure (in terms of how many \
        collections and how they are organized) of the base dataset, but with \
        all the cases of both the base and combining datasets.",
      },
    },
  },
  Count: {
    group: "Summarizing Transformers",
    componentData: {
      init: {
        context1: {
          title: "Dataset to Count",
        },
        attributeSet1: {
          title: "Attributes to Count",
        },
      },
      transformerFunction: { kind: "datasetCreator", func: count },
      info: {
        summary:
          "Summarizes the frequency of all combinations \
        of values of the given attributes that appear at least once in the input dataset.",
        inputs:
          "A dataset and a list of attributes whose possible combinations \
        within that dataset you want to count.",
        outputs:
          "A dataset containing all combinations of values of the given \
        attributes from the input dataset, as well as a 'Count' attribute that \
        contains the number of occurrences of each combination of values.",
      },
    },
  },
  Compare: {
    group: "Summarizing Transformers",
    componentData: {
      init: {
        context1: {
          title: "First Dataset to Compare",
        },
        context2: {
          title: "Second Dataset to Compare",
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
      info: {
        summary:
          "Provides several ways of comparing the data \
        from two datasets (or possibly the same dataset with itself).",
        inputs:
          "Two datasets to compare, an attribute from each to compare, \
        and an indication of what kind of comparison to perform.",
        outputs:
          "Output differs depending on the type of comparison:\n\
        A categorical comparison produces a dataset that is grouped by the \
        two selected attributes, and identical cases from the input datasets \
        are merged together.\n\
        A numeric comparison produces a dataset with four attributes: the original \
        two attributes, their numeric difference, and a color indicating whether \
        the difference was negative, positive, or neutral.\n\
        A structural comparison produces a dataset that compares the two attributes \
        by attempting to match their values up. The output dataset has a copy of \
        the original two attributes, as well as a comparison status indicating \
        whether or not the values differ by an insertion, a deletion, or have \
        matching contents.",
      },
    },
  },
  "Running Sum": {
    group: "Running Aggregators",
    componentData: {
      init: {
        context1: {
          title: "Dataset to calculate running sum on",
        },
        attribute1: {
          title: "Attribute to Aggregate",
        },
      },
      transformerFunction: { kind: "datasetCreator", func: runningSum },
      info: {
        summary:
          "Produces a new dataset with an attribute added \
        that contains the running sum of the given attribute's values across \
        the whole dataset.",
        inputs:
          "A dataset to compute the sum over, and an attribute whose values \
        are used in the sum.",
        outputs:
          "A copy of the input dataset with a running sum attribute added.",
      },
    },
  },
  "Running Mean": {
    group: "Running Aggregators",
    componentData: {
      init: {
        context1: {
          title: "Dataset to calculate running mean on",
        },
        attribute1: {
          title: "Attribute to Aggregate",
        },
      },
      transformerFunction: { kind: "datasetCreator", func: runningMean },
      info: {
        summary:
          "Produces a new dataset with an attribute added \
        that contains the running mean (average) of the given attribute's values across \
        the whole dataset.",
        inputs:
          "A dataset to compute the mean over, and an attribute whose values \
        are used in the mean.",
        outputs:
          "A copy of the input dataset with a running mean attribute added.",
      },
    },
  },
  "Running Min": {
    group: "Running Aggregators",
    componentData: {
      init: {
        context1: {
          title: "Dataset to calculate running min on",
        },
        attribute1: {
          title: "Attribute to Aggregate",
        },
      },
      transformerFunction: { kind: "datasetCreator", func: runningMin },
      info: {
        summary:
          "Produces a new dataset with an attribute added \
        that contains the running minimum of the given attribute's values across \
        the whole dataset.",
        inputs:
          "A dataset to compute the minimum over, and an attribute whose values \
        are used in the minimum.",
        outputs:
          "A copy of the input dataset with a running minimum attribute added.",
      },
    },
  },
  "Running Max": {
    group: "Running Aggregators",
    componentData: {
      init: {
        context1: {
          title: "Dataset to calculate running max on",
        },
        attribute1: {
          title: "Attribute to Aggregate",
        },
      },
      transformerFunction: { kind: "datasetCreator", func: runningMax },
      info: {
        summary:
          "Produces a new dataset with an attribute added \
        that contains the running maximum of the given attribute's values across \
        the whole dataset.",
        inputs:
          "A dataset to compute the maximum over, and an attribute whose values \
        are used in the maximum.",
        outputs:
          "A copy of the input dataset with a running maximum attribute added.",
      },
    },
  },
  Difference: {
    group: "Running Aggregators",
    componentData: {
      init: {
        context1: {
          title: "Dataset to calculate difference on",
        },
        attribute1: {
          title: "Attribute to Aggregate",
        },
      },
      transformerFunction: { kind: "datasetCreator", func: difference },
      info: {
        summary:
          "Produces a dataset with a new attribute containing \
        the difference of each case's value of a given attribute with the case directly \
        above it. The first case (which has no case above it) subtracts 0 from its \
        value.",
        inputs:
          "A dataset and an attribute whose values are used in the difference.",
        outputs:
          "A copy of the input dataset with a new attribute added that \
        contains the differences.",
      },
    },
  },
  "Difference From": {
    group: "Running Aggregators",
    componentData: {
      init: {
        context1: {
          title: "Dataset to calculate difference on",
        },
        attribute1: {
          title: "Attribute to take difference from",
        },
        textInput2: {
          title: "Starting value for difference",
        },
      },
      transformerFunction: {
        kind: "datasetCreator",
        func: differenceFrom,
      },
      info: {
        summary:
          "Identical to the Difference transformer, but allows you to \
        choose the starting value that will be subtracted from the first case. \
        See info for Difference for more information.",
        inputs:
          "A dataset, an attribute to take the difference over, and a \
        starting value that will be subtracted from the first case.",
        outputs:
          "A copy of the input dataset with a new attribute that contains \
        the differences.",
      },
    },
  },
  Reduce: {
    group: "Running Aggregators",
    componentData: {
      init: {
        context1: {
          title: "Dataset to Reduce",
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
      info: {
        summary:
          "Produces a dataset with a new attribute that accumulates a \
        value across all the cases in the input dataset. Given a starting value and a \
        formula, Reduce uses the formula to calculate each value of the new \
        attribute.\n\
        The formula can reference a special 'accumulator' value, \
        which holds the value that the formula evaluated to in the previous case.",
        inputs:
          "A dataset to add the new attribute to, a name for the new attribute, \
        a starting value for the accumulator, a name for the accumulator (so you can \
        refer to it in the formula), and a formula for determining the values of \
        the new attribute.",
        outputs:
          "A copy of the input dataset with a new attribute added whose \
        values are determined by the given formula evaluated for each case.",
      },
    },
  },
  Copy: {
    group: "Copy Transformers",
    componentData: {
      init: {
        context1: {
          title: "Dataset to Copy",
        },
      },
      transformerFunction: { kind: "datasetCreator", func: copy },
      info: {
        summary:
          "Produces a copy of the given dataset, \
        copying all of its collections, attributes, and cases.",
        inputs: "A dataset to create a copy of.",
        outputs: "A copy of the input dataset.",
      },
    },
  },
  "Copy Structure": {
    group: "Copy Transformers",
    componentData: {
      init: {
        context1: {
          title: "Dataset to Copy",
        },
      },
      transformerFunction: { kind: "datasetCreator", func: copyStructure },
      info: {
        summary:
          "Produces a duplicate of the structure of the \
        given dataset, but without copying any of the cases. The output has the \
        same collections and attributes as the input, but is empty.",
        inputs: "A dataset to copy the structure of.",
        outputs:
          "A dataset with the same collection and attribute structure as \
        the input, but no cases.",
      },
    },
  },
  "Dot Product": {
    group: "Aggregators",
    componentData: {
      init: {
        context1: {
          title: "Dataset to Take Dot Product of",
        },
        attributeSet1: {
          title: "Attributes to Take Dot Product of",
        },
      },
      transformerFunction: { kind: "datasetCreator", func: dotProduct },
      info: {
        summary:
          "Calculates a dot product of the indicated attributes \
        by multiplying the values of these attributes in each case and summing \
        these products across the entire dataset.",
        inputs:
          "A dataset and a list of attributes whose values are used \
        in the dot product.",
        outputs:
          "A single number which is the sum of products of the values \
        from the indicated attributes in the input dataset.",
      },
    },
  },

  Average: {
    group: "Aggregators",
    componentData: {
      init: {
        context1: {
          title: "Dataset to Take Average of",
        },
        attribute1: {
          title: "Attribute to Average",
        },
      },
      transformerFunction: { kind: "datasetCreator", func: average },
      info: {
        summary:
          "Takes the average value of a given numeric attribute \
        in the given dataset.",
        inputs: "A dataset and an attribute within it to take the average of.",
        outputs:
          "A single number which is the average value of the given attribute.",
      },
    },
  },
  Filter: {
    group: "Others",
    componentData: {
      init: {
        context1: {
          title: "Dataset to Filter",
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
      info: {
        summary:
          "Takes a dataset and produces a copy of it that contains \
        only the cases for which the given formula evaluates to true.",
        inputs:
          "A dataset to filter and a formula that evaluates to either true \
        or false.",
        outputs:
          "A copy of the input dataset that only has the cases for which \
        the formula was true.",
      },
    },
  },
  "Transform Column": {
    group: "Others",
    componentData: {
      init: {
        context1: {
          title: "Dataset to Transform Column Of",
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
      info: {
        summary:
          "Takes an input dataset and produces a copy \
        of it with the values of one of its attributes transformed by a given \
        formula. Make sure to indicate what type of value you expect the formula \
        to evaluate to.",
        inputs:
          "A dataset, an attribute to transform, a formula that will \
        determine the new values of the given attribute, and the type that the \
        formula should evaluate to.",
        outputs:
          "A copy of the input dataset with transformed values for the \
        given attribute.",
      },
    },
  },
  "Build Column": {
    group: "Others",
    componentData: {
      init: {
        context1: {
          title: "Dataset to Add Attribute To",
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
      info: {
        summary:
          "Takes an input dataset and adds a new attribute \
        to one of the collections, whose values are determined by a formula. \
        Make sure to indicate what type of values you expect the formula to evaluate to.",
        inputs:
          "A dataset, a name for the new attribute, an existing collection \
        to add the attribute to, a formula for the attribute's values, and \
        an indication of the type of value the formula will evaluate to.",
        outputs:
          "A copy of the input dataset, with the new attribute added to \
        the indicated collection. The values of the new attribute are determined \
        by evaluating the formula at each case.",
      },
    },
  },
  "Select Attributes": {
    group: "Others",
    componentData: {
      init: {
        context1: {
          title: "Dataset to Select Attributes From",
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
      info: {
        summary:
          "Chooses particular attributes from \
        a dataset and leaves out others. You can choose a list of attributes that \
        will be the only ones to appear in the output ('select only') or choose a \
        list that should NOT appear in the output ('select all but').",
        inputs:
          "A dataset, an indication of how to use the given attribute list \
        (the 'mode'), and a list of attributes.",
        outputs:
          "A copy of the input dataset that contains either only the listed \
        attributes, or all but the listed attributes.",
      },
    },
  },
  Sort: {
    group: "Others",
    componentData: {
      init: {
        context1: {
          title: "Dataset to sort",
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
      info: {
        summary:
          "Takes a dataset and orders it, using the value of a formula \
        to determine how cases should appear in order.",
        inputs:
          "A dataset to sort, a formula ('key expression'), an indication of \
        the type the formula evaluates to, and a sort direction (ascending or \
          descending).",
        outputs:
          "A copy of the input dataset, with cases sorted by the value \
        of the key expression.",
      },
    },
  },
};

export default transformerList;

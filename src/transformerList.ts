import {
  TransformerTemplateInit,
  TransformerTemplateState,
  TransformFunction,
} from "./components/transformer-template/TransformerTemplate";
import { TransformationDescription } from "./lib/transformationDescription";
import { filter } from "./transformers/filter";
import { buildColumn } from "./transformers/buildColumn";
import { flatten } from "./transformers/flatten";
import { groupBy } from "./transformers/groupBy";
import { selectAttributes } from "./transformers/selectAttributes";
import { count } from "./transformers/count";
import { sort } from "./transformers/sort";
import { pivotLonger, pivotWider } from "./transformers/pivot";
import { join } from "./transformers/join";
import { copy } from "./transformers/copy";
import { copyStructure } from "./transformers/copyStructure";
import { combineCases } from "./transformers/combineCases";
import {
  difference,
  differenceFrom,
  genericFold,
  runningMax,
  runningMean,
  runningMin,
  runningSum,
} from "./transformers/fold";
import { sumProduct } from "./transformers/sumProduct";
import { mean } from "./transformers/mean";
import { median } from "./transformers/median";
import { mode } from "./transformers/mode";
import { standardDeviation } from "./transformers/standardDeviation";
import { partitionOverride, partitionUpdate } from "./transformers/partition";
import { editableCopyOverride } from "./transformers/editableCopy";
import { transformColumn } from "./transformers/transformColumn";
import { compare } from "./transformers/compare";

export type TransformersInteractiveState = {
  transformerREPL?: {
    transformer: BaseTransformerName;
  };
  DDTransformation?: TransformerTemplateState;
  savedTransformation?: {
    name: string;
    description: string;
  };
  activeTransformations?: TransformationDescription[];
};

export type TransformerGroup =
  | "Structural Transformers"
  | "Combining Transformers"
  | "Summarizing Transformers"
  | "Running Aggregators"
  | "Aggregators"
  | "Copy Transformers"
  | "Others";

/**
 *  All valid values of the `base` field of a saved transformer object
 */
export type DatasetCreatorTransformerName =
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
  | "Mean"
  | "Median"
  | "Mode"
  | "Standard Deviation"
  | "Sum Product"
  | "Combine Cases"
  | "Reduce";

export type FullOverrideTransformerName = "Partition" | "Editable Copy";

export type BaseTransformerName =
  | DatasetCreatorTransformerName
  | FullOverrideTransformerName;

export type TransformerList = Record<
  BaseTransformerName,
  {
    group: TransformerGroup;
    componentData: {
      init: TransformerTemplateInit;
      transformerFunction: TransformFunction;
      info: {
        summary: string;
        consumes: string;
        produces: string;
        docLink: string;
      };
    };
  }
>;

/**
 * Computes the link into the standalone documentation for a particular transformer
 * given its heading ID in the Google doc.
 *
 * @param headingID The auto-generated heading ID from the Google doc
 * @returns A link to the docs for this transformer
 */
function docLinkFromHeadingID(headingID: string): string {
  return `https://docs.google.com/document/d/1NZA9gxtu6jD3M-5SQyx0tvV2N5qYKMgRm1XUwMnLgJU/edit#heading=${headingID}`;
}

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
        createFunc: partitionOverride,
        updateFunc: partitionUpdate,
      },
      info: {
        summary:
          "Creates multiple new datasets from an attribute of a single dataset. \
          Each output dataset contains only cases that share the same distinct \
          value of that attribute.",
        consumes:
          "A dataset containing an attribute with one or more unique values.",
        produces:
          "One new dataset per unique value of the indicated attribute.",
        docLink: docLinkFromHeadingID("h.j1zfqypxsk9t"),
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
          "Takes a dataset with multiple collections and collapses it into a \
          new dataset with a single collection containing all of the attributes.",
        consumes: "A dataset with many collections.",
        produces: "A dataset with a single collection.",
        docLink: docLinkFromHeadingID("h.panq958nqlq5"),
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
          "Produces a new dataset that is grouped by combinations of the given \
          attributes, by adding a new parent collection that contains copies of \
          these attributes.",
        consumes: "A dataset to group and a list of attributes to group by.",
        produces:
          "A copy of the input dataset whose cases are grouped by the given attributes.",
        docLink: docLinkFromHeadingID("h.rdk3sh75yqxm"),
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
          "Pivots a dataset, making a new one that is longer and narrower. It \
          does this by turning indicated attribute names into values under a \
          single attribute, and putting the values formerly under those attributes \
          under a new attribute. A single case in the input is thus split into \
          multiple cases (making the dataset 'longer'). This is the inverse of \
          Pivot Wider.",
        consumes:
          "A dataset to pivot, a list of attributes that should become values, \
          and names for both the attribute that will contain the former attribute \
          names ('Names To') and the attribute that will contain the values that \
          were under those attributes ('Values To').",
        produces:
          "A pivoted copy of the input, usually with more cases and fewer attributes.",
        docLink: docLinkFromHeadingID("h.3ag94ew1tob2"),
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
          "Pivots a dataset, making a new one that is shorter and wider. It does \
          this by turning the values of an indicated attribute into attribute \
          names, and using the values of another attribute as values for these \
          new attributes. This is the inverse of Pivot Longer.",
        consumes:
          "A dataset to pivot, an attribute that contains values which should be \
          turned into attribute names ('Names From'), and an attribute containing \
          values which should be moved under the newly created attributes \
          ('Values From').",
        produces:
          "A pivoted copy of the input, usually with fewer cases and more attributes.",
        docLink: docLinkFromHeadingID("h.g7bra3b61eoj"),
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
          "Combines two datasets into a new one, based on values that are shared \
          between the datasets. The output is a copy of the base dataset, but the \
          collection containing the base attribute also contains copies of the \
          attributes from the collection containing the joining attribute in the \
          joining dataset.\n\
          The copied attributes hold values from the first case in the joining \
          dataset whose value for the joining attribute matched the value of the \
          base attribute (or are missing if there is no such case).",
        consumes:
          "Two datasets to join (one base and one joining), and an attribute \
          from each whose shared values will determine which cases are joined to \
          each other.",
        produces:
          "A single, new dataset containing all collections/attributes from the \
          base dataset, as well as some cases copied in from the joining dataset \
          where the joining and base attributes matched.",
        docLink: docLinkFromHeadingID("h.vdg3eipys2m2"),
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
          "Takes two datasets that share the same attributes and produces a new \
          dataset that has all of their cases.",
        consumes:
          "Two datasets (a base and a combining dataset) that have the same \
          attribute names.",
        produces:
          "A single, new dataset that has the structure (in terms of how many \
            collections and how they are organized) of the base dataset, but \
            with all the cases of both the base and combining datasets.",
        docLink: docLinkFromHeadingID("h.ssd5a8j00sm7"),
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
          "Summarizes the frequency of all combinations of values of the given \
          attributes that appear at least once in the input dataset.",
        consumes:
          "A dataset and a list of attributes whose possible combinations within \
          that dataset you want to count.",
        produces:
          "A new dataset containing all combinations of values of the given \
          attributes from the input dataset, as well as a 'Count' attribute that \
          contains the number of occurrences of each combination of values.",
        docLink: docLinkFromHeadingID("h.nhpqpjtaibn5"),
      },
    },
  },
  Compare: {
    group: "Summarizing Transformers",
    componentData: {
      init: {
        context1: {
          title: "Dataset to Compare",
        },
        attribute1: {
          title: "First attribute to Compare",
        },
        attribute2: {
          title: "Second attribute to Compare",
          context: "context1",
        },
        dropdown1: {
          title: "What kind of Comparison?",
          options: [
            { value: "categorical", title: "Categorical" },
            { value: "numeric", title: "Numeric" },
          ],
          defaultValue: "Select a type",
        },
      },
      transformerFunction: { kind: "datasetCreator", func: compare },
      info: {
        summary:
          "Provides ways of comparing the data from two attributes in \
        the same dataset.",
        consumes:
          "Two attributes to compare, the dataset they come from, and an \
          indication of what kind of comparison to perform.",
        produces:
          "Output differs depending on the type of comparison:\n\
          A categorical comparison produces a dataset that is grouped by the two \
          selected attributes, and identical cases from the input datasets are \
          merged together.\n\
          A numeric comparison produces a dataset with four attributes: the \
          original two attributes, their numeric difference, and a color \
          indicating whether the difference was negative, positive, or neutral.",
        docLink: docLinkFromHeadingID("h.2og7klit1lga"),
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
          "Produces a new dataset with an attribute added that contains the \
          running sum of the given attribute's values across the whole dataset.",
        consumes:
          "A dataset to compute the sum over, and an attribute whose values are \
          used in the sum.",
        produces:
          "A copy of the input dataset with a running sum attribute added.",
        docLink: docLinkFromHeadingID("h.a4c7fxsbf33r"),
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
          "Produces a new dataset with an attribute added that contains the \
          running mean (average) of the given attribute's values across the \
          whole dataset.",
        consumes:
          "A dataset to compute the mean over, and an attribute whose values \
          are used in the mean.",
        produces:
          "A copy of the input dataset with a running mean attribute added.",
        docLink: docLinkFromHeadingID("h.iijekpj8y560"),
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
          "Produces a new dataset with an attribute added that contains the \
          running minimum of the given attribute's values across the whole dataset.",
        consumes:
          "A dataset to compute the minimum over, and an attribute whose values \
          are used in the minimum.",
        produces:
          "A copy of the input dataset with a running minimum attribute added.",
        docLink: docLinkFromHeadingID("h.xshg6r8pui6q"),
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
          "Produces a new dataset with an attribute added that contains the \
          running maximum of the given attribute's values across the whole dataset.",
        consumes:
          "A dataset to compute the maximum over, and an attribute whose values \
          are used in the maximum.",
        produces:
          "A copy of the input dataset with a running maximum attribute added.",
        docLink: docLinkFromHeadingID("h.he4m8wbu4fly"),
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
          "Produces a new dataset with a new attribute containing the difference \
          of each case's value of a given attribute with the case directly above \
          it. The first case (which has no case above it) subtracts 0 from its value.",
        consumes:
          "A dataset and an attribute whose values are used in the difference.",
        produces:
          "A copy of the input dataset with a new attribute added that contains \
          the differences.",
        docLink: docLinkFromHeadingID("h.126pcwyw826a"),
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
          "Identical to the Difference transformer, but allows you to choose the \
          starting value that will be subtracted from the first case. See info \
          for Difference for more information.",
        consumes:
          "A dataset, an attribute to take the difference over, and a starting \
          value that will be subtracted from the first case.",
        produces:
          "A copy of the input dataset with a new attribute that contains the \
          differences.",
        docLink: docLinkFromHeadingID("h.p0oj9jm9w1kb"),
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
          "Produces a new dataset with an attribute that accumulates a value \
          across all the cases in the input dataset. Given a starting value and \
          a formula, Reduce uses the formula to calculate each value of the new \
          attribute.\n\
          The formula can reference a special 'accumulator' value, which holds \
          the value that the formula evaluated to in the previous case.",
        consumes:
          "A dataset to add the new attribute to, a name for the new attribute, \
          a starting value for the accumulator, a name for the accumulator (so \
            you can refer to it in the formula), and a formula for determining \
            the values of the new attribute.",
        produces:
          "A copy of the input dataset with a new attribute added whose values \
          are determined by the given formula evaluated for each case.",
        docLink: docLinkFromHeadingID("h.fug5ntifvvlp"),
      },
    },
  },
  Mean: {
    group: "Aggregators",
    componentData: {
      init: {
        context1: {
          title: "Dataset to Compute Mean Over",
        },
        attribute1: {
          title: "Attribute to Find Mean of",
        },
      },
      transformerFunction: { kind: "datasetCreator", func: mean },
      info: {
        summary:
          "Finds the mean value of a given numeric attribute in the given dataset. \
          This is the sum of all values under the attribute, divided by the number \
          of values.",
        consumes: "A dataset and an attribute within it to take the mean of.",
        produces: "A single number which is the mean of the given attribute.",
        docLink: docLinkFromHeadingID("h.lmsg0diutyw"),
      },
    },
  },
  Median: {
    group: "Aggregators",
    componentData: {
      init: {
        context1: {
          title: "Dataset to Compute Median Over",
        },
        attribute1: {
          title: "Attribute to Find Median of",
        },
      },
      transformerFunction: { kind: "datasetCreator", func: median },
      info: {
        summary:
          "Finds the median value of a given numeric attribute in the given \
          dataset. This is the middle value which separates the higher half \
          from the lower half of the dataset (when sorted). For datasets with \
          an even number of cases, the average of the two middle values is used.",
        consumes: "A dataset and an attribute within it to find the median of.",
        produces:
          "A single number which is the median value of the given attribute.",
        docLink: docLinkFromHeadingID("h.6awq4ztrr1w9"),
      },
    },
  },
  Mode: {
    group: "Aggregators",
    componentData: {
      init: {
        context1: {
          title: "Dataset to Compute Mode Over",
        },
        attribute1: {
          title: "Attribute to Find Mode of",
        },
      },
      transformerFunction: { kind: "datasetCreator", func: mode },
      info: {
        summary:
          "Finds the mode value(s) of a given numeric attribute in the given \
          dataset. These are the values which occur most often under the given attribute.",
        consumes:
          "A dataset and an attribute within it to find the mode(s) of.",
        produces:
          "A list of numbers which are the most frequently occuring in the given attribute.",
        docLink: docLinkFromHeadingID("h.2u89jvtiita2"),
      },
    },
  },
  "Standard Deviation": {
    group: "Aggregators",
    componentData: {
      init: {
        context1: {
          title: "Dataset to Compute Standard Deviation Over",
        },
        attribute1: {
          title: "Attribute to Find Standard Deviation of",
        },
      },
      transformerFunction: { kind: "datasetCreator", func: standardDeviation },
      info: {
        summary:
          "Finds the population standard deviation of a given numeric attribute \
          in the given dataset.",
        consumes:
          "A dataset and an attribute within it to find the standard deviation of.",
        produces:
          "A single number which is the standard deviation of the given attribute.",
        docLink: docLinkFromHeadingID("h.3lpola26n9jt"),
      },
    },
  },
  "Sum Product": {
    group: "Aggregators",
    componentData: {
      init: {
        context1: {
          title: "Dataset to Take Sum Product of",
        },
        attributeSet1: {
          title: "Attributes to Take Sum Product of",
        },
      },
      transformerFunction: { kind: "datasetCreator", func: sumProduct },
      info: {
        summary:
          "Calculates a sum product of the indicated attributes by multiplying \
          the values of these attributes in each case and summing these products \
          across the entire dataset.",
        consumes:
          "A dataset and a list of attributes whose values are used in the sum \
          product.",
        produces:
          "A single number which is the sum of products of the values from the \
          indicated attributes in the input dataset.",
        docLink: docLinkFromHeadingID("h.rw1dv7p08258"),
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
          "Produces a copy of the given dataset, copying all of its collections, \
          attributes, and cases.",
        consumes: "A dataset to create a copy of.",
        produces: "A copy of the input dataset.",
        docLink: docLinkFromHeadingID("h.uq0pa7ojmqp4"),
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
          "Produces a duplicate of the structure of the given dataset, but \
          without copying any of the cases. The output has the same collections \
          and attributes as the input, but is empty.",
        consumes: "A dataset to copy the structure of.",
        produces:
          "A dataset with the same collection and attribute structure as \
        the input, but no cases.",
        docLink: docLinkFromHeadingID("h.wuazcel945t6"),
      },
    },
  },
  "Editable Copy": {
    group: "Copy Transformers",
    componentData: {
      init: {
        context1: {
          title: "Dataset to Clone",
        },
      },
      transformerFunction: {
        kind: "fullOverride",
        createFunc: editableCopyOverride,
        updateFunc: async () => ({}),
      },
      info: {
        summary:
          "Produces an editable copy of the given dataset that does not update \
          when the original dataset is changed.",
        consumes: "A dataset to copy.",
        produces: "An editable copy of the input dataset.",
        docLink: docLinkFromHeadingID("h.k8luwltbuvbd"),
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
          inputTypes: ["row"],
          outputTypes: ["boolean"],
          inputTypeDisabled: true,
          outputTypeDisabled: true,
        },
        expression1: { title: "" },
      },
      transformerFunction: { kind: "datasetCreator", func: filter },
      info: {
        summary:
          "Takes a dataset and produces a copy of it that contains only the \
          cases for which the given formula evaluates to true.",
        consumes:
          "A dataset to filter and a formula that evaluates to either true or false.",
        produces:
          "A copy of the input dataset that only has the cases for which the formula was true.",
        docLink: docLinkFromHeadingID("h.ycy2d7rjztiu"),
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
          inputTypes: ["row"],
          outputTypes: ["any", "string", "number", "boolean", "boundary"],
          inputTypeDisabled: true,
        },
        expression1: { title: "" },
      },
      transformerFunction: { kind: "datasetCreator", func: transformColumn },
      info: {
        summary:
          "Takes an input dataset and produces a copy of it with the values of \
          one of its attributes transformed by a given formula. Make sure to \
          indicate what type of value you expect the formula to evaluate to.",
        consumes:
          "A dataset, an attribute to transform, a formula that will determine \
          the new values of the given attribute, and the type that the formula \
          should evaluate to.",
        produces:
          "A copy of the input dataset with transformed values for the given attribute.",
        docLink: docLinkFromHeadingID("h.dksm7abmovmg"),
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
          inputTypes: ["row"],
          outputTypes: ["any", "string", "number", "boolean", "boundary"],
          inputTypeDisabled: true,
        },
        expression1: { title: "" },
      },
      transformerFunction: { kind: "datasetCreator", func: buildColumn },
      info: {
        summary:
          "Makes a new copy of a  dataset, and adds a new attribute to one of the \
          collections, whose values are determined by a formula. Make sure to \
          indicate what type of values you expect the formula to evaluate to.",
        consumes:
          "A dataset, a name for the new attribute, an existing collection to \
          add the attribute to, a formula for the attribute's values, and an \
          indication of the type of value the formula will evaluate to.",
        produces:
          "A copy of the input dataset, with the new attribute added to the \
          indicated collection. The values of the new attribute are determined \
          by evaluating the formula at each case.",
        docLink: docLinkFromHeadingID("h.dnpc70npaxkh"),
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
          "Chooses particular attributes from a dataset and leaves out others. \
          You can choose a list of attributes that will be the only ones to appear \
          in the output ('select only') or choose a list that should NOT appear \
          in the output ('select all but').",
        consumes:
          "A dataset, an indication of how to use the given attribute list (the \
            'mode'), and a list of attributes.",
        produces:
          "A copy of the input dataset that contains either only the listed \
          attributes, or all but the listed attributes.",
        docLink: docLinkFromHeadingID("h.runninikk5n5"),
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
          inputTypes: ["row"],
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
          "Takes a dataset and orders it, using the value of a formula to \
          determine how cases should appear in order.",
        consumes:
          "A dataset to sort, a formula ('key expression'), an indication of the \
          type the formula evaluates to, and a sort direction (ascending or descending).",
        produces:
          "A copy of the input dataset, with cases sorted by the value of the \
          key expression.",
        docLink: docLinkFromHeadingID("h.9swamcujp916"),
      },
    },
  },
};

export default transformerList;

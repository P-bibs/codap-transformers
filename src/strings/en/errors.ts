const errors = {
  validation: {
    noDataSet: "Please choose a valid dataset to transform.",
    invalidAttribute: "Invalid attribute name: {{ name }}",
    invalidCollection: "Invalid collection name: {{ name }}",
    duplicateAttribute: "Attribute name already in use: {{ name }}",
    typeMismatch: "expected a {{ type }}, instead got {{ value }}",
    noOutputColumnName: "Please enter a name for the new attribute",
    noExpression: "Please enter an expression",
  },
  count: {
    noAttribute: "Please choose at least one attribute to count",
  },
  groupBy: {
    noAttribute: "Please choose at least one attribute to group by",
  },
  median: {
    noAttribute: "Please choose an attribute to find the median of.",
    noValues: "Cannot find median of no numeric values",
  },
  mode: {
    noAttribute: "Please choose an attribute to find the mode of.",
    noValues: "Cannot find mode of no numeric values",
  },
  mean: {
    noAttribute: "Please choose an attribute to take the mean of.",

    // FIXME: "no numeric values" is confusing. I think the point is that there
    // are zero values, so mentioning "numeric" might make the user think that
    // the issue is with types.
    noValues: "Cannot find mean of no numeric values.",
  },
  standardDeviation: {
    noAttribute:
      "Please choose an attribute to find the standard deviation of.",
    noValues: "Cannot find standard deviation of no numeric values",
  },
  compare: {
    noAttribute: "Please select two attributes",
    noComparisonType: "Please select a valid comparison type",
    invalidFirstAttribute: "Invalid first attribute",
    invalidSecondAttribute: "Invalid second attribute",
    typeMismatch: "Expected {{ type }}, instead got {{ value }}",
  },
  fold: {
    noAttribute: "Please select an attribute to aggregate",
    noBaseValue: "Please enter a base value",
    noAccumulatorName: "Please enter an accumulator name",
    duplicateAccumulatorName:
      "Duplicate accumulator name: there is already a column called {{ accumulatorName }}.",
  },
  differenceFrom: {
    noAttribute: "Please choose an attribute to take the difference from",
    noStartingValue: "Please provide a starting value for the difference.",
    nonNumericStartingValue:
      "Expected numeric starting value, instead got {{ value }}",
  },
  buildColumn: {
    noCollection: "Please select a collection to add to",
    noAttribute: "Please enter a non-empty name for the new attribute",
    noExpression: "Please enter a non-empty expression",
    noOutputType: "Please enter a valid output type",
  },
  combineCases: {
    noDataSet: "Please choose two datasets to combine.",
    differentAttributes:
      "Base and combining datasets must have the same attribute names",
  },
  filter: {
    noExpression: "Please enter a non-empty expression to filter by",
    nonBooleanResult:
      "Expected predicate to evaluate to true/false, but it evaluated to {{ value }} for case {{ caseNumber }}",
  },
  join: {
    noDataSetOrAttribute: "Please choose two datasets and two attributes",
    invalidJoiningAttribute: "Invalid joining attribute: {{ name }}",
    invalidBaseAttribute: "Invalid base attribute {{ name }}",
  },
  partition: {
    noAttribute: "Please select an attribute to partition by.",
    wantToProceed: "Are you sure you want to proceed?",
    confirmZeroDatasets:
      "This partition will create 0 datasets but still go through. Is this what you intend?",
    confirmManyDatasets: "This partition will create {{ number }} new datasets",
    confirmUpdateManyDatasets:
      'Updating the partition of "{{ name }}" will lead to {{ number }} total output datasets',

    // Prefixes actual updating error
    errorUpdating: "Error updating partitioned tables",
  },
  pivot: {
    noAttribute: "Please choose at least one attribute to pivot on",
    noNameForNamesTo:
      "Please choose a non-empty name for the Names To attribute",
    noNameForValuesTo:
      "Please choose a non-empty name for the Values To attribute",
    pivotLongerOnlySingleCollection:
      "Pivot longer can only be used on a single-collection dataset",
    pivotWiderOnlySingleCollection:
      "Pivot wider can only be used on a single-collection dataset",
    namesToValuesToSameName:
      "Please choose distinct names for the Names To and Values To attributes",
    noNamesFrom: "Please choose an attribute to get names from",
    noValuesFrom: "Please choose an attribute to get values from",
    cannotUseAsAttributeName:
      "Cannot use {{ value }} (from attribute {{ attributeName }} at case {{ caseNumber }} as an attribute name",
    invalidAttributeForValuesFrom:
      "Invalid attribute to retrieve values from: {{ name }}",
    multipleValuesForSameNamesFrom:
      'Case has multiple {{ valuesFrom }} values ({{ value1 }} and {{ value2 }}) for same "{{ namesFrom }}" ({{ namesFromValue }})',
  },
  selectAttributes: {
    noSelectedAttributes:
      "Transformed dataset must contain at least one attribute (0 selected)",
  },
  sort: {
    keysOfDifferentTypes:
      "Sort encountered keys of differing types {{ value1 }} and {{ value2 }}. Keys must have the same type for all cases.",
    noKeyExpression: "Please enter a non-empty key expression",
    noSortDirection: "Please select a valid sort direction",
  },
  sumProduct: {
    noAttribute:
      "Please choose at least one attribute to take the sum product of.",
    noAttributeUnchecked: "Cannot take the sum product of zero attributes.",
    typeMismatchInAttribute:
      "Expected number in attribute {{ name }}, instead got {{ value }}",
  },
  transformColumn: {
    noAttribute: "Please select an attribute to transform",
    noExpression: "Please enter a non-empty expression to transform with",
    noOutputType: "Please enter a valid output type",
    invalidAttribute: "Invalid attribute to transform: {{ name }}",
  },
};

export default errors;

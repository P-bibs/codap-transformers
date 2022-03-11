const errors = {
  validation: {
    noDataSet: "Please choose a dataset to transform",
    invalidAttribute:
      'Please select a valid attribute: "{{ name }}" was not found',
    invalidCollection:
      'Please select a valid collection: "{{ name }}" was not found',
    duplicateAttribute:
      'Please choose a different attribute name: "{{ name }}" is already in use',
    typeMismatch: "expected a {{ type }}, instead got {{ value }}",
    noOutputColumnName: "Please enter a name for the new attribute",
    noExpression: "Please enter an expression",
  },
  typeChecking: {
    typeMismatch: "Formula did not evaluate to {{ type }} for case {{ case }}",
  },
  count: {
    noAttribute: "Please choose at least one attribute to count",
  },
  groupBy: {
    noAttribute: "Please choose at least one attribute to group by",
  },
  median: {
    noAttribute:
      "Please choose an attribute for which you would like to find the median",
    noValues: "Cannot find median of no values",
  },
  mode: {
    noAttribute:
      "Please choose an attribute for which you would like to find the mode",
    noValues: "Cannot find mode of no values",
  },
  mean: {
    noAttribute:
      "Please choose an attribute for which you would like the find the mean",
    noValues: "Cannot find mean of no values",
  },
  standardDeviation: {
    noAttribute:
      "Please choose an attribute for which you would like to find the standard deviation",
    noValues: "Cannot find standard deviation of no values",
  },
  compare: {
    noAttribute: "Please select two attributes",
    noComparisonType: "Please select a valid comparison type",
    invalidFirstAttribute:
      'Please select a valid first attribute: "{{ name }}" was not found',
    invalidSecondAttribute:
      'Please select a valid second attribute: "{{ name }}" was not found',
  },
  fold: {
    noAttribute: "Please select an attribute to aggregate",
    noBaseValue: "Please enter a base value",
    noAccumulatorName: "Please enter an accumulator name",
    duplicateAccumulatorName:
      'Please enter a different accumulator name: there is already an attribute called "{{ accumulatorName }}"',
  },
  differenceFrom: {
    noAttribute: "Please choose an attribute to take the difference from",
    noStartingValue: "Please provide a starting value for the difference",
    nonNumericStartingValue:
      "Please provide a  numeric starting value; got {{ value }}",
  },
  buildAttribute: {
    noCollection:
      "Please select a collection to which the new attribute will be added",
    noAttribute: "Please enter a name for the new attribute",
    noExpression: "Please enter an expression",
    noOutputType: "Please enter an output type",
  },
  combineCases: {
    noDataSet: "Please choose two datasets to combine",
    differentAttributes: "Please choose datasets with the same attributes",
  },
  filter: {
    noExpression: "Please enter an expression by which to filter",
    nonBooleanResult:
      "Please enter an expression that evaluates to a Boolean. The one you entered evaluated to {{ value }} for case {{ caseNumber }}",
  },
  join: {
    noDataSetOrAttribute: "Please choose two datasets and two attributes",
    invalidJoiningAttribute:
      'Please select a valid joining attribute: "{{ name }}" was not found',
    invalidBaseAttribute:
      'Please select a valid base attribute: "{{ name }}" was not found',
  },
  partition: {
    noAttribute: "Please select an attribute by which to partition",
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
    noAttribute: "Please choose at least one attribute by which to pivot",
    noNameForNamesTo: "Please choose a name for the Names To attribute",
    noNameForValuesTo: "Please choose a name for the Values To attribute",
    pivotLongerOnlySingleCollection:
      "Pivot longer can only be used on a single-collection dataset",
    pivotWiderOnlySingleCollection:
      "Pivot wider can only be used on a single-collection dataset",
    namesToValuesToSameName:
      "Please choose distinct names for the Names To and Values To attributes",
    noNamesFrom: "Please choose an attribute from which to get names",
    noValuesFrom: "Please choose an attribute from which to get values",
    cannotUseAsAttributeName:
      "Cannot use {{ value }} (from attribute {{ attributeName }} at case {{ caseNumber }} as an attribute name",
    invalidAttributeForValuesFrom:
      'Please select a valid attribute from which to retrieve values: "{{ name }}" was not found',
    multipleValuesForSameNamesFrom:
      'Case has multiple {{ valuesFrom }} values ({{ value1 }} and {{ value2 }}) for same "{{ namesFrom }}" ({{ namesFromValue }})',
  },
  selectAttributes: {
    noSelectedAttributes:
      "Transformed dataset must contain at least one attribute (0 selected)",
    noMode: "Please select a mode",
  },
  sort: {
    keysOfDifferentTypes:
      "Please provide a key expression that evaluates to the same type for all cases. Got keys of different types {{ value1 }} and {{ value2 }}",
    noKeyExpression: "Please enter a key expression",
    noSortDirection: "Please select a sort direction",
    noSortMethod: "Please select a sort method",
    noSortAttribute: "Please select an attribute by which to sort",
  },
  sumProduct: {
    noAttribute:
      "Please choose at least one attribute from which to take the sum product",
    noAttributeUnchecked: "Cannot take the sum product of zero attributes",
    typeMismatchInAttribute:
      'Please select a numeric attribute instead of "{{ name }}"',
  },
  transformAttribute: {
    noAttribute: "Please select an attribute to transform",
    noExpression: "Please enter an expression with which to transform",
    noOutputType: "Please enter an output type",
    invalidAttribute:
      'Please select a valid attribute to transform: "{{ name }}" was not found',
  },
  codapPhone: {
    updateInteractiveFrame: {
      fail: "Failed to update CODAP interactive frame",
      undefinedResult: "Invalid response while updating interactive frame",
    },
    callMultiple: {
      undefinedResult: "Invalid response while making multiple requests",
    },
    getInteractiveFrame: {
      fail: "Failed to get interactive frame",
      undefinedResult: "Invalid response while getting interactive frame",
    },
    notifyInteractiveFrameIsDirty: {
      fail: "Failed to notify interactive frame that state is dirty",
      undefinedResult:
        "Invalid response while notifying interactive frame that state is dirty",
    },
    notifyInteractiveFrameWithSelect: {
      fail: "Failed to notify component to select",
      undefinedResult: "Invalid response while selecting the interactive frame",
    },
    getAllComponents: {
      fail: "Failed to get components",
      undefinedResult: "Invalid response while getting all components",
    },
    getComponent: {
      fail: "Failed to get component",
      undefinedResult: "Invalid response while getting component",
    },
    updateComponent: {
      fail: "Failed to update component",
      undefinedResult: "Invalid response while updating component",
    },
    updateDataContext: {
      fail: "Failed to update context",
      undefinedResult: "Invalid response while updating data context",
    },
    getAllDataContexts: {
      fail: "Failed to get data contexts",
      undefinedResult: "Invalid response while getting all data contexts",
    },
    getAllCollections: {
      fail: "Failed to get collections",
      unefinedResult: "Invalid response while getting all collections",
    },
    getCaseById: {
      fail: "Failed to get case in {{ context }} with id {{ id }}",
      undefinedResult: "Invalid response while getting case by ID",
    },
    getDataFromContext: {
      fail: "Failed to get data items",
      undefinedResult: "Invalid response while getting data from context",
    },
    getDataContext: {
      fail: "Failed to get context {{ context }}",
      undefinedResult: "Invalid response while getting data context",
    },
    deleteDataContext: {
      fail: "Failed to delete data context",
      undefinedResult: "Invalid response while deleting data context",
    },
    createDataContext: {
      fail: "Failed to create data context",
      undefinedResult: "Invalid response while creating data context",
    },
    createDataInteractive: {
      fail: "Failed to create data interactive",
      undefinedResult: "Invalid response while creating data interactive",
    },
    insertDataItems: {
      fail: "Failed to create dataset with data",
      undefinedResult: "Invalid response while inserting data items",
    },
    updateContextWithDataSet: {
      fail: "Failed to update {{ context }}",
    },
    createCollections: {
      fail: "Failed to create collections in {{ context }}",
      undefinedResult: "Invalid response while creating collections",
    },
    deleteCollection: {
      fail: "Failed to delete collection {{ collection }} in {{ context }}",
      undefinedResult: "Invalid response while deleting collection",
    },
    deleteAllCases: {
      fail: "Failed to delete all cases",
      undefinedResult: "Invalid response while deleting all cases",
    },
    createTable: {
      fail: "Failed to create table",
      undefinedResult: "Invalid response while creating table",
    },
    createText: {
      fail: "Failed to create text",
      undefinedResult: "Invalid response while creating text",
    },
    updateText: {
      fail: "Failed to update text",
      undefinedResult: "Invalid response while updating text",
    },
    deleteText: {
      fail: "Failed to delete text",
      undefinedResult: "Invalid response while deleting text",
    },
    ensureUniqueName: {
      fail: "Failed to fetch list of existing {{ resourceType }}",
      undefinedResult: "Invalid response while getting resource list",
    },
    evalExpression: {
      fail: "Evaluating `{{ expression }}` failed: {{ error }}",
      undefinedResult: "Invalid response while evaluating expression",
    },
    getFunctionInfo: {
      fail: "Failed to get function info",
      undefinedResult: "Invalid response while getting function info",
    },
    notifyUndoableActionPerformed: {
      failed: "Failed notifying about undoable action performed",
      undefinedResult:
        "Invalid response while notifying about undoable action performed",
    },
  },
};

export default errors;

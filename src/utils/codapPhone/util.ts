import { Collection, CodapAttribute } from "./types";

/**
 * Fill collection with defaults
 *
 * If the title is undefined, use the name as the title. Also fill the titles of
 * the attrs.
 * @param c - Collection to fill
 * @returns Filled collection
 */
export function fillCollectionWithDefaults(c: Collection): Collection {
  return {
    ...c,
    attrs: c.attrs?.map(fillAttrWithDefaults),
    title: c.title === undefined ? c.name : c.title,
  };
}

export function collectionsEqual(
  collections1: Collection[],
  collections2: Collection[]
): boolean {
  return listEqual(collections1, collections2, collectionEqual);
}

// Conditional type
// https://www.typescriptlang.org/docs/handbook/2/conditional-types.html
type ExcludeNonObject<T> = T extends
  | number
  | boolean
  | string
  | null
  | undefined
  ? never
  : T;

/**
 * Shallow equal
 *
 * Compares two objects for equality. This should not be used as a
 * shallowEquals because of the way it treats `undefined` fields. A canonical
 * shallowEquals will treat a field with a value of `undefined` and a missing
 * field differently, but for our use case, we need to treat them the same. For
 * example, if we send an attribute to CODAP with a missing field, the next
 * time we query that object, it will be returned with the missing fields
 * filled in with `undefined`. This will cause it to not be canonically equal
 * to an identical objects with the undefined fields missing. This version of
 * shallowEquals treats those objects as equal.
 *
 * @param a - The first object
 * @param b - The second object
 * @returns Whether the objects are equal
 */
function shallowEqual<T>(
  a: ExcludeNonObject<T>,
  b: ExcludeNonObject<T>
): boolean {
  // The type signature makes sure that the two arguments passed in have the
  // same type, and that they are not a primitive value (they are objects). The
  // casts allow us to use string keys. This is safe because the keys are
  // obtained through `Object.keys`.
  const aAsRecord = a as unknown as Record<string, unknown>;
  const bAsRecord = b as unknown as Record<string, unknown>;

  if (a === b) {
    return true;
  }

  const allKeys = new Set(Object.keys(a));
  Object.keys(b).forEach((k) => allKeys.add(k));

  for (const key of allKeys) {
    if (aAsRecord[key] !== bAsRecord[key]) {
      return false;
    }
  }

  return true;
}

function attributesEqual(
  attributes1?: CodapAttribute[],
  attributes2?: CodapAttribute[]
): boolean {
  if (attributes1 === undefined || attributes2 === undefined) {
    return attributes1 === attributes2;
  }
  return listEqual(attributes1, attributes2, shallowEqual);
}

/**
 * Fill attribute with defaults
 *
 * These are the defaults that CODAP will automatically fill in.
 * @param attr - Attribute to fill
 * @returns Filled attribute
 */
function fillAttrWithDefaults(attr: CodapAttribute): CodapAttribute {
  const withDefaults = {
    ...attr,
    title: attr.title === undefined ? attr.name : attr.title,
    editable: attr.editable === undefined ? true : attr.editable,
    hidden: attr.hidden === undefined ? false : attr.hidden,
    description: attr.description === undefined ? "" : attr.description,
  };
  if (withDefaults.type === undefined) {
    return {
      ...withDefaults,
      type: null,
    };
  }
  if (withDefaults.type === "numeric") {
    return {
      ...withDefaults,
      precision: 2,
      unit: null,
    };
  }
  return withDefaults;
}

function collectionEqual(c1: Collection, c2: Collection): boolean {
  return (
    c1.name === c2.name &&
    c1.title === c2.title &&
    c1.description === c2.description &&
    shallowEqual(c1.labels, c2.labels) &&
    attributesEqual(c1.attrs, c2.attrs)
  );
}

function listEqual<T>(
  l1: T[],
  l2: T[],
  equalityFunc: (a: T, b: T) => boolean
): boolean {
  if (l1.length !== l2.length) {
    return false;
  }

  for (let i = 0; i < l1.length; i++) {
    if (!equalityFunc(l1[i], l2[i])) {
      return false;
    }
  }

  return true;
}

export class DefaultMap<K, V> extends Map<K, V> {
  defaultValueFunc: () => V;

  constructor(defaultValueFunc: () => V, entries?: Iterable<readonly [K, V]>) {
    super(entries || []);
    this.defaultValueFunc = defaultValueFunc;
  }

  get(key: K): V {
    if (!this.has(key)) {
      this.set(key, this.defaultValueFunc());
    }

    // Safe cast because we have already set the value above
    return super.get(key) as V;
  }
}

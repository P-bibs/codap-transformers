/**
 * Compute the union of two arrays, using `pred` to determine equality
 */
export function unionWithPredicate<T>(
  array1: T[],
  array2: T[],
  pred: (elt1: T, elt2: T) => boolean
): T[] {
  const out: T[] = [];

  const merged: T[] = array1.concat(array2);

  for (const elementToBeAdded of merged) {
    if (
      out.find((existingElement: T) =>
        pred(existingElement, elementToBeAdded)
      ) === undefined
    ) {
      out.push(elementToBeAdded);
    }
  }

  return out;
}

/**
 * Compute the intersection of two arrays, using `pred` to determine equality
 */
export function intersectionWithPredicate<T>(
  array1: T[],
  array2: T[],
  pred: (elt1: T, elt2: T) => boolean
): T[] {
  return array1.filter(
    (elt1) => array2.find((elt2) => pred(elt1, elt2)) !== undefined
  );
}

/**
 * Compute the difference of two arrays, using `pred` to determine equality
 */
export function setDifferenceWithPredicate<T>(
  array1: T[],
  array2: T[],
  pred: (elt1: T, elt2: T) => boolean
): T[] {
  return array1.filter(
    (elt1) => array2.find((elt2) => pred(elt1, elt2)) === undefined
  );
}

/**
 * Compute the symmetric difference of two arrays, using `pred` to determine equality
 */
export function symmetricDifferenceWithPredicate<T>(
  array1: T[],
  array2: T[],
  pred: (elt1: T, elt2: T) => boolean
): T[] {
  return unionWithPredicate(
    setDifferenceWithPredicate(array1, array2, pred),
    setDifferenceWithPredicate(array2, array1, pred),
    pred
  );
}

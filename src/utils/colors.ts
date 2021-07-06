type Color = [number, number, number];
export const GREY: Color = [230, 230, 230];
export const GREEN: Color = [0, 255, 0];
export const RED: Color = [255, 0, 0];

/**
 * Given two colors and a value between 0 and 1, calculates the color that
 * lies "between" the `from` and `to` colors.
 *
 * Progress of 0 corresponds to the `from` color and progress of ` corresponds
 * to the `to` color. Anything in between interpolates between the two.
 */
export const interpolateColor = (
  from: Color,
  to: Color,
  progress: number
): Color => {
  const r = from[0] + (to[0] - from[0]) * progress;
  const g = from[1] + (to[1] - from[1]) * progress;
  const b = from[2] + (to[2] - from[2]) * progress;
  return [r, g, b];
};

/**
 * Converts a color array to a string representation for CODAP.
 * Truncates floats.
 */
export const colorToRgbString = ([r, g, b]: Color) => {
  return `rgb(${Math.trunc(r)},${Math.trunc(g)},${Math.trunc(b)})`;
};

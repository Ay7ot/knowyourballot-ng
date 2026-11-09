export type ListFit = { above: boolean; maxHeight: number };

/**
 * Where to show a search input's result list, and how tall it may be.
 *
 * Coordinates are CSS pixels relative to the layout viewport.
 * `viewportTop` and `viewportHeight` should come from `visualViewport`, so a
 * software keyboard that shrinks the visual viewport is taken into account.
 * `headerBottom` is the sticky header's bottom edge in the same coordinates.
 *
 * The list opens below the input and flips above it when there is too little
 * room below and more room above. `gap` is the space between the input and the
 * list; `edge` is the breathing room kept at the viewport or header edge.
 */
export function computeListFit(
  inputTop: number,
  inputBottom: number,
  viewportTop: number,
  viewportHeight: number,
  headerBottom = 0,
  gap = 8,
  edge = 12,
): ListFit {
  const visibleTop = Math.max(viewportTop, headerBottom);
  const visibleBottom = viewportTop + viewportHeight;
  if (inputBottom < visibleTop || inputTop > visibleBottom) return { above: false, maxHeight: 0 };

  const below = Math.max(0, visibleBottom - inputBottom - gap - edge);
  const above = Math.max(0, inputTop - visibleTop - gap - edge);
  // Flip only when the space below is genuinely tight and above is roomier.
  const up = below < 160 && above > below;
  return { above: up, maxHeight: up ? above : below };
}

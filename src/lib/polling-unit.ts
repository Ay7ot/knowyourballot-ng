const PU_RE = /^\s*(\d{1,2})\s*[/\-.\u00b7 ]\s*(\d{1,2})\s*[/\-.\u00b7 ]\s*(\d{1,2})\s*[/\-.\u00b7 ]\s*(\d{1,3})\s*$/;

export type PollingUnitParts = [string, string, string, string];

/** Accept the separators people actually type: slash, hyphen, dot, middle dot or space. */
export function matchPollingUnit(value: string): PollingUnitParts | null {
  const m = PU_RE.exec(value.trim());
  return m ? [m[1], m[2], m[3], m[4]] : null;
}

export function formatPollingUnit(parts: PollingUnitParts): string {
  return parts.join("/");
}

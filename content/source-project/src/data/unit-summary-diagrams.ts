/** Archify summaries available for the exam units, excluding reference appendices. */
export const UNIT_SUMMARY_CODES = [
  'M11101', 'M11102', 'M11103', 'M11201', 'M11202', 'M11203',
  'M12101', 'M12102', 'M12103', 'M12201', 'M12202', 'M12203',
  'M13101', 'M13201',
  'M21101', 'M21102', 'M21201', 'M21202',
  'M22101', 'M22102', 'M22201', 'M22202', 'M22301',
] as const;

const supportedCodes = new Set<string>(UNIT_SUMMARY_CODES);

export function getUnitSummaryAsset(topicCode: string): string | undefined {
  if (!supportedCodes.has(topicCode)) return undefined;
  return `${import.meta.env.BASE_URL}assets/interactive-diagrams/unit-summaries/${topicCode}.html`;
}

export function getUnitSummaryReaderAsset(topicCode: string): string | undefined {
  if (!supportedCodes.has(topicCode)) return undefined;
  return `${import.meta.env.BASE_URL}assets/interactive-diagrams/unit-summaries/${topicCode}.reader.json`;
}

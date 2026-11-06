/**
 * The economy in eight numbers. Every figure comes from an official publisher (NBS, CBN,
 * DMO, the Presidency, FAAC) and links to the report we read it in. Checked by hand;
 * update `checked` and the figures together.
 */
export const ECONOMY_CHECKED = "2026-11-06";

export type Source = { label: string; url: string };
export type Indicator = {
  id: string;
  title: string;
  /** The headline number, formatted. */
  value: string;
  /** What period or date the number is for. */
  asOf: string;
  /** One plain sentence on what it means. */
  plain: string;
  /** A concrete everyday comparison. */
  example?: string;
  /** Earlier values to compare with, newest first. */
  compare?: { label: string; value: string }[];
  /** Issue id on /who-decides. */
  issue?: string;
  /** Promise topic on /promises. */
  topic?: string;
  note?: string;
  sources: Source[];
};

const naira = (n: number) => `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

export const INDICATORS: Indicator[] = [
  {
    id: "inflation",
    title: "Inflation",
    value: "14.63%",
    asOf: "September 2026",
    plain: "Prices in September 2026 were 14.63% higher than a year before. Inflation has fallen four months in a row.",
    example: `Something that cost ${naira(1000)} in September 2025 cost about ${naira(1146)} in September 2026.`,
    compare: [
      { label: "Food inflation, Sept 2026", value: "19.59%" },
      { label: "August 2026", value: "15.39%" },
      { label: "September 2025", value: "20.98%" },
    ],
    issue: "prices",
    topic: "Economy",
    sources: [{ label: "NBS CPI report, via Nairametrics (15 Oct 2026)", url: "https://nairametrics.com/2026/10/15/nigerias-inflation-drops-to-14-63-in-september-2026-nbs/" }],
  },
  {
    id: "naira",
    title: "Naira to US dollar",
    value: "₦1,348.74",
    asOf: "5 November 2026, official market",
    plain: "What one US dollar cost at the official Nigerian Foreign Exchange Market. Street (parallel market) rates were about ₦1,400.",
    example: `$100 cost about ${naira(134874)} at the official rate.`,
    compare: [{ label: "30 June 2026 (rate DMO used)", value: "₦1,379" }],
    issue: "naira",
    topic: "Economy",
    sources: [
      { label: "CBN rate, via Vanguard (6 Nov 2026)", url: "https://www.vanguardngr.com/2026/11/dollar-to-naira-exchange-rate-today-november-6-2026/" },
      { label: "DMO debt report, via BusinessDay", url: "https://businessday.ng/business-economy/article/nigerias-public-debt-rises-by-n14-39trn-in-one-year-to-n166-79trn/" },
    ],
  },
  {
    id: "petrol",
    title: "Petrol price",
    value: "₦1,596 a litre",
    asOf: "May 2026, national average",
    plain: "The average pump price was 55% higher than a year earlier. It was highest in Edo (₦1,723) and lowest in Adamawa (₦1,470).",
    example: `Filling a 10-litre jerrycan cost about ${naira(15963)}, up from ${naira(10278)} in May 2025.`,
    compare: [
      { label: "April 2026", value: "₦1,533" },
      { label: "May 2025", value: "₦1,028" },
    ],
    issue: "fuel",
    topic: "Fuel and power",
    note: "This is the newest NBS petrol price report we could find.",
    sources: [{ label: "NBS Petrol Price Watch, via News Central (24 Jun 2026)", url: "https://newscentraltv.com/petrol-price-jumps-to-n1596-per-litre-nbs/" }],
  },
  {
    id: "jobs",
    title: "Unemployment",
    value: "4.3%",
    asOf: "April to June 2024",
    plain: "The share of people who want work and did none in the survey week. It looks low because NBS now counts anyone who worked at least one hour that week as employed, following the international (ILO) standard.",
    compare: [{ label: "January to March 2024", value: "5.3%" }],
    topic: "Jobs",
    note: "This is the newest NBS labour force figure we could find. Many people work but earn too little, which this number doesn't show.",
    sources: [{ label: "NBS Labour Force Survey, via Nairametrics (25 Nov 2024)", url: "https://nairametrics.com/2024/11/25/nigerias-unemployment-rate-drops-to-4-3-in-q2-2024-down-from-5-3-in-q1-nbs" }],
  },
  {
    id: "wage",
    title: "National minimum wage",
    value: "₦70,000 a month",
    asOf: "Set by law in July 2024",
    plain: "The lowest monthly pay the law allows for full-time workers. Each state and LGA pays its own staff, and not all pay it.",
    example: `At May 2026 prices, ${naira(70000)} buys about 44 litres of petrol, or about $52 at the official rate.`,
    issue: "wage",
    topic: "Jobs",
    sources: [
      { label: "Minimum Wage Act 2024, via Nairametrics (29 Jul 2024)", url: "https://nairametrics.com/2024/07/29/president-tinubu-signs-n70000-new-minimum-wage-into-law/" },
      { label: "What every state pays, Nairametrics (1 May 2026)", url: "https://nairametrics.com/2026/05/01/minimum-wage-2026-what-every-state-in-nigeria-pays/" },
    ],
  },
  {
    id: "budget",
    title: "Federal budget for 2026",
    value: "₦68.32 trillion",
    asOf: "Signed April 2026",
    plain: "What the federal government plans to spend in 2026. The President proposes it and the National Assembly can change it before he signs.",
    topic: "Economy",
    sources: [{ label: "State House, Abuja (17 Apr 2026)", url: "https://statehouse.gov.ng/president-tinubu-assents-to-2026-appropriation-bill-and-2025-budget-extension/" }],
  },
  {
    id: "debt",
    title: "Public debt",
    value: "₦166.79 trillion",
    asOf: "30 June 2026",
    plain: "Everything the federal and state governments owe. About 55% is borrowed inside Nigeria and 45% from abroad. That is about $121 billion.",
    compare: [
      { label: "Owed inside Nigeria", value: "₦91.59 trillion" },
      { label: "Owed abroad", value: "₦75.2 trillion" },
    ],
    topic: "Economy",
    sources: [{ label: "Debt Management Office, via BusinessDay (27 Sep 2026)", url: "https://businessday.ng/business-economy/article/nigerias-public-debt-rises-by-n14-39trn-in-one-year-to-n166-79trn/" }],
  },
  {
    id: "faac",
    title: "Money shared to states",
    value: "₦1.07 trillion",
    asOf: "August 2026 allocation, all 36 states",
    plain: "What the 36 states received in one month from the federation account, after deductions. Delta received the most, ₦98.27 billion. This is money your governor and State Assembly decide how to spend.",
    sources: [{ label: "FAAC data, compiled by Nairametrics Research (6 Nov 2026)", url: "https://nairametrics.com/2026/11/06/delta-tops-state-faac-disbursements-at-n98-27-billion-as-lagos-drops-to-fifth/" }],
  },
];

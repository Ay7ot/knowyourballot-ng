/**
 * Who controls what, in plain words. Based on the 1999 Constitution as amended:
 * Second Schedule Part I (Exclusive Legislative List, federal only), Part II (Concurrent
 * List, federal and states), and the Fourth Schedule (local government functions).
 * The Fifth Alteration (2023) moved electricity and railways onto the Concurrent List.
 * Kept deliberately simple: "mostly" means where the main decisions and money sit.
 */
import type { Office } from "./types";

export type Level = "federal" | "state" | "local";
export const LEVEL_NAME: Record<Level, string> = {
  federal: "Federal: President and National Assembly",
  state: "State: Governor and State Assembly",
  local: "Local government (LGA)",
};

export type Issue = { id: string; issue: string; mostly: Level[]; who: string; note: string; words: string };

export const ISSUES: Issue[] = [
  { id: "naira", issue: "The naira and exchange rate", mostly: ["federal"], who: "Central Bank of Nigeria, with the President's economic policy", note: "Currency, banking and foreign exchange are on the federal-only list.", words: "naira dollar exchange rate forex fx cbn currency" },
  { id: "prices", issue: "Inflation and the cost of living", mostly: ["federal"], who: "The Central Bank (interest rates) and the federal government (taxes, imports, spending)", note: "States affect local prices too, through their own taxes, levies and spending.", words: "inflation prices cost of living food prices expensive" },
  { id: "fuel", issue: "Petrol prices and supply", mostly: ["federal"], who: "Federal government policy and regulators; pump prices have been set by the market since the 2023 subsidy removal", note: "Oil, gas and mines are on the federal-only list.", words: "fuel petrol pms subsidy pump price oil gas refinery nnpc" },
  { id: "power", issue: "Electricity", mostly: ["federal", "state"], who: "Shared: since 2023 states can build and regulate their own power markets", note: "Many states are now setting up their own electricity regulators.", words: "electricity power light nepa disco tariff band" },
  { id: "security", issue: "Police, army and national security", mostly: ["federal"], who: "The President commands the armed forces and the Nigeria Police Force", note: "Governors are called chief security officers of their states but don't command the police. Many states fund local security outfits.", words: "security police army insecurity bandits kidnapping terrorism amotekun hisbah" },
  { id: "roads", issue: "Roads", mostly: ["federal", "state", "local"], who: "Federal highways by the federal government, most other roads by the state, local streets by the LGA", note: "Ask which road it is: a highway between states, a state road, or a street in your area.", words: "roads road highway potholes bridges streets" },
  { id: "schools", issue: "Schools and teachers", mostly: ["state", "local"], who: "States run public secondary schools and most primary schools with LGAs; federal government runs federal universities and unity colleges", note: "University strikes (ASUU) are a federal matter for federal universities.", words: "schools school education teachers primary secondary university asuu ubec" },
  { id: "health", issue: "Hospitals and clinics", mostly: ["state", "local"], who: "LGAs run primary health centres, states run general hospitals, federal runs teaching and federal medical centres", note: "", words: "health hospital hospitals clinic doctors healthcare phc" },
  { id: "water", issue: "Water and sanitation", mostly: ["state", "local"], who: "State water boards, and LGAs for refuse and drainage", note: "", words: "water borehole sanitation refuse waste drainage flooding" },
  { id: "markets", issue: "Markets, motor parks and refuse", mostly: ["local"], who: "Local governments", note: "These are listed LGA functions in the Constitution's Fourth Schedule.", words: "market markets motor park levies refuse touts" },
  { id: "wage", issue: "Minimum wage and salaries", mostly: ["federal"], who: "The National Assembly sets the national minimum wage by law", note: "Each state and LGA pays its own workers, so payment depends on them.", words: "minimum wage salary salaries pay workers pension" },
  { id: "tax", issue: "Taxes", mostly: ["federal", "state", "local"], who: "Federal: VAT and company tax. State: personal income tax. LGA: rates and some levies", note: "", words: "tax taxes vat levy levies firs income tax" },
  { id: "land", issue: "Land and housing", mostly: ["state"], who: "Governors control land in their state under the Land Use Act", note: "", words: "land housing c of o certificate of occupancy rent" },
];

/** What each office on your ballot can and can't change, in a sentence each. */
export const OFFICE_POWER: Record<Office, { can: string; cant: string; money: string }> = {
  president: {
    can: "Sets economic policy, commands the army and police, appoints ministers and the Central Bank governor, and proposes the federal budget.",
    cant: "Can't spend money or pass laws without the National Assembly, and doesn't run your state's schools or roads.",
    money: "Proposes the federal budget each year; the National Assembly can change it.",
  },
  senate: {
    can: "Passes federal laws, approves or changes the budget, confirms ministers, and can investigate and impeach.",
    cant: "Doesn't run projects directly. Constituency projects are carried out by federal agencies.",
    money: "Votes on the federal budget with the House of Representatives.",
  },
  rep: {
    can: "Passes federal laws, approves or changes the budget, starts money bills, and speaks for your federal constituency.",
    cant: "Doesn't run projects directly. Constituency projects are carried out by federal agencies.",
    money: "Votes on the federal budget with the Senate.",
  },
  governor: {
    can: "Runs your state: state roads, public schools, general hospitals, water, land and the state civil service.",
    cant: "Doesn't control the police, the naira or petrol prices.",
    money: "Spends the state budget, from its share of federation money plus state taxes.",
  },
  assembly: {
    can: "Passes state laws, approves or changes the state budget, and can investigate and impeach the governor.",
    cant: "Doesn't run projects directly or make federal law.",
    money: "Votes on the state budget and oversees how the governor spends it.",
  },
};

export type Term = { id: string; term: string; short: string; words?: string };
/** Election words people trip over, each defined in a sentence or two. */
export const GLOSSARY: Term[] = [
  { id: "pvc", term: "PVC", short: "Permanent Voter Card. Your voter's card from INEC. You need the physical card to vote.", words: "voter card voters card" },
  { id: "polling-unit", term: "Polling unit", short: "The exact place you registered to vote, often a school or open space. You can only vote there. Its code is on your PVC, like 24/14/05/012." },
  { id: "ward", term: "Ward", short: "A group of polling units inside an LGA. Results are collated ward by ward." },
  { id: "lga", term: "LGA", short: "Local Government Area. Nigeria has 774. Your LGA decides most of what's on your ballot." },
  { id: "senatorial-district", term: "Senatorial district", short: "One of three areas each state is split into to elect its senators. The FCT has one. 109 in total." },
  { id: "federal-constituency", term: "Federal constituency", short: "The area that elects one member of the House of Representatives. 360 in total, shared by population." },
  { id: "state-constituency", term: "State constituency", short: "The area that elects one member of your State House of Assembly. An LGA can have one or several." },
  { id: "national-assembly", term: "National Assembly", short: "Nigeria's federal parliament: the Senate and the House of Representatives together.", words: "nass" },
  { id: "running-mate", term: "Running mate", short: "The person who runs with a presidential or governorship candidate, and becomes vice president or deputy governor if they win." },
  { id: "bvas", term: "BVAS", short: "Bimodal Voter Accreditation System. INEC's device that checks your fingerprint or face before you vote, and sends a photo of the result sheet." },
  { id: "irev", term: "IReV", short: "INEC Result Viewing portal. The website where photos of polling unit result sheets are posted for anyone to see." },
  { id: "accreditation", term: "Accreditation", short: "Being checked and confirmed as a registered voter at your polling unit before you get a ballot." },
  { id: "off-cycle", term: "Off-cycle state", short: "A state whose governorship election falls on a different date because of past court rulings: Anambra, Bayelsa, Edo, Ekiti, Imo, Kogi, Ondo and Osun." },
  { id: "runoff", term: "Run-off", short: "A second round if no presidential candidate wins outright. To win outright, a candidate needs the most votes and at least 25% of the votes in two-thirds of the 36 states and the FCT." },
  { id: "faac", term: "FAAC", short: "Federation Account Allocation Committee. It shares federally collected money between the federal government, states and LGAs every month.", words: "allocation federation account" },
  { id: "sha", term: "SHA", short: "State House of Assembly. Your state's own lawmakers." },
];

/**
 * Education Level Hierarchy Mapping Utility.
 * This file translates dynamic user-entered education strings into numeric tiers
 * so that we can compare qualifications mathematically (e.g., verifying if a student's
 * completed level is >= the course's minimum required level) without relying solely on exact matches.
 * It also provides standard labels for UI dropdowns to guide user input.
 */

// Define standard education level options with tiers for UI dropdowns and comparison.
// These labels guide user input, but the tier matching is flexible for free-form text.
export const STANDARD_EDUCATION_LEVEL_OPTIONS = [
  { label: "+2 / High School", value: "+2", tier: 1 },
  { label: "Diploma", value: "diploma", tier: 2 },
  { label: "Foundation", value: "foundation", tier: 2 },
  { label: "Bachelor Degree", value: "bachelor", tier: 3 },
  { label: "Postgraduate Diploma", value: "pg_diploma", tier: 4 },
  { label: "Master Degree", value: "master", tier: 5 },
  { label: "PhD", value: "phd", tier: 6 }
];

// For courses, these are the typical "apply levels" a student would target.
export const STANDARD_COURSE_LEVEL_OPTIONS = [
  "Diploma",
  "Foundation",
  "Bachelor Degree",
  "Postgraduate Diploma",
  "Master Degree",
  "PhD"
];

// Keywords for dynamic tier mapping from free-form text input
const TIER_MAPPINGS = [
  { keywords: ["+2", "plus 2", "12", "high school", "senior secondary", "a level", "a-level", "plus2", "intermediate"], tier: 1 },
  { keywords: ["foundation", "diploma", "associate"], tier: 2 },
  { keywords: ["bachelor", "undergraduate", "bsc", "ba", "bba", "be", "btech", "graduate"], tier: 3 },
  { keywords: ["pg diploma", "postgraduate diploma", "pgd", "pg-diploma"], tier: 4 },
  { keywords: ["master", "msc", "ma", "mba", "postgraduate", "mtech", "mphil"], tier: 5 },
  { keywords: ["phd", "doctorate", "psd", "doctor"], tier: 6 }
];

/**
 * Returns the numeric tier for a given education level value.
 * Tries to match against standard options first, then against keywords.
 * @param {string} value - The education level string (e.g., "+2", "Bachelor Degree").
 * @returns {number} The tier level (1-6), or 0 if unrecognized.
 */
export const getEduTier = (value) => {
  if (!value) return 0; // Return 0 for no value, indicating lowest possible or unrecognized
  const norm = String(value).toLowerCase().trim();

  // Try to match against standard options first for exact matches
  const exactMatch = STANDARD_EDUCATION_LEVEL_OPTIONS.find(e => 
    e.value.toLowerCase() === norm || e.label.toLowerCase() === norm
  );
  if (exactMatch) return exactMatch.tier;

  // Fallback to keyword-based matching
  for (const mapping of TIER_MAPPINGS) {
    if (mapping.keywords.some(kw => norm.includes(kw))) {
      return mapping.tier;
    }
  }


  // If no match, return a default low tier or indicate unrecognized
  return 1; // Default to Tier 1 for unrecognized, to allow some flexibility
};

export const TEST_NAMES = ["IELTS", "PTE", "TOEFL", "DUOLINGO", "MOI"];

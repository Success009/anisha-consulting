import { getEduTier } from './educationHierarchy';

/**
 * Main logical matching engine.
 * Filters and ranks a list of courses based on a student profile.
 * 
 * @param {Array} courses - List of courses from the database.
 * @param {Object} studentProfile - Details entered during consultation.
 * @returns {Array} List of evaluated courses, sorted by eligibility and score.
 */
export const evaluateAndRankCourses = (courses, studentProfile) => {
  const { 
    gpa, 
    completed_education_level, 
    desired_apply_level, 
    test_results, 
    interested_countries 
  } = studentProfile;

  if (!gpa || !completed_education_level || !desired_apply_level) {
    return [ ];
  }

  const studentGpaNum = parseFloat(gpa);
  const studentEduTier = getEduTier(completed_education_level);

  const evaluated = courses.map(course => {
    let isEliminated = false;
    const reasons = [ ];

    // === PHASE I: HARD ELIMINATION ===

    // 1. Target Level Match (STRICT)
    const courseLvlNorm = (course.course_level || '').toLowerCase().trim();
    const studentLvlNorm = (desired_apply_level || '').toLowerCase().trim();
    if (courseLvlNorm !== studentLvlNorm) {
      isEliminated = true;
      reasons.push(`Target level mismatch: Student wants "${desired_apply_level}", course is "${course.course_level || 'N/A'}"`);
    }

    // 2. Minimum GPA Limit (STRICT)
    const minGpa = parseFloat(course.minimum_gpa) || 0;
    if (studentGpaNum < minGpa) {
      isEliminated = true;
      reasons.push(`GPA below requirement: Course requires minimum GPA of ${minGpa}, student has ${studentGpaNum}`);
    }

    // 3. Minimum Completed Education Tier (STRICT)
    const courseMinEduTier = getEduTier(course.minimum_education_level);
    if (studentEduTier < courseMinEduTier) {
      isEliminated = true;
      reasons.push(`Educational background unmet: Course requires minimum qualification level of "${course.minimum_education_level}", student has completed "${completed_education_level}"`);
    }

    // === PHASE II: SOFT SCORING & PRIORITIZATION ===
    let score = 0;
    const scoreBreakdown = [ ];

    if (!isEliminated) {
      // 1. Country Preference Weights
      const filteredCountries = (interested_countries || [ ]).map(c => c.trim().toLowerCase()).filter(Boolean);
      const courseCountryNorm = (course.country || '').trim().toLowerCase();
      
      const countryIdx = filteredCountries.indexOf(courseCountryNorm);
      if (countryIdx !== -1) {
        let countryBoost = 0;
        if (countryIdx === 0) countryBoost = 100;
        else if (countryIdx === 1) countryBoost = 50;
        else if (countryIdx === 2) countryBoost = 25;
        else countryBoost = 10;

        score += countryBoost;
        scoreBreakdown.push({ 
          label: `Match for Country Preference #${countryIdx + 1} (${course.country})`, 
          points: countryBoost 
        });
      }

      // 2. Proficiency Test Requirement Checks & Scores
      const courseTests = course.proficiency_tests || [ ];
      if (courseTests.length === 0) {
        score += 30;
        scoreBreakdown.push({ label: "No English proficiency test required", points: 30 });
      } else {
        let testMatched = false;
        let highestTestBonus = 0;
        let matchedTestLabel = "";

        for (const reqTest of courseTests) {
          if (!reqTest || !reqTest.test_name) continue;
          const reqTestName = reqTest.test_name.trim().toUpperCase();
          const studentTest = (test_results || [ ]).find(t => t && t.test_name && t.test_name.trim().toUpperCase() === reqTestName);

          // Handle Medium of Instruction (MOI) option
          if (reqTestName === 'MOI') {
            const hasMoi = (test_results || [ ]).some(t => t && t.test_name && t.test_name.trim().toUpperCase() === 'MOI');
            if (hasMoi) {
              testMatched = true;
              const moiBoost = 30;
              if (moiBoost > highestTestBonus) {
                highestTestBonus = moiBoost;
                matchedTestLabel = "Medium of Instruction (MOI) eligibility accepted";
              }
            }
          } else if (studentTest) {
            const reqScore = parseFloat(reqTest.minimum_score) || 0;
            const stdScore = parseFloat(studentTest.score) || 0;

            if (stdScore >= reqScore) {
              testMatched = true;
              let currentBoost = 30; // Base score for meeting requirements
              
              const diff = stdScore - reqScore;
              let scaleBonus = 0;
              if (reqTestName === 'IELTS') {
                scaleBonus = Math.floor(diff / 0.5) * 5;
              } else if (['PTE', 'DUOLINGO', 'TOEFL'].includes(reqTestName)) {
                scaleBonus = Math.floor(diff / 5) * 5;
              }
              
              currentBoost += scaleBonus;
              if (currentBoost > highestTestBonus) {
                highestTestBonus = currentBoost;
                matchedTestLabel = `Exceeded ${reqTest.test_name} minimum (Required: ${reqScore}, Student got: ${stdScore})`;
              }
            }
          }
        }

        if (testMatched) {
          score += highestTestBonus;
          scoreBreakdown.push({ label: matchedTestLabel, points: highestTestBonus });
        } else {
          score -= 40;
          scoreBreakdown.push({ 
            label: "Missing or insufficient English test score (Student needs to retake or choose MOI/another option)", 
            points: -40 
          });
        }
      }
    }

    return {
      ...course,
      isEliminated,
      reasons,
      score,
      scoreBreakdown
    };
  });

  // Sort matched courses: Non-eliminated at the top (highest scores first), then eliminated records
  return evaluated.sort((a, b) => {
    if (a.isEliminated && !b.isEliminated) return 1;
    if (!a.isEliminated && b.isEliminated) return -1;
    if (a.score !== b.score) return b.score - a.score;
    return (a.university_name || '').localeCompare(b.university_name || '');
  });
};

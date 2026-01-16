/**
 * WHO STEPS Risk Calculator for South Asian Populations
 * Based on WHO STEPS (Step 1) - Non-Lab Assessment
 * 
 * This calculator estimates risk for chronic lifestyle diseases:
 * - Diabetes
 * - Hypertension
 * - Cardiovascular Disease (CVD)
 * - Dyslipidemia
 * 
 * IMPORTANT: This is informational only and does NOT diagnose diseases.
 */

// South Asian-specific thresholds
const SOUTH_ASIAN_THRESHOLDS = {
    waist: {
        male: 90, // cm (lower than global 102cm)
        female: 80 // cm (lower than global 88cm)
    },
    bmi: {
        overweight: 23, // lower than global 25
        obese: 27.5 // lower than global 30
    }
};

/**
 * Calculate diabetes risk score (0-100)
 * Based on: Age, BMI, Waist, Family History, Physical Activity, Diet
 */
export function calculateDiabetesRisk(answers) {
    let score = 0;
    let confidence = 'high';

    // Age (0-20 points)
    const age = parseInt(answers.age) || 0;
    if (age >= 45) score += 20;
    else if (age >= 35) score += 15;
    else if (age >= 25) score += 5;

    // BMI (0-25 points) - South Asian thresholds
    const bmi = parseFloat(answers.bmi) || 0;
    if (bmi >= SOUTH_ASIAN_THRESHOLDS.bmi.obese) score += 25;
    else if (bmi >= SOUTH_ASIAN_THRESHOLDS.bmi.overweight) score += 15;
    else if (bmi >= 18.5) score += 5;

    // Waist circumference (0-20 points) - South Asian specific
    const waist = parseFloat(answers.waist) || 0;
    const gender = answers.gender || 'male';
    const waistThreshold = SOUTH_ASIAN_THRESHOLDS.waist[gender];
    if (waist > waistThreshold + 10) score += 20;
    else if (waist > waistThreshold) score += 15;

    // Family history (0-15 points)
    if (answers.family_diabetes === 'yes') score += 15;

    // Physical activity (0-10 points)
    if (answers.physical_activity === 'low') score += 10;
    else if (answers.physical_activity === 'moderate') score += 5;

    // Diet (0-10 points)
    if (answers.diet_sugar === 'high') score += 5;
    if (answers.diet_vegetables === 'low') score += 5;

    // Symptoms (soft signals, affects confidence)
    let symptomCount = 0;
    if (answers.symptom_thirst === 'yes') symptomCount++;
    if (answers.symptom_urination === 'yes') symptomCount++;
    if (answers.symptom_fatigue === 'yes') symptomCount++;

    if (symptomCount >= 2) {
        confidence = 'high';
    } else if (symptomCount === 1) {
        confidence = 'moderate';
    } else if (!answers.waist || !answers.bmi) {
        confidence = 'low';
    }

    return { score: Math.min(score, 100), confidence };
}

/**
 * Calculate hypertension risk score (0-15)
 * Based on: Age, BMI, Family History, Salt Intake, Stress, Physical Activity
 */
export function calculateHypertensionRisk(answers) {
    let score = 0;
    let confidence = 'high';

    // Age (0-3 points)
    const age = parseInt(answers.age) || 0;
    if (age >= 55) score += 3;
    else if (age >= 45) score += 2;
    else if (age >= 35) score += 1;

    // BMI (0-3 points)
    const bmi = parseFloat(answers.bmi) || 0;
    if (bmi >= SOUTH_ASIAN_THRESHOLDS.bmi.obese) score += 3;
    else if (bmi >= SOUTH_ASIAN_THRESHOLDS.bmi.overweight) score += 2;

    // Family history (0-2 points)
    if (answers.family_hypertension === 'yes') score += 2;

    // Salt intake (0-2 points)
    if (answers.diet_salt === 'high') score += 2;
    else if (answers.diet_salt === 'moderate') score += 1;

    // Stress (0-2 points)
    if (answers.stress_level === 'high') score += 2;
    else if (answers.stress_level === 'moderate') score += 1;

    // Physical activity (0-2 points)
    if (answers.physical_activity === 'low') score += 2;
    else if (answers.physical_activity === 'moderate') score += 1;

    // Tobacco (0-1 point)
    if (answers.tobacco_use === 'yes') score += 1;

    // Confidence based on data completeness
    if (!answers.bmi || !answers.age) {
        confidence = 'low';
    } else if (!answers.diet_salt || !answers.stress_level) {
        confidence = 'moderate';
    }

    return { score: Math.min(score, 15), confidence };
}

/**
 * Calculate CVD risk score (0-20)
 * Based on: Age, Gender, Tobacco, Family History, Physical Activity, BMI
 */
export function calculateCVDRisk(answers) {
    let score = 0;
    let confidence = 'high';

    // Age (0-5 points)
    const age = parseInt(answers.age) || 0;
    if (age >= 55) score += 5;
    else if (age >= 45) score += 4;
    else if (age >= 35) score += 2;

    // Gender (males higher risk)
    if (answers.gender === 'male' && age >= 45) score += 2;

    // Tobacco (0-4 points)
    if (answers.tobacco_use === 'yes') score += 4;

    // Family history (0-3 points)
    if (answers.family_heart === 'yes') score += 3;

    // BMI (0-3 points)
    const bmi = parseFloat(answers.bmi) || 0;
    if (bmi >= SOUTH_ASIAN_THRESHOLDS.bmi.obese) score += 3;
    else if (bmi >= SOUTH_ASIAN_THRESHOLDS.bmi.overweight) score += 2;

    // Physical activity (0-2 points)
    if (answers.physical_activity === 'low') score += 2;
    else if (answers.physical_activity === 'moderate') score += 1;

    // Stress (0-1 point)
    if (answers.stress_level === 'high') score += 1;

    // Confidence
    if (!answers.age || !answers.bmi) {
        confidence = 'low';
    } else if (!answers.tobacco_use || !answers.family_heart) {
        confidence = 'moderate';
    }

    return { score: Math.min(score, 20), confidence };
}

/**
 * Calculate dyslipidemia risk score (0-15)
 * Based on: Age, BMI, Diet, Physical Activity, Family History
 */
export function calculateDyslipidemiaRisk(answers) {
    let score = 0;
    let confidence = 'high';

    // Age (0-3 points)
    const age = parseInt(answers.age) || 0;
    if (age >= 45) score += 3;
    else if (age >= 35) score += 2;

    // BMI (0-4 points)
    const bmi = parseFloat(answers.bmi) || 0;
    if (bmi >= SOUTH_ASIAN_THRESHOLDS.bmi.obese) score += 4;
    else if (bmi >= SOUTH_ASIAN_THRESHOLDS.bmi.overweight) score += 3;

    // Diet - fried food (0-3 points)
    if (answers.diet_fried === 'high') score += 3;
    else if (answers.diet_fried === 'moderate') score += 2;

    // Physical activity (0-2 points)
    if (answers.physical_activity === 'low') score += 2;
    else if (answers.physical_activity === 'moderate') score += 1;

    // Family history (0-2 points)
    if (answers.family_cholesterol === 'yes') score += 2;

    // Waist (0-1 point)
    const waist = parseFloat(answers.waist) || 0;
    const gender = answers.gender || 'male';
    if (waist > SOUTH_ASIAN_THRESHOLDS.waist[gender]) score += 1;

    // Confidence
    if (!answers.bmi || !answers.age) {
        confidence = 'low';
    } else if (!answers.diet_fried || !answers.physical_activity) {
        confidence = 'moderate';
    }

    return { score: Math.min(score, 15), confidence };
}

/**
 * Get risk level classification
 * Conservative thresholds - better to under-claim than over-claim
 */
export function getRiskLevel(condition, score) {
    const thresholds = {
        diabetes: { low: 30, moderate: 60 }, // out of 100
        hypertension: { low: 5, moderate: 10 }, // out of 15
        cvd: { low: 7, moderate: 14 }, // out of 20
        dyslipidemia: { low: 5, moderate: 10 }, // out of 15
        thyroid: { low: 5, moderate: 12 } // out of 20
    };

    const t = thresholds[condition];
    if (!t) return { level: 'Low', color: 'text-[#648C81]', bg: 'bg-[#648C81]/10' };

    if (score >= t.moderate) {
        return { level: 'High', color: 'text-rose-600', bg: 'bg-rose-50' };
    } else if (score >= t.low) {
        return { level: 'Moderate', color: 'text-amber-600', bg: 'bg-amber-50' };
    } else {
        return { level: 'Low', color: 'text-[#648C81]', bg: 'bg-[#648C81]/10' };
    }
}

/**
 * Calculate all risk scores
 */
export function calculateAllRisks(answers) {
    const diabetes = calculateDiabetesRisk(answers);
    const hypertension = calculateHypertensionRisk(answers);
    const cvd = calculateCVDRisk(answers);
    const dyslipidemia = calculateDyslipidemiaRisk(answers);

    // Overall confidence is the lowest of all
    const confidences = [diabetes.confidence, hypertension.confidence, cvd.confidence, dyslipidemia.confidence];
    const overallConfidence = confidences.includes('low') ? 'low' :
        confidences.includes('moderate') ? 'moderate' : 'high';

    return {
        scores: {
            diabetes: diabetes.score,
            hypertension: hypertension.score,
            cvd: cvd.score,
            dyslipidemia: dyslipidemia.score,
            thyroid: 0 // Placeholder - thyroid requires different assessment
        },
        confidence: overallConfidence,
        individualConfidence: {
            diabetes: diabetes.confidence,
            hypertension: hypertension.confidence,
            cvd: cvd.confidence,
            dyslipidemia: dyslipidemia.confidence
        }
    };
}

/**
 * Get recommendation based on risk level
 * IMPORTANT: Never diagnose, only suggest medical review
 */
export function getRecommendation(riskLevel) {
    if (riskLevel === 'High') {
        return 'We recommend consulting with a healthcare professional for a comprehensive evaluation.';
    } else if (riskLevel === 'Moderate') {
        return 'Consider discussing these results with your doctor during your next visit.';
    } else {
        return 'Continue maintaining healthy lifestyle habits and regular check-ups.';
    }
}

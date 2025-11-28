/**
 * Unified Health Risk Assessment (UHRA) Calculator
 * Calculates 5 distinct risk scores from a single set of answers.
 */

export const calculateRiskScores = (answers) => {
    // Initialize scores
    let scores = {
        diabetes: 0,      // Range: 0-100
        hypertension: 0,  // Range: 0-15
        cvd: 0,           // Range: 0-20
        dyslipidemia: 0,  // Range: 0-15
        thyroid: 0        // Range: 0-20
    };

    // --- 1. DIABETES SCORE (IDRS-aligned) ---
    // Age
    if (answers.age < 35) scores.diabetes += 0;
    else if (answers.age <= 49) scores.diabetes += 20;
    else scores.diabetes += 30;

    // Waist
    // Assuming answers.waist is 'low', 'medium', 'high' mapped from the cm values
    if (answers.waist === 'medium') scores.diabetes += 10;
    if (answers.waist === 'high') scores.diabetes += 20;

    // Physical Activity
    if (answers.activity === 'moderate') scores.diabetes += 10;
    if (answers.activity === 'sedentary') scores.diabetes += 20;

    // Family History
    if (answers.family_diabetes === 'one') scores.diabetes += 10;
    if (answers.family_diabetes === 'both') scores.diabetes += 20;


    // --- 2. HYPERTENSION SCORE (WHO/NPCDCS aligned) ---
    if (answers.age > 40) scores.hypertension += 2;
    if (answers.bmi >= 25) scores.hypertension += 3;
    if (answers.salt === 'high') scores.hypertension += 2;
    if (answers.activity === 'sedentary') scores.hypertension += 2;
    if (answers.stress === 'high') scores.hypertension += 2;
    if (answers.family_bp === 'yes') scores.hypertension += 3;
    if (answers.tobacco === 'yes' || answers.alcohol === 'frequent') scores.hypertension += 3;


    // --- 3. CVD SCORE (WHO HEARTS aligned) ---
    // Age (Men >= 45, Women >= 50) - Simplified to 45+ if gender unknown
    const isAtRiskAge = answers.age >= 45;
    if (isAtRiskAge) scores.cvd += 4;

    if (answers.history_diabetes === 'yes') scores.cvd += 4;
    if (answers.history_bp === 'yes') scores.cvd += 4;
    if (answers.tobacco === 'yes') scores.cvd += 3;
    if (answers.family_heart === 'yes') scores.cvd += 3;
    if (answers.waist === 'high') scores.cvd += 2;


    // --- 4. DYSLIPIDEMIA SCORE (WHO/ICMR aligned) ---
    if (answers.age > 40) scores.dyslipidemia += 3;
    if (answers.history_diabetes === 'yes') scores.dyslipidemia += 4;
    if (answers.diet === 'high_fat') scores.dyslipidemia += 2;
    if (answers.activity === 'sedentary') scores.dyslipidemia += 2;
    if (answers.family_cholesterol === 'yes' || answers.family_heart === 'yes') scores.dyslipidemia += 3;
    if (answers.alcohol === 'frequent') scores.dyslipidemia += 1;


    // --- 5. THYROID SCORE (Clinical risk-aligned) ---
    if (answers.thyroid_symptoms === 'yes') scores.thyroid += 4;
    if (answers.family_thyroid === 'yes') scores.thyroid += 4;
    if (answers.gender === 'female') scores.thyroid += 2;
    if (answers.history_autoimmune === 'yes') scores.thyroid += 3;
    if (answers.neck_swelling === 'yes') scores.thyroid += 3;


    return scores;
};

export const getRiskLevel = (condition, score) => {
    switch (condition) {
        case 'diabetes':
            if (score < 30) return { level: 'Low', color: 'text-emerald-600', bg: 'bg-emerald-50' };
            if (score < 60) return { level: 'Moderate', color: 'text-amber-600', bg: 'bg-amber-50' };
            return { level: 'High', color: 'text-rose-600', bg: 'bg-rose-50' };

        case 'hypertension':
            if (score < 4) return { level: 'Low', color: 'text-emerald-600', bg: 'bg-emerald-50' };
            if (score < 8) return { level: 'Moderate', color: 'text-amber-600', bg: 'bg-amber-50' };
            return { level: 'High', color: 'text-rose-600', bg: 'bg-rose-50' };

        case 'cvd':
            if (score < 5) return { level: 'Low', color: 'text-emerald-600', bg: 'bg-emerald-50' };
            if (score < 10) return { level: 'Moderate', color: 'text-amber-600', bg: 'bg-amber-50' };
            return { level: 'High', color: 'text-rose-600', bg: 'bg-rose-50' };

        case 'dyslipidemia':
            if (score < 5) return { level: 'Low', color: 'text-emerald-600', bg: 'bg-emerald-50' };
            if (score < 10) return { level: 'Moderate', color: 'text-amber-600', bg: 'bg-amber-50' };
            return { level: 'High', color: 'text-rose-600', bg: 'bg-rose-50' };

        case 'thyroid':
            if (score < 5) return { level: 'Low', color: 'text-emerald-600', bg: 'bg-emerald-50' };
            if (score < 10) return { level: 'Moderate', color: 'text-amber-600', bg: 'bg-amber-50' };
            return { level: 'High', color: 'text-rose-600', bg: 'bg-rose-50' };

        default:
            return { level: 'Unknown', color: 'text-slate-600', bg: 'bg-slate-50' };
    }
};

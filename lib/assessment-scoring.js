// Assessment Scoring Logic for CareOn

export const calculateDiabetesScore = (responses) => {
  let score = 0;
  
  // Age scoring
  if (responses.age === '35-49') score += 20;
  else if (responses.age === '>=50') score += 30;
  
  // Waist circumference scoring
  if (responses.waist === 'moderate') score += 10;
  else if (responses.waist === 'high') score += 20;
  
  // Physical activity scoring
  if (responses.activity === 'moderate') score += 10;
  else if (responses.activity === 'sedentary') score += 20;
  
  // Family history scoring
  if (responses.familyDiabetes === 'one') score += 10;
  else if (responses.familyDiabetes === 'both') score += 20;
  
  return score;
};

export const calculateHypertensionScore = (responses) => {
  let score = 0;
  
  if (responses.age === '>=50') score += 2;
  if (responses.bmi === '25-29.9' || responses.bmi === '>=30') score += 3;
  if (responses.salt === 'high') score += 2;
  if (responses.activity === 'sedentary') score += 2;
  if (responses.stress === 'high') score += 2;
  if (responses.hypertensionHistory === 'yes') score += 3;
  if (responses.tobacco === 'yes' || responses.alcohol === 'weekly' || responses.alcohol === '>3/week') score += 3;
  
  return score;
};

export const calculateCVDScore = (responses) => {
  let score = 0;
  
  // Age and gender-based scoring
  if ((responses.gender === 'male' && responses.age === '>=50') || 
      (responses.gender === 'female' && responses.age === '>=50')) {
    score += 4;
  }
  
  if (responses.diabetesHistory === 'yes') score += 4;
  if (responses.hypertensionHistory === 'yes') score += 4;
  if (responses.tobacco === 'yes') score += 3;
  if (responses.familyCVD === 'yes') score += 3;
  if (responses.waist === 'high') score += 2;
  
  return score;
};

export const calculateDyslipidemiaScore = (responses) => {
  let score = 0;
  
  if (responses.age === '>=50') score += 3;
  if (responses.diabetesHistory === 'yes') score += 4;
  if (responses.diet === 'high-junk') score += 2;
  if (responses.activity === 'sedentary') score += 2;
  if (responses.familyCholesterol === 'yes') score += 3;
  if (responses.alcohol === '>3/week') score += 1;
  
  return score;
};

export const calculateThyroidScore = (responses) => {
  let score = 0;
  
  if (responses.thyroidSymptoms === 'yes') score += 4;
  if (responses.familyThyroid === 'yes') score += 4;
  if (responses.gender === 'female') score += 2;
  if (responses.autoimmune === 'yes') score += 3;
  if (responses.neckSwelling === 'yes') score += 3;
  
  return score;
};

export const getRiskLevel = (score, maxScore, type) => {
  const percentage = (score / maxScore) * 100;
  
  if (type === 'diabetes') {
    if (percentage < 30) return 'Low';
    if (percentage < 60) return 'Medium';
    return 'High';
  } else if (type === 'hypertension') {
    if (percentage < 33) return 'Low';
    if (percentage < 67) return 'Medium';
    return 'High';
  } else if (type === 'cvd') {
    if (percentage < 35) return 'Low';
    if (percentage < 65) return 'Medium';
    return 'High';
  } else if (type === 'dyslipidemia') {
    if (percentage < 33) return 'Low';
    if (percentage < 67) return 'Medium';
    return 'High';
  } else if (type === 'thyroid') {
    if (percentage < 30) return 'Low';
    if (percentage < 60) return 'Medium';
    return 'High';
  }
  
  return 'Medium';
};

export const calculateAllScores = (responses) => {
  const diabetesScore = calculateDiabetesScore(responses);
  const hypertensionScore = calculateHypertensionScore(responses);
  const cvdScore = calculateCVDScore(responses);
  const dyslipidemiaScore = calculateDyslipidemiaScore(responses);
  const thyroidScore = calculateThyroidScore(responses);
  
  return {
    diabetes_score: diabetesScore,
    hypertension_score: hypertensionScore,
    cvd_score: cvdScore,
    dyslipidemia_score: dyslipidemiaScore,
    thyroid_score: thyroidScore,
    diabetes_risk: getRiskLevel(diabetesScore, 100, 'diabetes'),
    hypertension_risk: getRiskLevel(hypertensionScore, 15, 'hypertension'),
    cvd_risk: getRiskLevel(cvdScore, 20, 'cvd'),
    dyslipidemia_risk: getRiskLevel(dyslipidemiaScore, 15, 'dyslipidemia'),
    thyroid_risk: getRiskLevel(thyroidScore, 20, 'thyroid')
  };
};

export const getRecommendations = (scores) => {
  const recommendations = [];
  
  if (scores.diabetes_risk === 'High' || scores.diabetes_risk === 'Medium') {
    recommendations.push({
      condition: 'Diabetes',
      message: 'Consider lifestyle modifications including regular exercise and balanced diet. Consult a doctor for screening.',
      priority: scores.diabetes_risk === 'High' ? 'urgent' : 'moderate'
    });
  }
  
  if (scores.hypertension_risk === 'High' || scores.hypertension_risk === 'Medium') {
    recommendations.push({
      condition: 'Hypertension',
      message: 'Monitor blood pressure regularly. Reduce salt intake and manage stress. Medical consultation recommended.',
      priority: scores.hypertension_risk === 'High' ? 'urgent' : 'moderate'
    });
  }
  
  if (scores.cvd_risk === 'High' || scores.cvd_risk === 'Medium') {
    recommendations.push({
      condition: 'Cardiovascular Disease',
      message: 'Heart health assessment recommended. Focus on heart-healthy diet and regular exercise.',
      priority: scores.cvd_risk === 'High' ? 'urgent' : 'moderate'
    });
  }
  
  if (scores.dyslipidemia_risk === 'High' || scores.dyslipidemia_risk === 'Medium') {
    recommendations.push({
      condition: 'Dyslipidemia',
      message: 'Lipid profile test recommended. Maintain healthy diet low in saturated fats.',
      priority: scores.dyslipidemia_risk === 'High' ? 'urgent' : 'moderate'
    });
  }
  
  if (scores.thyroid_risk === 'High' || scores.thyroid_risk === 'Medium') {
    recommendations.push({
      condition: 'Thyroid',
      message: 'Thyroid function tests recommended. Monitor symptoms and consult an endocrinologist.',
      priority: scores.thyroid_risk === 'High' ? 'urgent' : 'moderate'
    });
  }
  
  return recommendations;
};
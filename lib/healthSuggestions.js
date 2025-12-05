// Creative Health Suggestions for Disease Prevention
export const healthSuggestions = [
    {
        title: "💧 Hydration Hero Time!",
        message: "Drink a glass of water right now! Your kidneys will thank you. Aim for 8 glasses today to prevent kidney stones and UTIs!",
        icon: "💧"
    },
    {
        title: "🚶 Walk Away Diabetes!",
        message: "Take a 30-minute walk today! Regular walking reduces diabetes risk by 50%. Your future self will thank you!",
        icon: "🚶"
    },
    {
        title: "🥗 Rainbow Plate Challenge!",
        message: "Eat 5 different colored fruits/veggies today! Each color fights different diseases. Be a nutrition ninja!",
        icon: "🥗"
    },
    {
        title: "😴 Sleep = Superpower!",
        message: "Get 7-8 hours of sleep tonight! Good sleep prevents heart disease, obesity, and depression. Sweet dreams = healthy life!",
        icon: "😴"
    },
    {
        title: "🧘 Stress-Buster Alert!",
        message: "Take 5 deep breaths right now! Chronic stress causes 90% of diseases. Breathe in calm, breathe out stress!",
        icon: "🧘"
    },
    {
        title: "❤️ Heart Health Check!",
        message: "Check your blood pressure this week! High BP is the silent killer. Know your numbers, save your heart!",
        icon: "❤️"
    },
    {
        title: "🤸 Move It or Lose It!",
        message: "Do 10 jumping jacks NOW! Just 15 minutes of exercise daily reduces cancer risk by 20%. Let's go!",
        icon: "🤸"
    },
    {
        title: "📱 Digital Detox Time!",
        message: "No screens for the next hour! Blue light disrupts sleep and increases eye strain. Give your eyes a vacation!",
        icon: "📱"
    },
    {
        title: "🦷 Smile Saver!",
        message: "Brush and floss today! Gum disease is linked to heart disease and diabetes. A healthy mouth = healthy body!",
        icon: "🦷"
    },
    {
        title: "🌞 Vitamin D Boost!",
        message: "Get 15 minutes of sunlight today! Prevents bone diseases, depression, and boosts immunity. Sunshine is medicine!",
        icon: "🌞"
    },
    {
        title: "🧠 Brain Food Alert!",
        message: "Eat some nuts or fish today! Omega-3s prevent Alzheimer's and boost memory. Feed your brain!",
        icon: "🧠"
    },
    {
        title: "🍬 Sugar Swap Challenge!",
        message: "Replace one sugary drink with water today! Excess sugar causes diabetes, obesity, and heart disease. You got this!",
        icon: "🍬"
    },
    {
        title: "🏋️ Strength Training!",
        message: "Do 10 squats right now! Muscle strength prevents osteoporosis and falls in old age. Build strong bones!",
        icon: "🏋️"
    },
    {
        title: "🫁 Breathe Better!",
        message: "Practice deep breathing for 2 minutes! Improves lung capacity and prevents respiratory diseases. Inhale health!",
        icon: "🫁"
    },
    {
        title: "🥤 Alcohol Alert!",
        message: "Have an alcohol-free day today! Reduces liver disease, cancer, and heart disease risk. Your liver will celebrate!",
        icon: "🥤"
    },
    {
        title: "🧴 Skin Shield!",
        message: "Apply sunscreen if going out! Prevents skin cancer and premature aging. Protect your largest organ!",
        icon: "🧴"
    },
    {
        title: "🍎 Apple A Day!",
        message: "Eat an apple today! Rich in fiber and antioxidants, prevents heart disease and cancer. Crunch your way to health!",
        icon: "🍎"
    },
    {
        title: "🚭 Smoke-Free Zone!",
        message: "If you smoke, try to skip one cigarette today! Smoking causes 16 types of cancer. Every cigarette not smoked is a win!",
        icon: "🚭"
    },
    {
        title: "🧊 Cold Water Splash!",
        message: "Splash cold water on your face! Boosts circulation and reduces stress. Wake up your immune system!",
        icon: "🧊"
    },
    {
        title: "👥 Social Connection!",
        message: "Call a friend or family member today! Social isolation increases disease risk. Connection is medicine!",
        icon: "👥"
    }
];

/**
 * Get a random health suggestion
 */
export const getRandomHealthSuggestion = () => {
    return healthSuggestions[Math.floor(Math.random() * healthSuggestions.length)];
};

/**
 * Send health suggestion notification
 */
export const sendHealthSuggestion = () => {
    const suggestion = getRandomHealthSuggestion();

    if (Notification.permission === 'granted') {
        try {
            new Notification(suggestion.title, {
                body: suggestion.message,
                icon: '/icon-192x192.png',
                badge: '/badge-72x72.png',
                tag: 'health-suggestion',
                vibrate: [200, 100, 200, 100, 200]
            });
        } catch (error) {
            console.error('Notification error:', error);
        }
    }
};

/**
 * Get recommended doctor specializations based on risk scores
 */
export const getRecommendedSpecializations = (assessment) => {
    if (!assessment || !assessment.scores) return [];

    const recommendations = [];
    const scores = assessment.scores;

    // High diabetes risk
    if (scores.diabetes_risk >= 7) {
        recommendations.push({
            specialization: 'Endocrinologist',
            reason: 'High diabetes risk detected - Early intervention can prevent complications!',
            priority: 'high',
            riskScore: scores.diabetes_risk
        });
    }

    // High cardiovascular risk
    if (scores.cardiovascular_risk >= 7) {
        recommendations.push({
            specialization: 'Cardiologist',
            reason: 'High heart disease risk - Protect your heart with expert care!',
            priority: 'high',
            riskScore: scores.cardiovascular_risk
        });
    }

    // High hypertension risk
    if (scores.hypertension_risk >= 7) {
        recommendations.push({
            specialization: 'Cardiologist',
            reason: 'High blood pressure risk - Control it before it controls you!',
            priority: 'high',
            riskScore: scores.hypertension_risk
        });
    }

    // Moderate risks - General Physician
    if (scores.diabetes_risk >= 4 && scores.diabetes_risk < 7) {
        recommendations.push({
            specialization: 'General Physician',
            reason: 'Moderate diabetes risk - Prevention is better than cure!',
            priority: 'medium',
            riskScore: scores.diabetes_risk
        });
    }

    return recommendations;
};

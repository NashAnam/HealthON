// Comprehensive Nutrition Database for Search Suggestions
export const foodDatabase = [
    {
        name: 'Apple',
        calories: 52,
        protein: 0.3,
        carbs: 14,
        fats: 0.2,
        fiber: 2.4,
        gi: 36,
        vitamins: 'Vitamin C, Vitamin K',
        minerals: 'Potassium',
        category: 'Fruit'
    },
    {
        name: 'Banana',
        calories: 89,
        protein: 1.1,
        carbs: 23,
        fats: 0.3,
        fiber: 2.6,
        gi: 51,
        vitamins: 'Vitamin B6, Vitamin C',
        minerals: 'Potassium, Magnesium',
        category: 'Fruit'
    },
    {
        name: 'Chicken Breast (Grilled)',
        calories: 165,
        protein: 31,
        carbs: 0,
        fats: 3.6,
        fiber: 0,
        gi: 0,
        vitamins: 'Vitamin B6, Vitamin B12',
        minerals: 'Selenium, Phosphorus, Zinc',
        category: 'Protein'
    },
    {
        name: 'Salmon (Baked)',
        calories: 208,
        protein: 20,
        carbs: 0,
        fats: 13,
        fiber: 0,
        gi: 0,
        vitamins: 'Vitamin D, Vitamin B12, Vitamin B6',
        minerals: 'Selenium, Magnesium, Potassium',
        category: 'Protein/Healthy Fats'
    },
    {
        name: 'Brown Rice (Cooked)',
        calories: 112,
        protein: 2.6,
        carbs: 24,
        fats: 0.9,
        fiber: 1.8,
        gi: 50,
        vitamins: 'Vitamin B1, Vitamin B6',
        minerals: 'Magnesium, Phosphorus, Selenium',
        category: 'Grains'
    },
    {
        name: 'Oats (Cooked)',
        calories: 68,
        protein: 2.5,
        carbs: 12,
        fats: 1.4,
        fiber: 1.7,
        gi: 55,
        vitamins: 'Vitamin B1',
        minerals: 'Manganese, Phosphorus, Magnesium',
        category: 'Grains'
    },
    {
        name: 'Spinach (Raw)',
        calories: 23,
        protein: 2.9,
        carbs: 3.6,
        fats: 0.4,
        fiber: 2.2,
        gi: 15,
        vitamins: 'Vitamin A, Vitamin C, Vitamin K, Folate',
        minerals: 'Iron, Calcium, Magnesium, Potassium',
        category: 'Vegetable'
    },
    {
        name: 'Broccoli (Steamed)',
        calories: 35,
        protein: 2.4,
        carbs: 7.2,
        fats: 0.4,
        fiber: 3.3,
        gi: 15,
        vitamins: 'Vitamin C, Vitamin K, Vitamin A, Folate',
        minerals: 'Potassium, Manganese, Iron',
        category: 'Vegetable'
    },
    {
        name: 'Lentils (Cooked)',
        calories: 116,
        protein: 9,
        carbs: 20,
        fats: 0.4,
        fiber: 7.9,
        gi: 32,
        vitamins: 'Folate, Vitamin B1, Vitamin B6',
        minerals: 'Iron, Manganese, Phosphorus, Copper',
        category: 'Legumes/Protein'
    },
    {
        name: 'Greek Yogurt (Plain)',
        calories: 59,
        protein: 10,
        carbs: 3.6,
        fats: 0.4,
        fiber: 0,
        gi: 12,
        vitamins: 'Vitamin B12, Vitamin B2',
        minerals: 'Calcium, Phosphorus, Selenium',
        category: 'Dairy'
    },
    {
        name: 'Avocado',
        calories: 160,
        protein: 2,
        carbs: 8.5,
        fats: 15,
        fiber: 6.7,
        gi: 15,
        vitamins: 'Vitamin K, Folate, Vitamin C, Vitamin E, Vitamin B6',
        minerals: 'Potassium, Copper',
        category: 'Fruit/Healthy Fats'
    },
    {
        name: 'Almonds',
        calories: 579,
        protein: 21,
        carbs: 22,
        fats: 50,
        fiber: 12.5,
        gi: 15,
        vitamins: 'Vitamin E, Vitamin B2',
        minerals: 'Manganese, Magnesium, Copper, Phosphorus',
        category: 'Nuts'
    },
    {
        name: 'Eggs (Boiled)',
        calories: 155,
        protein: 13,
        carbs: 1.1,
        fats: 11,
        fiber: 0,
        gi: 0,
        vitamins: 'Vitamin B12, Vitamin D, Vitamin A, Vitamin B2',
        minerals: 'Selenium, Phosphorus, Iodine, Zinc',
        category: 'Protein'
    },
    {
        name: 'Quinoa (Cooked)',
        calories: 120,
        protein: 4.4,
        carbs: 21,
        fats: 1.9,
        fiber: 2.8,
        gi: 53,
        vitamins: 'Folate, Vitamin B1, Vitamin B6',
        minerals: 'Manganese, Magnesium, Phosphorus, Copper',
        category: 'Grains'
    },
    {
        name: 'Sweet Potato (Baked)',
        calories: 90,
        protein: 2,
        carbs: 21,
        fats: 0.1,
        fiber: 3.3,
        gi: 70,
        vitamins: 'Vitamin A, Vitamin C, Vitamin B6',
        minerals: 'Potassium, Manganese, Copper',
        category: 'Vegetable'
    }
];

export const searchFood = (query) => {
    if (!query) return [];
    const lowQuery = query.toLowerCase();
    return foodDatabase.filter(food =>
        food.name.toLowerCase().includes(lowQuery) ||
        food.category.toLowerCase().includes(lowQuery)
    ).slice(0, 5);
};

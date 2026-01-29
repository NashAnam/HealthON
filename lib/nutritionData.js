// Comprehensive Nutrition Database for Search Suggestions
// Values are per 100g of the food item
export const foodDatabase = [
    // --- Fruits ---
    { name: 'Apple', calories: 52, protein: 0.3, carbs: 14, fats: 0.2, fiber: 2.4, gi: 36, vitamins: 'C, K', minerals: 'Potassium', category: 'Fruit' },
    { name: 'Banana', calories: 89, protein: 1.1, carbs: 23, fats: 0.3, fiber: 2.6, gi: 51, vitamins: 'B6, C', minerals: 'Potassium, Magnesium', category: 'Fruit' },
    { name: 'Kiwi', calories: 61, protein: 1.1, carbs: 15, fats: 0.5, fiber: 3.0, gi: 50, vitamins: 'C, K, E', minerals: 'Potassium, Copper', category: 'Fruit' },
    { name: 'Mango', calories: 60, protein: 0.8, carbs: 15, fats: 0.4, fiber: 1.6, gi: 51, vitamins: 'A, C, E, K', minerals: 'Potassium, Magnesium', category: 'Fruit' },
    { name: 'Orange', calories: 47, protein: 0.9, carbs: 12, fats: 0.1, fiber: 2.4, gi: 40, vitamins: 'C, A', minerals: 'Calcium, Potassium', category: 'Fruit' },
    { name: 'Guava', calories: 68, protein: 2.6, carbs: 14, fats: 1.0, fiber: 5.4, gi: 32, vitamins: 'C, A', minerals: 'Potassium, Magnesium', category: 'Fruit' },
    { name: 'Papaya', calories: 43, protein: 0.5, carbs: 11, fats: 0.3, fiber: 1.7, gi: 59, vitamins: 'C, A, Folate', minerals: 'Potassium, Magnesium', category: 'Fruit' },
    { name: 'Watermelon', calories: 30, protein: 0.6, carbs: 8, fats: 0.2, fiber: 0.4, gi: 72, vitamins: 'C, A', minerals: 'Potassium', category: 'Fruit' },
    { name: 'Grapes', calories: 69, protein: 0.7, carbs: 18, fats: 0.2, fiber: 0.9, gi: 53, vitamins: 'C, K', minerals: 'Potassium', category: 'Fruit' },
    { name: 'Pineapple', calories: 50, protein: 0.5, carbs: 13, fats: 0.1, fiber: 1.4, gi: 59, vitamins: 'C, B6', minerals: 'Manganese, Potassium', category: 'Fruit' },

    // --- Indian Main Course ---
    { name: 'Chicken Biryani', calories: 220, protein: 12, carbs: 28, fats: 8, fiber: 1.2, gi: 65, vitamins: 'B12, B6', minerals: 'Iron, Zinc', category: 'Indian' },
    { name: 'Veg Biryani', calories: 190, protein: 5, carbs: 32, fats: 6, fiber: 2.5, gi: 60, vitamins: 'A, C', minerals: 'Potassium, Iron', category: 'Indian' },
    { name: 'Paneer Tikka', calories: 230, protein: 15, carbs: 6, fats: 18, fiber: 0.5, gi: 30, vitamins: 'B12, A', minerals: 'Calcium, Phosphorus', category: 'Indian' },
    { name: 'Dal Tadka', calories: 120, protein: 7, carbs: 18, fats: 3, fiber: 5.0, gi: 35, vitamins: 'B1, B6, Folate', minerals: 'Iron, Magnesium', category: 'Indian' },
    { name: 'Butter Chicken', calories: 260, protein: 18, carbs: 8, fats: 19, fiber: 0.5, gi: 45, vitamins: 'B12, A', minerals: 'Iron, Zinc', category: 'Indian' },
    { name: 'Palak Paneer', calories: 160, protein: 10, carbs: 7, fats: 11, fiber: 3.5, gi: 30, vitamins: 'A, C, K, B12', minerals: 'Iron, Calcium', category: 'Indian' },
    { name: 'Rajma Masala', calories: 140, protein: 8.5, carbs: 21, fats: 2.5, fiber: 7.0, gi: 25, vitamins: 'Folate, B1', minerals: 'Iron, Magnesium, Potassium', category: 'Indian' },
    { name: 'Chole Masala', calories: 165, protein: 8, carbs: 24, fats: 4.5, fiber: 8.0, gi: 28, vitamins: 'C, B6, Folate', minerals: 'Iron, Magnesium', category: 'Indian' },
    { name: 'Roti (Whole Wheat)', calories: 260, protein: 9, carbs: 55, fats: 1.5, fiber: 7.0, gi: 62, vitamins: 'B1, B3, B6', minerals: 'Magnesium, Phosphorus', category: 'Indian' },
    { name: 'Aloo Paratha', calories: 280, protein: 5, carbs: 45, fats: 10, fiber: 4.0, gi: 75, vitamins: 'C, B6', minerals: 'Potassium', category: 'Indian' },
    { name: 'Dosa (Plain)', calories: 135, protein: 3, carbs: 28, fats: 1.5, fiber: 1.0, gi: 77, vitamins: 'B1, B2', minerals: 'Calcium, Iron', category: 'Indian' },
    { name: 'Idli (Rice)', calories: 110, protein: 2.5, carbs: 24, fats: 0.2, fiber: 0.8, gi: 70, vitamins: 'B complex', minerals: 'Iron, Calcium', category: 'Indian' },
    { name: 'Masala Dosa', calories: 210, protein: 4, carbs: 32, fats: 8, fiber: 2.5, gi: 70, vitamins: 'C, B6', minerals: 'Potassium, Iron', category: 'Indian' },
    { name: 'Sambar', calories: 85, protein: 4, carbs: 12, fats: 2, fiber: 3.5, gi: 45, vitamins: 'A, C, Folate', minerals: 'Potassium, Iron', category: 'Indian' },

    // --- Global / Fast Food ---
    { name: 'Noodles (Veg)', calories: 175, protein: 4.5, carbs: 30, fats: 4, fiber: 1.5, gi: 55, vitamins: 'B1, B3', minerals: 'Iron, Sodium', category: 'Global' },
    { name: 'Noodles (Chicken)', calories: 210, protein: 10, carbs: 28, fats: 7, fiber: 1.2, gi: 55, vitamins: 'B12, B6', minerals: 'Iron, Selenium', category: 'Global' },
    { name: 'Pasta (White Sauce)', calories: 240, protein: 8, carbs: 35, fats: 10, fiber: 1.0, gi: 60, vitamins: 'B1, B2', minerals: 'Calcium, Sodium', category: 'Global' },
    { name: 'Pizza (Margherita)', calories: 265, protein: 11, carbs: 33, fats: 10, fiber: 2.2, gi: 80, vitamins: 'A, B12', minerals: 'Calcium, Sodium', category: 'Global' },
    { name: 'Burger (Veg)', calories: 250, protein: 8, carbs: 40, fats: 7, fiber: 3.5, gi: 75, vitamins: 'C, B6', minerals: 'Iron, Sodium', category: 'Global' },
    { name: 'Chicken Nuggets', calories: 295, protein: 16, carbs: 15, fats: 20, fiber: 0.5, gi: 60, vitamins: 'B6, B12', minerals: 'Sodium, Phosphorus', category: 'Global' },
    { name: 'French Fries', calories: 312, protein: 3.4, carbs: 41, fats: 15, fiber: 3.8, gi: 103, vitamins: 'C, B6', minerals: 'Potassium, Sodium', category: 'Global' },
    { name: 'Sushi (Salmon)', calories: 150, protein: 6, carbs: 28, fats: 1.5, fiber: 0.5, gi: 55, vitamins: 'D, B12', minerals: 'Iodine, Selenium', category: 'Global' },

    // --- Proteins & Veggies ---
    { name: 'Paneer (Raw)', calories: 265, protein: 18, carbs: 1.2, fats: 20, fiber: 0, gi: 15, vitamins: 'B12, A', minerals: 'Calcium, Phosphorus', category: 'Protein' },
    { name: 'Chicken Breast (Grilled)', calories: 165, protein: 31, carbs: 0, fats: 3.6, fiber: 0, gi: 0, vitamins: 'B6, B12', minerals: 'Selenium, Phosphorus, Zinc', category: 'Protein' },
    { name: 'Salmon (Baked)', calories: 208, protein: 20, carbs: 0, fats: 13, fiber: 0, gi: 0, vitamins: 'D, B12, B6', minerals: 'Selenium, Magnesium, Potassium', category: 'Protein' },
    { name: 'Eggs (Boiled)', calories: 155, protein: 13, carbs: 1.1, fats: 11, fiber: 0, gi: 0, vitamins: 'B12, D, A, B2', minerals: 'Selenium, Phosphorus, Iodine', category: 'Protein' },
    { name: 'Spinach (Raw)', calories: 23, protein: 2.9, carbs: 3.6, fats: 0.4, fiber: 2.2, gi: 15, vitamins: 'A, C, K, Folate', minerals: 'Iron, Calcium, Magnesium', category: 'Vegetable' },
    { name: 'Broccoli (Steamed)', calories: 35, protein: 2.4, carbs: 7.2, fats: 0.4, fiber: 3.3, gi: 15, vitamins: 'C, K, A, Folate', minerals: 'Potassium, Manganese', category: 'Vegetable' },
    { name: 'Carrot (Raw)', calories: 41, protein: 0.9, carbs: 10, fats: 0.2, fiber: 2.8, gi: 35, vitamins: 'A, K, B6', minerals: 'Potassium', category: 'Vegetable' },
    { name: 'Cauliflower (Steamed)', calories: 25, protein: 1.9, carbs: 5.0, fats: 0.3, fiber: 2.0, gi: 15, vitamins: 'C, K, B6', minerals: 'Potassium, Manganese', category: 'Vegetable' },
    { name: 'Sweet Potato (Baked)', calories: 90, protein: 2, carbs: 21, fats: 0.1, fiber: 3.3, gi: 70, vitamins: 'A, C, B6', minerals: 'Potassium, Manganese', category: 'Vegetable' },

    // --- Grains & Legumes ---
    { name: 'Brown Rice (Cooked)', calories: 112, protein: 2.6, carbs: 24, fats: 0.9, fiber: 1.8, gi: 50, vitamins: 'B1, B6', minerals: 'Magnesium, Selenium', category: 'Grains' },
    { name: 'Quinoa (Cooked)', calories: 120, protein: 4.4, carbs: 21, fats: 1.9, fiber: 2.8, gi: 53, vitamins: 'Folate, B1, B6', minerals: 'Manganese, Magnesium', category: 'Grains' },
    { name: 'Oats (Cooked)', calories: 68, protein: 2.5, carbs: 12, fats: 1.4, fiber: 1.7, gi: 55, vitamins: 'B1', minerals: 'Manganese, Phosphorus', category: 'Grains' },
    { name: 'Lentils (Cooked)', calories: 116, protein: 9, carbs: 20, fats: 0.4, fiber: 7.9, gi: 32, vitamins: 'Folate, B1, B6', minerals: 'Iron, Manganese', category: 'Legumes' },
    { name: 'Chickpeas (Cooked)', calories: 164, protein: 8.9, carbs: 27, fats: 2.6, fiber: 7.6, gi: 28, vitamins: 'B6, Folate', minerals: 'Iron, Magnesium', category: 'Legumes' },

    // --- Snacks & Others ---
    { name: 'Almonds', calories: 579, protein: 21, carbs: 22, fats: 50, fiber: 12.5, gi: 15, vitamins: 'E, B2', minerals: 'Manganese, Magnesium', category: 'Nuts' },
    { name: 'Walnuts', calories: 654, protein: 15, carbs: 14, fats: 65, fiber: 6.7, gi: 15, vitamins: 'B6, E', minerals: 'Copper, Manganese, Magnesium', category: 'Nuts' },
    { name: 'Greek Yogurt (Plain)', calories: 59, protein: 10, carbs: 3.6, fats: 0.4, fiber: 0, gi: 12, vitamins: 'B12, B2', minerals: 'Calcium, Phosphorus', category: 'Dairy' },
    { name: 'Milk (Cow, 1%)', calories: 42, protein: 3.4, carbs: 5, fats: 1, fiber: 0, gi: 32, vitamins: 'D, B12, A', minerals: 'Calcium, Phosphorus', category: 'Dairy' },
    { name: 'Dark Chocolate (70%)', calories: 600, protein: 8, carbs: 45, fats: 43, fiber: 11, gi: 23, vitamins: 'K', minerals: 'Iron, Magnesium, Copper', category: 'Snack' }
];

export const searchFood = (query) => {
    if (!query) return [];
    const lowQuery = query.toLowerCase().trim();

    // Prioritize results that start with the query, then those that contain it
    const primary = foodDatabase.filter(food =>
        food.name.toLowerCase().startsWith(lowQuery)
    );

    const secondary = foodDatabase.filter(food =>
        !food.name.toLowerCase().startsWith(lowQuery) &&
        (food.name.toLowerCase().includes(lowQuery) || food.category.toLowerCase().includes(lowQuery))
    );

    return [...primary, ...secondary].slice(0, 8);
};

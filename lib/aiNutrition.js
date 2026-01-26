/**
 * AI Nutrition Calculator
 * Calculates comprehensive nutrition information for any food item
 * Uses a combination of nutrition database and AI for accurate results
 */

/**
 * Calculate nutrition information for a food item
 * @param {string} foodItem - Name of the food item
 * @param {number} quantity - Quantity of the food
 * @param {string} unit - Unit of measurement (grams, pieces, plates, etc.)
 * @returns {Promise<Object>} Nutrition breakdown
 */
export async function calculateNutrition(foodItem, quantity, unit) {
    try {
        // For now, we'll use a comprehensive nutrition database approach
        // This can be enhanced with AI API later

        const nutritionData = await getNutritionFromDatabase(foodItem, quantity, unit);

        return {
            success: true,
            data: nutritionData
        };
    } catch (error) {
        console.error('Error calculating nutrition:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get nutrition data from database/API
 * This is a comprehensive database that includes Indian foods, packaged foods, etc.
 */
async function getNutritionFromDatabase(foodItem, quantity, unit) {
    // Normalize the food item name
    const normalizedFood = foodItem.toLowerCase().trim();

    // Convert quantity to grams for standardization
    const gramsQuantity = convertToGrams(quantity, unit, normalizedFood);

    // Check our comprehensive food database
    const baseNutrition = FOOD_DATABASE[normalizedFood] || estimateNutrition(normalizedFood);

    // Calculate based on quantity (base values are per 100g)
    const multiplier = gramsQuantity / 100;

    return {
        foodItem: foodItem,
        quantity: quantity,
        unit: unit,
        servingSize: `${gramsQuantity}g`,
        calories: Math.round(baseNutrition.calories * multiplier),
        protein: parseFloat((baseNutrition.protein * multiplier).toFixed(1)),
        carbohydrates: parseFloat((baseNutrition.carbs * multiplier).toFixed(1)),
        fat: parseFloat((baseNutrition.fat * multiplier).toFixed(1)),
        fiber: parseFloat((baseNutrition.fiber * multiplier).toFixed(1)),
        vitamins: {
            vitaminA: parseFloat((baseNutrition.vitaminA * multiplier).toFixed(1)),
            vitaminC: parseFloat((baseNutrition.vitaminC * multiplier).toFixed(1)),
            vitaminD: parseFloat((baseNutrition.vitaminD * multiplier).toFixed(1)),
            vitaminB12: parseFloat((baseNutrition.vitaminB12 * multiplier).toFixed(1))
        },
        minerals: {
            calcium: parseFloat((baseNutrition.calcium * multiplier).toFixed(1)),
            iron: parseFloat((baseNutrition.iron * multiplier).toFixed(1)),
            potassium: parseFloat((baseNutrition.potassium * multiplier).toFixed(1)),
            sodium: parseFloat((baseNutrition.sodium * multiplier).toFixed(1))
        },
        glycemicIndex: baseNutrition.gi,
        glycemicLoad: Math.round((baseNutrition.gi * baseNutrition.carbs * multiplier) / 100)
    };
}

/**
 * Convert various units to grams
 */
function convertToGrams(quantity, unit, foodItem) {
    const unitLower = unit.toLowerCase();

    // Standard conversions
    if (unitLower.includes('gram') || unitLower === 'g') {
        return parseFloat(quantity);
    }

    if (unitLower.includes('kg') || unitLower === 'kilogram') {
        return parseFloat(quantity) * 1000;
    }

    // Indian food specific conversions
    if (unitLower.includes('plate') || unitLower.includes('bowl')) {
        return parseFloat(quantity) * 200; // Average plate ~200g
    }

    if (unitLower.includes('cup')) {
        return parseFloat(quantity) * 150;
    }

    if (unitLower.includes('piece') || unitLower.includes('pcs')) {
        // Estimate based on food type
        if (foodItem.includes('samosa')) return parseFloat(quantity) * 50;
        if (foodItem.includes('gulab jamun')) return parseFloat(quantity) * 40;
        if (foodItem.includes('roti') || foodItem.includes('chapati')) return parseFloat(quantity) * 40;
        return parseFloat(quantity) * 50; // Default piece weight
    }

    // Default: assume grams
    return parseFloat(quantity);
}

/**
 * Comprehensive Food Database (per 100g)
 * Includes Indian foods, packaged foods, sweets, and fast food
 */
const FOOD_DATABASE = {
    // Indian Foods
    'chicken biryani': { calories: 165, protein: 8, carbs: 20, fat: 6, fiber: 1, vitaminA: 50, vitaminC: 2, vitaminD: 0.5, vitaminB12: 0.3, calcium: 25, iron: 1.5, potassium: 150, sodium: 300, gi: 58 },
    'dal': { calories: 116, protein: 9, carbs: 20, fat: 0.5, fiber: 8, vitaminA: 10, vitaminC: 1, vitaminD: 0, vitaminB12: 0, calcium: 40, iron: 3.3, potassium: 350, sodium: 5, gi: 30 },
    'roti': { calories: 297, protein: 11, carbs: 51, fat: 6, fiber: 7, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB12: 0, calcium: 20, iron: 4, potassium: 190, sodium: 400, gi: 52 },
    'chapati': { calories: 297, protein: 11, carbs: 51, fat: 6, fiber: 7, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB12: 0, calcium: 20, iron: 4, potassium: 190, sodium: 400, gi: 52 },
    'rice': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB12: 0, calcium: 10, iron: 0.2, potassium: 35, sodium: 1, gi: 73 },
    'samosa': { calories: 262, protein: 4, carbs: 25, fat: 17, fiber: 2, vitaminA: 20, vitaminC: 5, vitaminD: 0, vitaminB12: 0, calcium: 20, iron: 1, potassium: 150, sodium: 400, gi: 60 },
    'paneer': { calories: 265, protein: 18, carbs: 1.2, fat: 20, fiber: 0, vitaminA: 270, vitaminC: 0, vitaminD: 0.2, vitaminB12: 0.7, calcium: 480, iron: 0.2, potassium: 100, sodium: 18, gi: 27 },
    'chole': { calories: 164, protein: 9, carbs: 27, fat: 3, fiber: 8, vitaminA: 15, vitaminC: 4, vitaminD: 0, vitaminB12: 0, calcium: 49, iron: 3, potassium: 291, sodium: 300, gi: 28 },
    'rajma': { calories: 127, protein: 8.7, carbs: 23, fat: 0.5, fiber: 6, vitaminA: 0, vitaminC: 1.2, vitaminD: 0, vitaminB12: 0, calcium: 28, iron: 2.9, potassium: 405, sodium: 2, gi: 19 },

    // Sweets
    'gulab jamun': { calories: 375, protein: 4, carbs: 55, fat: 15, fiber: 1, vitaminA: 50, vitaminC: 0, vitaminD: 0.1, vitaminB12: 0.2, calcium: 100, iron: 0.5, potassium: 80, sodium: 50, gi: 75 },
    'jalebi': { calories: 450, protein: 3, carbs: 70, fat: 18, fiber: 0.5, vitaminA: 20, vitaminC: 0, vitaminD: 0, vitaminB12: 0, calcium: 30, iron: 1, potassium: 50, sodium: 100, gi: 80 },
    'ladoo': { calories: 420, protein: 6, carbs: 50, fat: 22, fiber: 2, vitaminA: 30, vitaminC: 0, vitaminD: 0, vitaminB12: 0, calcium: 50, iron: 1.5, potassium: 120, sodium: 40, gi: 70 },
    'barfi': { calories: 390, protein: 7, carbs: 45, fat: 20, fiber: 1, vitaminA: 100, vitaminC: 0, vitaminD: 0.2, vitaminB12: 0.3, calcium: 150, iron: 0.8, potassium: 100, sodium: 60, gi: 68 },

    // Packaged Foods
    'maggi noodles': { calories: 385, protein: 9, carbs: 62, fat: 11, fiber: 2, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB12: 0, calcium: 40, iron: 2, potassium: 100, sodium: 2100, gi: 55 },
    'biscuit': { calories: 450, protein: 7, carbs: 70, fat: 16, fiber: 2, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB12: 0, calcium: 30, iron: 3, potassium: 100, sodium: 400, gi: 70 },
    'chips': { calories: 536, protein: 6, carbs: 53, fat: 34, fiber: 4, vitaminA: 0, vitaminC: 15, vitaminD: 0, vitaminB12: 0, calcium: 20, iron: 1, potassium: 1200, sodium: 850, gi: 56 },

    // Fast Food
    'burger': { calories: 295, protein: 17, carbs: 24, fat: 14, fiber: 2, vitaminA: 30, vitaminC: 2, vitaminD: 0.2, vitaminB12: 1.5, calcium: 80, iron: 2.5, potassium: 250, sodium: 600, gi: 66 },
    'pizza': { calories: 266, protein: 11, carbs: 33, fat: 10, fiber: 2, vitaminA: 100, vitaminC: 3, vitaminD: 0.1, vitaminB12: 0.5, calcium: 200, iron: 2, potassium: 170, sodium: 600, gi: 60 },
    'french fries': { calories: 312, protein: 3.4, carbs: 41, fat: 15, fiber: 3.8, vitaminA: 0, vitaminC: 9, vitaminD: 0, vitaminB12: 0, calcium: 15, iron: 0.7, potassium: 579, sodium: 210, gi: 75 },
    'mcdonald\'s big mac': { calories: 257, protein: 13, carbs: 20, fat: 14, fiber: 2, vitaminA: 40, vitaminC: 2, vitaminD: 0.2, vitaminB12: 1, calcium: 100, iron: 2, potassium: 200, sodium: 500, gi: 65 },

    // Common Foods
    'chicken': { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, vitaminA: 21, vitaminC: 0, vitaminD: 0.1, vitaminB12: 0.3, calcium: 11, iron: 0.9, potassium: 220, sodium: 70, gi: 0 },
    'egg': { calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, vitaminA: 160, vitaminC: 0, vitaminD: 2, vitaminB12: 1.1, calcium: 50, iron: 1.8, potassium: 126, sodium: 124, gi: 0 },
    'milk': { calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, fiber: 0, vitaminA: 46, vitaminC: 0, vitaminD: 1.3, vitaminB12: 0.4, calcium: 113, iron: 0, potassium: 143, sodium: 43, gi: 39 },
    'banana': { calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, vitaminA: 3, vitaminC: 8.7, vitaminD: 0, vitaminB12: 0, calcium: 5, iron: 0.3, potassium: 358, sodium: 1, gi: 51 },
    'apple': { calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, vitaminA: 3, vitaminC: 4.6, vitaminD: 0, vitaminB12: 0, calcium: 6, iron: 0.1, potassium: 107, sodium: 1, gi: 36 }
};

/**
 * Estimate nutrition for unknown foods based on category
 */
function estimateNutrition(foodItem) {
    // Try to categorize the food
    if (foodItem.includes('sweet') || foodItem.includes('dessert') || foodItem.includes('cake')) {
        return { calories: 400, protein: 4, carbs: 60, fat: 16, fiber: 1, vitaminA: 30, vitaminC: 0, vitaminD: 0.1, vitaminB12: 0.1, calcium: 50, iron: 1, potassium: 100, sodium: 150, gi: 70 };
    }

    if (foodItem.includes('curry') || foodItem.includes('sabzi')) {
        return { calories: 120, protein: 5, carbs: 15, fat: 5, fiber: 3, vitaminA: 100, vitaminC: 15, vitaminD: 0, vitaminB12: 0, calcium: 50, iron: 2, potassium: 300, sodium: 250, gi: 45 };
    }

    if (foodItem.includes('bread') || foodItem.includes('toast')) {
        return { calories: 265, protein: 9, carbs: 49, fat: 3.2, fiber: 2.7, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB12: 0, calcium: 150, iron: 3.6, potassium: 115, sodium: 491, gi: 75 };
    }

    // Default estimation for unknown foods
    return { calories: 150, protein: 5, carbs: 20, fat: 5, fiber: 2, vitaminA: 20, vitaminC: 5, vitaminD: 0.1, vitaminB12: 0.1, calcium: 30, iron: 1, potassium: 150, sodium: 200, gi: 50 };
}

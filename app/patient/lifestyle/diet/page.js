'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getPatient, createDietLog, getDietLogs, supabase } from '@/lib/supabase';
import { calculateNutrition } from '@/lib/aiNutrition';
import { ArrowLeft, Plus, Utensils, TrendingUp, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DietPage() {
    const router = useRouter();
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [dietLogs, setDietLogs] = useState([]);

    // Form state
    const [foodItem, setFoodItem] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState('grams');
    const [calculating, setCalculating] = useState(false);
    const [nutritionData, setNutritionData] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const user = await getCurrentUser();
            if (!user) return router.push('/login');

            const { data: patientData } = await getPatient(user.id);
            if (!patientData) return router.push('/complete-profile');

            setPatient(patientData);

            // Load recent diet logs
            const today = new Date().toISOString().split('T')[0];
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const { data: logs } = await getDietLogs(patientData.id, weekAgo, today);
            setDietLogs(logs || []);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load diet data');
        } finally {
            setLoading(false);
        }
    };

    const handleCalculateNutrition = async () => {
        if (!foodItem || !quantity) {
            toast.error('Please enter food item and quantity');
            return;
        }

        setCalculating(true);
        try {
            const result = await calculateNutrition(foodItem, parseFloat(quantity), unit);
            if (result.success) {
                setNutritionData(result.data);
                toast.success('Nutrition calculated successfully!');
            } else {
                toast.error('Failed to calculate nutrition');
            }
        } catch (error) {
            console.error('Error calculating nutrition:', error);
            toast.error('Failed to calculate nutrition');
        } finally {
            setCalculating(false);
        }
    };

    const handleSaveDietLog = async () => {
        if (!nutritionData) {
            toast.error('Please calculate nutrition first');
            return;
        }

        try {
            const dietData = {
                patient_id: patient.id,
                date: new Date().toISOString().split('T')[0],
                meal_type: 'snack',
                food_item: foodItem,
                quantity: parseFloat(quantity),
                unit: unit,
                nutrition_data: nutritionData,
                created_at: new Date().toISOString()
            };

            const { error } = await createDietLog(dietData);
            if (error) throw error;

            toast.success('Diet log saved successfully!');
            setShowAddForm(false);
            setFoodItem('');
            setQuantity('');
            setNutritionData(null);
            loadData();
        } catch (error) {
            console.error('Error saving diet log:', error);
            toast.error('Failed to save diet log');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FDF8FA]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4a2b3d]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDF8FA] pb-10">
            <header className="bg-white px-6 md:px-12 py-5 flex items-center justify-between border-b border-gray-100 sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
                        <ArrowLeft className="w-6 h-6 text-[#4a2b3d]" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-[#4a2b3d] uppercase tracking-tight">Diet & Nutrition</h1>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">AI-Powered Nutrition Tracker</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="px-6 py-3 bg-[#5a8a7a] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#4a7a6a] transition-all flex items-center gap-2"
                >
                    <Plus size={18} />
                    Add Food
                </button>
            </header>

            <main className="max-w-7xl mx-auto px-6 md:px-12 py-8">
                {showAddForm && (
                    <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm mb-8">
                        <h2 className="text-xl font-black text-[#4a2b3d] uppercase tracking-tight mb-6">Log Your Food</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div className="md:col-span-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2 mb-2 block">Food Item</label>
                                <input
                                    type="text"
                                    value={foodItem}
                                    onChange={(e) => setFoodItem(e.target.value)}
                                    placeholder="e.g., Chicken Biryani, Samosa, Gulab Jamun"
                                    className="w-full bg-gray-50 rounded-xl p-4 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#5a8a7a]/20 font-medium"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2 mb-2 block">Quantity</label>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    placeholder="1"
                                    className="w-full bg-gray-50 rounded-xl p-4 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#5a8a7a]/20 font-medium"
                                />
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2 mb-2 block">Unit</label>
                            <select
                                value={unit}
                                onChange={(e) => setUnit(e.target.value)}
                                className="w-full bg-gray-50 rounded-xl p-4 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#5a8a7a]/20 font-medium"
                            >
                                <option value="grams">Grams (g)</option>
                                <option value="kg">Kilograms (kg)</option>
                                <option value="plate">Plate</option>
                                <option value="bowl">Bowl</option>
                                <option value="cup">Cup</option>
                                <option value="piece">Piece</option>
                            </select>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={handleCalculateNutrition}
                                disabled={calculating}
                                className="flex-1 py-4 bg-[#649488] text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-[#527569] transition-all disabled:opacity-50"
                            >
                                {calculating ? 'Calculating...' : 'Calculate Nutrition'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddForm(false);
                                    setNutritionData(null);
                                    setFoodItem('');
                                    setQuantity('');
                                }}
                                className="px-8 py-4 bg-gray-100 text-gray-700 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all"
                            >
                                Cancel
                            </button>
                        </div>

                        {nutritionData && (
                            <div className="mt-8 p-6 bg-gradient-to-br from-[#5a8a7a]/10 to-[#4a2b3d]/10 rounded-2xl border border-[#5a8a7a]/20">
                                <h3 className="text-lg font-black text-[#4a2b3d] uppercase tracking-tight mb-4">Nutrition Breakdown</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    <div className="bg-white p-4 rounded-xl">
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Calories</p>
                                        <p className="text-2xl font-black text-[#4a2b3d]">{nutritionData.calories}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl">
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Protein</p>
                                        <p className="text-2xl font-black text-[#5a8a7a]">{nutritionData.protein}g</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl">
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Carbs</p>
                                        <p className="text-2xl font-black text-[#649488]">{nutritionData.carbohydrates}g</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl">
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Fat</p>
                                        <p className="text-2xl font-black text-[#4a2b3d]">{nutritionData.fat}g</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="bg-white p-4 rounded-xl">
                                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Vitamins</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm font-bold text-gray-600">Vitamin A</span>
                                                <span className="text-sm font-black text-[#5a8a7a]">{nutritionData.vitamins.vitaminA}μg</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-bold text-gray-600">Vitamin C</span>
                                                <span className="text-sm font-black text-[#5a8a7a]">{nutritionData.vitamins.vitaminC}mg</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-bold text-gray-600">Vitamin D</span>
                                                <span className="text-sm font-black text-[#5a8a7a]">{nutritionData.vitamins.vitaminD}μg</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-bold text-gray-600">Vitamin B12</span>
                                                <span className="text-sm font-black text-[#5a8a7a]">{nutritionData.vitamins.vitaminB12}μg</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl">
                                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Minerals</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm font-bold text-gray-600">Calcium</span>
                                                <span className="text-sm font-black text-[#4a2b3d]">{nutritionData.minerals.calcium}mg</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-bold text-gray-600">Iron</span>
                                                <span className="text-sm font-black text-[#4a2b3d]">{nutritionData.minerals.iron}mg</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-bold text-gray-600">Potassium</span>
                                                <span className="text-sm font-black text-[#4a2b3d]">{nutritionData.minerals.potassium}mg</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-bold text-gray-600">Sodium</span>
                                                <span className="text-sm font-black text-[#4a2b3d]">{nutritionData.minerals.sodium}mg</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-4 rounded-xl">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Glycemic Index</p>
                                            <p className="text-xl font-black text-[#4a2b3d]">{nutritionData.glycemicIndex}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Glycemic Load</p>
                                            <p className="text-xl font-black text-[#5a8a7a]">{nutritionData.glycemicLoad}</p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSaveDietLog}
                                    className="w-full mt-6 py-4 bg-[#4a2b3d] text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-[#3a1b2d] transition-all"
                                >
                                    Save to Diet Log
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
                    <h2 className="text-xl font-black text-[#4a2b3d] uppercase tracking-tight mb-6">Recent Diet Logs</h2>
                    {dietLogs.length === 0 ? (
                        <div className="text-center py-12">
                            <Utensils className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-400 font-bold">No diet logs yet. Start tracking your nutrition!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {dietLogs.map((log, index) => (
                                <div key={index} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:border-[#5a8a7a]/30 transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-black text-[#4a2b3d]">{log.food_item}</h3>
                                            <p className="text-sm font-bold text-gray-400">{log.quantity} {log.unit}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-[#5a8a7a]">{log.nutrition_data?.calories || 0}</p>
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Calories</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Protein</p>
                                            <p className="text-sm font-black text-[#4a2b3d]">{log.nutrition_data?.protein || 0}g</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Carbs</p>
                                            <p className="text-sm font-black text-[#4a2b3d]">{log.nutrition_data?.carbohydrates || 0}g</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Fat</p>
                                            <p className="text-sm font-black text-[#4a2b3d]">{log.nutrition_data?.fat || 0}g</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

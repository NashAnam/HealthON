'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getPatient, supabase } from '@/lib/supabase';
import { Camera, Save, Utensils, Calendar, TrendingUp, Search, Info, Plus, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { searchFood } from '@/lib/nutritionData';

export default function DietTrackerPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [patient, setPatient] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [dietLogs, setDietLogs] = useState([]);

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        meal_type: 'lunch',
        food_name: '',
        calories: '',
        protein: '',
        carbs: '',
        fats: '',
        fiber: '',
        gi: '',
        vitamins: '',
        minerals: '',
        notes: ''
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const user = await getCurrentUser();
        if (!user) return router.replace('/login');

        const { data: patientData } = await getPatient(user.id);
        if (!patientData) {
            setLoading(false);
            return;
        }
        setPatient(patientData);

        // Load recent diet logs
        const { data: logs } = await supabase
            .from('diet_logs')
            .select('*')
            .eq('patient_id', patientData.id)
            .order('date', { ascending: false })
            .limit(10);

        if (logs) setDietLogs(logs);
        setLoading(false);
    };

    const analyzeFood = (imageData) => {
        setIsAnalyzing(true);
        // Simulate AI recognition delay
        setTimeout(() => {
            setIsAnalyzing(false);
            // Example recognition based on common keywords (fallback to search)
            const mockRecognizedFood = "Grilled Chicken Salad";
            const foodData = searchFood(mockRecognizedFood)[0];

            if (foodData) {
                setFormData(prev => ({
                    ...prev,
                    food_name: foodData.name,
                    calories: foodData.calories.toString(),
                    protein: foodData.protein.toString(),
                    carbs: foodData.carbs.toString(),
                    fats: foodData.fats.toString(),
                    fiber: foodData.fiber.toString(),
                    gi: foodData.gi.toString()
                }));
                setSearchQuery(foodData.name);
                toast.success(`AI Detected: ${foodData.name}`, { icon: '🤖' });
            }
        }, 1500);
    };

    const captureFood = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });

            const video = document.createElement('video');
            video.srcObject = stream;
            await video.play();

            setTimeout(() => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const context = canvas.getContext('2d');
                context.drawImage(video, 0, 0);

                const imageData = canvas.toDataURL('image/jpeg', 0.8);
                setCapturedImage(imageData);

                stream.getTracks().forEach(track => track.stop());
                toast.success('Image captured!');

                // Simulate AI food recognition
                analyzeFood(imageData);
            }, 2000);

            toast.success('Camera ready - capturing in 2 seconds...');
        } catch (error) {
            console.error('Camera error:', error);
            toast.error('Camera access denied');
        }
    };

    const handleSearchChange = (query) => {
        setSearchQuery(query);
        if (query.trim()) {
            const results = searchFood(query);
            setSuggestions(results);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
        setFormData(prev => ({ ...prev, food_name: query }));
    };

    const selectSuggestion = (food) => {
        setFormData({
            ...formData,
            food_name: food.name,
            calories: food.calories.toString(),
            protein: food.protein.toString(),
            carbs: food.carbs.toString(),
            fats: food.fats.toString(),
            fiber: food.fiber.toString(),
            gi: food.gi.toString(),
            vitamins: food.vitamins,
            minerals: food.minerals
        });
        setSearchQuery(food.name);
        setSuggestions([]);
        setShowSuggestions(false);
        toast.success(`Selected: ${food.name}`);
    };

    const handleSave = async () => {
        if (!formData.food_name) {
            toast.error('Please enter food name');
            return;
        }

        try {
            const logData = {
                patient_id: patient.id,
                date: formData.date,
                meal_type: formData.meal_type,
                food_name: formData.food_name,
                calories: parseFloat(formData.calories) || null,
                protein: parseFloat(formData.protein) || null,
                carbs: parseFloat(formData.carbs) || null,
                fats: parseFloat(formData.fats) || null,
                fiber: parseFloat(formData.fiber) || null,
                gi: parseInt(formData.gi) || null,
                vitamins: formData.vitamins,
                minerals: formData.minerals,
                image_url: capturedImage || null,
                ai_recognized: !!capturedImage,
                notes: formData.notes
            };

            const { error } = await supabase
                .from('diet_logs')
                .insert([logData]);

            if (error) throw error;

            toast.success('Diet log saved!');

            // Reset form
            setFormData({
                date: new Date().toISOString().split('T')[0],
                meal_type: 'lunch',
                food_name: '',
                calories: '',
                protein: '',
                carbs: '',
                fats: '',
                fiber: '',
                gi: '',
                vitamins: '',
                minerals: '',
                notes: ''
            });
            setSearchQuery('');
            setCapturedImage(null);

            loadData();
        } catch (error) {
            console.error('Save error full details:', JSON.stringify(error, null, 2));
            console.error('Save error message:', error.message);
            console.error('Save error details:', error.details);
            console.error('Save error hint:', error.hint);
            toast.error(`Failed to save: ${error.message || 'Unknown error'}`);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#648C81]"></div>
        </div>
    );

    const totalToday = dietLogs
        .filter(log => log.date === formData.date)
        .reduce((acc, log) => ({
            calories: acc.calories + (log.calories || 0),
            protein: acc.protein + (log.protein || 0),
            carbs: acc.carbs + (log.carbs || 0),
            fats: acc.fats + (log.fats || 0),
            fiber: acc.fiber + (log.fiber || 0),
            avgGi: acc.giCount > 0 ? (acc.totalGi + (log.gi || 0)) / (acc.giCount + (log.gi ? 1 : 0)) : (log.gi || 0),
            totalGi: acc.totalGi + (log.gi || 0),
            giCount: acc.giCount + (log.gi ? 1 : 0)
        }), { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, totalGi: 0, giCount: 0, avgGi: 0 });

    return (
        <div className="min-h-screen bg-white p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <button
                    onClick={() => router.push('/patient/health-tracker')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 font-bold transition-colors group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    Back to Health Tracker
                </button>
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900 mb-2">Diet Tracker</h1>
                    <p className="text-slate-500">Track your meals with AI-powered food recognition</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Input Form */}
                    <div className="lg:col-span-2 bg-white border-2 border-[#648C81]/20 rounded-3xl p-6 md:p-8">
                        <h2 className="text-xl font-black text-slate-900 mb-6">Log Meal</h2>

                        {/* Camera Button */}
                        <button
                            onClick={captureFood}
                            disabled={isAnalyzing}
                            className="w-full mb-6 bg-[#648C81] hover:bg-[#4a2135] text-white p-6 rounded-xl font-bold flex items-center justify-center gap-3 transition-all"
                        >
                            <Camera className="w-6 h-6" />
                            {isAnalyzing ? 'Analyzing...' : 'Take Photo & Auto-Detect Food'}
                        </button>

                        {capturedImage && (
                            <div className="mb-6">
                                <img src={capturedImage} alt="Food" className="w-full rounded-xl border-2 border-[#648C81]/20" />
                            </div>
                        )}

                        <div className="relative mb-8">
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Search Food (Google-like)</label>
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#648C81] transition-all" size={20} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    placeholder="Search for apples, chicken, rice..."
                                    className="w-full bg-slate-50 border-2 border-slate-100 focus:border-[#648C81] focus:bg-white rounded-2xl py-5 pl-12 pr-4 text-lg font-bold text-slate-900 outline-none transition-all shadow-sm"
                                    onFocus={() => searchQuery && setShowSuggestions(true)}
                                />
                            </div>

                            {/* Suggestions Dropdown */}
                            {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute z-10 w-full mt-2 bg-white border-2 border-slate-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    {suggestions.map((food, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => selectSuggestion(food)}
                                            className="px-6 py-4 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-none flex items-center justify-between group transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-[#648C81]/10 text-[#648C81] rounded-xl flex items-center justify-center font-bold">
                                                    {food.name[0]}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-800 group-hover:text-[#648C81] transition-all">{food.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{food.category}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-slate-600">{food.calories} <span className="text-[10px] text-slate-400 uppercase">kcal</span></p>
                                                <Plus size={16} className="text-slate-300 group-hover:text-[#648C81] ml-auto mt-1" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full bg-slate-50 border-2 border-slate-100 focus:border-[#648C81] focus:bg-white p-4 pl-12 rounded-xl font-bold text-slate-800 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Meal Type</label>
                                <select
                                    value={formData.meal_type}
                                    onChange={(e) => setFormData({ ...formData, meal_type: e.target.value })}
                                    className="w-full bg-slate-50 border-2 border-slate-100 focus:border-[#648C81] focus:bg-white p-4 rounded-xl font-bold text-slate-800 outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="breakfast">Breakfast</option>
                                    <option value="lunch">Lunch</option>
                                    <option value="dinner">Dinner</option>
                                    <option value="snack">Snack</option>
                                </select>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Confirmed Food Name</label>
                            <input
                                type="text"
                                value={formData.food_name}
                                onChange={(e) => setFormData({ ...formData, food_name: e.target.value })}
                                placeholder="Food not found? Type here..."
                                className="w-full bg-slate-50 border-2 border-slate-100 focus:border-[#648C81] focus:bg-white p-4 rounded-xl font-bold text-slate-800 outline-none transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="space-y-1">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Calories</label>
                                <input
                                    type="number"
                                    value={formData.calories}
                                    onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                                    placeholder="350"
                                    className="w-full bg-white border-2 border-slate-100 focus:border-[#648C81] p-3 rounded-xl font-black text-slate-800 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Protein (g)</label>
                                <input
                                    type="number"
                                    value={formData.protein}
                                    onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                                    placeholder="30"
                                    className="w-full bg-white border-2 border-slate-100 focus:border-[#648C81] p-3 rounded-xl font-black text-slate-800 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Fiber (g)</label>
                                <input
                                    type="number"
                                    value={formData.fiber}
                                    onChange={(e) => setFormData({ ...formData, fiber: e.target.value })}
                                    placeholder="5"
                                    className="w-full bg-white border-2 border-slate-100 focus:border-[#648C81] p-3 rounded-xl font-black text-slate-800 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">GI Index</label>
                                <input
                                    type="number"
                                    value={formData.gi}
                                    onChange={(e) => setFormData({ ...formData, gi: e.target.value })}
                                    placeholder="35"
                                    className="w-full bg-white border-2 border-slate-100 focus:border-[#648C81] p-3 rounded-xl font-black text-slate-800 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            <div className="space-y-1">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Vitamins</label>
                                <input
                                    type="text"
                                    value={formData.vitamins}
                                    onChange={(e) => setFormData({ ...formData, vitamins: e.target.value })}
                                    placeholder="eg. Vit C, Vit D"
                                    className="w-full bg-white border-2 border-slate-100 focus:border-[#648C81] p-3 rounded-xl font-bold text-slate-800 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Minerals</label>
                                <input
                                    type="text"
                                    value={formData.minerals}
                                    onChange={(e) => setFormData({ ...formData, minerals: e.target.value })}
                                    placeholder="eg. Iron, Magnesium"
                                    className="w-full bg-white border-2 border-slate-100 focus:border-[#648C81] p-3 rounded-xl font-bold text-slate-800 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            className="w-full bg-[#648C81] hover:bg-[#527569] text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                        >
                            <Save className="w-5 h-5" />
                            Save Meal
                        </button>
                    </div>

                    {/* Summary & Recent Logs */}
                    <div className="space-y-6">
                        {/* Today's Summary */}
                        <div className="bg-gradient-to-br from-[#648C81]/10 to-white border-2 border-[#648C81]/20 rounded-3xl p-6">
                            <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-[#648C81]" />
                                Today's Total
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-600">Calories</span>
                                    <span className="text-lg font-black text-[#648C81]">{totalToday.calories.toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-600">Protein</span>
                                    <span className="text-lg font-black text-[#648C81]">{totalToday.protein.toFixed(0)}g</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-600">Carbs</span>
                                    <span className="text-lg font-black text-[#648C81]">{totalToday.carbs.toFixed(0)}g</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-600">Fiber</span>
                                    <span className="text-lg font-black text-[#648C81]">{totalToday.fiber.toFixed(1)}g</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-600">Avg GI Index</span>
                                    <span className="text-lg font-black text-[#648C81]">{totalToday.avgGi.toFixed(0)}</span>
                                </div>
                            </div>
                            <div className="mt-6 p-4 bg-white/50 rounded-2xl border border-[#648C81]/10">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nutrient Density</p>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#648C81] transition-all duration-500"
                                            style={{ width: `${Math.min(100, (totalToday.protein + totalToday.fiber) * 2)}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-black text-[#648C81]">Good</span>
                                </div>
                            </div>
                        </div>

                        {/* Recent Meals */}
                        <div className="bg-white border-2 border-[#648C81]/20 rounded-3xl p-6">
                            <h3 className="text-lg font-black text-slate-900 mb-4">Recent Meals</h3>
                            <div className="space-y-3">
                                {dietLogs.length === 0 ? (
                                    <p className="text-slate-400 text-center py-4">No meals logged yet</p>
                                ) : (
                                    dietLogs.slice(0, 5).map((log) => (
                                        <div key={log.id} className="p-3 bg-slate-50 rounded-xl">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-bold text-slate-900 text-sm">{log.food_name}</span>
                                                <span className="text-xs text-[#648C81] font-black">{log.calories} cal</span>
                                            </div>
                                            <div className="flex gap-2 text-xs text-slate-500">
                                                <span>{log.meal_type}</span>
                                                <span>•</span>
                                                <span>{log.date}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

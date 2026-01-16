'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getPatient, supabase } from '@/lib/supabase';
import { Camera, Save, Utensils, Calendar, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

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
        notes: ''
    });

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

    const analyzeFood = async (imageData) => {
        setIsAnalyzing(true);
        toast.loading('Analyzing food...');

        // Simulate AI analysis (in production, call Google Cloud Vision or similar API)
        setTimeout(() => {
            // Mock data - replace with actual AI API call
            const mockFoods = [
                { name: 'Chicken Salad', calories: 350, protein: 30, carbs: 15, fats: 18 },
                { name: 'Rice Bowl', calories: 450, protein: 12, carbs: 75, fats: 8 },
                { name: 'Fruit Smoothie', calories: 200, protein: 5, carbs: 45, fats: 2 },
                { name: 'Sandwich', calories: 400, protein: 20, carbs: 50, fats: 12 }
            ];

            const randomFood = mockFoods[Math.floor(Math.random() * mockFoods.length)];

            setFormData(prev => ({
                ...prev,
                food_name: randomFood.name,
                calories: randomFood.calories.toString(),
                protein: randomFood.protein.toString(),
                carbs: randomFood.carbs.toString(),
                fats: randomFood.fats.toString()
            }));

            setIsAnalyzing(false);
            toast.dismiss();
            toast.success(`Detected: ${randomFood.name}!`);
        }, 2000);
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
                notes: ''
            });
            setCapturedImage(null);

            loadData();
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Failed to save diet log');
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
            fats: acc.fats + (log.fats || 0)
        }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

    return (
        <div className="min-h-screen bg-white p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
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

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Date</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full p-4 border-2 border-slate-200 rounded-xl focus:border-[#648C81] focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Meal Type</label>
                                <select
                                    value={formData.meal_type}
                                    onChange={(e) => setFormData({ ...formData, meal_type: e.target.value })}
                                    className="w-full p-4 border-2 border-slate-200 rounded-xl focus:border-[#648C81] focus:outline-none"
                                >
                                    <option value="breakfast">Breakfast</option>
                                    <option value="lunch">Lunch</option>
                                    <option value="dinner">Dinner</option>
                                    <option value="snack">Snack</option>
                                </select>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Food Name</label>
                            <input
                                type="text"
                                value={formData.food_name}
                                onChange={(e) => setFormData({ ...formData, food_name: e.target.value })}
                                placeholder="e.g., Chicken Salad"
                                className="w-full p-4 border-2 border-slate-200 rounded-xl focus:border-[#648C81] focus:outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Calories</label>
                                <input
                                    type="number"
                                    value={formData.calories}
                                    onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                                    placeholder="350"
                                    className="w-full p-4 border-2 border-slate-200 rounded-xl focus:border-[#648C81] focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Protein (g)</label>
                                <input
                                    type="number"
                                    value={formData.protein}
                                    onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                                    placeholder="30"
                                    className="w-full p-4 border-2 border-slate-200 rounded-xl focus:border-[#648C81] focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Carbs (g)</label>
                                <input
                                    type="number"
                                    value={formData.carbs}
                                    onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                                    placeholder="45"
                                    className="w-full p-4 border-2 border-slate-200 rounded-xl focus:border-[#648C81] focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Fats (g)</label>
                                <input
                                    type="number"
                                    value={formData.fats}
                                    onChange={(e) => setFormData({ ...formData, fats: e.target.value })}
                                    placeholder="12"
                                    className="w-full p-4 border-2 border-slate-200 rounded-xl focus:border-[#648C81] focus:outline-none"
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
                                    <span className="text-sm font-bold text-slate-600">Fats</span>
                                    <span className="text-lg font-black text-[#648C81]">{totalToday.fats.toFixed(0)}g</span>
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

'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCurrentUser, getNutritionist, getDietPlans, assignDietPlan, getNutritionistPatients } from '@/lib/supabase';
import { FileText, Plus, ArrowLeft, Search, Calendar, Apple, Coffee, Utensils, Moon, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DietPlansPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const patientFilter = searchParams.get('patient');

    const [nutritionist, setNutritionist] = useState(null);
    const [plans, setPlans] = useState([]);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // New Plan State
    const [newPlan, setNewPlan] = useState({
        patient_id: patientFilter || '',
        title: '',
        description: '',
        meals: {
            breakfast: [],
            lunch: [],
            dinner: [],
            snacks: []
        },
        end_date: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const user = await getCurrentUser();
            if (!user) {
                router.push('/expert-login');
                return;
            }

            const { data: nutriData } = await getNutritionist(user.id);
            if (!nutriData) {
                router.push('/complete-profile');
                return;
            }
            setNutritionist(nutriData);

            const [plansRes, patientsRes] = await Promise.all([
                getDietPlans(nutriData.id),
                getNutritionistPatients(nutriData.id)
            ]);

            setPlans(plansRes.data || []);

            // Deduplicate patients
            const uniquePatients = [];
            const patientIds = new Set();
            (patientsRes.data || []).forEach(item => {
                if (item.patients && !patientIds.has(item.patients.id)) {
                    patientIds.add(item.patients.id);
                    uniquePatients.push(item.patients);
                }
            });
            setPatients(uniquePatients);

        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load diet plans');
        } finally {
            setLoading(false);
        }
    };

    const handleAddMealItem = (mealType) => {
        const item = prompt(`Enter ${mealType} item:`);
        if (item) {
            setNewPlan(prev => ({
                ...prev,
                meals: {
                    ...prev.meals,
                    [mealType]: [...prev.meals[mealType], item]
                }
            }));
        }
    };

    const handleCreatePlan = async (e) => {
        e.preventDefault();
        if (!newPlan.patient_id || !newPlan.title) {
            toast.error('Please fill in required fields');
            return;
        }

        try {
            const { error } = await assignDietPlan({
                ...newPlan,
                nutritionist_id: nutritionist.id,
                status: 'active'
            });

            if (error) throw error;

            toast.success('Diet plan assigned successfully');
            setShowForm(false);
            loadData();
        } catch (error) {
            toast.error('Failed to create diet plan');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/nutritionist/dashboard')}
                            className="p-2 hover:bg-gray-50 rounded-xl transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">Diet Plans</h1>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">Nutrition Management</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowForm(true)}
                        className="px-6 py-3 bg-green-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-green-600/20 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        New Plan
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Form Overlay */}
                {showForm && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
                        <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Create Diet Plan</h2>
                                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                                    <X className="w-6 h-6 text-gray-400" />
                                </button>
                            </div>

                            <form onSubmit={handleCreatePlan} className="p-8 space-y-6 overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Patient</label>
                                        <select
                                            value={newPlan.patient_id}
                                            onChange={(e) => setNewPlan({ ...newPlan, patient_id: e.target.value })}
                                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold text-gray-900 focus:ring-2 focus:ring-green-500 transition-all appearance-none"
                                            required
                                        >
                                            <option value="">Choose Patient</option>
                                            {patients.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Plan Title</label>
                                        <input
                                            type="text"
                                            value={newPlan.title}
                                            onChange={(e) => setNewPlan({ ...newPlan, title: e.target.value })}
                                            placeholder="e.g., Weight Loss Alpha"
                                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold text-gray-900 focus:ring-2 focus:ring-green-500 transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
                                    <textarea
                                        value={newPlan.description}
                                        onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold text-gray-900 focus:ring-2 focus:ring-green-500 transition-all min-h-[100px]"
                                        placeholder="Specific goals or restrictions..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    {[
                                        { id: 'breakfast', icon: Coffee, title: 'Breakfast', color: 'text-orange-500' },
                                        { id: 'lunch', icon: Utensils, title: 'Lunch', color: 'text-green-500' },
                                        { id: 'dinner', icon: Moon, title: 'Dinner', color: 'text-blue-500' },
                                        { id: 'snacks', icon: Apple, title: 'Snacks', color: 'text-red-500' }
                                    ].map(meal => (
                                        <div key={meal.id} className="bg-gray-50/50 p-4 rounded-3xl border border-gray-100">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <meal.icon className={`w-4 h-4 ${meal.color}`} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">{meal.title}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddMealItem(meal.id)}
                                                    className="w-6 h-6 rounded-lg bg-white shadow-sm flex items-center justify-center hover:scale-110 transition-transform"
                                                >
                                                    <Plus className="w-3 h-3 text-green-600" />
                                                </button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {newPlan.meals[meal.id].map((item, idx) => (
                                                    <span key={idx} className="bg-white px-3 py-1 rounded-full text-[9px] font-black text-gray-500 border border-gray-100 uppercase tracking-tighter">
                                                        {item}
                                                    </span>
                                                ))}
                                                {newPlan.meals[meal.id].length === 0 && <span className="text-[9px] font-bold text-gray-300 italic">No items added</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-5 bg-green-600 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-green-600/20 flex items-center justify-center gap-3"
                                >
                                    <Save className="w-5 h-5" />
                                    Save & Assign Plan
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Plans List */}
                {plans.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                        <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">No Active Plans</h3>
                        <p className="text-gray-500 font-medium">Create your first diet plan to get started.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {plans.map((plan) => (
                            <div key={plan.id} className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm flex flex-col">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 border border-green-100">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-green-50 text-green-600 rounded-full border border-green-100">
                                        {plan.status}
                                    </span>
                                </div>
                                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2 leading-tight">
                                    {plan.title}
                                </h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">
                                    Assigned to: <span className="text-green-600">{plan.patients?.name || 'Unknown'}</span>
                                </p>

                                <div className="space-y-4 mb-8">
                                    {Object.entries(plan.meals).map(([meal, items]) => (
                                        <div key={meal} className="flex gap-3">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 w-16">{meal}:</span>
                                            <p className="text-[10px] font-bold text-gray-700 leading-relaxed uppercase tracking-tighter">
                                                {items.length > 0 ? items.join(', ') : 'None'}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Date Created</span>
                                        <span className="text-[10px] font-black text-gray-600 uppercase tracking-tighter">
                                            {new Date(plan.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <button className="text-[10px] font-black text-green-600 uppercase tracking-widest hover:text-black transition-colors">
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

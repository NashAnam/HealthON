'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, supabase } from '@/lib/supabase';
import { Target, ArrowLeft, Plus, Check, Utensils, Save, History, TrendingUp, Activity, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GoalsPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [patientData, setPatientData] = useState(null);
    const [activeTab, setActiveTab] = useState('goals');
    const [goals, setGoals] = useState([]);
    const [dietLogs, setDietLogs] = useState([]);
    const [showGoalForm, setShowGoalForm] = useState(false);

    const [newGoal, setNewGoal] = useState({
        title: '',
        description: '',
        category: 'diet',
        power_points: 200,
        target_date: ''
    });

    const [dietLog, setDietLog] = useState({
        meal_type: 'breakfast',
        foods: [],
        calories: 0,
        home_food: true,
        date: new Date().toISOString().split('T')[0]
    });
    const [foodItem, setFoodItem] = useState('');

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        const currentUser = await getCurrentUser();
        if (!currentUser) return router.push('/login');
        setUser(currentUser);

        // Fetch fundamental patient data for Risk Score
        const { data: pData } = await supabase
            .from('patients')
            .select('*')
            .eq('user_id', currentUser.id)
            .single();

        if (pData) {
            setPatientData(pData);
        }

        if (activeTab === 'goals') {
            const { data } = await supabase
                .from('goals')
                .select('*')
                .eq('patient_id', currentUser.id)
                .order('created_at', { ascending: false });
            setGoals(data || []);
        } else {
            const { data } = await supabase
                .from('diet_logs')
                .select('*')
                .eq('patient_id', currentUser.id)
                .order('date', { ascending: false });
            setDietLogs(data || []);
        }
    };


    const createGoal = async () => {
        try {
            const { error } = await supabase.from('goals').insert([{
                patient_id: user.id,
                ...newGoal,
                status: 'active',
                progress: 0
            }]);

            if (error) throw error;
            toast.success('Goal created!');
            setShowGoalForm(false);
            setNewGoal({ title: '', description: '', category: 'diet', power_points: 200, target_date: '' });
            loadData();
        } catch (error) {
            toast.error('Error creating goal');
        }
    };

    const completeGoal = async (goalId, points) => {
        try {
            await supabase.from('goals').update({ status: 'completed', progress: 100 }).eq('id', goalId);
            await supabase.from('patients').update({ reward_points: supabase.raw(`reward_points + ${points}`) }).eq('user_id', user.id);
            toast.success(`Goal completed! +${points} power points`);
            loadData();
        } catch (error) {
            toast.error('Error completing goal');
        }
    };

    const addFood = () => {
        if (!foodItem) return;
        setDietLog({
            ...dietLog,
            foods: [...dietLog.foods, foodItem]
        });
        setFoodItem('');
    };

    const saveDietLog = async () => {
        try {
            const { error } = await supabase.from('diet_logs').insert([{
                patient_id: user.id,
                ...dietLog,
                foods: JSON.stringify(dietLog.foods)
            }]);

            if (error) throw error;
            toast.success('Diet logged successfully!');
            setDietLog({
                meal_type: 'breakfast',
                foods: [],
                calories: 0,
                home_food: true,
                date: new Date().toLocaleDateString('en-CA')
            });
            loadData();
        } catch (error) {
            toast.error('Error saving diet log');
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFB] pb-20">
            <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <button onClick={() => router.push('/patient/dashboard')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors shrink-0">
                                <ArrowLeft className="w-6 h-6 text-gray-900" />
                            </button>
                            <div>
                                <h1 className="text-xl md:text-2xl font-black text-gray-900">Treatment Plan</h1>
                                <p className="text-xs md:text-sm font-bold text-gray-400">Goals & Nutrition Tracking</p>
                            </div>
                        </div>
                        <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl w-full md:w-auto justify-between md:justify-start">
                            <button
                                onClick={() => setActiveTab('goals')}
                                className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'goals' ? 'bg-white text-plum-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                <Target className="inline-block mr-2 w-4 h-4" /> Goals
                            </button>
                            <button
                                onClick={() => setActiveTab('diet')}
                                className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'diet' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                <Utensils className="inline-block mr-2 w-4 h-4" /> Nutrition
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">


                {activeTab === 'goals' ? (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Active Goals</h2>
                            <button
                                onClick={() => setShowGoalForm(!showGoalForm)}
                                className="px-3 md:px-5 py-2.5 bg-plum-800 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-plum-800/20 active:scale-95 flex items-center gap-2"
                            >
                                <Plus size={16} /> <span className="hidden xs:inline">Custom Goal</span>
                            </button>
                        </div>

                        {showGoalForm && (
                            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 mb-8 animate-in slide-in-from-top-4">
                                <h3 className="text-lg font-black text-gray-900 mb-6 uppercase tracking-widest text-plum-800">Set New Milestone</h3>
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Goal Title</label>
                                        <input
                                            type="text"
                                            value={newGoal.title}
                                            onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                                            placeholder="e.g., Lose 5kg, Morning Walk 30mins"
                                            className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-plum-800/20 transition-all"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Points Reward</label>
                                            <input
                                                type="number"
                                                value={newGoal.power_points}
                                                onChange={(e) => setNewGoal({ ...newGoal, power_points: e.target.value === '' ? '' : parseInt(e.target.value) })}
                                                className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-plum-800/20 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Target Date</label>
                                            <input
                                                type="date"
                                                value={newGoal.target_date}
                                                onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                                                className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-plum-800/20 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button onClick={createGoal} className="flex-1 bg-plum-800 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-plum-800/20">Create Goal</button>
                                        <button onClick={() => setShowGoalForm(false)} className="px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">Cancel</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid gap-4">
                            {goals.length > 0 ? goals.map((goal) => (
                                <div key={goal.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-lg font-black text-gray-900 group-hover:text-plum-800 transition-colors uppercase tracking-tight">{goal.title}</h3>
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${goal.status === 'completed' ? 'bg-teal-50 text-teal-700 border border-teal-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                                                    }`}>
                                                    {goal.status}
                                                </span>
                                            </div>
                                            <p className="text-gray-500 text-xs font-bold">{goal.description || 'No description provided'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reward</p>
                                            <p className="text-sm font-black text-teal-600">+{goal.power_points} pts</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                        <div className="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                            <span>Progress: {goal.progress}%</span>
                                            <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-plum-800 transition-all duration-1000" style={{ width: `${goal.progress}%` }} />
                                            </div>
                                        </div>
                                        {goal.status === 'active' && (
                                            <button
                                                onClick={() => completeGoal(goal.id, goal.power_points)}
                                                className="px-6 py-2.5 bg-teal-50 text-teal-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-700 hover:text-white transition-all active:scale-95 border border-teal-100"
                                            >
                                                Mark Complete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-20 bg-white rounded-[2rem] border border-gray-100">
                                    <Target className="w-16 h-16 text-gray-100 mx-auto mb-4" />
                                    <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">
                                        No active goals found.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Diet Logging Form */}
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                            <h3 className="text-xl font-black text-gray-900 mb-8 uppercase tracking-tight flex items-center gap-3">
                                <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl"><Utensils size={24} /></div>
                                Log Nutrition
                            </h3>
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Meal Type</label>
                                        <select
                                            value={dietLog.meal_type}
                                            onChange={(e) => setDietLog({ ...dietLog, meal_type: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-600/20 transition-all appearance-none"
                                        >
                                            <option value="breakfast">Breakfast</option>
                                            <option value="lunch">Lunch</option>
                                            <option value="dinner">Dinner</option>
                                            <option value="snacks">Snacks</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Calories (kcal)</label>
                                        <input
                                            type="number"
                                            value={dietLog.calories}
                                            onChange={(e) => setDietLog({ ...dietLog, calories: e.target.value === '' ? '' : parseInt(e.target.value) })}
                                            className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-600/20 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Add Foods</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={foodItem}
                                                onChange={(e) => setFoodItem(e.target.value)}
                                                placeholder="e.g., Brown Rice, Salad"
                                                className="flex-1 bg-gray-50 border border-gray-100 p-4 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-600/20 transition-all"
                                                onKeyPress={(e) => e.key === 'Enter' && addFood()}
                                            />
                                            <button onClick={addFood} className="p-4 bg-teal-600 text-white rounded-xl hover:bg-black transition-all">
                                                <Plus size={24} />
                                            </button>
                                        </div>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {dietLog.foods.map((food, i) => (
                                                <span key={i} className="px-4 py-1.5 bg-teal-50 text-teal-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-teal-100">
                                                    {food}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                                        <input
                                            type="checkbox"
                                            checked={dietLog.home_food}
                                            onChange={(e) => setDietLog({ ...dietLog, home_food: e.target.checked })}
                                            className="w-5 h-5 accent-teal-600"
                                        />
                                        <label className="text-sm font-black text-gray-600 uppercase tracking-widest">Home Cooked Meal</label>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={saveDietLog}
                                className="w-full bg-teal-600 text-white mt-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-teal-700/20 flex items-center justify-center gap-2"
                            >
                                <Save size={20} /> Save Nutrition Log
                            </button>
                        </div>

                        {/* Recent History */}
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                            <h3 className="text-lg font-black text-gray-900 mb-6 uppercase tracking-tight flex items-center gap-2">
                                <History size={20} className="text-gray-400" /> Recent Logs
                            </h3>
                            <div className="space-y-4">
                                {dietLogs.length > 0 ? dietLogs.map((log) => (
                                    <div key={log.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-teal-200 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-teal-600 shadow-sm font-black text-[10px] uppercase">
                                                {log.meal_type[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-900 capitalize">{log.meal_type}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(log.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-teal-700">{log.calories} kcal</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{log.home_food ? '🏠 Home' : '🏪 Outside'}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-center py-10 text-gray-400 font-black uppercase tracking-widest text-[10px]">No recent dietary history</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

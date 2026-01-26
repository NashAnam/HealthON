// Reward Points Helper Functions

import { supabase } from './supabase';

// Points configuration
export const POINTS_CONFIG = {
    VITALS_LOG: 10,      // 10 points for logging vitals
    DIET_LOG: 5,         // 5 points for diet log
    MED_LOG: 5,          // 5 points for medication log
    ASSESSMENT: 50,      // 50 points for completing assessment
    APPOINTMENT: 20      // 20 points for attending appointment
};

/**
 * Award points to a patient
 * @param {string} patientId - Patient UUID
 * @param {number} points - Number of points to award
 * @param {string} source - Source of points (e.g., 'vitals_log')
 * @param {string} description - Optional description
 */
export async function awardPoints(patientId, points, source, description = null) {
    try {
        const { data, error } = await supabase.rpc('award_points', {
            p_patient_id: patientId,
            p_points: points,
            p_source: source,
            p_description: description
        });

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error awarding points:', error);
        return { success: false, error };
    }
}

/**
 * Get patient's current reward points
 * @param {string} patientId - Patient UUID
 */
export async function getRewardPoints(patientId) {
    try {
        const { data, error } = await supabase
            .from('reward_points')
            .select('*')
            .eq('patient_id', patientId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        return {
            points: data?.points || 0,
            totalEarned: data?.total_earned || 0,
            totalRedeemed: data?.total_redeemed || 0
        };
    } catch (error) {
        console.error('Error getting reward points:', error);
        return { points: 0, totalEarned: 0, totalRedeemed: 0 };
    }
}

/**
 * Get available rewards from catalog
 */
export async function getAvailableRewards() {
    try {
        const { data, error } = await supabase
            .from('rewards_catalog')
            .select('*')
            .eq('is_active', true)
            .order('points_required', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error getting rewards:', error);
        return [];
    }
}

/**
 * Redeem points for a reward
 * @param {string} patientId - Patient UUID
 * @param {number} points - Points to redeem
 * @param {string} description - Description of redemption
 */
export async function redeemPoints(patientId, points, description) {
    try {
        const { data, error } = await supabase.rpc('redeem_points', {
            p_patient_id: patientId,
            p_points: points,
            p_description: description
        });

        if (error) throw error;
        return { success: data };
    } catch (error) {
        console.error('Error redeeming points:', error);
        return { success: false, error };
    }
}

/**
 * Get points transaction history
 * @param {string} patientId - Patient UUID
 * @param {number} limit - Number of transactions to fetch
 */
export async function getPointsHistory(patientId, limit = 10) {
    try {
        const { data, error } = await supabase
            .from('points_transactions')
            .select('*')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error getting points history:', error);
        return [];
    }
}

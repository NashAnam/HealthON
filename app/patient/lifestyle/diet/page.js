'use client';
import { useState } from 'react';
import Header from '@/components/patient/Header';

export default function DietPage() {
    return (
        <div className="min-h-screen bg-surface">
            <Header />
            <div className="max-w-7xl mx-auto px-6 pt-28 pb-10">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Diet & Nutrition</h1>
                <div className="glass-card p-6">
                    <p className="text-gray-500">Diet tracking features coming soon.</p>
                </div>
            </div>
        </div>
    );
}

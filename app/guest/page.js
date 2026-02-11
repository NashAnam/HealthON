'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GuestPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to patient dashboard which already has guest mode logic
        router.replace('/patient/dashboard');
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FDF8FA]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4a2b3d]"></div>
        </div>
    );
}

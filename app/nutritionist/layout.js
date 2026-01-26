'use client';
import { SidebarProvider } from '@/lib/SidebarContext';
import ExpertSidebar from '@/components/ExpertSidebar';

export default function NutritionistLayout({ children }) {
    return (
        <SidebarProvider>
            <div className="flex min-h-screen bg-gray-50">
                <ExpertSidebar role="nutritionist" />
                <div className="flex-1 lg:ml-64">
                    {children}
                </div>
            </div>
        </SidebarProvider>
    );
}

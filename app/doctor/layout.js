import { SidebarProvider } from '@/lib/SidebarContext';
import DoctorSidebar from '@/components/doctor/Sidebar';
import { Toaster } from 'react-hot-toast';

export default function DoctorLayout({ children }) {
    return (
        <SidebarProvider>
            <div className="flex min-h-screen bg-[#FAFAFA]">
                <DoctorSidebar />
                <div className="flex-1 transition-all duration-300 lg:pl-64">
                    {children}
                </div>
                <Toaster position="top-right" />
            </div>
        </SidebarProvider>
    );
}

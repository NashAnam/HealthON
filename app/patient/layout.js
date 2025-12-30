import { SidebarProvider } from '@/lib/SidebarContext';
import Sidebar from '@/components/patient/Sidebar';
import NotificationSync from '@/components/patient/NotificationSync';

export default function PatientLayout({ children }) {
    return (
        <SidebarProvider>
            <div className="flex min-h-screen bg-surface">
                <Sidebar />
                <NotificationSync />
                <div className="flex-1 lg:pl-64 transition-all duration-300">
                    {children}
                </div>
            </div>
        </SidebarProvider>
    );
}

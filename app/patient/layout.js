import { SidebarProvider } from '@/lib/SidebarContext';
import Sidebar from '@/components/patient/Sidebar';
import NotificationSync from '@/components/patient/NotificationSync';
import BottomNav from '@/components/patient/BottomNav';

export default function PatientLayout({ children }) {
    return (
        <SidebarProvider>
            <div className="flex min-h-screen bg-[#f5f5f5] w-full overflow-x-hidden relative flex-row-reverse">
                <Sidebar />
                <NotificationSync />
                <div className="flex-1 w-full min-w-0 pb-20 lg:pb-0">
                    {children}
                </div>
                <BottomNav />
            </div>
        </SidebarProvider>
    );
}

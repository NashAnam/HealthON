export default function Loading() {
    return (
        <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center">
            <div className="relative w-20 h-20">
                {/* Brand Logo Pulse Effect */}
                <div className="absolute inset-0 bg-[#649488]/20 rounded-full animate-ping" />
                <div className="absolute inset-2 bg-[#602E5A]/10 rounded-full animate-pulse" />

                {/* Spinner */}
                <div className="absolute inset-0 border-4 border-[#649488]/30 border-t-[#602E5A] rounded-full animate-spin" />

                {/* Center Icon (Optional, clean look) */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3 h-3 bg-[#602E5A] rounded-full" />
                </div>
            </div>
            <h2 className="mt-8 text-[#602E5A] font-bold text-lg tracking-widest animate-pulse">HEALTHON</h2>
        </div>
    )
}

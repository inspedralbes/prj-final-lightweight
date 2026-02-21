import { useNavigate, useLocation } from "react-router-dom";
import { Dumbbell, List, ChevronRight, LogOut, FileText } from "./Icons";

export interface LayoutProps {
    children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="flex bg-[#0a0a0a] min-h-screen text-gray-300 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col fixed h-full z-10">
                <div className="p-6 flex items-center gap-3">
                    <Dumbbell className="w-8 h-8 text-orange-500" />
                    <span className="text-xl font-bold text-white tracking-tight">
                        Light<span className="text-orange-500">Weight</span>
                    </span>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1">
                    <div className="text-xs font-semibold text-gray-500 uppercase px-3 mb-2 tracking-wider">
                        Management
                    </div>

                    <button
                        onClick={() => navigate("/dashboard")}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive("/dashboard")
                            ? "bg-[#1a1a1a] text-orange-500"
                            : "text-gray-400 hover:bg-[#1a1a1a] hover:text-white"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <List
                                className={`w-5 h-5 ${isActive("/dashboard") ? "text-orange-500" : "text-gray-500 group-hover:text-white"
                                    }`}
                            />
                            Routines
                        </div>
                        {isActive("/dashboard") && <ChevronRight className="w-4 h-4" />}
                    </button>

                    <button
                        onClick={() => navigate("/programs")} // Placeholder route
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive("/programs")
                            ? "bg-[#1a1a1a] text-orange-500"
                            : "text-gray-400 hover:bg-[#1a1a1a] hover:text-white"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <FileText
                                className={`w-5 h-5 ${isActive("/programs") ? "text-orange-500" : "text-gray-500 group-hover:text-white"
                                    }`}
                            />
                            Programs
                        </div>
                    </button>
                </nav>

                <div className="p-4 border-t border-[#1a1a1a]">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-[#1a1a1a] hover:text-white transition-all duration-200"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8 bg-[#0a0a0a]">
                {children}
            </main>
        </div>
    );
};

export default Layout;

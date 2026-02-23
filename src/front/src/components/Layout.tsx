import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Dumbbell, List, ChevronRight, LogOut, FileText, Menu, X } from "./Icons";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";

export interface LayoutProps {
    children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    const isActive = (path: string) => location.pathname === path;

    const navItems = [
        { path: "/dashboard", label: t("sidebar.dashboard"), icon: List },
        { path: "/programs", label: t("sidebar.documentation"), icon: FileText },
    ];

    return (
        <div className="flex h-screen bg-[#0a0a0a] text-gray-300 font-sans">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`${
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            } md:translate-x-0 transform transition-transform duration-300 ease-in-out fixed md:static inset-y-0 left-0 w-64 bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col z-40`}>
                {/* Header */}
                <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Dumbbell className="w-8 h-8 text-orange-500" />
                        <span className="text-xl font-bold text-white tracking-tight hidden sm:inline">
                            Light<span className="text-orange-500">Weight</span>
                        </span>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="md:hidden text-gray-400 hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                    <div className="text-xs font-semibold text-gray-500 uppercase px-3 mb-4 tracking-wider">
                        Management
                    </div>

                    {navItems.map(({ path, label, icon: Icon }) => (
                        <button
                            key={path}
                            onClick={() => {
                                navigate(path);
                                setSidebarOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                                isActive(path)
                                    ? "bg-[#1a1a1a] text-orange-500"
                                    : "text-gray-400 hover:bg-[#1a1a1a] hover:text-white"
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <Icon
                                    className={`w-5 h-5 ${
                                        isActive(path)
                                            ? "text-orange-500"
                                            : "text-gray-500 group-hover:text-white"
                                    }`}
                                />
                                {label}
                            </div>
                            {isActive(path) && <ChevronRight className="w-4 h-4" />}
                        </button>
                    ))}
                </nav>

                {/* Language Switcher */}
                <div className="p-4 border-t border-[#1a1a1a]">
                    <LanguageSwitcher />
                </div>

                {/* Logout Button */}
                <div className="p-4 border-t border-[#1a1a1a]">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-[#1a1a1a] hover:text-white transition-all duration-200"
                    >
                        <LogOut className="w-5 h-5" />
                        {t("common.logout")}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar (Mobile) */}
                <div className="md:hidden bg-[#1a1a1a] border-b border-[#2a2a2a] px-4 py-4 flex items-center justify-between">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="text-gray-400 hover:text-white"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <Dumbbell className="w-6 h-6 text-orange-500" />
                </div>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#0a0a0a]">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;

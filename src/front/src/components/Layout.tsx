import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Dumbbell,
  List,
  ChevronRight,
  LogOut,
  FileText,
  Menu,
  X,
  User,
} from "./Icons";
import { Ticket } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

export interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  // MENÚ PARA ENTRENADORES
  const coachNavItems = [
    {
      path: "/dashboard",
      label: t("sidebar.dashboard") || "Panel de control",
      icon: List,
    },
    { path: "/clients", label: t("sidebar.clients") || "Clientes", icon: List },
    {
      path: "/programs",
      label: t("sidebar.documentation") || "Documentación",
      icon: FileText,
    },
  ];

  // MENÚ PARA CLIENTES
  const clientNavItems = [
    {
      path: "/client-home",
      label: t("routines.title") || "Mis rutinas",
      icon: Dumbbell,
    },
    {
      path: "/clients/invitations",
      label: t("sidebar.invitations") || "Invitations",
      icon: Ticket,
    },
  ];

  // El menú cambia automáticamente según quién inicie sesión
  const navItems = user?.role === "CLIENT" ? clientNavItems : coachNavItems;

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
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transform transition-transform duration-300 ease-in-out fixed md:static inset-y-0 left-0 w-64 bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col z-40`}
      >
        {/* Header */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-0">
            <img
              src="/LW_logo.png"
              alt="LightWeight Logo"
              className="w-15 h-15 object-contain"
            />
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
            {t("sidebar.management") || "Gestión"}
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

        {/* --- PARTE INFERIOR DEL SIDEBAR --- */}
        <div className="mt-auto flex flex-col">
          {/* Language Switcher */}
          <div className="p-4 border-t border-[#1a1a1a]">
            <LanguageSwitcher />
          </div>

          {/* Tarjeta de Perfil y Botón de Salir */}
          <div className="p-4 border-t border-[#1a1a1a]">
            <div className="flex items-center justify-between bg-[#111111] p-3 rounded-xl border border-[#222222]">
              <div className="flex flex-col">
                <span className="text-white font-medium text-sm truncate max-w-[120px]">
                  {user?.username || username || "Usuario"}
                </span>
                <span className="text-gray-500 text-xs mt-0.5">
                  {user?.role === "COACH"
                    ? t("auth.roleCoach")
                    : t("auth.roleClient")}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-orange-500 hover:bg-[#1a1a1a] p-2 rounded-lg transition-all"
                title={t("common.logout") || "Cerrar sesión"}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
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
          <img
            src="/LW_logo.png"
            alt="LightWeight Logo"
            className="w-10 h-10 object-contain"
          />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#0a0a0a]">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

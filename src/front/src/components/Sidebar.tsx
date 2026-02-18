import React from 'react';
import SidebarItem from './SidebarItem';
import { Link } from 'react-router-dom';

// Barra lateral mínima amb paleta negre+taronja
export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-900 min-h-screen p-6 flex flex-col justify-between">
      {/* Cap: logo i títol */}
      <div>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-orange-500 rounded flex items-center justify-center font-bold text-black">CP</div>
          <div>
            <div className="text-lg font-bold text-white">COACHPRO</div>
            <div className="text-xs text-gray-500">Panell</div>
          </div>
        </div>

        {/* Elements de navegació mínims */}
        <nav className="space-y-2">
          <Link to="/home"><SidebarItem label="Resum" /></Link>
          <Link to="/clients"><SidebarItem label="Clients" /></Link>
          <Link to="/programs"><SidebarItem label="Programes" /></Link>
          <Link to="/messages"><SidebarItem label="Missatges" badge={4} /></Link>
        </nav>
      </div>

      {/* Peu amb usuari i botó tancar sessió */}
      <div className="flex items-center gap-3">
        <img src="https://i.pravatar.cc/40" alt="avatar" className="w-10 h-10 rounded-full" />
        <div className="flex-1">
          <div className="text-sm font-semibold text-white">Entrenador Mike</div>
          <div className="text-xs text-gray-500">Compte Pro</div>
        </div>
      </div>
    </aside>
  );
}

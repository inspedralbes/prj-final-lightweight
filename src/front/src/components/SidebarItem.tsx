import React from 'react';

type Props = {
  label: string;
  badge?: string | number;
};

// Componente simple per a un element de la barra lateral
export default function SidebarItem({ label, badge }: Props) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded hover:bg-gray-700 cursor-pointer">
      <div className="flex items-center gap-3">
        {/* Indicador icònic (placeholder) */}
        <div className="w-2 h-6 bg-orange-500 rounded" />
        <span className="text-sm text-gray-200">{label}</span>
      </div>
      {badge ? <span className="text-xs text-orange-400">{badge}</span> : null}
    </div>
  );
}

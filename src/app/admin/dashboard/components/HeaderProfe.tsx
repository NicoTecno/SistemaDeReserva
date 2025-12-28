"use client";
import React from 'react';
import { Users, LogOut, Calendar, Clock, ShieldCheck } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export function HeaderProfe({ activeTab, setActiveTab, pendientesAccion, setModalConfig }: any) {
  const supabase = createClient();

  const handleLogout = () => {
    setModalConfig({
      isOpen: true,
      title: "¿Cerrar Sesión?",
      message: "¿Confirmas que quieres salir del panel de administración?",
      type: 'danger',
      onConfirm: async () => {
        await supabase.auth.signOut();
        window.location.replace('/');
      }
    });
  };

  const tabs = [
    { id: 'agenda', icon: Calendar, label: 'AGENDA' },
    { id: 'pendientes', icon: Clock, label: 'ACCIONES' },
    { id: 'alumnos', icon: Users, label: 'ALUMNOS' },
    { id: 'verificar', icon: ShieldCheck, label: 'VERIFICAR' }
  ];

  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
      {/* IDENTIDAD */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
          <Users size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none text-slate-800">
            Dashboard <span className="text-indigo-600">Profe</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest italic mt-1">Gestión Administrativa</p>
        </div>
      </div>

      {/* NAVEGACIÓN Y LOGOUT */}
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <div className="flex bg-white p-1.5 rounded-[2rem] border border-slate-100 shadow-sm overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-[1.5rem] font-black text-[10px] transition-all uppercase flex items-center gap-2 relative ${
                activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <tab.icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
              
              {tab.id === 'pendientes' && pendientesAccion > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                  {pendientesAccion}
                </span>
              )}
            </button>
          ))}
        </div>

        <button 
          onClick={handleLogout} 
          className="p-4 bg-white border border-slate-100 rounded-2xl text-rose-500 hover:bg-rose-50 transition-colors shadow-sm ml-auto md:ml-0"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
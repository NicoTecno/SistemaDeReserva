"use client";
import React from 'react';
import { User, LogOut } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export function HeaderAlumno({ perfil, activeTab, setActiveTab, setModalConfig }: any) {
  const supabase = createClient();

  const handleLogout = () => {
    setModalConfig({
      isOpen: true,
      title: "¿Cerrar Sesión?",
      message: "¿Confirmas que quieres salir?",
      type: 'danger',
      onConfirm: async () => {
        await supabase.auth.signOut();
        window.location.replace('/');
      }
    });
  };

  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
          <User size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter uppercase">Hola, {perfil?.full_name?.split(' ')[0]}</h1>
          <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest italic">Panel de Alumno</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex bg-white p-1.5 rounded-[2rem] border border-slate-100 shadow-sm">
          {['reservar', 'agenda', 'perfil'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 rounded-[1.5rem] font-black text-[10px] transition-all uppercase ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>
              {tab}
            </button>
          ))}
        </div>
        <button onClick={handleLogout} className="p-4 bg-white border border-slate-100 rounded-2xl text-rose-500 hover:bg-rose-100 transition-colors shadow-sm">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
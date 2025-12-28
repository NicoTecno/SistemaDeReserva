"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Save, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export function PerfilView({ perfil, setPerfil, setCargando, setModalConfig }: any) {
  const supabase = createClient();

  const actualizarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    const { error } = await supabase.from('perfiles').update({
      full_name: perfil.full_name,
      nivel_educativo: perfil.nivel_educativo,
      nombre_tutor: perfil.nombre_tutor,
      whatsapp_tutor: perfil.whatsapp_tutor
    }).eq('id', perfil.id);
    setCargando(false);
    if (!error) setModalConfig({ isOpen: true, title: "Éxito", message: "Perfil actualizado.", type: 'success' });
  };

  return (
    <motion.div key="perfil" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto w-full">
      <form onSubmit={actualizarPerfil} className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-slate-100 shadow-sm space-y-8">
        <div className="space-y-6">
          <h2 className="text-xl font-black italic uppercase text-indigo-600">Datos Alumno</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="text" placeholder="Nombre completo" required value={perfil?.full_name || ''} onChange={(e) => setPerfil({...perfil, full_name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none" />
            <select value={perfil?.nivel_educativo || ''} onChange={(e) => setPerfil({...perfil, nivel_educativo: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none">
              <option value="">Nivel Educativo...</option>
              <option value="Primaria">Primaria</option>
              <option value="Secundaria">Secundaria</option>
              <option value="Terciario/Universitario">Terciario/Universitario</option>
            </select>
          </div>
          <h2 className="text-xl font-black italic uppercase text-indigo-600 pt-4">Tutor</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="text" placeholder="Nombre Tutor" value={perfil?.nombre_tutor || ''} onChange={(e) => setPerfil({...perfil, nombre_tutor: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none" />
            <input type="tel" placeholder="WhatsApp Tutor" value={perfil?.whatsapp_tutor || ''} onChange={(e) => setPerfil({...perfil, whatsapp_tutor: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none" />
          </div>
        </div>
        <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[1.8rem] font-black uppercase text-[11px] shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3">
          <Save size={18}/> Guardar Perfil
        </button>
      </form>
    </motion.div>
  );
}
"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ModalCustom } from '@/components/ModalCustom';
import { Loader2, Clock, BellRing } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Importación de sub-componentes
import { HeaderAlumno } from './components/HeaderAlumno';
import { ReservaView } from './components/ReservaView';
import { AgendaView } from './components/AgendaView';
import { PerfilView } from './components/PerfilView';

export default function PanelAlumno() {
  const supabase = createClient();
  
  const [activeTab, setActiveTab] = useState<'reservar' | 'agenda' | 'perfil'>('reservar');
  const [perfil, setPerfil] = useState<any>(null);
  const [verificando, setVerificando] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [clasesOcupadas, setClasesOcupadas] = useState<any[]>([]);
  const [misClases, setMisClases] = useState<any[]>([]);
  const [modalConfig, setModalConfig] = useState({ 
    isOpen: false, title: '', message: '', type: 'info' as any, onConfirm: undefined as any 
  });

  // ESTADO PARA NOTIFICACIONES GLOBALES (TOAST)
  const [globalToast, setGlobalToast] = useState<{ msg: string; tipo: 'success' | 'info' } | null>(null);

  useEffect(() => {
    let canalGlobal: any;

    const checkUser = async () => {
      setVerificando(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) { 
        window.location.replace('/'); 
        return; 
      }

      const { data: p } = await supabase.from('perfiles').select('*').eq('id', session.user.id).single();
      if (!p) { 
        window.location.replace('/'); 
        return; 
      }

      setPerfil(p);
      setVerificando(false);
      await cargarDatos(session.user.id);

      // ==========================================
      // ESCUCHA GLOBAL EN TIEMPO REAL (SOCKET)
      // ==========================================
      canalGlobal = supabase
        .channel('notificaciones_panel')
        .on(
          'postgres_changes', 
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'clases', 
            filter: `id_alumno=eq.${session.user.id}` 
          }, 
          (payload) => {
            // 1. Refrescar datos
            cargarDatos(session.user.id);

            const nueva = payload.new as any;
            const vieja = payload.old as any;

            // --- LÓGICA DE NOTIFICACIONES CORREGIDA ---

            // A. Si el cambio fue por NOTAS DE PAGO (Evitamos que salten otros mensajes)
            if (nueva.notas_pago_problema !== vieja?.notas_pago_problema) {
              if (nueva.notas_pago_problema) {
                lanzarToast("Atención: Hay un problema con tu comprobante ⚠️", 'info');
              }
              return; // Importante: Salimos para que no evalúe los estados de clase
            }

            // B. Si el cambio fue por SUBIR UN COMPROBANTE (nueva.comprobante_url cambió)
            // Si el alumno acaba de subir algo, no queremos que salten avisos de "Confirmado"
            if (nueva.comprobante_url !== vieja?.comprobante_url) {
              return; // Silenciamos cualquier notificación si el cambio es solo la URL del archivo
            }

            // C. CLASE CONFIRMADA (Ahora más estricto)
            // Solo avisar si antes era 'solicitado' y ahora es 'confirmado'
            if (vieja?.estado === 'solicitado' && nueva.estado === 'confirmado') {
              lanzarToast("¡Tu clase ha sido confirmada! 🚀", 'success');
              return;
            }

            // D. PAGO APROBADO
            if (nueva.pagado === true && vieja?.pagado === false) {
              lanzarToast("¡Pago verificado correctamente! ✅", 'success');
              return;
            }
          }
        )
        .subscribe();
    };

    checkUser();

    return () => {
      if (canalGlobal) supabase.removeChannel(canalGlobal);
    };
  }, []);

  const lanzarToast = (msg: string, tipo: 'success' | 'info') => {
    setGlobalToast({ msg, tipo });
    setTimeout(() => setGlobalToast(null), 6000);
  };

  const cargarDatos = async (userId?: string) => {
    const id = userId || perfil?.id;
    if (!id) return;

    const { data: todas } = await supabase
      .from('clases')
      .select('fecha_inicio, fecha_fin, estado')
      .in('estado', ['solicitado', 'confirmado', 'finalizada']); 
    setClasesOcupadas(todas || []);

    const { data: mias } = await supabase
      .from('clases')
      .select('*')
      .eq('id_alumno', id)
      .neq('estado', 'cancelado') 
      .order('fecha_inicio', { ascending: false }); 
      
    setMisClases(mias || []);
  };

  if (verificando) return (
    <div className="min-h-screen bg-[#FDFDFF] flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans">Verificando acceso...</p>
    </div>
  );

  if (perfil && !perfil.verificado && activeTab !== 'perfil') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-[13px] font-sans">
        <div className="max-w-md w-full bg-white rounded-[3rem] p-10 shadow-xl text-center space-y-6 border border-slate-100">
          <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Clock size={40} />
          </div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-slate-800">Cuenta en Verificación</h1>
          <p className="text-slate-500 leading-relaxed">
            Hola {perfil.full_name?.split(' ')[0]}. Un administrador debe validar tu cuenta antes de que puedas realizar reservas.
          </p>
          <button 
            onClick={() => setActiveTab('perfil')} 
            className="text-indigo-600 font-black uppercase text-[10px] underline tracking-widest hover:text-indigo-800 transition-colors"
          >
            Revisar mis datos personales
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFF] p-4 md:p-12 font-sans text-slate-900 pb-20 text-[13px] relative overflow-x-hidden">
      
      {/* TOAST GLOBAL */}
      <AnimatePresence>
        {globalToast && (
          <motion.div 
            initial={{ opacity: 0, y: -100, x: '-50%' }}
            animate={{ opacity: 1, y: 30, x: '-50%' }}
            exit={{ opacity: 0, y: -100, x: '-50%' }}
            className={`fixed top-0 left-1/2 z-[999] px-6 py-4 rounded-[1.8rem] shadow-2xl flex items-center gap-4 border-2 font-black text-[11px] uppercase tracking-tighter w-[92%] max-w-md
              ${globalToast.tipo === 'success' ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-slate-900 border-slate-700 text-white'}`}
          >
            <div className="bg-white/20 p-2 rounded-full">
              <BellRing size={18} className="animate-bounce" />
            </div>
            <p className="flex-1 leading-tight">{globalToast.msg}</p>
            <button onClick={() => setGlobalToast(null)} className="opacity-50 hover:opacity-100 transition-opacity">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto space-y-10">
        <HeaderAlumno 
          perfil={perfil} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          setModalConfig={setModalConfig}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'reservar' && (
              <ReservaView 
                perfil={perfil} 
                clasesOcupadas={clasesOcupadas} 
                onUpdate={cargarDatos} 
                setCargando={setCargando} 
                setModalConfig={setModalConfig} 
              />
            )}
            
            {activeTab === 'agenda' && (
              <AgendaView 
                misClases={misClases} 
                onUpdate={cargarDatos} 
                setCargando={setCargando} 
                setModalConfig={setModalConfig} 
              />
            )}

            {activeTab === 'perfil' && (
              <PerfilView 
                perfil={perfil} 
                setPerfil={setPerfil} 
                setCargando={setCargando} 
                setModalConfig={setModalConfig} 
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <ModalCustom 
        {...modalConfig} 
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))} 
      />
      
      {cargando && (
        <div className="fixed inset-0 z-[1000] bg-white/60 backdrop-blur-sm flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

function X({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}
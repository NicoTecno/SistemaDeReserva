"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { isSameDay, parseISO } from 'date-fns';
import { 
  Calendar as CalendarIcon, Clock, Users, ShieldCheck, 
  X, Download, Send, BellRing, LogOut 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ModalCustom } from '@/components/ModalCustom';

// Importación de componentes de vista
import { AgendaView } from './components/AgendaView';
import { AccionesView } from './components/AccionesView';
import { AlumnosView } from './components/AlumnosView';
import { VerificacionView } from './components/VerificacionView';

type Vista = 'agenda' | 'pendientes' | 'alumnos' | 'verificar';

export default function PanelProfesora() {
  const supabase = createClient();
  
  // --- ESTADOS ---
  const [esAdmin, setEsAdmin] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const [activeTab, setActiveTab] = useState<Vista>('agenda');
  const [clases, setClases] = useState<any[]>([]);
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [mesActual, setMesActual] = useState(new Date());
  const [imagenZoom, setImagenZoom] = useState<string | null>(null);

  // NOTIFICACIÓN FLOTANTE (TOAST)
  const [notificacion, setNotificacion] = useState<string | null>(null);

  // ESTADOS PARA CIERRE DE CLASE
  const [modalFinalizar, setModalFinalizar] = useState<{abierto: boolean, claseId: string | null}>({ 
    abierto: false, claseId: null 
  });
  const [datosClase, setDatosClase] = useState({ temas: "", comentarios: "" });

  // CONFIGURACIÓN DE MODAL GLOBAL
  const [modalConfig, setModalConfig] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    type: 'info' as 'info'|'success'|'danger',
    onConfirm: undefined as (() => void) | undefined
  });

  // --- LÓGICA DE PROTECCIÓN Y REALTIME ---
  useEffect(() => {
    let canalClases: any;

    const checkAdmin = async () => {
      setVerificando(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { window.location.href = '/'; return; }

        const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', user.id).single();
        if (!perfil || perfil.rol !== 'admin') { window.location.href = '/dashboard'; return; }

        setEsAdmin(true);
        await cargarDatos();

        canalClases = supabase
          .channel('cambios_clases_admin')
          .on(
            'postgres_changes', 
            { event: '*', schema: 'public', table: 'clases' }, 
            (payload) => {
              if (payload.eventType === 'INSERT') {
                setNotificacion("¡Nueva solicitud de clase recibida! 📥");
                setTimeout(() => setNotificacion(null), 5000);
              }
              if (payload.eventType === 'UPDATE') {
                const vieja = payload.old as any;
                const nueva = payload.new as any;
                if (nueva.comprobante_url && !vieja.comprobante_url) {
                  setNotificacion("Un alumno ha subido un comprobante de pago 💸");
                  setTimeout(() => setNotificacion(null), 5000);
                }
              }
              cargarDatos();
            }
          )
          .subscribe();

      } catch (error) {
        window.location.href = '/';
      } finally {
        setVerificando(false);
      }
    };
    
    checkAdmin();

    return () => {
      if (canalClases) supabase.removeChannel(canalClases);
    };
  }, []);

  const cargarDatos = async () => {
    try {
      const { data: dataClases } = await supabase.from('clases')
        .select(`*, perfiles:id_alumno ( id, full_name, email )`)
        .order('fecha_inicio', { ascending: true });

      setClases(dataClases || []);

      const perfilesMap = new Map();
      dataClases?.forEach(c => c.perfiles && perfilesMap.set(c.perfiles.id, c.perfiles));
      setAlumnos(Array.from(perfilesMap.values()));
    } finally { setCargando(false); }
  };

  const handleUpdate = async (id: string, updates: any) => {
    try {
      const { error } = await supabase.from('clases').update(updates).eq('id', id);
      if (error) throw error;
      
      // Solo mostramos éxito si no es una cancelación (que ya tiene su propio modal)
      if (updates.estado !== 'cancelado') {
          setModalConfig({ 
            isOpen: true, 
            title: "Éxito", 
            message: "Registro actualizado correctamente.", 
            type: 'success',
            onConfirm: undefined 
          });
      }
    } catch (err: any) {
      setModalConfig({ 
        isOpen: true, 
        title: "Error", 
        message: err.message, 
        type: 'danger',
        onConfirm: undefined 
      });
    }
  };

  // LOGOUT CON CONFIRMACIÓN
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

  // Filtros para la UI
  const clasesDelDia = clases.filter(c => isSameDay(parseISO(c.fecha_inicio), fechaSeleccionada) && c.estado !== 'cancelado');
  const pendientesAccion = clases.filter(c => (c.estado === 'solicitado' || (c.comprobante_url && !c.pagado)) && c.estado !== 'cancelado');

  if (verificando || !esAdmin) return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-4 md:p-12 font-sans text-[13px] relative overflow-x-hidden">
      
      {/* NOTIFICACIÓN FLOTANTE (TOAST) */}
      <AnimatePresence>
        {notificacion && (
          <motion.div 
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed top-10 right-10 z-[300] bg-slate-900 text-white px-6 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4 border-2 border-slate-700 font-black uppercase text-[10px] tracking-widest"
          >
            <div className="bg-indigo-600 p-2 rounded-full animate-pulse">
              <BellRing size={16} />
            </div>
            {notificacion}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER UNIFICADO */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
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

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex bg-white p-1.5 rounded-[2rem] border border-slate-100 shadow-sm overflow-x-auto">
              {[
                { id: 'agenda', icon: CalendarIcon, label: 'AGENDA' },
                { id: 'pendientes', icon: Clock, label: 'ACCIONES' },
                { id: 'alumnos', icon: Users, label: 'ALUMNOS' },
                { id: 'verificar', icon: ShieldCheck, label: 'VERIFICAR' }
              ].map((tab) => (
                <button 
                  key={tab.id} 
                  onClick={() => setActiveTab(tab.id as Vista)} 
                  className={`px-5 py-2.5 rounded-[1.5rem] font-black text-[10px] transition-all uppercase flex items-center gap-2 relative ${
                    activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'
                  }`}
                >
                  <tab.icon size={14}/> 
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.id === 'pendientes' && pendientesAccion.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                      {pendientesAccion.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <button 
              onClick={handleLogout} 
              className="p-4 bg-white border border-slate-100 rounded-2xl text-rose-500 hover:bg-rose-100 transition-colors shadow-sm ml-auto md:ml-0"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* CONTENIDO DE VISTAS */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            {activeTab === 'agenda' && (
              <AgendaView 
                mesActual={mesActual} setMesActual={setMesActual}
                fechaSeleccionada={fechaSeleccionada} setFechaSeleccionada={setFechaSeleccionada}
                clases={clases} clasesDelDia={clasesDelDia}
                handleUpdate={handleUpdate} setModalFinalizar={setModalFinalizar}
                setModalConfig={setModalConfig} 
              />
            )}
            {activeTab === 'pendientes' && (
              <AccionesView 
                pendientes={pendientesAccion} 
                setImagenZoom={setImagenZoom} 
                handleUpdate={handleUpdate} 
                setModalConfig={setModalConfig} 
              />
            )}
            {activeTab === 'alumnos' && (
              <AlumnosView 
                alumnos={alumnos} 
                clases={clases} 
                setModalFinalizar={(config: any) => {
                  const claseExistente = clases.find(c => c.id === config.claseId);
                  if (claseExistente) {
                    setDatosClase({
                      temas: claseExistente.temas_vistos || "",
                      comentarios: claseExistente.comentarios_profe || ""
                    });
                  } else {
                    setDatosClase({ temas: "", comentarios: "" });
                  }
                  setModalFinalizar(config);
                }} 
              />
            )}
            {activeTab === 'verificar' && <VerificacionView />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* --- MODAL DE FINALIZACIÓN / EDICIÓN --- */}
      <AnimatePresence>
        {modalFinalizar.abierto && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setModalFinalizar({ abierto: false, claseId: null })} />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="relative bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl">
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-black text-slate-800 italic uppercase">Resumen de Clase</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 text-center">Informa lo trabajado al alumno</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-1 block">Temas Vistos</label>
                    <input type="text" placeholder="Ej: Fracciones y Decimales" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500" value={datosClase.temas} onChange={(e) => setDatosClase({...datosClase, temas: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-1 block">Comentarios / Tarea</label>
                    <textarea placeholder="Ej: Quedaron ejercicios pendientes de la guía..." className="w-full min-h-[100px] p-6 bg-slate-50 border border-slate-100 rounded-[2rem] font-medium italic outline-none focus:border-indigo-500 resize-none" value={datosClase.comentarios} onChange={(e) => setDatosClase({...datosClase, comentarios: e.target.value})} />
                  </div>
                </div>
                <button 
                  onClick={async () => {
                    await handleUpdate(modalFinalizar.claseId!, { 
                      estado: 'finalizada', temas_vistos: datosClase.temas, comentarios_profe: datosClase.comentarios 
                    });
                    setModalFinalizar({ abierto: false, claseId: null });
                    setDatosClase({ temas: "", comentarios: "" });
                  }}
                  className="w-full py-5 bg-slate-900 text-white font-black text-[10px] uppercase rounded-[1.8rem] hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100"
                >
                  <Send size={14}/> Guardar y Finalizar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- ZOOM DE IMAGEN --- */}
      <AnimatePresence>
        {imagenZoom && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setImagenZoom(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="relative max-w-lg w-full bg-white rounded-[3rem] overflow-hidden" onClick={e => e.stopPropagation()}>
              <button onClick={() => setImagenZoom(null)} className="absolute top-6 right-6 p-2 bg-white/80 rounded-full text-slate-800 z-10 hover:bg-white transition-all"><X size={20}/></button>
              <img src={imagenZoom} className="w-full h-auto max-h-[70vh] object-contain p-2" alt="Ticket" />
              <div className="p-8 text-center bg-white border-t border-slate-100">
                <a href={imagenZoom} download className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest inline-flex items-center gap-2"><Download size={14}/> Descargar Ticket</a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL GLOBAL */}
      <ModalCustom 
        isOpen={modalConfig.isOpen} 
        onClose={() => setModalConfig({...modalConfig, isOpen: false})} 
        title={modalConfig.title} 
        message={modalConfig.message} 
        type={modalConfig.type} 
        onConfirm={modalConfig.onConfirm}
      />
    </div>
  );
}
"use client";

import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  User, Eye, Wallet, XCircle, AlertCircle, 
  Send, CheckCircle2, Clock, Trash2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AccionesView = ({ pendientes, setImagenZoom, handleUpdate, setModalConfig }: any) => {
  const [modalRechazo, setModalRechazo] = useState<{ abierto: boolean; claseId: string | null }>({
    abierto: false,
    claseId: null
  });
  const [motivoRechazo, setMotivoRechazo] = useState("");

  const opcionesRapidas = [
    "Monto incorrecto",
    "Comprobante ilegible",
    "Transferencia no recibida",
    "No corresponde a la fecha"
  ];

  const abrirModalRechazo = (id: string) => {
    setModalRechazo({ abierto: true, claseId: id });
    setMotivoRechazo("");
  };

  const cerrarModalRechazo = () => {
    setModalRechazo({ abierto: false, claseId: null });
  };

  const confirmarRechazo = () => {
    if (modalRechazo.claseId && motivoRechazo.trim()) {
      handleUpdate(modalRechazo.claseId, { 
        comprobante_url: null, 
        notas_pago_problema: motivoRechazo 
      });
      cerrarModalRechazo();
    }
  };

  // --- NUEVA FUNCIÓN DE CANCELACIÓN ESTÉTICA ---
  const manejarCancelacionAdmin = (clase: any) => {
    setModalConfig({
      isOpen: true,
      title: "¿Cancelar esta clase?",
      message: `Estás a punto de cancelar la clase de ${clase.perfiles?.full_name || 'el alumno'}. Esta acción no se puede deshacer.`,
      type: 'danger',
      confirmText: "Sí, cancelar clase",
      onConfirm: () => handleUpdate(clase.id, { estado: 'cancelado' })
    });
  };

  return (
    <div className="grid gap-4 relative">
      {/* --- ESTADO VACÍO --- */}
      {pendientes.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/50 border-2 border-dashed border-slate-200 rounded-[3rem] p-20 text-center"
        >
          <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <CheckCircle2 className="text-emerald-500" size={30} />
          </div>
          <h3 className="text-slate-800 font-black uppercase italic">¡Todo al día!</h3>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
            No hay solicitudes ni pagos por revisar.
          </p>
        </motion.div>
      )}

      {/* --- LISTADO --- */}
      <AnimatePresence>
        {pendientes.map((clase: any) => {
          const inicio = parseISO(clase.fecha_inicio);
          const fin = parseISO(clase.fecha_fin);
          const duracion = Math.round((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60));

          return (
            <motion.div 
              layout
              key={clase.id} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] p-6 border border-slate-100 flex flex-col md:flex-row items-center gap-6 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-slate-100">
                  <User size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-800 text-base italic uppercase">
                      {clase.perfiles?.full_name || 'Alumno'}
                    </h3>
                    {duracion > 1 && (
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-black rounded-md uppercase tracking-tighter">
                        {duracion} Horas
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase">
                    <Clock size={12} className="text-slate-300" />
                    <span>{format(inicio, "dd/MM", { locale: es })}</span>
                    <span className="text-indigo-600 font-black">
                      {format(inicio, "HH:mm")} a {format(fin, "HH:mm")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                {clase.comprobante_url && !clase.pagado && (
                  <button 
                    onClick={() => setImagenZoom(clase.comprobante_url)} 
                    className="px-4 py-2.5 bg-amber-50 text-amber-600 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-amber-100 transition-all border border-amber-100"
                  >
                    <Eye size={14}/> Ticket
                  </button>
                )}

                <div className="flex gap-2 border-l pl-4 border-slate-100">
                  {clase.estado === 'solicitado' && (
                    <button 
                      onClick={() => handleUpdate(clase.id, { estado: 'confirmado' })} 
                      className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase hover:bg-slate-900 shadow-lg shadow-indigo-100 transition-all"
                    >
                      Confirmar
                    </button>
                  )}

                  {clase.comprobante_url && !clase.pagado && (
                    <>
                      <button 
                        onClick={() => handleUpdate(clase.id, { pagado: true })} 
                        className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase hover:bg-emerald-600 flex items-center gap-2 shadow-lg shadow-emerald-100 transition-all"
                      >
                        <Wallet size={14}/> Cobrado
                      </button>
                      
                      <button 
                        onClick={() => abrirModalRechazo(clase.id)}
                        className="bg-rose-50 text-rose-500 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase hover:bg-rose-100 flex items-center gap-2 border border-rose-100 transition-all"
                      >
                        <AlertCircle size={14}/> Problema
                      </button>
                    </>
                  )}

                  {/* BOTÓN CANCELAR REDISEÑADO */}
                  {!clase.pagado && !clase.comprobante_url && ( // <--- NUEVA CONDICIÓN
                    <button 
                      onClick={() => manejarCancelacionAdmin(clase)} 
                      className="flex items-center gap-1 px-3 py-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all font-black text-[9px] uppercase"
                    >
                      <XCircle size={18} />
                      <span className="hidden lg:inline">Cancelar</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* --- MODAL DE RECHAZO (PROBLEMA) --- */}
      <AnimatePresence>
        {modalRechazo.abierto && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
              onClick={cerrarModalRechazo}
            />
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-[1.5rem] flex items-center justify-center">
                  <AlertCircle size={32}/>
                </div>
                
                <div>
                  <h3 className="text-xl font-black text-slate-800 italic uppercase">Reportar Problema</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                    Esto borrará el ticket y pedirá al alumno que suba uno nuevo
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-2">
                  {opcionesRapidas.map(opcion => (
                    <button
                      key={opcion}
                      onClick={() => setMotivoRechazo(opcion)}
                      className={`px-4 py-2 rounded-full text-[10px] font-black uppercase transition-all border
                        ${motivoRechazo === opcion 
                          ? 'bg-rose-500 border-rose-500 text-white shadow-md' 
                          : 'bg-white border-slate-100 text-slate-500 hover:border-rose-200'}`}
                    >
                      {opcion}
                    </button>
                  ))}
                </div>

                <textarea 
                  placeholder="Escribe el motivo aquí..."
                  className="w-full min-h-[100px] p-5 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm focus:outline-none focus:border-rose-500 transition-all resize-none italic"
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                />

                <div className="flex w-full gap-3">
                  <button onClick={cerrarModalRechazo} className="flex-1 py-4 text-slate-400 font-black text-[10px] uppercase">
                    Volver
                  </button>
                  <button 
                    onClick={confirmarRechazo}
                    disabled={!motivoRechazo.trim()}
                    className="flex-1 py-4 bg-slate-900 text-white font-black text-[10px] uppercase rounded-2xl shadow-xl hover:bg-rose-600 transition-all disabled:opacity-30"
                  >
                    Notificar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
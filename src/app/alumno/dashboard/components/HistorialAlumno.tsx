"use client";

import React, { useState } from 'react';
import { BookOpen, Info, Filter, X, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

export const HistorialAlumno = ({ clases }: { clases: any[] }) => {
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [verResumen, setVerResumen] = useState<any>(null);

  // Filtrado de sus propias clases
  const clasesFiltradas = clases
    .filter((c: any) => {
      if (filtroEstado === "todas") return true;
      if (filtroEstado === "pendientes_pago") return !c.pagado && c.estado !== 'cancelado';
      return c.estado === filtroEstado;
    })
    .sort((a: any, b: any) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime());

  return (
    <div className="space-y-6">
      {/* Header con Filtros */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 italic uppercase">Mi Historial</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revisa tus clases y temas vistos</p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
          <Filter size={14} className="text-slate-400 ml-2" />
          <select 
            value={filtroEstado} 
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="bg-transparent text-[10px] font-black uppercase outline-none text-slate-600 cursor-pointer"
          >
            <option value="todas">Todas las clases</option>
            <option value="finalizada">Completadas</option>
            <option value="pendientes_pago">Pendientes de Pago</option>
            <option value="cancelado">Canceladas</option>
          </select>
        </div>
      </div>

      {/* Lista de Clases */}
      <div className="grid grid-cols-1 gap-3">
        {clasesFiltradas.length > 0 ? (
          clasesFiltradas.map((c: any) => (
            <div key={c.id} className="group bg-white p-5 rounded-[2rem] border border-slate-100 flex items-center justify-between hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${
                  c.estado === 'finalizada' ? 'bg-indigo-50 text-indigo-600' : 
                  c.estado === 'cancelado' ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-600'
                }`}>
                  <BookOpen size={20} />
                </div>
                <div>
                  <p className="font-black text-slate-700 italic text-[13px] uppercase">
                    {format(parseISO(c.fecha_inicio), "EEEE dd 'de' MMMM", { locale: es })}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Clock size={12} className="text-slate-400"/>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {format(parseISO(c.fecha_inicio), "HH:mm")} hs
                    </span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                      c.pagado ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                    }`}>
                      {c.pagado ? 'Cobrada' : 'Pendiente de Pago'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {c.estado === 'finalizada' && (
                  <button 
                    onClick={() => setVerResumen(c)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase hover:bg-indigo-600 transition-all shadow-lg active:scale-95"
                  >
                    <Info size={14}/> Ver Resumen
                  </button>
                )}
                {c.estado === 'cancelado' && (
                  <span className="text-[9px] font-black text-rose-400 uppercase italic mr-4 text-right">Clase Anulada</span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <AlertCircle size={40} className="mx-auto text-slate-200 mb-3" />
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">No se encontraron clases</p>
          </div>
        )}
      </div>

      {/* MODAL DE RESUMEN PARA EL ALUMNO */}
      <AnimatePresence>
        {verResumen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl relative border border-slate-100">
              <button onClick={() => setVerResumen(null)} className="absolute top-8 right-8 text-slate-300 hover:text-indigo-600 transition-colors"><X size={24}/></button>
              
              <div className="space-y-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-indigo-600 text-white rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-100 rotate-3">
                    <CheckCircle2 size={32}/>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 italic uppercase italic">¡Clase Lograda!</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Repasa lo que aprendimos hoy</p>
                </div>

                <div className="space-y-6">
                  <div className="relative">
                    <div className="absolute -left-4 top-0 w-1 h-full bg-indigo-500 rounded-full opacity-20"></div>
                    <h5 className="text-[10px] font-black text-indigo-500 uppercase mb-2 tracking-tighter">Temas de la sesión:</h5>
                    <p className="font-bold text-slate-700 text-sm leading-relaxed italic uppercase">
                      {verResumen.temas_vistos || "Contenido general de la materia."}
                    </p>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-5 text-indigo-600">
                      <BookOpen size={40}/>
                    </div>
                    <h5 className="text-[10px] font-black text-slate-400 uppercase mb-2">Notas de tu Profe:</h5>
                    <p className="text-slate-600 text-[13px] leading-relaxed">
                      {verResumen.comentarios_profe || "¡Excelente clase hoy! Sigue practicando los ejercicios propuestos."}
                    </p>
                  </div>
                </div>

                <button onClick={() => setVerResumen(null)} className="w-full py-5 bg-slate-900 text-white rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl">Entendido</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
import React, { useState } from 'react';
import { Search, User, History, Users, Eye, Filter, Edit3, BookOpen, Info, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

export const AlumnosView = ({ alumnos, clases, setModalFinalizar }: any) => {
  const [filtroNombre, setFiltroNombre] = useState("");
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<any>(null);
  const [filtroEstado, setFiltroEstado] = useState("todas");
  
  // Nuevo estado para ver el resumen sin editar
  const [verResumen, setVerResumen] = useState<any>(null);

  const alumnosFiltrados = alumnos.filter((a: any) => 
    a.full_name?.toLowerCase().includes(filtroNombre.toLowerCase())
  );

  const obtenerHistorialFiltrado = (idAlumno: string) => {
    let historial = clases.filter((c: any) => c.id_alumno === idAlumno);
    if (filtroEstado !== "todas") historial = historial.filter((c: any) => c.estado === filtroEstado);
    return historial.sort((a: any, b: any) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime());
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
      {/* Columna Izquierda (Buscador) - Se mantiene igual */}
      <div className="lg:col-span-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
          <input type="text" placeholder="Buscar alumno..." className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-slate-100 focus:outline-none shadow-sm" onChange={(e) => setFiltroNombre(e.target.value)} />
        </div>
        <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
          {alumnosFiltrados.map((alumno: any) => (
            <button key={alumno.id} onClick={() => { setAlumnoSeleccionado(alumno); setFiltroEstado("todas"); }} className={`w-full p-5 rounded-[2rem] flex items-center gap-4 transition-all border ${alumnoSeleccionado?.id === alumno.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl' : 'bg-white border-slate-50 text-slate-600 hover:border-indigo-100'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${alumnoSeleccionado?.id === alumno.id ? 'bg-white/20' : 'bg-slate-50 text-indigo-500'}`}><User size={20}/></div>
              <div className="text-left">
                <p className="font-black text-sm uppercase italic tracking-tight">{alumno.full_name}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Columna Derecha (Historial) */}
      <div className="lg:col-span-8">
        {alumnoSeleccionado ? (
          <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-800 italic uppercase">{alumnoSeleccionado.full_name}</h2>
              <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="bg-slate-50 p-2 rounded-xl text-[10px] font-black uppercase outline-none border border-slate-100">
                <option value="todas">Todas</option>
                <option value="finalizada">Finalizadas</option>
              </select>
            </div>

            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-2 custom-scrollbar">
              {obtenerHistorialFiltrado(alumnoSeleccionado.id).map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white rounded-xl shadow-sm text-indigo-500"><BookOpen size={16}/></div>
                    <div>
                      <p className="font-black text-slate-700 text-[11px] uppercase italic">
                        {format(parseISO(c.fecha_inicio), "dd MMM, HH:mm", { locale: es })} hs
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[150px]">
                        {c.temas_vistos || "Sin temas"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* BOTÓN INFO: Ver detalles sin editar */}
                    {c.estado === 'finalizada' && (
                      <button onClick={() => setVerResumen(c)} className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-indigo-600 transition-all">
                        <Info size={16}/>
                      </button>
                    )}
                    
                    {/* BOTÓN EDITAR */}
                    {c.estado === 'finalizada' && (
                      <button onClick={() => setModalFinalizar({ abierto: true, claseId: c.id })} className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-emerald-600 transition-all">
                        <Edit3 size={16}/>
                      </button>
                    )}

                    <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-xl ${c.pagado ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                      {c.pagado ? 'Ok' : '$'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 p-24 border-2 border-dashed border-slate-100 rounded-[3rem] bg-white opacity-40 italic font-black uppercase text-[10px]">Selecciona un alumno</div>
        )}
      </div>

      {/* --- MODAL DE SÓLO LECTURA (POPUP DE INFORMACIÓN) --- */}
      <AnimatePresence>
        {verResumen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative">
              <button onClick={() => setVerResumen(null)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-600"><X size={20}/></button>
              
              <div className="space-y-6">
                <div className="inline-block px-4 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase">Resumen Pedagógico</div>
                
                <div className="space-y-4">
                  <div>
                    <h5 className="text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Temas tratados:</h5>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-slate-700 text-sm italic">
                      {verResumen.temas_vistos || "No se registraron temas."}
                    </div>
                  </div>

                  <div>
                    <h5 className="text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Observaciones / Tarea:</h5>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-600 text-[13px] leading-relaxed">
                      {verResumen.comentarios_profe || "Sin comentarios adicionales."}
                    </div>
                  </div>
                </div>

                <button onClick={() => setVerResumen(null)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all">Cerrar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
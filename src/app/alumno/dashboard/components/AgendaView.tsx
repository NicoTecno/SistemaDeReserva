"use client";
import React, { useState, useMemo } from 'react';
import { 
  format, isSameDay, parseISO, startOfMonth, endOfMonth, 
  eachDayOfInterval, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, isToday
} from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Info, X, CreditCard, CheckCircle2, ChevronLeft, ChevronRight, 
  Zap, Clock 
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export function AgendaView({ misClases, onUpdate, setCargando, setModalConfig }: any) {
  const supabase = createClient();
  
  // --- ESTADOS DE VISTA ---
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [mesVisualizado, setMesVisualizado] = useState(new Date());
  const [verResumen, setVerResumen] = useState<any>(null);
  const [verTodoElHistorial, setVerTodoElHistorial] = useState(false);

  // ==========================================
  // 1. LÓGICA DE CANCELACIÓN
  // ==========================================
  const ejecutarCancelacion = async (clase: any, esMismoDia: boolean) => {
    setCargando(true);
    try {
      if (esMismoDia) {
        await supabase.from('clases').update({ estado: 'cancelado' }).eq('id', clase.id);
      } else {
        await supabase.from('clases').delete().eq('id', clase.id);
      }
      onUpdate();
      setModalConfig({
        isOpen: true,
        title: "¡Hecho!",
        message: esMismoDia ? "La clase se canceló (sujeta a cobro)." : "Reserva eliminada con éxito.",
        type: 'success'
      });
    } catch (error) {
      setModalConfig({ isOpen: true, title: "Error", message: "No pudimos procesar la cancelación.", type: 'danger' });
    } finally {
      setCargando(false);
    }
  };

  const manejarCancelacion = (clase: any) => {
    const hoy = new Date();
    const fechaClase = parseISO(clase.fecha_inicio);
    const esMismoDia = isSameDay(hoy, fechaClase);

    setModalConfig({
      isOpen: true,
      title: "¿Confirmas la cancelación?",
      message: esMismoDia 
        ? "Atención: Al cancelar hoy, la política indica que la clase debe abonarse igual."
        : "Esta acción eliminará tu reserva de forma permanente.",
      type: 'danger',
      onConfirm: () => ejecutarCancelacion(clase, esMismoDia)
    });
  };

  // ==========================================
  // 2. LÓGICA DE SUBIDA DE PAGO
  // ==========================================
  const manejarSubida = async (e: React.ChangeEvent<HTMLInputElement>, claseId: string) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    setCargando(true);
    const nombre = `${claseId}-${Date.now()}`;

    try {
      const { error: errorStorage } = await supabase.storage.from('comprobantes').upload(nombre, archivo);
      if (errorStorage) throw errorStorage;

      const { data: { publicUrl } } = supabase.storage.from('comprobantes').getPublicUrl(nombre);
      
      const { error: errorDb } = await supabase.from('clases').update({ 
          comprobante_url: publicUrl, 
          notas_pago_problema: null 
      }).eq('id', claseId);

      if (errorDb) throw errorDb;
      
      onUpdate(); 
      setModalConfig({ isOpen: true, title: "¡Recibido!", message: "Comprobante en revisión.", type: 'success' });

    } catch (err) {
      setModalConfig({ isOpen: true, title: "Error", message: "No pudimos subir el archivo.", type: 'danger' });
    } finally { 
      setTimeout(() => {
        setCargando(false);
        if (e.target) e.target.value = ""; 
      }, 500);
    }
  };

  // ==========================================
  // 3. CÁLCULOS DE CALENDARIO
  // ==========================================
  const diasCalendario = useMemo(() => {
    const inicio = startOfWeek(startOfMonth(mesVisualizado), { weekStartsOn: 1 });
    const fin = endOfWeek(endOfMonth(mesVisualizado), { weekStartsOn: 1 });
    return eachDayOfInterval({ start: inicio, end: fin });
  }, [mesVisualizado]);

  const historialFiltrado = useMemo(() => {
    return misClases
      .filter((c: any) => {
        const fechaClase = parseISO(c.fecha_inicio);
        return verTodoElHistorial ? true : isSameMonth(fechaClase, mesVisualizado);
      })
      .sort((a: any, b: any) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime());
  }, [misClases, mesVisualizado, verTodoElHistorial]);

  const clasesDelDia = misClases.filter((c: any) => isSameDay(parseISO(c.fecha_inicio), fechaSeleccionada));

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* --- CALENDARIO --- */}
        <div className="lg:col-span-4 bg-white rounded-[2.5rem] p-6 border border-slate-100 h-fit shadow-sm">
          <div className="flex items-center justify-between mb-6 px-2">
            <button onClick={() => setMesVisualizado(subMonths(mesVisualizado, 1))} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"><ChevronLeft size={20}/></button>
            <div className="text-center">
                <span className="text-[11px] font-black uppercase text-slate-700 block tracking-widest">{format(mesVisualizado, 'MMMM', { locale: es })}</span>
                <span className="text-[9px] font-bold text-slate-300 uppercase">{format(mesVisualizado, 'yyyy')}</span>
            </div>
            <button onClick={() => setMesVisualizado(addMonths(mesVisualizado, 1))} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"><ChevronRight size={20}/></button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => <div key={i} className="text-[9px] font-black text-slate-200 mb-2 uppercase">{d}</div>)}
            {diasCalendario.map((dia, i) => {
              const tieneClase = misClases.some((c: any) => isSameDay(parseISO(c.fecha_inicio), dia));
              const esMesActual = isSameMonth(dia, mesVisualizado);
              return (
                <button key={i} onClick={() => {setFechaSeleccionada(dia); setVerTodoElHistorial(false);}} 
                  className={`aspect-square rounded-xl font-bold text-xs flex items-center justify-center transition-all
                  ${!esMesActual ? 'opacity-20' : ''} 
                  ${isSameDay(dia, fechaSeleccionada) ? 'bg-indigo-600 text-white shadow-xl' : 
                  tieneClase ? 'bg-indigo-50 text-indigo-600' : 'text-slate-300 hover:bg-slate-50'}`}>
                  {format(dia, 'd')}
                </button>
              );
            })}
          </div>
        </div>

        {/* --- DETALLE DEL DÍA --- */}
        <div className="lg:col-span-8 space-y-4">
          <h2 className="font-black text-xl italic px-4 uppercase tracking-tighter text-slate-800">
            {isToday(fechaSeleccionada) ? "Hoy" : format(fechaSeleccionada, "EEEE dd MMMM", { locale: es })}
          </h2>
          {clasesDelDia.length > 0 ? clasesDelDia.map((clase: any) => (
            <div key={clase.id} className="flex flex-col gap-2">
              
              {clase.notas_pago_problema && !clase.pagado && (
                <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-rose-50 border border-rose-100 p-4 rounded-[1.8rem] flex items-center gap-3 mx-2 shadow-sm">
                  <div className="bg-rose-500 p-1.5 rounded-lg text-white"><Zap size={14} fill="currentColor"/></div>
                  <div>
                    <p className="text-rose-600 font-black text-[10px] uppercase tracking-tight">Problema con el comprobante:</p>
                    <p className="text-rose-500 font-bold text-[11px] italic leading-tight">"{clase.notas_pago_problema}"</p>
                  </div>
                </motion.div>
              )}

              <div className="bg-white p-5 rounded-[2.2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[70px] bg-slate-50 p-3 rounded-2xl border border-slate-100 font-black text-indigo-600">
                    {format(parseISO(clase.fecha_inicio), "HH:mm")}
                  </div>
                  <div>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                      clase.estado === 'confirmado' ? 'bg-emerald-50 text-emerald-500' : 
                      clase.estado === 'cancelado' ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {clase.estado}
                    </span>
                    <p className={`font-black text-[10px] mt-1 uppercase ${clase.pagado ? 'text-emerald-500' : (clase.comprobante_url && !clase.notas_pago_problema) ? 'text-amber-500' : clase.notas_pago_problema ? 'text-rose-500' : 'text-slate-300'}`}>
                      {clase.pagado ? '✓ Pago Aprobado' : (clase.comprobante_url && !clase.notas_pago_problema) ? 'Pago en Revisión' : clase.notas_pago_problema ? 'Pago Rechazado' : 'Pago Pendiente'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* CANCELAR: Solo si no está pagada, ni cancelada, ni finalizada, ni en revisión */}
                  {clase.estado !== 'finalizada' && 
                   clase.estado !== 'cancelado' && 
                   !clase.pagado && 
                   !clase.comprobante_url && (
                    <button 
                      onClick={() => manejarCancelacion(clase)}
                      className="px-4 py-3 rounded-2xl bg-rose-50 text-rose-600 text-[9px] font-black uppercase hover:bg-rose-600 hover:text-white transition-all border border-rose-100"
                    >
                      Cancelar
                    </button>
                  )}

                  {clase.estado === 'finalizada' && (
                    <button onClick={() => setVerResumen(clase)} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
                      <Info size={18} />
                    </button>
                  )}
                  
                  {/* GESTIÓN DE PAGO */}
                  {!clase.pagado && clase.estado !== 'cancelado' && (
                    <div className="flex items-center">
                      {clase.estado === 'solicitado' ? (
                        <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600">
                          <Clock size={14} className="animate-pulse" />
                          <span className="text-[9px] font-black uppercase tracking-tight">Pendiente Aprobación</span>
                        </div>
                      ) : (
                        <>
                          {clase.comprobante_url && !clase.notas_pago_problema ? (
                            <div className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500/10 border border-amber-200 text-amber-600 shadow-sm shadow-amber-50">
                              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                              <span className="text-[9px] font-black uppercase tracking-widest">Pago en revisión</span>
                            </div>
                          ) : (
                            <label className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[9px] font-black uppercase cursor-pointer transition-all shadow-xl 
                              ${clase.notas_pago_problema ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-900 hover:bg-indigo-600'} text-white`}>
                              <span>{clase.notas_pago_problema ? 'Corregir Pago' : 'Subir Pago'}</span> 
                              <input type="file" className="hidden" onChange={(e) => manejarSubida(e, clase.id)} />
                            </label>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )) : <div className="p-16 text-center border-2 border-dashed border-slate-100 rounded-[3rem] text-slate-200 font-black uppercase italic text-[10px]">No hay clases para este día</div>}
        </div>
      </div>

      {/* --- BITÁCORA --- */}
      <section className="space-y-6 pt-12 border-t border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4">
            <h3 className="font-black text-slate-800 uppercase italic tracking-tighter text-lg flex items-center gap-2">Mi Bitácora</h3>
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl">
                <button onClick={() => setVerTodoElHistorial(false)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${!verTodoElHistorial ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>Este Mes</button>
                <button onClick={() => setVerTodoElHistorial(true)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${verTodoElHistorial ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>Ver Todo</button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {historialFiltrado.length > 0 ? historialFiltrado.map((c: any) => (
            <div key={c.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 flex items-center justify-between shadow-sm group">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${c.pagado ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                  {c.pagado ? <CheckCircle2 size={20} /> : <CreditCard size={20} />}
                </div>
                <div>
                  <p className="font-black text-slate-700 text-[11px] uppercase italic">{format(parseISO(c.fecha_inicio), "dd MMM yyyy", { locale: es })}</p>
                  <p className={`text-[9px] font-bold uppercase truncate max-w-[130px] mt-1 ${c.estado === 'confirmado' ? 'text-indigo-400' : 'text-slate-300'}`}>
                    {c.temas_vistos || (c.estado === 'confirmado' ? "Próxima Clase" : "Clase Registrada")}
                  </p>
                </div>
              </div>
              {c.estado === 'finalizada' && <button onClick={() => setVerResumen(c)} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all"><Info size={16} /></button>}
            </div>
          )) : <div className="col-span-full py-16 text-center text-[10px] text-slate-200 font-black uppercase italic">Sin registros</div>}
        </div>
      </section>

      {/* --- MODAL DE RESUMEN --- */}
      <AnimatePresence>
        {verResumen && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl relative">
              <button onClick={() => setVerResumen(null)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900"><X size={24}/></button>
              <h3 className="text-2xl font-black text-slate-800 uppercase italic text-center mb-8">Notas del Profesor</h3>
              <div className="space-y-4">
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-indigo-500 uppercase mb-1">Contenido visto</p>
                    <p className="text-slate-700 font-bold text-sm italic">{verResumen.temas_vistos || "Clase práctica"}</p>
                </div>
                <div className="p-5 bg-slate-900 rounded-[2.2rem] text-white italic text-xs leading-relaxed">
                    "{verResumen.comentarios_profe || "¡Excelente clase!"}"
                </div>
              </div>
              <button onClick={() => setVerResumen(null)} className="w-full mt-8 py-5 bg-indigo-600 text-white rounded-[1.8rem] font-black text-[10px] uppercase shadow-xl hover:shadow-indigo-100 transition-all">Cerrar</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
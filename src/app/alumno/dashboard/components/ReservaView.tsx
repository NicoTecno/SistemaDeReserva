"use client";
import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addHours, parse, addMonths, subMonths, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Clock, ChevronLeft, ChevronRight, ArrowRight, AlertTriangle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export function ReservaView({ perfil, clasesOcupadas, onUpdate, setCargando, setModalConfig }: any) {
  const supabase = createClient();
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date>(new Date());
  const [mesActual, setMesActual] = useState<Date>(new Date());
  const [horaInicio, setHoraInicio] = useState<string | null>(null);
  const [horaFin, setHoraFin] = useState<string | null>(null);

  const horarios = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];

  const seleccionarHorario = (h: string) => {
    if (!horaInicio || (horaInicio && horaFin)) { 
      setHoraInicio(h); 
      setHoraFin(null); 
    } else {
      const inicioIndex = horarios.indexOf(horaInicio);
      const finIndex = horarios.indexOf(h);
      if (finIndex > inicioIndex) setHoraFin(h);
      else { setHoraInicio(h); setHoraFin(null); }
    }
  };

  const reservar = async () => {
    if (!perfil || !horaInicio) return;
    setCargando(true);

    const inicioDate = parse(horaInicio, 'HH:mm', fechaSeleccionada);
    const finCalculado = addHours(parse(horaFin || horaInicio, 'HH:mm', fechaSeleccionada), 1);
    
    // INTENTO DE INSERCIÓN
    const { error } = await supabase.from('clases').insert([{ 
      id_alumno: perfil.id, 
      fecha_inicio: inicioDate.toISOString(), 
      fecha_fin: finCalculado.toISOString(), 
      estado: 'solicitado',
      pagado: false
    }]);
    
    setCargando(false);

    if (error) {
      // MANEJO DE RACE CONDITION (SI EL CANDADO SQL REBOTA LA OPERACIÓN)
      if (error.code === '23P01' || error.message?.includes('exclude')) {
        setModalConfig({ 
          isOpen: true, 
          title: "¡Horario Ocupado!", 
          message: "Llegaste por milisegundos tarde. Alguien acaba de reservar este espacio. Por favor, elige otro horario.", 
          type: 'danger' 
        });
      } else {
        setModalConfig({ 
          isOpen: true, 
          title: "Error de Reserva", 
          message: "No pudimos procesar tu solicitud. Intenta de nuevo.", 
          type: 'danger' 
        });
      }
      // Actualizamos los datos para que el horario ocupado desaparezca de la UI
      onUpdate(); 
      setHoraInicio(null); 
      setHoraFin(null);
      return;
    }

    // ÉXITO
    setModalConfig({ 
      isOpen: true, 
      title: "¡Solicitud Enviada!", 
      message: "Tu clase ha sido reservada correctamente y está pendiente de aprobación.", 
      type: 'success' 
    });
    
    setHoraInicio(null); 
    setHoraFin(null);
    onUpdate();
  };

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Calendario */}
      <div className="lg:col-span-4 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm h-fit">
        <div className="flex items-center justify-between mb-8 font-black uppercase italic tracking-tighter text-slate-700">
          {format(mesActual, 'MMMM yyyy', { locale: es })}
          <div className="flex gap-1">
            <button onClick={() => setMesActual(subMonths(mesActual, 1))} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"><ChevronLeft size={18}/></button>
            <button onClick={() => setMesActual(addMonths(mesActual, 1))} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"><ChevronRight size={18}/></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {eachDayOfInterval({ start: startOfMonth(mesActual), end: endOfMonth(mesActual) }).map((dia, i) => (
            <button 
              key={i} 
              onClick={() => { setFechaSeleccionada(dia); setHoraInicio(null); }} 
              className={`aspect-square rounded-2xl font-bold transition-all text-xs
                ${isSameDay(dia, fechaSeleccionada) 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-110' 
                  : 'text-slate-400 hover:bg-indigo-50 hover:text-indigo-600'}`}
            >
              {format(dia, 'd')}
            </button>
          ))}
        </div>
      </div>

      {/* Horarios */}
      <div className="lg:col-span-8 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black uppercase text-slate-800 italic flex items-center gap-3">
                <Clock size={20} className="text-indigo-600"/> Horarios Disponibles
            </h2>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Selecciona uno</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {horarios.map(h => {
            const ocupado = clasesOcupadas.some((c:any) => 
              isSameDay(parseISO(c.fecha_inicio), fechaSeleccionada) && 
              format(parseISO(c.fecha_inicio), "HH:mm") === h
            );
            
            const sel = (horaInicio === h || (horaInicio && horaFin && horarios.indexOf(h) >= horarios.indexOf(horaInicio) && horarios.indexOf(h) <= horarios.indexOf(horaFin)));
            
            return (
              <button 
                key={h} 
                disabled={ocupado} 
                onClick={() => seleccionarHorario(h)} 
                className={`p-4 rounded-2xl font-black text-[11px] uppercase transition-all border-2
                  ${ocupado 
                    ? 'bg-slate-50 text-slate-200 border-transparent cursor-not-allowed opacity-50' 
                    : sel 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100' 
                      : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-400 hover:text-indigo-600'}`}
              >
                {h}
              </button>
            );
          })}
        </div>

        {horaInicio && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 p-8 bg-indigo-50/50 rounded-[2.5rem] border-2 border-dashed border-indigo-200 flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <div>
                <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-1 text-center md:text-left">Resumen de solicitud</p>
                <h3 className="text-lg font-black italic uppercase text-slate-800">
                    {format(fechaSeleccionada, "EEEE dd 'de' MMMM", { locale: es })} 
                    <span className="text-indigo-600 ml-2">@ {horaInicio} HS</span>
                </h3>
            </div>
            <button 
                onClick={reservar} 
                className="w-full md:w-auto px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 shadow-2xl hover:scale-105 active:scale-95"
            >
              Confirmar Reserva <ArrowRight size={18}/>
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
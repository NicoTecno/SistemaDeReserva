import React from 'react';
import { format, parseISO, isSameDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, subMonths, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Check, Calendar as CalendarIcon, XCircle } from 'lucide-react';

export const AgendaView = ({ 
  mesActual, 
  setMesActual, 
  fechaSeleccionada, 
  setFechaSeleccionada,
  clases, 
  clasesDelDia, 
  setModalFinalizar,
  handleUpdate, // <-- Prop necesaria para actualizar estado
  setModalConfig // <-- Prop necesaria para la confirmación estética
}: any) => {

  // FILTRO: Solo clases que el profesor aceptó (confirmado) o que ya realizó (finalizada)
  // Esto evita que aparezcan solicitudes pendientes en el calendario
  const clasesAceptadas = clases.filter((c: any) => 
    c.estado === 'confirmado' || c.estado === 'finalizada'
  );

  // LÓGICA PARA CANCELACIÓN DESDE AGENDA (CORREGIDA)
  const manejarCancelacionAdmin = (clase: any) => {
    setModalConfig({
      isOpen: true,
      title: "¿Cancelar esta clase?",
      message: `Estás por cancelar la clase de ${clase.perfiles?.full_name}. Esta acción no se puede deshacer.`,
      type: 'danger',
      onConfirm: async () => {
        // 1. Ejecutamos la actualización
        await handleUpdate(clase.id, { estado: 'cancelado' });
        
        // 2. Cerramos el modal inmediatamente después de la confirmación
        setModalConfig((prev: any) => ({ ...prev, isOpen: false }));
      }
    });
  };

  // LÓGICA PARA GENERAR LOS DÍAS DEL CALENDARIO
  const renderDias = () => {
    const inicioMes = startOfMonth(mesActual);
    const finMes = endOfMonth(inicioMes);
    const inicioSemana = startOfWeek(inicioMes, { weekStartsOn: 1 });
    const finSemana = endOfWeek(finMes, { weekStartsOn: 1 });
    const dias = [];
    let dia = inicioSemana;

    while (dia <= finSemana) {
      const cloneDia = dia;
      // Usamos el array filtrado para mostrar los puntos indicadores
      const tieneClases = clasesAceptadas.some((c: any) => 
        isSameDay(parseISO(c.fecha_inicio), cloneDia)
      );
      const esSeleccionado = isSameDay(cloneDia, fechaSeleccionada);
      const esMesActual = isSameMonth(cloneDia, inicioMes);

      dias.push(
        <button
          key={cloneDia.toString()}
          onClick={() => setFechaSeleccionada(cloneDia)}
          className={`relative h-10 w-full rounded-xl text-[11px] font-black transition-all flex items-center justify-center
            ${!esMesActual ? 'text-slate-200' : 'text-slate-600'}
            ${esSeleccionado ? 'bg-indigo-600 text-white shadow-lg scale-110 z-10' : 'hover:bg-slate-50'}`}
        >
          {format(cloneDia, 'd')}
          {tieneClases && !esSeleccionado && (
            <span className="absolute bottom-1.5 w-1 h-1 bg-indigo-400 rounded-full"></span>
          )}
        </button>
      );
      dia = addDays(dia, 1);
    }
    return dias;
  };

  // Filtramos las clases del día seleccionado para mostrar solo las confirmadas/finalizadas
  const listaFiltradaDelDia = clasesDelDia.filter((c: any) => 
    c.estado === 'confirmado' || c.estado === 'finalizada'
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Columna Calendario */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="font-black text-slate-800 text-sm uppercase italic">
              {format(mesActual, 'MMMM yyyy', { locale: es })}
            </h2>
            <div className="flex gap-1">
              <button onClick={() => setMesActual(subMonths(mesActual, 1))} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><ChevronLeft size={18}/></button>
              <button onClick={() => setMesActual(addMonths(mesActual, 1))} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><ChevronRight size={18}/></button>
            </div>
          </div>
          <div className="grid grid-cols-7 mb-2 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => <span key={d}>{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {renderDias()}
          </div>
        </div>
      </div>

      {/* Columna Clases */}
      <div className="lg:col-span-8 space-y-4">
        <h2 className="font-black text-slate-800 text-xl px-4 italic flex items-center gap-3">
          <CalendarIcon className="text-indigo-600" size={20} />
          {format(fechaSeleccionada, "EEEE dd 'de' MMMM", { locale: es })}
        </h2>
        
        {listaFiltradaDelDia.length > 0 ? (
          [...listaFiltradaDelDia]
            .sort((a: any, b: any) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime())
            .map((clase: any) => {
              const inicio = parseISO(clase.fecha_inicio);
              const fin = parseISO(clase.fecha_fin);

              return (
                <div key={clase.id} className="bg-white p-5 rounded-[2.5rem] border border-slate-100 flex flex-col md:flex-row md:items-center gap-6 group hover:shadow-md transition-all">
                  {/* Cuadro de Hora */}
                  <div className="text-center min-w-[95px] bg-slate-50 p-3 rounded-2xl border border-slate-100 group-hover:bg-indigo-600 transition-all">
                    <p className="text-base font-black text-indigo-600 group-hover:text-white leading-tight">
                      {format(inicio, "HH:mm")}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-200">
                      a {format(fin, "HH:mm")}
                    </p>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-slate-800 text-base uppercase italic tracking-tighter">
                        {clase.perfiles?.full_name}
                      </h3>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${clase.pagado ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {clase.pagado ? '✓ Cobrado' : '✕ Impago'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${clase.estado === 'confirmado' ? 'bg-indigo-50 text-indigo-500' : 'bg-slate-100 text-slate-400'}`}>
                        {clase.estado}
                      </span>
                    </div>
                  </div>

                  {/* ACCIONES */}
                  <div className="flex items-center gap-2">
                    {clase.estado === 'confirmado' && (
                      <>
                        {/* CANCELAR */}
                        <button 
                          onClick={() => manejarCancelacionAdmin(clase)} 
                          className="px-4 py-3 bg-rose-50 text-rose-600 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-rose-600 hover:text-white transition-all border border-rose-100"
                        >
                          <XCircle size={16}/> Cancelar
                        </button>

                        {/* FINALIZAR */}
                        <button 
                          onClick={() => setModalFinalizar({ abierto: true, claseId: clase.id })} 
                          className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-indigo-600 transition-all shadow-lg active:scale-95"
                        >
                          <Check size={16}/> Finalizar
                        </button>
                      </>
                    )}
                    
                    {clase.estado === 'finalizada' && (
                      <span className="px-6 py-3 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase italic border border-slate-100">
                        Clase Realizada
                      </span>
                    )}
                  </div>
                </div>
              );
            })
        ) : (
          <div className="bg-white p-24 rounded-[3.5rem] border-2 border-dashed border-slate-100 text-center text-slate-300 font-black uppercase tracking-widest">
            Sin clases confirmadas
          </div>
        )}
      </div>
    </div>
  );
};
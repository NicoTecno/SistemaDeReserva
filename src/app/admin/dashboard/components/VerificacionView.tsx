import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Check, ShieldAlert, UserCheck } from 'lucide-react';

export const VerificacionView = () => {
  const supabase = createClient();
  const [pendientes, setPendientes] = useState<any[]>([]);

  const cargarPendientes = async () => {
    const { data } = await supabase
      .from('perfiles')
      .select('*')
      .eq('verificado', false)
      .neq('rol', 'admin');
    setPendientes(data || []);
  };

  useEffect(() => { cargarPendientes(); }, []);

  const aprobar = async (id: string) => {
    await supabase.from('perfiles').update({ verificado: true }).eq('id', id);
    cargarPendientes();
  };

  return (
    <div className="space-y-4">
      <h2 className="font-black text-slate-800 text-xl px-4 italic">Nuevos Registros Pendientes</h2>
      {pendientes.length > 0 ? pendientes.map(p => (
        <div key={p.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center"><ShieldAlert size={24}/></div>
            <div>
              <p className="font-black uppercase italic text-sm">{p.full_name}</p>
              <p className="text-[10px] text-slate-400 font-bold">{p.email}</p>
            </div>
          </div>
          <button onClick={() => aprobar(p.id)} className="px-6 py-3 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100">
            <Check size={16}/> Aprobar Acceso
          </button>
        </div>
      )) : (
        <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-slate-100 text-center text-slate-300 font-black uppercase italic">Todo al día, no hay pendientes</div>
      )}
    </div>
  );
};
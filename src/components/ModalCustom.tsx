"use client";
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: 'info' | 'danger' | 'success' | 'warning';
}

export const ModalCustom = ({ isOpen, onClose, onConfirm, title, message, type = 'info' }: ModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100"
          >
            <div className="flex justify-center mb-4">
              {type === 'danger' ? <AlertCircle size={48} className="text-rose-500" /> : 
               type === 'success' ? <CheckCircle2 size={48} className="text-emerald-500" /> : 
               <AlertCircle size={48} className="text-indigo-500" />}
            </div>
            
            <h3 className="text-xl font-black text-center text-slate-800 mb-2 uppercase italic tracking-tighter">
              {title}
            </h3>
            <p className="text-slate-500 text-center text-[13px] mb-8 font-medium leading-relaxed">
              {message}
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={onClose} 
                className="flex-1 py-4 font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase text-[10px] tracking-widest"
              >
                {onConfirm ? 'Volver' : 'Entendido'}
              </button>
              
              {onConfirm && (
                <button 
                  onClick={() => {
                    onConfirm();
                  }} 
                  className={`flex-1 py-4 rounded-2xl font-black text-white shadow-lg transition-transform active:scale-95 uppercase text-[10px] tracking-widest ${
                    type === 'danger' ? 'bg-rose-500 shadow-rose-100' : 'bg-indigo-600 shadow-indigo-100'
                  }`}
                >
                  Confirmar
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
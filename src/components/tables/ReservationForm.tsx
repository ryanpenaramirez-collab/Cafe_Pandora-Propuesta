import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Clock, Users, FileText } from 'lucide-react';
import { ReservationFormProps } from './types';

export default function ReservationForm({ tableId, tableName, onConfirm, onCancel }: ReservationFormProps) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [guestName, setGuestName] = useState('');
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState('19:00');
  const [persons, setPersons] = useState(2);
  const [notes, setNotes] = useState('');
  const [specialDecoration, setSpecialDecoration] = useState(false);
  const [occasion, setOccasion] = useState('Normal');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!guestName.trim()) newErrors.guestName = 'El nombre del cliente es requerido';
    const [h, m] = time.split(':').map(Number);
    if (h < 8 || h > 23) newErrors.time = 'La hora debe estar entre 08:00 y 23:00';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const notesStr = [
      notes && `Notas: ${notes}`,
      specialDecoration && 'Decoración especial',
      occasion !== 'Normal' && `Ocasión: ${occasion}`,
    ].filter(Boolean).join(' | ');
    onConfirm(guestName.trim(), `${date}T${time}`, persons, notesStr);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4"
        onClick={onCancel}
      >
        <motion.div
          initial={{ y: 30 }}
          animate={{ y: 0 }}
          onClick={e => e.stopPropagation()}
          className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="bg-pandora-dark p-4 flex justify-between items-center">
            <div>
              <h3 className="font-serif font-bold text-lg text-pandora-gold">Nueva Reserva</h3>
              <p className="text-[11px] text-slate-400">{tableName}</p>
            </div>
            <button
              onClick={onCancel}
              className="p-1 hover:bg-white/10 rounded-full text-white cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1 mb-1">
                <Users className="w-3.5 h-3.5" /> Nombre del Cliente *
              </label>
              <input
                type="text"
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                placeholder="Nombre completo"
                className={`w-full border rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-pandora-gold ${errors.guestName ? 'border-red-300' : 'border-slate-200'}`}
              />
              {errors.guestName && <p className="text-[10px] text-red-500 mt-0.5">{errors.guestName}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1 mb-1">
                  <Calendar className="w-3.5 h-3.5" /> Fecha
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  min={todayStr}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-pandora-gold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1 mb-1">
                  <Clock className="w-3.5 h-3.5" /> Hora
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className={`w-full border rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-pandora-gold ${errors.time ? 'border-red-300' : 'border-slate-200'}`}
                />
                {errors.time && <p className="text-[10px] text-red-500 mt-0.5">{errors.time}</p>}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1 mb-1">
                <Users className="w-3.5 h-3.5" /> Número de Personas
              </label>
              <input
                type="number"
                value={persons}
                onChange={e => setPersons(Math.min(12, Math.max(1, Number(e.target.value))))}
                min={1}
                max={12}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-pandora-gold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1 mb-1">
                <FileText className="w-3.5 h-3.5" /> Ocasión
              </label>
              <select
                value={occasion}
                onChange={e => setOccasion(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-pandora-gold bg-white"
              >
                <option value="Normal">Normal</option>
                <option value="Cumpleaños">Cumpleaños</option>
                <option value="Aniversario">Aniversario</option>
                <option value="Reunión de negocios">Reunión de negocios</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">Notas Especiales</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Alergias, preferencias, ocasión especial..."
                rows={3}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-pandora-gold resize-none"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={specialDecoration}
                onChange={e => setSpecialDecoration(e.target.checked)}
                className="rounded border-slate-300 text-pandora-accent focus:ring-pandora-accent"
              />
              ¿Requiere decoración especial?
            </label>
          </div>

          <div className="p-4 border-t border-slate-100 flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all hover:scale-[1.02]"
            >
              Confirmar Reserva
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

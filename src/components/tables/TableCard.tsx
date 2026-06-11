import { motion } from 'motion/react';
import { Users } from 'lucide-react';
import { TableCardProps } from './types';
import { getTableStatusColor, formatCOP } from './utils';

export default function TableCard({ table, isSelected, onClick }: TableCardProps) {
  const colors = getTableStatusColor(table.status);

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={{ scale: 1.03, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onClick(table)}
      className={`relative h-32 rounded-2xl border-2 flex flex-col justify-between p-3.5 transition-all cursor-pointer text-left ${colors.border} ${colors.bg} ${colors.text} ${
        isSelected
          ? 'ring-2 scale-[0.97] shadow-lg'
          : 'shadow-sm'
      }`}
      style={isSelected ? { ringColor: '#D4A017', boxShadow: '0 4px 16px rgba(212,160,23,0.25)' } : undefined}
    >
      <div className="flex justify-between items-start w-full">
        <span className="font-serif font-bold text-sm leading-tight tracking-tight">
          {table.name}
        </span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${colors.badge} shrink-0 ml-1`}>
          {table.status}
        </span>
      </div>

      <div>
        <div className="flex items-center gap-1 text-[11px] opacity-70 mb-1">
          <Users className="w-3 h-3 shrink-0" />
          <span>{table.capacity} pax</span>
          {table.currentWaiter && (
            <span className="truncate ml-1">· {table.currentWaiter}</span>
          )}
        </div>

        {table.status === 'ocupada' && (
          <div className="font-mono font-bold text-sm text-rose-600">
            {formatCOP(table.totalAmount)}
          </div>
        )}
        {table.status === 'por_pagar' && (
          <div className="font-mono font-bold text-sm text-amber-600 animate-pulse">
            {formatCOP(table.totalAmount)}
          </div>
        )}
        {table.status === 'reservada' && table.guestName && (
          <div className="text-[10px] text-emerald-600 truncate font-medium">
            {table.guestName}
          </div>
        )}
      </div>
    </motion.button>
  );
}

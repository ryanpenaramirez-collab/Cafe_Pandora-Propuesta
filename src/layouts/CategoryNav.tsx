import { motion } from 'motion/react';

interface Category {
  id: string;
  name: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  buttonIds: string[];
}

interface CategoryNavProps {
  categories: Category[];
  activeCategory: string | null;
  categoryCounts: Record<string, number>;
  onSelect: (id: string | null) => void;
}

export default function CategoryNav({ categories, activeCategory, categoryCounts, onSelect }: CategoryNavProps) {
  if (categories.length === 0) {
    return (
      <div className="overflow-x-auto scrollbar-hide flex gap-2 pb-1 snap-x snap-mandatory scroll-smooth shrink-0">
        <div className="p-4 text-center text-pandora-muted text-xs font-light w-full">
          Ninguna categoría activa.
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto scrollbar-hide flex gap-2 pb-1 snap-x snap-mandatory scroll-smooth shrink-0">
      {categories.map((cat) => {
        const IconComponent = cat.icon;
        const isActive = activeCategory === cat.id;
        const count = categoryCounts[cat.id] || 0;

        return (
          <motion.button
            key={cat.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(isActive ? null : cat.id)}
            className={`snap-start shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all cursor-pointer ${
              isActive
                ? 'bg-pandora-gold-bg border-pandora-gold text-pandora-gold shadow-md'
                : 'bg-transparent border-pandora-border text-pandora-body hover:bg-pandora-accent/30 shadow-sm'
            }`}
          >
            <IconComponent className={`w-4 h-4 ${isActive ? 'text-pandora-gold' : 'text-pandora-body'}`} />
            <span className="text-xs font-bold uppercase tracking-wider whitespace-nowrap">{cat.name}</span>
            {count > 0 && (
              <span className="h-4 min-w-[16px] px-1 rounded-full bg-pandora-gold-badge text-pandora-title text-[8px] font-extrabold flex items-center justify-center">
                {count}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

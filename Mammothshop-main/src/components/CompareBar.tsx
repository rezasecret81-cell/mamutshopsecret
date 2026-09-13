import { useCompare } from '@/lib/compare-context';
import { Link } from '@/lib/router-context';

export function CompareBar() {
  const { items, remove, count } = useCompare();

  if (count === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] animate-slide-up">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-sm font-600 text-gray-700 shrink-0">مقایسه ({count}):</span>
          {items.map((p) => (
            <div key={p.id} className="flex items-center gap-1 shrink-0">
              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">{p.name}</span>
              <button onClick={() => remove(p.id)} className="text-error-400 hover:text-error-600">
                ×
              </button>
            </div>
          ))}
        </div>
        <Link to="/compare" className="btn btn-primary btn-sm shrink-0">
          مقایسه
        </Link>
      </div>
    </div>
  );
}

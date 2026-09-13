import { toPersianDigits } from '@/lib/format';
import { ChevronRight, ChevronLeft } from 'lucide-react';

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-1.5">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="قبلی"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
      {start > 1 && (
        <>
          <PageBtn n={1} active={page === 1} onClick={() => onChange(1)} />
          {start > 2 && <span className="px-1 text-gray-400">…</span>}
        </>
      )}
      {pages.map((p) => (
        <PageBtn key={p} n={p} active={p === page} onClick={() => onChange(p)} />
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-gray-400">…</span>}
          <PageBtn n={totalPages} active={page === totalPages} onClick={() => onChange(totalPages)} />
        </>
      )}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="بعدی"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
    </div>
  );
}

function PageBtn({ n, active, onClick }: { n: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`min-w-9 h-9 px-2 rounded-xl flex items-center justify-center text-sm font-600 transition-colors ${
        active ? 'bg-primary-600 text-white shadow-md' : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
      }`}
    >
      {toPersianDigits(n)}
    </button>
  );
}

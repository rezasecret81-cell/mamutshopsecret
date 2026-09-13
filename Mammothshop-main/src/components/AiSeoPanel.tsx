import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';
import type { Product } from '@/lib/types';
import { toPersianDigits, formatDate } from '@/lib/format';
import { Sparkles, Loader, Check, X, Eye, History, AlertTriangle, Wand2, FileText, Tag, Link2, Image as ImageIcon, ChevronDown, ChevronUp } from 'lucide-react';

type SeoSuggestion = {
  seo_title: string;
  meta_description: string;
  focus_keyword: string;
  secondary_keywords: string[];
  long_tail_keywords: string[];
  seo_description: string;
  faq: { question: string; answer: string }[];
  image_alt_texts: { url: string; alt: string }[];
  seo_slug: string;
  seo_score: number;
  internal_link_suggestions: { name: string; slug: string; reason: string }[];
};

type SeoHistoryEntry = {
  id: string;
  seo_data: Record<string, unknown>;
  created_at: string;
};

export function AiSeoPanel({ product, onApplied }: { product: Product; onApplied: () => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<SeoSuggestion | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<SeoHistoryEntry[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [editableSuggestion, setEditableSuggestion] = useState<SeoSuggestion | null>(null);

  useEffect(() => {
    if (product.category_id) {
      supabase
        .from('products')
        .select('*, category:categories(*), brand:brands(*)')
        .eq('category_id', product.category_id)
        .neq('id', product.id)
        .limit(10)
        .then(({ data }) => setRelatedProducts((data ?? []) as Product[]));
    }
  }, [product]);

  const handleGenerate = async () => {
    setLoading(true);
    setSuggestion(null);
    setEditableSuggestion(null);
    try {
      await supabase.from('products').update({ ai_seo_status: 'processing' }).eq('id', product.id);
      const result = await api.generateAiSeo(product, relatedProducts);
      setSuggestion(result);
      setEditableSuggestion(result);
      setShowPreview(true);
      toast('محتوای سئو با موفقیت تولید شد', 'success');
    } catch (err) {
      await supabase.from('products').update({ ai_seo_status: 'failed' }).eq('id', product.id);
      toast(err instanceof Error ? err.message : 'خطا در تولید سئو', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!editableSuggestion) return;
    setLoading(true);
    try {
      const currentSeo = {
        seo_title: product.seo_title,
        meta_description: product.meta_description,
        focus_keyword: product.focus_keyword,
        secondary_keywords: product.secondary_keywords,
        long_tail_keywords: product.long_tail_keywords,
        seo_description: product.seo_description,
        faq: product.faq,
        seo_slug: product.seo_slug,
        seo_score: product.seo_score,
        internal_link_suggestions: product.internal_link_suggestions,
      };
      await api.saveSeoHistory(product.id, currentSeo as Record<string, unknown>);
      await api.applySeoSuggestion(product.id, editableSuggestion);
      toast('محتوای سئو با موفقیت اعمال شد', 'success');
      setShowPreview(false);
      onApplied();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'خطا در ذخیره', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await api.getSeoHistory(product.id);
      setHistory(data);
    } catch {
      toast('خطا در بارگذاری تاریخچه', 'error');
    }
  };

  const handleRestore = async (historyId: string) => {
    if (!confirm('بازگردانی نسخه قبلی؟ تغییرات فعلی جایگزین می‌شوند.')) return;
    try {
      await api.restoreSeoVersion(historyId, product.id);
      toast('نسخه قبلی بازگردانی شد', 'success');
      onApplied();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'خطا در بازگردانی', 'error');
    }
  };

  const score = product.seo_score ?? 0;
  const scoreColor = score >= 80 ? 'text-success-600 bg-success-50' : score >= 50 ? 'text-warning-600 bg-warning-50' : 'text-error-600 bg-error-50';

  const issues: { ok: boolean; label: string }[] = [
    { ok: !!product.seo_title, label: 'عنوان سئو' },
    { ok: !!product.meta_description, label: 'توضیحات متا' },
    { ok: !!product.focus_keyword, label: 'کلمه کلیدی اصلی' },
    { ok: !!product.seo_description, label: 'توضیحات بهینه‌شده' },
    { ok: !!product.faq && product.faq.length > 0, label: 'سوالات متداول' },
    { ok: !!product.seo_slug, label: 'اسلاگ سئو' },
  ];

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-600" />
          <h3 className="font-700">دستیار سئو با هوش مصنوعی</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1.5 rounded-lg text-sm font-700 ${scoreColor}`}>
            سئو: {toPersianDigits(score)}/۱۰۰
          </div>
          {product.ai_seo_status === 'optimized' && (
            <span className="badge badge-success">بهینه‌شده</span>
          )}
          {product.ai_seo_status === 'processing' && (
            <span className="badge badge-warning">در حال پردازش</span>
          )}
          {product.ai_seo_status === 'failed' && (
            <span className="badge badge-error">ناموفق</span>
          )}
        </div>
      </div>

      {issues.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {issues.map((issue, i) => (
            <span key={i} className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md ${issue.ok ? 'bg-success-50 text-success-700' : 'bg-error-50 text-error-700'}`}>
              {issue.ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
              {issue.label}
            </span>
          ))}
        </div>
      )}

      {product.last_ai_optimization && (
        <p className="text-xs text-gray-400">
          آخرین بهینه‌سازی: {formatDate(product.last_ai_optimization)}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="btn btn-primary gap-2"
        >
          {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          {loading ? 'در حال تولید...' : 'تولید سئو با هوش مصنوعی'}
        </button>
        <button
          onClick={() => { setShowHistory(!showHistory); if (!showHistory) loadHistory(); }}
          className="btn btn-secondary gap-2"
        >
          <History className="w-4 h-4" />
          تاریخچه تغییرات
        </button>
      </div>

      {showHistory && (
        <div className="border border-gray-200 rounded-xl p-4 space-y-2">
          <h4 className="font-600 text-sm mb-2">نسخه‌های قبلی</h4>
          {history.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">تاریخچه‌ای وجود ندارد</p>
          ) : (
            history.map((h) => (
              <div key={h.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-600">{formatDate(h.created_at)}</p>
                  <p className="text-xs text-gray-500">
                    {(h.seo_data.seo_title as string) || 'بدون عنوان'}
                  </p>
                </div>
                <button
                  onClick={() => handleRestore(h.id)}
                  className="btn btn-ghost btn-sm text-primary-600"
                >
                  بازگردانی
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {showPreview && editableSuggestion && (
        <SeoPreview
          current={product}
          suggestion={editableSuggestion}
          editable={editableSuggestion}
          setEditable={setEditableSuggestion}
          onApply={handleApply}
          loading={loading}
        />
      )}
    </div>
  );
}

function SeoPreview({
  current,
  suggestion,
  editable,
  setEditable,
  onApply,
  loading,
}: {
  current: Product;
  suggestion: SeoSuggestion;
  editable: SeoSuggestion;
  setEditable: (s: SeoSuggestion) => void;
  onApply: () => void;
  loading: boolean;
}) {
  const [activeSection, setActiveSection] = useState<string>('title');

  const sections = [
    { key: 'title', label: 'عنوان', icon: <Tag className="w-4 h-4" /> },
    { key: 'meta', label: 'متا', icon: <FileText className="w-4 h-4" /> },
    { key: 'keywords', label: 'کلمات کلیدی', icon: <Tag className="w-4 h-4" /> },
    { key: 'description', label: 'توضیحات', icon: <FileText className="w-4 h-4" /> },
    { key: 'faq', label: 'سوالات', icon: <FileText className="w-4 h-4" /> },
    { key: 'images', label: 'تصاویر', icon: <ImageIcon className="w-4 h-4" /> },
    { key: 'links', label: 'لینک‌ها', icon: <Link2 className="w-4 h-4" /> },
    { key: 'slug', label: 'اسلاگ', icon: <Link2 className="w-4 h-4" /> },
  ];

  return (
    <div className="border-2 border-primary-200 rounded-xl overflow-hidden">
      <div className="bg-primary-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary-600" />
          <span className="font-700 text-primary-800">پیش‌نمایش تغییرات</span>
        </div>
        <span className="text-sm text-primary-700">امتیاز: {toPersianDigits(suggestion.seo_score)}/۱۰۰</span>
      </div>

      <div className="flex gap-1 p-3 border-b border-gray-100 overflow-x-auto">
        {sections.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
              activeSection === s.key ? 'bg-primary-100 text-primary-700 font-600' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
        {activeSection === 'title' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 font-600">عنوان فعلی</label>
              <p className="text-sm text-gray-600 mt-1 p-2 bg-gray-50 rounded-lg">{current.seo_title || '—'}</p>
            </div>
            <div>
              <label className="text-xs text-primary-600 font-600">پیشنهاد هوش مصنوعی (قابل ویرایش)</label>
              <textarea
                className="input mt-1"
                value={editable.seo_title}
                onChange={(e) => setEditable({ ...editable, seo_title: e.target.value })}
                rows={2}
              />
            </div>
          </div>
        )}

        {activeSection === 'meta' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 font-600">توضیحات متا فعلی</label>
              <p className="text-sm text-gray-600 mt-1 p-2 bg-gray-50 rounded-lg">{current.meta_description || current.seo_description || '—'}</p>
            </div>
            <div>
              <label className="text-xs text-primary-600 font-600">پیشنهاد (قابل ویرایش)</label>
              <textarea
                className="input mt-1"
                value={editable.meta_description}
                onChange={(e) => setEditable({ ...editable, meta_description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        )}

        {activeSection === 'keywords' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-primary-600 font-600">کلمه کلیدی اصلی</label>
              <input
                className="input mt-1"
                value={editable.focus_keyword}
                onChange={(e) => setEditable({ ...editable, focus_keyword: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-primary-600 font-600">کلمات کلیدی ثانویه</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {editable.secondary_keywords.map((kw, i) => (
                  <span key={i} className="px-2 py-1 bg-primary-50 text-primary-700 rounded-md text-sm">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-primary-600 font-600">کلمات کلیدی طولانی (Long-tail)</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {editable.long_tail_keywords.map((kw, i) => (
                  <span key={i} className="px-2 py-1 bg-accent-50 text-accent-700 rounded-md text-sm">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'description' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 font-600">توضیحات فعلی</label>
              <div className="text-sm text-gray-600 mt-1 p-3 bg-gray-50 rounded-lg max-h-32 overflow-y-auto" dangerouslySetInnerHTML={{ __html: current.description || '—' }} />
            </div>
            <div>
              <label className="text-xs text-primary-600 font-600">توضیحات بهینه‌شده (HTML)</label>
              <textarea
                className="input mt-1 font-mono text-xs"
                value={editable.seo_description}
                onChange={(e) => setEditable({ ...editable, seo_description: e.target.value })}
                rows={8}
              />
            </div>
          </div>
        )}

        {activeSection === 'faq' && (
          <div className="space-y-3">
            {editable.faq.map((item, i) => (
              <div key={i} className="p-3 border border-gray-200 rounded-lg space-y-2">
                <input
                  className="input text-sm font-600"
                  value={item.question}
                  onChange={(e) => {
                    const updated = [...editable.faq];
                    updated[i] = { ...item, question: e.target.value };
                    setEditable({ ...editable, faq: updated });
                  }}
                  placeholder="سوال"
                />
                <textarea
                  className="input text-sm"
                  value={item.answer}
                  onChange={(e) => {
                    const updated = [...editable.faq];
                    updated[i] = { ...item, answer: e.target.value };
                    setEditable({ ...editable, faq: updated });
                  }}
                  rows={2}
                  placeholder="پاسخ"
                />
              </div>
            ))}
          </div>
        )}

        {activeSection === 'images' && (
          <div className="space-y-2">
            {editable.image_alt_texts.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">تصویری برای پیشنهاد alt text وجود ندارد</p>
            ) : (
              editable.image_alt_texts.map((img, i) => (
                <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <img src={img.url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  <input
                    className="input flex-1 text-sm"
                    value={img.alt}
                    onChange={(e) => {
                      const updated = [...editable.image_alt_texts];
                      updated[i] = { ...img, alt: e.target.value };
                      setEditable({ ...editable, image_alt_texts: updated });
                    }}
                  />
                </div>
              ))
            )}
          </div>
        )}

        {activeSection === 'links' && (
          <div className="space-y-2">
            {editable.internal_link_suggestions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">پیشنهاد لینک داخلی وجود ندارد</p>
            ) : (
              editable.internal_link_suggestions.map((link, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-600">{link.name}</p>
                    <p className="text-xs text-gray-500">{link.reason}</p>
                  </div>
                  <span className="text-xs text-gray-400 font-mono" dir="ltr">/{link.slug}</span>
                </div>
              ))
            )}
          </div>
        )}

        {activeSection === 'slug' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 font-600">اسلاگ فعلی</label>
              <p className="text-sm text-gray-600 mt-1 p-2 bg-gray-50 rounded-lg font-mono" dir="ltr">{current.slug}</p>
            </div>
            <div>
              <label className="text-xs text-primary-600 font-600">اسلاگ پیشنهادی</label>
              <input
                className="input mt-1 font-mono"
                dir="ltr"
                value={editable.seo_slug}
                onChange={(e) => setEditable({ ...editable, seo_slug: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-100 flex items-center justify-between">
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          تغییرات بدون تأیید شما اعمال نمی‌شوند
        </p>
        <div className="flex gap-2">
          <button onClick={onApply} disabled={loading} className="btn btn-primary gap-2">
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            اعمال همه تغییرات
          </button>
        </div>
      </div>
    </div>
  );
}

export function BulkAiSeo({ products, onComplete }: { products: Product[]; onComplete: () => void }) {
  const { toast } = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });
  const [lastError, setLastError] = useState<string | null>(null);

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const selectAll = () => {
    if (selected.size === products.length) setSelected(new Set());
    else setSelected(new Set(products.map((p) => p.id)));
  };

  const handleBulkGenerate = async () => {
    if (selected.size === 0) {
      toast('حداقل یک محصول انتخاب کنید', 'error');
      return;
    }
    setProcessing(true);
    setProgress({ current: 0, total: selected.size, success: 0, failed: 0 });

    for (const product of products) {
      if (!selected.has(product.id)) continue;
      try {
        const related = product.category_id
          ? ((await supabase.from('products').select('*, category:categories(*), brand:brands(*)').eq('category_id', product.category_id).neq('id', product.id).limit(10)).data ?? []) as Product[]
          : [];
        const result = await api.generateAiSeo(product, related);
        const currentSeo = {
          seo_title: product.seo_title,
          meta_description: product.meta_description,
          focus_keyword: product.focus_keyword,
          seo_description: product.seo_description,
          faq: product.faq,
          seo_slug: product.seo_slug,
          seo_score: product.seo_score,
          long_tail_keywords: product.long_tail_keywords,
          internal_link_suggestions: product.internal_link_suggestions,
        };
        await api.saveSeoHistory(product.id, currentSeo as Record<string, unknown>);
        await api.applySeoSuggestion(product.id, result);
        setProgress((p) => ({ ...p, current: p.current + 1, success: p.success + 1 }));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'خطای ناشناخته';
        setLastError(msg);
        setProgress((p) => ({ ...p, current: p.current + 1, failed: p.failed + 1 }));
      }
    }

    setProcessing(false);
    toast(`${toPersianDigits(progress.success)} محصول بهینه شد`, 'success');
    onComplete();
  };

  const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-primary-600" />
          <h3 className="font-700">بهینه‌سازی گروهی سئو</h3>
        </div>
        <div className="flex gap-2">
          <button onClick={selectAll} className="btn btn-ghost btn-sm">
            {selected.size === products.length ? 'لغو همه' : 'انتخاب همه'}
          </button>
          <button
            onClick={handleBulkGenerate}
            disabled={processing || selected.size === 0}
            className="btn btn-primary btn-sm gap-2"
          >
            {processing ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {processing ? 'در حال پردازش...' : `تولید سئو برای ${toPersianDigits(selected.size)} محصول`}
          </button>
        </div>
      </div>

      {processing && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">پیشرفت: {toPersianDigits(progress.current)} از {toPersianDigits(progress.total)}</span>
            <span className="font-600">{toPersianDigits(pct)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex gap-4 text-sm">
            <span className="text-success-600">موفق: {toPersianDigits(progress.success)}</span>
            <span className="text-error-600">ناموفق: {toPersianDigits(progress.failed)}</span>
          </div>
          {lastError && (
            <div className="text-xs text-error-600 bg-error-50 p-2 rounded-lg">
              آخرین خطا: {lastError}
            </div>
          )}
        </div>
      )}

      <div className="max-h-64 overflow-y-auto space-y-1">
        {products.map((p) => (
          <label
            key={p.id}
            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
              selected.has(p.id) ? 'bg-primary-50' : 'hover:bg-gray-50'
            }`}
          >
            <input
              type="checkbox"
              checked={selected.has(p.id)}
              onChange={() => toggleSelect(p.id)}
              className="rounded text-primary-600"
              disabled={processing}
            />
            <img src={p.image_url || ''} alt="" className="w-8 h-8 rounded-lg object-cover" />
            <span className="text-sm font-600 flex-1 line-clamp-1">{p.name}</span>
            {p.ai_seo_status === 'optimized' && (
              <span className="badge badge-success text-xs">بهینه‌شده</span>
            )}
          </label>
        ))}
      </div>
    </div>
  );
}

export function SeoDashboard() {
  const { toast } = useToast();
  const [data, setData] = useState<{
    totalProducts: number;
    optimizedProducts: number;
    needingSeo: number;
    avgScore: number;
    missingMeta: number;
    missingDescription: number;
    missingAlt: number;
    missingSchema: number;
    lowScoreProducts: { id: string; name: string; slug: string; seo_score: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSeoDashboard()
      .then(setData)
      .catch((e) => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) return <div className="card p-8 text-center text-gray-500">در حال بارگذاری...</div>;
  if (!data) return null;

  const cards = [
    { label: 'کل محصولات', value: data.totalProducts, color: 'bg-primary-50 text-primary-700' },
    { label: 'بهینه‌شده', value: data.optimizedProducts, color: 'bg-success-50 text-success-700' },
    { label: 'نیاز به بهینه‌سازی', value: data.needingSeo, color: 'bg-warning-50 text-warning-700' },
    { label: 'میانگین امتیاز', value: `${data.avgScore}/100`, color: 'bg-accent-50 text-accent-700' },
    { label: 'بدون متا', value: data.missingMeta, color: 'bg-error-50 text-error-700' },
    { label: 'بدون توضیحات', value: data.missingDescription, color: 'bg-error-50 text-error-700' },
    { label: 'بدون alt تصویر', value: data.missingAlt, color: 'bg-warning-50 text-warning-700' },
    { label: 'بدون schema', value: data.missingSchema, color: 'bg-gray-100 text-gray-700' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <div key={i} className={`card p-4 ${c.color}`}>
            <p className="text-sm opacity-80">{c.label}</p>
            <p className="text-2xl font-800 mt-1">{toPersianDigits(c.value)}</p>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <h3 className="font-700 mb-4">محصولات با کمترین امتیاز سئو</h3>
        {data.lowScoreProducts.length === 0 ? (
          <p className="text-center text-gray-500 py-4">همه محصولات امتیاز خوبی دارند</p>
        ) : (
          <div className="space-y-2">
            {data.lowScoreProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-600 text-sm">{p.name}</p>
                  <p className="text-xs text-gray-400 font-mono" dir="ltr">{p.slug}</p>
                </div>
                <span className={`px-3 py-1 rounded-lg text-sm font-700 ${p.seo_score < 30 ? 'bg-error-100 text-error-700' : 'bg-warning-100 text-warning-700'}`}>
                  {toPersianDigits(p.seo_score)}/۱۰۰
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

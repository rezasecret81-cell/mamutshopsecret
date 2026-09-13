import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Seo } from '@/components/Seo';
import type { Faq } from '@/lib/types';
import { ChevronDown, HelpCircle } from 'lucide-react';

export function FaqPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [category, setCategory] = useState('all');

  useEffect(() => {
    api.getFaqs().then((data) => {
      setFaqs(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const categories = ['all', ...Array.from(new Set(faqs.map((f) => f.category)))];
  const filtered = category === 'all' ? faqs : faqs.filter((f) => f.category === category);

  return (
    <>
      <Seo
        title="سوالات متداول"
        description="پاسخ به پرتکرارترین سوالات کاربران ماموت شاپ درباره ارسال، پرداخت، مرجوعی و گارانتی"
        canonicalPath="/faq"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer },
          })),
        }}
      />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl md:text-3xl font-800 mb-2">سوالات متداول</h1>
          <p className="text-gray-500">پاسخ به پرتکرارترین سوالات شما</p>
        </div>

        <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-2 rounded-xl text-sm font-500 whitespace-nowrap transition-colors ${
                category === c ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300'
              }`}
            >
              {c === 'all' ? 'همه' : c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-5">
                <div className="h-5 w-3/4 skeleton rounded mb-2" />
                <div className="h-4 w-full skeleton rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((faq) => (
              <div key={faq.id} className="card overflow-hidden">
                <button
                  onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                  className="w-full flex items-center justify-between p-5 text-right"
                >
                  <span className="font-600 text-gray-800">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${openId === faq.id ? 'rotate-180' : ''}`} />
                </button>
                {openId === faq.id && (
                  <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed animate-slide-down">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

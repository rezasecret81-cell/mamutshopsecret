import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SITE_URL = 'https://mamutshop.ir';

function xmlResponse(xml: string) {
  return new Response(xml, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

function urlEntry(loc: string, lastmod?: string, changefreq = 'weekly', priority = '0.7') {
  return `  <url>\n    <loc>${loc}</loc>\n${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ''}    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  const supabase = createClient(supabaseUrl, supabaseKey);

  const url = new URL(req.url);
  const type = url.searchParams.get('type') || 'index';

  try {
    // ── Sitemap Index ──
    if (type === 'index') {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/sitemap?type=pages</loc>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap?type=products</loc>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap?type=categories</loc>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap?type=brands</loc>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap?type=blog</loc>
  </sitemap>
</sitemapindex>`;
      return xmlResponse(xml);
    }

    // ── Static Pages ──
    if (type === 'pages') {
      const staticPages = [
        { path: '/', priority: '1.0', changefreq: 'daily' },
        { path: '/shop', priority: '0.9', changefreq: 'daily' },
        { path: '/about', priority: '0.5', changefreq: 'monthly' },
        { path: '/contact', priority: '0.5', changefreq: 'monthly' },
        { path: '/faq', priority: '0.5', changefreq: 'weekly' },
        { path: '/terms', priority: '0.3', changefreq: 'monthly' },
        { path: '/shipping', priority: '0.3', changefreq: 'monthly' },
        { path: '/returns', priority: '0.3', changefreq: 'monthly' },
        { path: '/privacy', priority: '0.3', changefreq: 'monthly' },
      ];
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(p => urlEntry(`${SITE_URL}${p.path}`, undefined, p.changefreq, p.priority)).join('\n')}
</urlset>`;
      return xmlResponse(xml);
    }

    // ── Products ──
    if (type === 'products') {
      const { data: products } = await supabase
        .from('products')
        .select('slug, seo_slug, updated_at')
        .eq('is_active', true);

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${(products || []).map(p => {
  const slug = p.seo_slug || p.slug;
  const lastmod = p.updated_at ? new Date(p.updated_at).toISOString().split('T')[0] : undefined;
  return urlEntry(`${SITE_URL}/product/${slug}`, lastmod, 'weekly', '0.8');
}).join('\n')}
</urlset>`;
      return xmlResponse(xml);
    }

    // ── Categories ──
    if (type === 'categories') {
      const { data: categories } = await supabase
        .from('categories')
        .select('slug, updated_at');

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${(categories || []).map(c => {
  const lastmod = c.updated_at ? new Date(c.updated_at).toISOString().split('T')[0] : undefined;
  return urlEntry(`${SITE_URL}/category/${c.slug}`, lastmod, 'weekly', '0.7');
}).join('\n')}
</urlset>`;
      return xmlResponse(xml);
    }

    // ── Brands ──
    if (type === 'brands') {
      const { data: brands } = await supabase
        .from('brands')
        .select('slug, updated_at')
        .eq('is_active', true);

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${(brands || []).map(b => {
  const lastmod = b.updated_at ? new Date(b.updated_at).toISOString().split('T')[0] : undefined;
  return urlEntry(`${SITE_URL}/shop?brand=${b.slug}`, lastmod, 'weekly', '0.6');
}).join('\n')}
</urlset>`;
      return xmlResponse(xml);
    }

    // ── Blog ──
    if (type === 'blog') {
      const { data: posts } = await supabase
        .from('blog_posts')
        .select('slug, updated_at, published_at')
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false });

      const blogIndex = urlEntry(`${SITE_URL}/blog`, undefined, 'daily', '0.6');
      const postsXml = (posts || []).map(p => {
        const lastmod = p.updated_at ? new Date(p.updated_at).toISOString().split('T')[0] : undefined;
        return urlEntry(`${SITE_URL}/blog/${p.slug}`, lastmod, 'monthly', '0.5');
      }).join('\n');

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${blogIndex}
${postsXml}
</urlset>`;
      return xmlResponse(xml);
    }

    // Fallback: index
    return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${SITE_URL}/sitemap?type=pages</loc></sitemap>
  <sitemap><loc>${SITE_URL}/sitemap?type=products</loc></sitemap>
  <sitemap><loc>${SITE_URL}/sitemap?type=categories</loc></sitemap>
  <sitemap><loc>${SITE_URL}/sitemap?type=brands</loc></sitemap>
  <sitemap><loc>${SITE_URL}/sitemap?type=blog</loc></sitemap>
</sitemapindex>`);
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});

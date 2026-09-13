import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SeoSuggestion {
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
}

async function getAiConfig(): Promise<{ apiKey: string; model: string; baseUrl: string }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", ["ai_api_key", "ai_model", "ai_base_url"]);

  if (error) throw new Error("خطا در خواندن تنظیمات: " + error.message);

  const settings: Record<string, string> = {};
  for (const row of data ?? []) {
    const val = row.value;
    settings[row.key] = typeof val === "string" ? val : String(val);
  }

  const apiKey = settings.ai_api_key || Deno.env.get("AI_API_KEY") || "";
  const model = settings.ai_model || Deno.env.get("AI_MODEL") || "gpt-4o-mini";
  const baseUrl = settings.ai_base_url || Deno.env.get("AI_BASE_URL") || "https://api.openai.com/v1";

  return { apiKey, model, baseUrl };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { product, relatedProducts } = body as {
      product: {
        name: string;
        description: string | null;
        specifications: Record<string, string>;
        price: number;
        sku: string | null;
        brand?: { name: string } | null;
        category?: { name: string } | null;
        image_url: string | null;
        images?: { image_url: string; alt: string | null }[];
        model_number: string | null;
        country_of_origin: string | null;
        warranty: string | null;
      };
      relatedProducts: { name: string; slug: string; category?: { name: string } | null }[];
    };

    const { apiKey, model: aiModel, baseUrl: aiBaseUrl } = await getAiConfig();

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "کلید API هوش مصنوعی تنظیم نشده است. لطفاً در تنظیمات سایت، ai_api_key را اضافه کنید." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are a professional SEO specialist for an Iranian e-commerce store (MamutShop). Generate SEO content in Persian (Farsi) for the given product.

Rules:
- Write natural, human-readable Persian content — no machine translation
- Use real product data only — never invent specifications, prices, or features
- If information is missing, omit that section rather than fabricating
- Avoid keyword stuffing
- Content must be unique and valuable for users
- Follow E-E-A-T principles
- SEO Title: 30-60 characters, include primary keyword + brand if available
- Meta Description: 120-160 characters, compelling, include primary keyword
- Focus Keyword: the main search term for this product
- Secondary Keywords: 3-5 related keywords
- Long-tail Keywords: 3-5 long-tail search phrases
- SEO Description: HTML with proper H1/H2 structure (H1: product name, H2 sections: معرفی محصول, مشخصات فنی, ویژگی‌ها و مزایا, کاربردها, چرا این محصول؟, سوالات متداول)
- FAQ: 3-5 Q&As based ONLY on real product data
- Image Alt Text: descriptive, natural, no keyword stuffing
- SEO Slug: short, readable, English/Latin characters
- SEO Score: 0-100 based on completeness
- Internal Links: suggest related products from the provided list only

Return ONLY valid JSON matching this TypeScript interface:
{
  "seo_title": string,
  "meta_description": string,
  "focus_keyword": string,
  "secondary_keywords": string[],
  "long_tail_keywords": string[],
  "seo_description": string,
  "faq": [{"question": string, "answer": string}],
  "image_alt_texts": [{"url": string, "alt": string}],
  "seo_slug": string,
  "seo_score": number,
  "internal_link_suggestions": [{"name": string, "slug": string, "reason": string}]
}`;

    const userPrompt = `Product data:
${JSON.stringify(product, null, 2)}

Related products available for internal linking:
${JSON.stringify(relatedProducts?.slice(0, 10) ?? [], null, 2)}

Generate complete SEO content in Persian for this product.`;

    const aiResponse = await fetch(`${aiBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      return new Response(
        JSON.stringify({ error: `خطا از سرویس هوش مصنوعی: ${aiResponse.status} - ${errText.slice(0, 200)}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiJson = await aiResponse.json();
    const content = aiJson?.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "پاسخ خالی از هوش مصنوعی" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let suggestion: SeoSuggestion;
    try {
      suggestion = JSON.parse(content);
    } catch {
      return new Response(
        JSON.stringify({ error: "پاسخ هوش مصنوعی قابل تجزیه نیست" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(suggestion),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "خطای سرور" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, merchantId, amount, callbackUrl, description, authority, txId, sandbox, status } = body;

    const isSandbox = sandbox ?? true;
    const zarinpalRequestUrl = isSandbox
      ? "https://sandbox.zarinpal.com/pg/v4/payment/request.json"
      : "https://api.zarinpal.com/pg/v4/payment/request.json";
    const zarinpalVerifyUrl = isSandbox
      ? "https://sandbox.zarinpal.com/pg/v4/payment/verify.json"
      : "https://api.zarinpal.com/pg/v4/payment/verify.json";
    const zarinpalGatewayUrl = isSandbox
      ? "https://sandbox.zarinpal.com/pg/StartPay/"
      : "https://www.zarinpal.com/pg/StartPay/";

    if (action === "request") {
      const res = await fetch(zarinpalRequestUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant_id: merchantId,
          amount,
          callback_url: callbackUrl,
          description: description || "پرداخت سفارش",
        }),
      });
      const json = await res.json();

      if (json?.data?.authority) {
        return new Response(
          JSON.stringify({
            authority: json.data.authority,
            gatewayUrl: zarinpalGatewayUrl + json.data.authority,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const errMsg = json?.errors?.message || "خطا در ایجاد تراکنش";
      return new Response(
        JSON.stringify({ error: errMsg }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "verify") {
      if (status === "NOK" || !authority) {
        return new Response(
          JSON.stringify({ success: false, message: "پرداخت لغو شد یا ناموفق بود" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const res = await fetch(zarinpalVerifyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant_id: merchantId,
          amount,
          authority,
        }),
      });
      const json = await res.json();

      if (json?.data?.ref_id) {
        return new Response(
          JSON.stringify({
            success: true,
            refId: String(json.data.ref_id),
            message: "پرداخت با موفقیت تایید شد",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const errMsg = json?.errors?.message || "تایید پرداخت ناموفق بود";
      return new Response(
        JSON.stringify({ success: false, message: errMsg }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "action نامعتبر" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "خطای سرور" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

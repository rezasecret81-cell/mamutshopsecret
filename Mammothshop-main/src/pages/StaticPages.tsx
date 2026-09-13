import { Seo } from '@/components/Seo';
import { Link } from '@/lib/router-context';
import { useSettings } from '@/lib/settings-context';
import { ShoppingBag, Phone, Mail, MapPin, Send, ShieldCheck, Award, Users, Heart } from 'lucide-react';

export function AboutPage() {
  const { settings } = useSettings();
  const about = {
    history_title: 'داستان ماموت شاپ',
    history_text: 'از یک ایده کوچک در سال ۱۳۹۲ تا بزرگ‌ترین فروشگاه آنلاین لوازم دیجیتال کشور. ما با هدف عرضه محصولات اصل با بهترین قیمت و خدمات بی‌نظیر مشتری شروع کردیم.',
    stat_customers: '+۵۰۰٬۰۰۰',
    stat_products: '+۵۰۰۰',
    stat_experience: '۱۰+ سال',
    stat_satisfaction: '٪۹۸',
    commitment_title: 'تعهد ما به شما',
    commitment_text: 'ما متعهد به ارائه محصولاتی با بالاترین کیفیت، قیمت منصفانه و خدمات پس از فروش بی‌نظیر هستیم. رضایت شما، اعتبار ماست.',
  };

  return (
    <>
      <Seo title="درباره ما" description="با ماموت شاپ آشنا شوید - بیش از یک دهه تجربه در فروش لوازم دیجیتال" canonicalPath="/about" />
      <div className="bg-gradient-to-br from-primary-900 to-primary-700 text-white">
        <div className="container mx-auto px-4 py-16 max-w-4xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-800 mb-4">{about.history_title}</h1>
          <p className="text-primary-100 leading-relaxed text-lg">
            {about.history_text}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-loose mb-6">
            ماموت شاپ با بیش از یک دهه تجربه در زمینه فروش لوازم دیجیتال، به یکی از معتبرترین فروشگاه‌های آنلاین کشور تبدیل شده است.
            ما بر این باوریم که هر مشتری شایسته دریافت بهترین خدمات و محصولات است. از این رو، تمام تلاش خود را برای رضایت شما به کار می‌بندیم.
          </p>
          <p className="text-gray-700 leading-loose mb-6">
            با بیش از ۵۰۰۰ محصول متنوع در دسته‌بندی‌های مختلف شامل موبایل، لپ‌تاپ، لوازم خانگی، تجهیزات گیمینگ و صوتی و تصویری،
            ما آماده ارائه بهترین محصولات با ضمانت اصالت و ارسال سریع به سراسر کشور هستیم.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 my-12">
          <Stat icon={<Users className="w-7 h-7" />} value={about.stat_customers} label="مشتری راضی" />
          <Stat icon={<ShoppingBag className="w-7 h-7" />} value={about.stat_products} label="محصول" />
          <Stat icon={<Award className="w-7 h-7" />} value={about.stat_experience} label="تجربه" />
          <Stat icon={<Heart className="w-7 h-7" />} value={about.stat_satisfaction} label="رضایت مشتری" />
        </div>

        <div className="card p-8 bg-gradient-to-br from-primary-50 to-white text-center">
          <ShieldCheck className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h2 className="text-xl font-700 mb-2">{about.commitment_title}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-6">
            {about.commitment_text}
          </p>
          <Link to="/shop" className="btn btn-primary">مشاهده فروشگاه</Link>
        </div>
      </div>
    </>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="card p-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-3">
        {icon}
      </div>
      <p className="text-2xl font-800 text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

export function ContactPage() {
  const { settings } = useSettings();

  return (
    <>
      <Seo title="تماس با ما" description="راه‌های ارتباطی با ماموت شاپ" canonicalPath="/contact" />
      <div className="bg-gradient-to-br from-primary-900 to-primary-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-3xl font-800 mb-2">تماس با ما</h1>
          <p className="text-primary-100">همیشه در دسترس شما هستیم</p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <ContactCard icon={<Phone className="w-6 h-6" />} title="تلفن" lines={[settings.site_phone]} />
          <ContactCard icon={<Mail className="w-6 h-6" />} title="ایمیل" lines={[settings.site_email]} dir="ltr" />
          <ContactCard icon={<MapPin className="w-6 h-6" />} title="آدرس" lines={[settings.site_address]} />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="font-700 mb-4">فرم تماس</h3>
            <form onSubmit={(e) => { e.preventDefault(); alert('پیام شما ارسال شد. به زودی پاسخ می‌دهیم.'); }} className="space-y-3">
              <div><label className="label">نام و نام خانوادگی</label><input className="input" required /></div>
              <div><label className="label">ایمیل</label><input type="email" className="input" required dir="ltr" /></div>
              <div><label className="label">موضوع</label><input className="input" required /></div>
              <div><label className="label">پیام</label><textarea className="input min-h-32" required /></div>
              <div>
                <label className="label">کپچا</label>
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-3">
                  <span className="font-700 text-primary-700 text-lg">۸ + ۵ = ؟</span>
                  <input className="input bg-white w-20" type="number" required />
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-full">
                <Send className="w-4 h-4" /> ارسال پیام
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <div className="card p-6">
              <h4 className="font-700 mb-3">ساعات کاری</h4>
              <ul className="text-sm space-y-2 text-gray-600">
                <li className="flex justify-between"><span>شنبه تا چهارشنبه</span><span>۹ تا ۲۱</span></li>
                <li className="flex justify-between"><span>پنجشنبه</span><span>۹ تا ۱۸</span></li>
                <li className="flex justify-between"><span>جمعه</span><span>تعطیل</span></li>
              </ul>
            </div>
            <div className="card p-6">
              <h4 className="font-700 mb-3">پشتیبانی آنلاین</h4>
              <p className="text-sm text-gray-600 mb-4">برای سوالات خود می‌توانید تیکت ثبت کنید یا با پشتیبانی آنلاین چت کنید.</p>
              <Link to="/account/tickets" className="btn btn-secondary w-full">ثبت تیکت</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ContactCard({ icon, title, lines, dir }: { icon: React.ReactNode; title: string; lines: string[]; dir?: string }) {
  return (
    <div className="card p-5 text-center">
      <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-3">
        {icon}
      </div>
      <h4 className="font-700 mb-2">{title}</h4>
      {lines.map((l, i) => (
        <p key={i} className="text-sm text-gray-600" dir={dir}>{l}</p>
      ))}
    </div>
  );
}

export function TermsPage() {
  return (
    <>
      <Seo title="قوانین و مقررات" description="قوانین و مقررات فروشگاه ماموت شاپ" canonicalPath="/terms" />
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-800 mb-6">قوانین و مقررات</h1>
        <div className="card p-8 space-y-6 text-sm leading-loose text-gray-700">
          <Section title="۱. پذیرش قوانین">
            با استفاده از وب‌سایت ماموت شاپ، شما قوانین و مقررات زیر را می‌پذیرید. در صورت عدم موافقت، لطفاً از خدمات این سایت استفاده نکنید.
          </Section>
          <Section title="۲. ثبت سفارش">
            تمامی سفارشات پس از تایید نهایی و پرداخت مبلغ، توسط تیم پشتیبانی بررسی و پردازش می‌شوند. ماموت شاپ حق لغو سفارش در موارد خاص را برای خود محفوظ می‌دارد.
          </Section>
          <Section title="۳. قیمت‌گذاری و پرداخت">
            قیمت‌ها به تومان و در زمان ثبت سفارش معتبر هستند. در صورت تغییر قیمت، سفارشات قبلی با همان قیمت اولیه پردازش می‌شوند. پرداخت‌ها از طریق درگاه‌های امن بانکی انجام می‌شود.
          </Section>
          <Section title="۴. ارسال و تحویل">
            زمان تحویل بسته به محل اقامت شما متفاوت است و معمولاً بین ۱ تا ۵ روز کاری طول می‌کشد. ارسال برای سفارشات بالای ۵ میلیون تومان رایگان است.
          </Section>
          <Section title="۵. شرایط بازگشت کالا">
            کالاها تا ۷ روز پس از تحویل در صورت داشتن شرایط قابل بازگشت هستند. کالا باید در وضعیت اولیه و بدون استفاده باشد.
          </Section>
          <Section title="۶. ضمانت اصالت">
            تمامی محصولات ماموت شاپ اصل و دارای ضمانت اصالت هستند. در صورت اثبات غیراصل بودن کالا، مبلغ پرداختی بازگردانده شده و کالا به صورت رایگان بازگردانده می‌شود.
          </Section>
          <Section title="۷. حریم خصوصی">
            اطلاعات شخصی شما نزد ما محفوظ بوده و در اختیار اشخاص ثالث قرار نمی‌گیرد. اطلاعات صرفاً برای پردازش سفارشات و ارائه خدمات بهتر استفاده می‌شود.
          </Section>
          <Section title="۸. تغییر قوانین">
            ماموت شاپ این حق را برای خود محفوظ می‌دارد که هر زمان، بخشی یا همه قوانین را تغییر دهد. تغییرات پس از انتشار در این صفحه اعمال می‌شوند.
          </Section>
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-700 text-gray-900 mb-2">{title}</h3>
      <p>{children}</p>
    </div>
  );
}

export function ShippingPage() {
  return (
    <>
      <Seo title="ارسال و تحویل" description="شرایط و هزینه ارسال کالا در فروشگاه ماموت شاپ" canonicalPath="/shipping" />
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-800 mb-6">ارسال و تحویل</h1>
        <div className="card p-8 space-y-6 text-sm leading-loose text-gray-700">
          <Section title="زمان ارسال">
            سفارشات پس از تایید نهایی، حداکثر تا ۲۴ ساعت کاری پردازش و ارسال می‌شوند. زمان تحویل بسته به شهر مقصد بین ۱ تا ۵ روز کاری متغیر است.
          </Section>
          <Section title="هزینه ارسال">
            هزینه ارسال برای سفارشات زیر ۵٬۰۰۰٬۰۰۰ تومان معادل ۵۰٬۰۰۰ تومان است. ارسال برای سفارشات بالای ۵٬۰۰۰٬۰۰۰ تومان رایگان می‌باشد.
          </Section>
          <Section title="روش ارسال">
            ارسال کالا از طریق پست پیشتاز، تیپاکس و چاپار انجام می‌شود. در شهر تهران امکان ارسال پیک موتوری نیز وجود دارد.
          </Section>
          <Section title="پیگیری سفارش">
            شما می‌توانید از طریق صفحه حساب کاربری خود، وضعیت سفارش را در هر مرحله پیگیری کنید.
          </Section>
        </div>
      </div>
    </>
  );
}

export function ReturnsPage() {
  return (
    <>
      <Seo title="بازگشت کالا" description="شرایط بازگشت کالا در فروشگاه ماموت شاپ" canonicalPath="/returns" />
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-800 mb-6">بازگشت کالا</h1>
        <div className="card p-8 space-y-6 text-sm leading-loose text-gray-700">
          <Section title="مدت بازگشت">
            کالاها تا ۷ روز پس از تحویل در صورت داشتن شرایط قابل بازگشت هستند.
          </Section>
          <Section title="شرایط بازگشت">
            کالا باید در وضعیت اولیه، بدون استفاده و با تمامی لوازم و بسته‌بندی اصلی باشد. کالاهای شخصی، بهداشتی و نرم‌افزارهای باز شده قابل بازگشت نیستند.
          </Section>
          <Section title="نحوه بازگشت">
            برای بازگشت کالا، از طریق صفحه حساب کاربری تیکت ثبت کنید. پس از تایید، کالا توسط پیک دریافت و مبلغ آن بازگردانده می‌شود.
          </Section>
        </div>
      </div>
    </>
  );
}

export function PrivacyPage() {
  return (
    <>
      <Seo title="حریم خصوصی" description="سیاست حریم خصوصی و محافظت از اطلاعات کاربران در ماموت شاپ" canonicalPath="/privacy" />
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-800 mb-6">حریم خصوصی</h1>
        <div className="card p-8 space-y-6 text-sm leading-loose text-gray-700">
          <Section title="جمع‌آوری اطلاعات">
            ماموت شاپ اطلاعات شخصی شما (نام، آدرس، شماره تماس، ایمیل) را تنها برای پردازش سفارشات و ارائه خدمات بهتر جمع‌آوری می‌کند.
          </Section>
          <Section title="استفاده از اطلاعات">
            اطلاعات شما در اختیار اشخاص ثالث قرار نمی‌گیرد و صرفاً برای ارسال کالا، پشتیبانی و اطلاع‌رسانی تخفیف‌ها استفاده می‌شود.
          </Section>
          <Section title="امنیت اطلاعات">
            تمامی اطلاعات شما با استفاده از پروتکل‌های امنیتی رمزگذاری شده و به صورت محرمانه نگهداری می‌شود.
          </Section>
          <Section title="حق کاربر">
            شما در هر زمان می‌توانید درخواست حذف حساب کاربری و اطلاعات خود را از طریق پشتیبانی ثبت کنید.
          </Section>
        </div>
      </div>
    </>
  );
}

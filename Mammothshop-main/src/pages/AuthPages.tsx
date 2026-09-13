import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, Link } from '@/lib/router-context';
import { useToast } from '@/components/Toast';
import { Seo } from '@/components/Seo';
import { useAuth } from '@/lib/auth-context';
import { Mail, Lock, User, Phone, Eye, EyeOff, ShoppingBag } from 'lucide-react';

function GoogleIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.23v2.84C4.04 20.89 7.77 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.23C1.43 8.55 1 10.22 1 12s.43 3.45 1.23 4.93l2.72-2.09.01-.31z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.77 1 4.04 3.18 2.23 7.07l3.61 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

export function LoginPage() {
  const { navigate } = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast('ورود موفقیت‌آمیز بود', 'success');
      navigate('/');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'ورود ناموفق بود', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (err) {
      toast(err instanceof Error ? err.message : 'ورود با گوگل ناموفق بود', 'error');
      setGoogleLoading(false);
    }
  };

  return (
    <>
      <Seo title="ورود" />
      <AuthLayout title="ورود به حساب کاربری" subtitle="خوش آمدید! لطفاً وارد حساب خود شوید">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="ایمیل" icon={<Mail className="w-4 h-4" />}>
            <input
              type="email"
              className="input pr-10"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              dir="ltr"
            />
          </Field>
          <Field label="رمز عبور" icon={<Lock className="w-4 h-4" />}>
            <input
              type={showPass ? 'text' : 'password'}
              className="input pr-10 pl-10"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </Field>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded border-gray-300 text-primary-600" />
              <span className="text-gray-600">مرا به خاطر بسپار</span>
            </label>
            <Link to="/forgot-password" className="text-primary-600 hover:underline">فراموشی رمز عبور؟</Link>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary w-full btn-lg">
            {loading ? 'در حال ورود...' : 'ورود'}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">یا</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="btn btn-secondary w-full btn-lg gap-2"
          >
            {googleLoading ? (
              'در حال اتصال...'
            ) : (
              <>
                <GoogleIcon />
                ورود با گوگل
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          حساب کاربری ندارید؟ <Link to="/register" className="text-primary-600 font-600 hover:underline">ثبت‌نام کنید</Link>
        </p>
      </AuthLayout>
    </>
  );
}

export function RegisterPage() {
  const { navigate } = useRouter();
  const { toast } = useToast();
  const { refreshProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast('رمز عبور باید حداقل ۶ کاراکتر باشد', 'error');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, phone } },
      });
      if (error) throw error;
      if (data.user) {
        await refreshProfile();
      }
      toast('ثبت‌نام موفقیت‌آمیز بود', 'success');
      navigate('/');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'ثبت‌نام ناموفق بود', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (err) {
      toast(err instanceof Error ? err.message : 'ورود با گوگل ناموفق بود', 'error');
      setGoogleLoading(false);
    }
  };

  return (
    <>
      <Seo title="ثبت‌نام" />
      <AuthLayout title="ساخت حساب کاربری" subtitle="برای عضویت در ماموت شاپ فرم زیر را تکمیل کنید">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="نام و نام خانوادگی" icon={<User className="w-4 h-4" />}>
            <input className="input pr-10" placeholder="نام کامل" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </Field>
          <Field label="شماره موبایل" icon={<Phone className="w-4 h-4" />}>
            <input className="input pr-10" placeholder="۰۹۱۲۳۴۵۶۷۸۹" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
          </Field>
          <Field label="ایمیل" icon={<Mail className="w-4 h-4" />}>
            <input type="email" className="input pr-10" placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" />
          </Field>
          <Field label="رمز عبور" icon={<Lock className="w-4 h-4" />}>
            <input
              type={showPass ? 'text' : 'password'}
              className="input pr-10 pl-10"
              placeholder="حداقل ۶ کاراکتر"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </Field>

          <button type="submit" disabled={loading} className="btn btn-primary w-full btn-lg">
            {loading ? 'در حال ثبت‌نام...' : 'ثبت‌نام'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">یا</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="btn btn-secondary w-full btn-lg gap-2"
        >
          {googleLoading ? (
            'در حال اتصال...'
          ) : (
            <>
              <GoogleIcon />
              ثبت‌نام با گوگل
            </>
          )}
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">
          قبلاً ثبت‌نام کرده‌اید؟ <Link to="/login" className="text-primary-600 font-600 hover:underline">ورود</Link>
        </p>
      </AuthLayout>
    </>
  );
}

export function ForgotPasswordPage() {
  const { toast } = useToast();
  const { navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setSent(true);
      toast('لینک بازیابی ارسال شد', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'ارسال ناموفق بود', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Seo title="بازیابی رمز عبور" />
      <AuthLayout title="بازیابی رمز عبور" subtitle="ایمیل خود را وارد کنید تا لینک بازیابی برایتان ارسال شود">
        {sent ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-success-50 text-success-600 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8" />
            </div>
            <p className="text-sm text-gray-600 mb-6">لینک بازیابی رمز عبور به ایمیل شما ارسال شد. لطفاً صندوق ورودی خود را بررسی کنید.</p>
            <button onClick={() => navigate('/login')} className="btn btn-primary w-full">بازگشت به ورود</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="ایمیل" icon={<Mail className="w-4 h-4" />}>
              <input type="email" className="input pr-10" placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" />
            </Field>
            <button type="submit" disabled={loading} className="btn btn-primary w-full btn-lg">
              {loading ? 'در حال ارسال...' : 'ارسال لینک بازیابی'}
            </button>
          </form>
        )}
        <p className="text-center text-sm text-gray-500 mt-6">
          <Link to="/login" className="text-primary-600 font-600 hover:underline">بازگشت به ورود</Link>
        </p>
      </AuthLayout>
    </>
  );
}

function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </Link>
          <h1 className="text-2xl font-700 text-gray-900 mb-1">{title}</h1>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <div className="card p-6 md:p-8">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
        {children}
      </div>
    </div>
  );
}

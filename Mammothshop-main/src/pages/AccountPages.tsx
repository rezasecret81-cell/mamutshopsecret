import { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useRouter, Link, Navigate } from '@/lib/router-context';
import { useToast } from '@/components/Toast';
import { Seo } from '@/components/Seo';
import { supabase } from '@/lib/supabase';
import type { Address, Order, Ticket, ChatRoom, ChatMessage } from '@/lib/types';
import { formatPrice, formatDate } from '@/lib/format';
import { User, MapPin, Package, Ticket as TicketIcon, Plus, Pencil, Trash2, Home, LogOut, ChevronLeft, Send, PlusCircle, MessageSquare, Headphones, Smile, Paperclip, X, Image as ImageIcon, FileText, Upload } from 'lucide-react';

type Section = 'profile' | 'addresses' | 'orders' | 'tickets' | 'chat';

const NAV: { key: Section; label: string; icon: React.ReactNode; path: string }[] = [
  { key: 'profile', label: 'پروفایل', icon: <User className="w-5 h-5" />, path: '/account/profile' },
  { key: 'orders', label: 'سفارشات من', icon: <Package className="w-5 h-5" />, path: '/account/orders' },
  { key: 'addresses', label: 'آدرس‌ها', icon: <MapPin className="w-5 h-5" />, path: '/account/addresses' },
  { key: 'tickets', label: 'تیکت پشتیبانی', icon: <TicketIcon className="w-5 h-5" />, path: '/account/tickets' },
  { key: 'chat', label: 'چت آنلاین', icon: <Headphones className="w-5 h-5" />, path: '/account/chat' },
];

export function AccountLayout({ section, children }: { section: Section; children: React.ReactNode }) {
  const { user, profile, signOut } = useAuth();
  const { navigate } = useRouter();
  if (!user) return <Navigate to="/login" />;

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1">
            <div className="card p-5 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl gradient-primary text-white flex items-center justify-center text-lg font-700">
                  {profile?.full_name?.[0] ?? <User className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <p className="font-700 truncate">{profile?.full_name ?? 'کاربر'}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
            </div>
            <nav className="card overflow-hidden">
              <Link to="/" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 border-b border-gray-100">
                <Home className="w-5 h-5" /> خانه
              </Link>
              {NAV.map((n) => (
                <Link
                  key={n.key}
                  to={n.path}
                  className={`flex items-center gap-3 px-4 py-3 text-sm border-b border-gray-100 transition-colors ${
                    section === n.key ? 'bg-primary-50 text-primary-700 font-600' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {n.icon} {n.label}
                </Link>
              ))}
              <button
                onClick={() => { signOut(); navigate('/'); }}
                className="flex items-center gap-3 px-4 py-3 text-sm text-error-600 hover:bg-error-50 w-full transition-colors"
              >
                <LogOut className="w-5 h-5" /> خروج
              </button>
            </nav>
          </aside>
          <div className="lg:col-span-3">{children}</div>
        </div>
      </div>
    </>
  );
}

export function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name ?? '');
    setPhone(profile?.phone ?? '');
  }, [profile]);

  if (!user) return <Navigate to="/login" />;

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateProfile(user.id, { full_name: fullName, phone });
      await refreshProfile();
      toast('پروفایل به‌روزرسانی شد', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'خطا', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AccountLayout section="profile">
      <Seo title="پروفایل" />
      <div className="card p-6">
        <h1 className="text-xl font-700 mb-6">ویرایش پروفایل</h1>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">نام و نام خانوادگی</label>
            <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="label">شماره موبایل</label>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
          </div>
          <div>
            <label className="label">ایمیل</label>
            <input className="input bg-gray-50" value={user.email ?? ''} disabled />
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn btn-primary mt-6">
          {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
        </button>
      </div>
    </AccountLayout>
  );
}

export function AddressesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const empty = { title: '', recipient: '', phone: '', province: '', city: '', postal_code: '', address: '', is_default: false };
  const [form, setForm] = useState<typeof empty>(empty);

  if (!user) return <Navigate to="/login" />;

  const load = () => {
    api.getAddresses(user.id).then(setAddresses).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, [user.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateAddress(editingId, form);
        toast('آدرس به‌روزرسانی شد', 'success');
      } else {
        await api.saveAddress({ ...form, user_id: user.id });
        toast('آدرس اضافه شد', 'success');
      }
      setShowForm(false);
      setEditingId(null);
      setForm(empty);
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'خطا', 'error');
    }
  };

  const handleEdit = (addr: Address) => {
    setEditingId(addr.id);
    setForm({
      title: addr.title ?? '',
      recipient: addr.recipient ?? '',
      phone: addr.phone ?? '',
      province: addr.province ?? '',
      city: addr.city ?? '',
      postal_code: addr.postal_code ?? '',
      address: addr.address ?? '',
      is_default: addr.is_default,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('پاک کردن این آدرس؟')) return;
    try {
      await api.deleteAddress(id);
      toast('آدرس حذف شد', 'success');
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'خطا', 'error');
    }
  };

  return (
    <AccountLayout section="addresses">
      <Seo title="آدرس‌های من" />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-700">آدرس‌های تحویل</h1>
        <button
          onClick={() => { setForm(empty); setEditingId(null); setShowForm(true); }}
          className="btn btn-primary btn-sm"
        >
          <Plus className="w-4 h-4" /> آدرس جدید
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 mb-6 animate-slide-down">
          <h3 className="font-700 mb-4">{editingId ? 'ویرایش آدرس' : 'آدرس جدید'}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="label">عنوان (خانه، محل کار)</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div><label className="label">نام گیرنده</label><input className="input" value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} required /></div>
            <div><label className="label">شماره تماس</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="ltr" required /></div>
            <div><label className="label">استان</label><input className="input" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} required /></div>
            <div><label className="label">شهر</label><input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required /></div>
            <div><label className="label">کد پستی</label><input className="input" value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} dir="ltr" /></div>
            <div className="md:col-span-2"><label className="label">آدرس کامل</label><textarea className="input min-h-20" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required /></div>
            <label className="flex items-center gap-2 md:col-span-2">
              <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} className="rounded text-primary-600" />
              <span className="text-sm text-gray-600">تنظیم به عنوان آدرس پیش‌فرض</span>
            </label>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="btn btn-primary">ذخیره</button>
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="btn btn-ghost">انصراف</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="card p-12 text-center text-gray-500">در حال بارگذاری...</div>
      ) : addresses.length === 0 ? (
        <div className="card p-12 text-center">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">آدرسی ثبت نشده است</p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div key={addr.id} className="card p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-700">{addr.title}</p>
                  {addr.is_default && <span className="badge badge-primary">پیش‌فرض</span>}
                </div>
                <p className="text-sm text-gray-600">{addr.recipient} - {addr.province} - {addr.city} - {addr.address}</p>
                <p className="text-xs text-gray-400 mt-1" dir="ltr">{addr.phone} {addr.postal_code && `| ${addr.postal_code}`}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(addr)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(addr.id)} className="p-2 rounded-lg hover:bg-error-50 text-error-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AccountLayout>
  );
}

const ORDER_STATUS: Record<string, { label: string; badge: string }> = {
  pending: { label: 'در انتظار پرداخت', badge: 'badge-warning' },
  paid: { label: 'پرداخت شد', badge: 'badge-primary' },
  processing: { label: 'در حال آماده‌سازی', badge: 'badge-primary' },
  shipped: { label: 'ارسال شد', badge: 'badge-accent' },
  delivered: { label: 'تحویل شد', badge: 'badge-success' },
  cancelled: { label: 'لغو شد', badge: 'badge-error' },
};

export function OrdersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { navigate } = useRouter();

  if (!user) return <Navigate to="/login" />;

  useEffect(() => {
    api.getUserOrders(user.id).then(setOrders).catch((e) => toast(e.message, 'error')).finally(() => setLoading(false));
  }, [user.id, toast]);

  const handleCancel = async (id: string) => {
    if (!confirm('لغو این سفارش؟')) return;
    try {
      await api.cancelOrder(id);
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: 'cancelled' } : o)));
      toast('سفارش لغو شد', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'خطا', 'error');
    }
  };

  return (
    <AccountLayout section="orders">
      <Seo title="سفارشات من" />
      <h1 className="text-xl font-700 mb-4">سفارشات من</h1>
      {loading ? (
        <div className="card p-12 text-center text-gray-500">در حال بارگذاری...</div>
      ) : orders.length === 0 ? (
        <div className="card p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">هنوز سفارشی ثبت نکرده‌اید</p>
          <Link to="/shop" className="btn btn-primary btn-sm">شروع خرید</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const status = ORDER_STATUS[order.status] ?? ORDER_STATUS.pending;
            return (
              <div key={order.id} className="card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
                  <div>
                    <p className="font-700">{order.order_number}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(order.created_at)}</p>
                  </div>
                  <span className={`badge ${status.badge} px-3 py-1`}>{status.label}</span>
                </div>
                <div className="flex items-center justify-between pt-3">
                  <div>
                    <p className="text-sm text-gray-500">مبلغ کل</p>
                    <p className="font-700 text-primary-700">{formatPrice(order.total_amount)} تومان</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => navigate(`/order/${order.order_number}`)} className="btn btn-secondary btn-sm">
                      <ChevronLeft className="w-4 h-4" /> جزئیات
                    </button>
                    {order.status === 'pending' && (
                      <button onClick={() => handleCancel(order.id)} className="btn btn-ghost btn-sm text-error-600">لغو سفارش</button>
                    )}
                    {order.tracking_code && (
                      <span className="badge badge-accent px-3 py-1.5">رهگیری: {order.tracking_code}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AccountLayout>
  );
}

export function TicketsPage() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  if (!user) return <Navigate to="/login" />;

  const load = () => {
    api.getTickets(user.id, isAdmin).then(setTickets).catch((e) => toast(e.message, 'error')).finally(() => setLoading(false));
  };
  useEffect(load, [user.id, isAdmin, toast]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;
    try {
      await api.createTicket(subject.trim(), priority, user.id);
      toast('تیکت ایجاد شد', 'success');
      setSubject('');
      setPriority('normal');
      setShowForm(false);
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'خطا', 'error');
    }
  };

  if (selectedTicket) {
    return <TicketDetail ticket={selectedTicket} onBack={() => { setSelectedTicket(null); load(); }} />;
  }

  const TICKET_STATUS: Record<string, { label: string; badge: string }> = {
    open: { label: 'باز', badge: 'badge-warning' },
    answered: { label: 'پاسخ داده شد', badge: 'badge-success' },
    closed: { label: 'بسته شد', badge: 'badge-error' },
  };

  return (
    <AccountLayout section="tickets">
      <Seo title="تیکت‌های پشتیبانی" />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-700">تیکت پشتیبانی</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary btn-sm">
          <PlusCircle className="w-4 h-4" /> تیکت جدید
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card p-5 mb-4 animate-slide-down">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">موضوع</label>
              <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="موضوع تیکت" required />
            </div>
            <div>
              <label className="label">اولویت</label>
              <select className="input" value={priority} onChange={(e) => setPriority(e.target.value as 'low' | 'normal' | 'high')}>
                <option value="low">کم</option>
                <option value="normal">معمولی</option>
                <option value="high">زیاد</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="btn btn-primary btn-sm">ایجاد تیکت</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost btn-sm">انصراف</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="card p-12 text-center text-gray-500">در حال بارگذاری...</div>
      ) : tickets.length === 0 ? (
        <div className="card p-12 text-center">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">تیکتی ثبت نکرده‌اید</p>
          <button onClick={() => setShowForm(true)} className="btn btn-primary btn-sm">ایجاد اولین تیکت</button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => {
            const st = TICKET_STATUS[t.status] ?? TICKET_STATUS.open;
            return (
              <button key={t.id} onClick={() => setSelectedTicket(t)} className="card p-5 w-full text-right hover:shadow-card-hover transition-all flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                  <TicketIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-600 truncate">{t.subject}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(t.created_at)}</p>
                </div>
                <span className={`badge ${st.badge}`}>{st.label}</span>
                <ChevronLeft className="w-4 h-4 text-gray-400" />
              </button>
            );
          })}
        </div>
      )}
    </AccountLayout>
  );
}

function TicketDetail({ ticket, onBack }: { ticket: Ticket; onBack: () => void }) {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [replies, setReplies] = useState<{ id: string; message: string; is_staff: boolean; created_at: string; user_id: string }[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTicketReplies(ticket.id).then(setReplies).catch(() => {}).finally(() => setLoading(false));
  }, [ticket.id]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;
    try {
      const reply = await api.sendTicketReply(ticket.id, user.id, message.trim(), isAdmin);
      setReplies((prev) => [...prev, reply]);
      setMessage('');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'خطا', 'error');
    }
  };

  return (
    <AccountLayout section="tickets">
      <Seo title={ticket.subject} />
      <button onClick={onBack} className="btn btn-ghost btn-sm mb-4">
        <ChevronLeft className="w-4 h-4" /> بازگشت
      </button>
      <div className="card overflow-hidden flex flex-col" style={{ height: '70vh' }}>
        <div className="p-4 border-b border-gray-100">
          <h1 className="font-700">{ticket.subject}</h1>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <p className="text-center text-gray-500 py-8">در حال بارگذاری...</p>
          ) : (
            replies.map((r) => (
              <div key={r.id} className={`flex ${r.is_staff || r.user_id !== user?.id ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${r.is_staff ? 'bg-accent-50 text-accent-900' : 'bg-primary-600 text-white'}`}>
                  {r.is_staff && <p className="text-xs font-700 mb-1 opacity-70">پشتیبانی</p>}
                  <p className="text-sm whitespace-pre-line">{r.message}</p>
                  <p className={`text-[10px] mt-1 ${r.is_staff ? 'text-accent-600' : 'text-primary-100'}`}>{formatDate(r.created_at)}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <form onSubmit={handleSend} className="p-3 border-t border-gray-100 flex gap-2">
          <input className="input" placeholder="پیام خود را بنویسید..." value={message} onChange={(e) => setMessage(e.target.value)} />
          <button type="submit" className="btn btn-primary shrink-0"><Send className="w-4 h-4" /></button>
        </form>
      </div>
    </AccountLayout>
  );
}

export function UserChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return <Navigate to="/login" />;

  const EMOJIS = ['😊', '👍', '❤️', '🎉', '👏', '🙏', '😍', '🌟', '✅', '📞', '💬', '📦', '🛒', '💰', '🎁'];

  const loadRooms = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setRooms(data || []);
    } catch {
      toast('خطا در بارگذاری چت‌ها', 'error');
    } finally {
      setLoading(false);
    }
  }, [user.id, toast]);

  const loadMessages = useCallback(async () => {
    if (!selectedRoom) return;
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', selectedRoom.id)
      .order('created_at', { ascending: true });
    if (!error && data) {
      setMessages(data);
      // Mark as read
      if (data.some(m => m.is_from_admin && !m.read_at)) {
        await supabase.from('chat_rooms').update({ unread_user: 0 }).eq('id', selectedRoom.id);
        data.filter(m => m.is_from_admin && !m.read_at).forEach(async m => {
          await supabase.from('chat_messages').update({ read_at: new Date().toISOString() }).eq('id', m.id);
        });
      }
    }
  }, [selectedRoom]);

  useEffect(() => {
    loadRooms();
    // Real-time subscription for rooms
    const channel = supabase.channel(`chat_rooms_${user.id}`);
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'chat_rooms', filter: `user_id=eq.${user.id}` }, () => loadRooms());
    channel.subscribe();
    return () => { channel.unsubscribe(); };
  }, [loadRooms, user.id]);

  useEffect(() => {
    if (selectedRoom) {
      loadMessages();
      // Real-time subscription for messages
      const channel = supabase.channel(`chat_messages_${selectedRoom.id}`);
      channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${selectedRoom.id}` }, (payload) => {
        setMessages(prev => [...prev, payload.new as ChatMessage]);
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
      channel.subscribe();
      return () => { channel.unsubscribe(); };
    }
  }, [selectedRoom, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const uploadFile = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `chat-${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const filePath = `chat/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (uploadError) {
      toast('خطا در آپلود فایل', 'error');
      return null;
    }

    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
    return publicUrl;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedRoom) return;
    setUploading(true);
    const url = await uploadFile(file);
    if (url) {
      const isImage = file.type.startsWith('image/');
      await supabase.from('chat_messages').insert({
        room_id: selectedRoom.id,
        sender_id: user.id,
        message: isImage ? '📷 تصویر' : `📎 ${file.name}`,
        is_from_admin: false,
        attachment_url: url,
        attachment_type: file.type,
        attachment_name: file.name,
      });
      loadMessages();
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim()) return;
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .insert({ user_id: user.id, subject: newSubject.trim(), status: 'active' })
        .select()
        .single();
      if (error) throw error;
      setRooms((prev) => [data, ...prev]);
      setSelectedRoom(data);
      setShowNewModal(false);
      setNewSubject('');
      toast('چت جدید ایجاد شد', 'success');
    } catch {
      toast('خطا در ایجاد چت', 'error');
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRoom) return;
    setSending(true);
    try {
      await supabase.from('chat_messages').insert({
        room_id: selectedRoom.id,
        sender_id: user.id,
        message: newMessage.trim(),
        is_from_admin: false,
      });
      setNewMessage('');
      await supabase.from('chat_rooms').update({
        updated_at: new Date().toISOString(),
        last_message: newMessage.trim(),
        last_message_at: new Date().toISOString()
      }).eq('id', selectedRoom.id);
      loadMessages();
    } catch {
      toast('خطا در ارسال پیام', 'error');
    } finally {
      setSending(false);
    }
  };

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmoji(false);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { active: 'badge-success', pending: 'badge-warning', closed: 'badge-error' };
    const label: Record<string, string> = { active: 'فعال', pending: 'در انتظار', closed: 'بسته' };
    return <span className={`badge ${map[status] || 'badge-warning'}`}>{label[status] || status}</span>;
  };

  return (
    <AccountLayout section="chat">
      <Seo title="چت آنلاین" />
      <h1 className="text-xl font-700 mb-4">چت آنلاین با پشتیبانی</h1>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-4 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-700">چت‌ها</h2>
            <button onClick={() => setShowNewModal(true)} className="btn btn-primary btn-sm">
              <Plus className="w-4 h-4" /> جدید
            </button>
          </div>
          {loading ? (
            <p className="text-center text-gray-500 py-4">در حال بارگذاری...</p>
          ) : rooms.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">چتی وجود ندارد</p>
              <button onClick={() => setShowNewModal(true)} className="btn btn-secondary btn-sm mt-3">شروع چت</button>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className={`w-full text-right p-3 rounded-xl transition-all ${
                    selectedRoom?.id === room.id ? 'bg-primary-50 border-primary-200' : 'hover:bg-gray-50'
                  } border border-gray-100`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${room.status === 'active' ? 'bg-success-500 animate-pulse' : 'bg-gray-300'}`} />
                      <p className="font-600 truncate text-sm">{room.subject || 'بدون موضوع'}</p>
                    </div>
                    {(room.unread_user || 0) > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-error-500 text-white text-[10px] font-700 flex items-center justify-center">
                        {room.unread_user}
                      </span>
                    )}
                  </div>
                  {room.last_message && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{room.last_message}</p>}
                  <p className="text-[10px] text-gray-400 mt-1">{formatDate(room.updated_at)}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card lg:col-span-2 flex flex-col min-h-[500px] relative">
          {selectedRoom ? (
            <>
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-700">{selectedRoom.subject || 'چت پشتیبانی'}</h2>
                    <div className="flex items-center gap-2">
                      {statusBadge(selectedRoom.status)}
                      {isTyping && <span className="text-xs text-primary-600 animate-pulse">در حال نوشتن...</span>}
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedRoom(null)} className="btn btn-ghost btn-sm lg:hidden">بازگشت</button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <Headphones className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p>پیامی وجود ندارد. پیام خود را بنویسید.</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.is_from_admin ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${msg.is_from_admin ? 'bg-white border border-gray-100 text-gray-900 rounded-tr-none' : 'bg-primary-600 text-white rounded-tl-none'}`}>
                        {msg.attachment_url && (
                          <div className="mb-2">
                            {msg.attachment_type?.startsWith('image') ? (
                              <img src={msg.attachment_url} alt="" className="rounded-lg max-h-40" />
                            ) : (
                              <a href={msg.attachment_url} target="_blank" rel="noopener" className="text-xs underline flex items-center gap-1">
                                <FileText className="w-4 h-4" /> {msg.attachment_name || 'فایل'}
                              </a>
                            )}
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-line leading-relaxed">{msg.message}</p>
                        <p className={`text-[10px] mt-1.5 ${msg.is_from_admin ? 'text-gray-400' : 'text-primary-200'}`}>
                          {new Date(msg.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                          {!msg.is_from_admin && msg.read_at && <span className="mr-1">✓✓</span>}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {selectedRoom.status === 'active' ? (
                <div className="p-3 border-t border-gray-100 bg-white">
                  <div className="flex gap-2 mb-2">
                    <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" id="chat-file-upload" />
                    <label htmlFor="chat-file-upload" className={`p-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                      {uploading ? <span className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin block" /> : <Paperclip className="w-5 h-5 text-gray-500" />}
                    </label>
                    <div className="relative">
                      <button onClick={() => setShowEmoji(!showEmoji)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                        <Smile className="w-5 h-5 text-gray-500" />
                      </button>
                      {showEmoji && (
                        <div className="absolute bottom-12 right-0 bg-white rounded-xl shadow-lg border border-gray-100 p-2 flex flex-wrap gap-1 w-48 z-10">
                          {EMOJIS.map((e) => (
                            <button key={e} onClick={() => addEmoji(e)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg text-lg">
                              {e}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <form onSubmit={handleSend} className="flex gap-2">
                    <input className="input flex-1" placeholder="پیام خود را بنویسید..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                    <button type="submit" disabled={sending || !newMessage.trim()} className="btn btn-primary shrink-0">
                      {sending ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="p-3 border-t border-gray-100 bg-gray-50 text-center text-sm text-gray-500">
                  این گفتگو بسته شده است
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                <p className="font-600 mb-1">گفتگو انتخاب نشده</p>
                <p className="text-sm">یک گفتگو را از لیست انتخاب کنید</p>
              </div>
            </div>
          )}

          {showEmoji && <div className="fixed inset-0 z-0" onClick={() => setShowEmoji(false)} />}
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-sm animate-slide-down">
            <h3 className="font-700 text-lg mb-4">شروع چت جدید</h3>
            <form onSubmit={handleCreateRoom}>
              <input className="input w-full mb-4" placeholder="موضوع گفتگو..." value={newSubject} onChange={(e) => setNewSubject(e.target.value)} required />
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary flex-1">ایجاد</button>
                <button type="button" onClick={() => setShowNewModal(false)} className="btn btn-ghost">انصراف</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AccountLayout>
  );
}

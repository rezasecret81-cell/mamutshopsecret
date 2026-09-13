import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from './api';

type SiteSettings = {
  site_name: string;
  site_url: string;
  site_email: string;
  site_phone: string;
  site_address: string;
  site_tagline: string;
  site_description: string;
  hero_title: string;
  hero_subtitle: string;
  hero_background_image: string;
  show_bestsellers: boolean;
  show_flash_sale: boolean;
  show_discounted: boolean;
  show_new_products: boolean;
  new_products_title: string;
  new_products_subtitle: string;
  shipping_cost: number;
  free_shipping_threshold: number;
  instagram: string;
  telegram: string;
  whatsapp: string;
  twitter: string;
  facebook: string;
  youtube: string;
  linkedin: string;
  aparat: string;
};

type SettingsContextValue = {
  settings: SiteSettings;
  loading: boolean;
  refresh: () => Promise<void>;
};

const defaultSettings: SiteSettings = {
  site_name: 'ماموت شاپ',
  site_url: 'https://mamutshop.ir',
  site_email: 'support@mamutshop.ir',
  site_phone: '۰۲۱-۹۱۰۱۰۱۰۱',
  site_address: 'تهران، خیابان ولیعصر، برج ماموت، طبقه ۸',
  site_tagline: 'فروشگاه آنلاین لوازم دیجیتال',
  site_description: 'ماموت شاپ - خرید آنلاین موبایل، لپ تاپ، لوازم خانگی و گیمینگ',
  hero_title: 'جدیدترین لوازم دیجیتال با بهترین قیمت',
  hero_subtitle: 'از موبایل و لپ‌تاپ تا کنسول بازی و لوازم خانگی',
  hero_background_image: '',
  show_bestsellers: true,
  show_flash_sale: true,
  show_discounted: true,
  show_new_products: true,
  new_products_title: 'جدیدترین محصولات',
  new_products_subtitle: 'تازه‌ترین محصولات وارد شده را از دست نده',
  shipping_cost: 50000,
  free_shipping_threshold: 5000000,
  instagram: '',
  telegram: '',
  whatsapp: '',
  twitter: '',
  facebook: '',
  youtube: '',
  linkedin: '',
  aparat: '',
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings({
        site_name: data.site_info?.site_name || defaultSettings.site_name,
        site_url: data.site_info?.site_url || defaultSettings.site_url,
        site_email: data.site_info?.site_email || defaultSettings.site_email,
        site_phone: data.site_info?.site_phone || defaultSettings.site_phone,
        site_address: data.site_info?.site_address || defaultSettings.site_address,
        site_tagline: data.site_info?.site_tagline || defaultSettings.site_tagline,
        site_description: data.site_info?.site_description || defaultSettings.site_description,
        hero_title: data.appearance?.hero_title || defaultSettings.hero_title,
        hero_subtitle: data.appearance?.hero_subtitle || defaultSettings.hero_subtitle,
        hero_background_image: data.appearance?.hero_background_image || defaultSettings.hero_background_image,
        show_bestsellers: data.appearance?.show_bestsellers ?? defaultSettings.show_bestsellers,
        show_flash_sale: data.appearance?.show_flash_sale ?? defaultSettings.show_flash_sale,
        show_discounted: data.appearance?.show_discounted ?? defaultSettings.show_discounted,
        show_new_products: data.appearance?.show_new_products ?? defaultSettings.show_new_products,
        new_products_title: data.appearance?.new_products_title || defaultSettings.new_products_title,
        new_products_subtitle: data.appearance?.new_products_subtitle || defaultSettings.new_products_subtitle,
        shipping_cost: data.shipping?.shipping_cost ?? defaultSettings.shipping_cost,
        free_shipping_threshold: data.shipping?.free_shipping_threshold ?? defaultSettings.free_shipping_threshold,
        instagram: data.social_links?.instagram || '',
        telegram: data.social_links?.telegram || '',
        whatsapp: data.social_links?.whatsapp || '',
        twitter: data.social_links?.twitter || '',
        facebook: data.social_links?.facebook || '',
        youtube: data.social_links?.youtube || '',
        linkedin: data.social_links?.linkedin || '',
        aparat: data.social_links?.aparat || '',
      });
    } catch {
      // ignore, use defaults
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, refresh: loadSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}

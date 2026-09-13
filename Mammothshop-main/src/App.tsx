import { useEffect, useState } from 'react';
import { AuthProvider } from '@/lib/auth-context';
import { CartProvider } from '@/lib/cart-context';
import { WishlistProvider } from '@/lib/wishlist-context';
import { CompareProvider } from '@/lib/compare-context';
import { SettingsProvider } from '@/lib/settings-context';
import { RouterProvider, useRouter } from '@/lib/router-context';
import { CacheProvider } from '@/lib/cache-context';
import { ToastProvider } from '@/components/Toast';
import { Layout } from '@/components/Layout';
import { HomePage } from '@/pages/HomePage';
import { ShopPage } from '@/pages/ShopPage';
import { ProductPage } from '@/pages/ProductPage';
import { CategoryPage } from '@/pages/CategoryPage';
import { CartPage } from '@/pages/CartPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { LoginPage, RegisterPage, ForgotPasswordPage } from '@/pages/AuthPages';
import { ProfilePage, AddressesPage, OrdersPage, TicketsPage, UserChatPage } from '@/pages/AccountPages';
import { AboutPage, ContactPage, TermsPage, ShippingPage, ReturnsPage, PrivacyPage } from '@/pages/StaticPages';
import { InvoicePage } from '@/pages/InvoicePage';
import { WishlistPage } from '@/pages/WishlistPage';
import { ComparePage } from '@/pages/ComparePage';
import { FaqPage } from '@/pages/FaqPage';
import { PaymentVerifyPage } from '@/pages/PaymentVerifyPage';
import {
  AdminOverview,
  AdminProducts,
  AdminOrders,
  AdminUsers,
  AdminCategories,
  AdminBrands,
  AdminCoupons,
  AdminInventory,
  AdminReviews,
  AdminReports,
  AdminFaqs,
  AdminFlashSales,
  AdminTicketsPage,
  AdminSettings,
  AdminChat,
  AdminSeo,
} from '@/pages/AdminPages';

function Routes() {
  const { route, params } = useRouter();

  switch (route?.path) {
    case '/':
      return <HomePage />;
    case '/shop':
      return <ShopPage />;
    case '/product/:slug':
      return <ProductPage slug={params.slug} />;
    case '/category/:slug':
      return <CategoryPage slug={params.slug} />;
    case '/cart':
      return <CartPage />;
    case '/checkout':
      return <CheckoutPage />;
    case '/order/:orderNumber':
      return <InvoicePage orderNumber={params.orderNumber} />;
    case '/wishlist':
      return <WishlistPage />;
    case '/compare':
      return <ComparePage />;
    case '/faq':
      return <FaqPage />;
    case '/login':
      return <LoginPage />;
    case '/register':
      return <RegisterPage />;
    case '/forgot-password':
      return <ForgotPasswordPage />;
    case '/account':
    case '/account/profile':
      return <ProfilePage />;
    case '/account/orders':
      return <OrdersPage />;
    case '/account/addresses':
      return <AddressesPage />;
    case '/account/tickets':
      return <TicketsPage />;
    case '/account/chat':
      return <UserChatPage />;
    case '/about':
      return <AboutPage />;
    case '/contact':
      return <ContactPage />;
    case '/terms':
      return <TermsPage />;
    case '/shipping':
      return <ShippingPage />;
    case '/returns':
      return <ReturnsPage />;
    case '/privacy':
      return <PrivacyPage />;
    case '/admin':
      return <AdminOverview />;
    case '/admin/products':
      return <AdminProducts />;
    case '/admin/orders':
      return <AdminOrders />;
    case '/admin/users':
      return <AdminUsers />;
    case '/admin/categories':
      return <AdminCategories />;
    case '/admin/brands':
      return <AdminBrands />;
    case '/admin/coupons':
      return <AdminCoupons />;
    case '/admin/tickets':
      return <AdminTicketsPage />;
    case '/admin/inventory':
      return <AdminInventory />;
    case '/admin/reviews':
      return <AdminReviews />;
    case '/admin/reports':
      return <AdminReports />;
    case '/admin/faqs':
      return <AdminFaqs />;
    case '/admin/flash-sales':
      return <AdminFlashSales />;
    case '/admin/settings':
      return <AdminSettings />;
    case '/admin/chat':
      return <AdminChat />;
    case '/admin/seo':
      return <AdminSeo />;
    case '/payment/verify':
      return <PaymentVerifyPage />;
    default:
      return (
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-md mx-auto">
            <p className="text-6xl font-800 text-primary-200">۴۰۴</p>
            <h1 className="text-2xl font-700 mt-4 mb-2">صفحه یافت نشد</h1>
            <p className="text-gray-500 mb-6">آدرس مورد نظر شما پیدا نشد.</p>
          </div>
        </div>
      );
  }
}

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <CartProvider>
          <WishlistProvider>
            <CompareProvider>
              <CacheProvider>
                <RouterProvider>
                  <ToastProvider>
                    <Layout>
                      <Routes />
                    </Layout>
                  </ToastProvider>
                </RouterProvider>
              </CacheProvider>
            </CompareProvider>
          </WishlistProvider>
        </CartProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;

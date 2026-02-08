import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';

// Critical path - loaded immediately (NOT lazy!)
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import ErrorBoundary from './components/common/ErrorBoundary';

// Everything else - lazy loaded
const Services = React.lazy(() => import('./pages/Services'));
const ProductDetails = React.lazy(() => import('./pages/ProductDetails'));
const Cart = React.lazy(() => import('./pages/Cart'));
const Checkout = React.lazy(() => import('./pages/Checkout/OnePageCheckout'));
const UpsellPage = React.lazy(() => import('./pages/Checkout/UpsellPage'));
const OrderConfirmation = React.lazy(() => import('./pages/OrderConfirmation'));
const Catalog = React.lazy(() => import('./pages/Catalog'));
const Orders = React.lazy(() => import('./pages/Orders'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const RegisterChoice = React.lazy(() => import('./pages/RegisterChoice'));
const BuyerRegister = React.lazy(() => import('./pages/BuyerRegister'));
const SellerRegister = React.lazy(() => import('./pages/SellerRegister'));
const SellerLanding = React.lazy(() => import('./pages/SellerLanding'));
const SellerOnboarding = React.lazy(() => import('./pages/SellerOnboarding'));
const ShippingPolicy = React.lazy(() => import('./pages/ShippingPolicy'));
const ComingSoon = React.lazy(() => import('./pages/ComingSoon'));
const PlaceholderPage = React.lazy(() => import('./pages/PlaceholderPage'));
const BestShops = React.lazy(() => import('./pages/BestShops'));
const PoliciesPage = React.lazy(() => import('./pages/legal/PoliciesPage'));
const AddCar = React.lazy(() => import('./pages/seller/AddCar'));
const KYCVerification = React.lazy(() => import('./pages/seller/KYCVerification'));
const CarDetails = React.lazy(() => import('./pages/CarDetails'));
const CarsCatalog = React.lazy(() => import('./pages/cars/CarsCatalog'));
const RealEstateCatalog = React.lazy(() => import('./pages/real-estate/RealEstateCatalog'));
const RealEstateDetails = React.lazy(() => import('./pages/real-estate/RealEstateDetails'));
const UtilitiesHub = React.lazy(() => import('./pages/utilities/UtilitiesHub'));
const ElectricityPayment = React.lazy(() => import('./pages/utilities/ElectricityPayment'));
const MobileRecharge = React.lazy(() => import('./pages/utilities/MobileRecharge'));
const PayHub = React.lazy(() => import('./pages/pay/PayHub'));
const Transfer = React.lazy(() => import('./pages/pay/Transfer'));
const Credit = React.lazy(() => import('./pages/pay/Credit'));
const LearnCatalog = React.lazy(() => import('./pages/learn/LearnCatalog'));
const CourseDetails = React.lazy(() => import('./pages/learn/CourseDetails'));
const MyCourses = React.lazy(() => import('./pages/learn/MyCourses'));
const VendorShop = React.lazy(() => import('./pages/VendorShop'));
const VendorsPage = React.lazy(() => import('./pages/VendorsPage'));
const TrackingPage = React.lazy(() => import('./pages/TrackingPage'));

// Admin - lazy loaded
const FunnelBuilder = React.lazy(() => import('./pages/FunnelBuilder'));
const AdminLayout = React.lazy(() => import('./layouts/AdminLayout'));
const AdminDashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const AdminProducts = React.lazy(() => import('./pages/admin/Products'));
const StoreModeration = React.lazy(() => import('./pages/admin/StoreModeration'));
const AdminOrders = React.lazy(() => import('./pages/admin/Orders'));
const SystemStatus = React.lazy(() => import('./pages/admin/SystemStatus'));
const ComplianceDashboard = React.lazy(() => import('./pages/admin/ComplianceDashboard'));
const AdminUsers = React.lazy(() => import('./pages/admin/Users'));
const AdminSettings = React.lazy(() => import('./pages/admin/Settings'));
const AdminPayouts = React.lazy(() => import('./pages/admin/Payouts'));
const AdminSubscription = React.lazy(() => import('./pages/admin/Subscription'));

// Seller - lazy loaded
const DashboardUltimate = React.lazy(() => import('./pages/seller/DashboardUltimate'));
const SellerDashboard = React.lazy(() => import('./pages/seller/SellerDashboard'));
const AddProduct = React.lazy(() => import('./pages/seller/AddProduct'));
const AddService = React.lazy(() => import('./pages/seller/AddService'));
const AddRealEstate = React.lazy(() => import('./pages/seller/AddRealEstate'));
const SmartAudit = React.lazy(() => import('./pages/seller/SmartAudit'));
const SellerSettings = React.lazy(() => import('./pages/seller/Settings'));
const AdvancedAnalytics = React.lazy(() => import('./pages/seller/AdvancedAnalytics'));
const POSTerminal = React.lazy(() => import('./pages/seller/POSTerminal'));
const SellerCredit = React.lazy(() => import('./pages/seller/SellerCredit'));

// New Features - lazy loaded
const AppStore = React.lazy(() => import('./pages/AppStore'));
const LoyaltyDashboard = React.lazy(() => import('./pages/LoyaltyDashboard'));

// Ambassador - lazy loaded
const AmbassadorLanding = React.lazy(() => import('./pages/Ambassador/Landing'));
const AmbassadorOnboarding = React.lazy(() => import('./pages/Ambassador/Onboarding'));
const AmbassadorDashboard = React.lazy(() => import('./pages/Ambassador/Dashboard'));
const AmbassadorResources = React.lazy(() => import('./pages/Ambassador/Resources'));


const PageLoader = () => (
  <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-slate-800">
    <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
    <p className="text-sm font-medium animate-pulse">Chargement...</p>
  </div>
);

import { HelmetProvider } from 'react-helmet-async';
import SEO from './components/common/SEO';
import RouteTracker from './components/common/RouteTracker';

import { WalletProvider } from './contexts/WalletContext';

// Lazy load these too
const Wallet = React.lazy(() => import('./pages/Wallet'));

const MyLibrary = React.lazy(() => import('./pages/MyLibrary'));
const Travel = React.lazy(() => import('./pages/Travel'));
const Favorites = React.lazy(() => import('./pages/Favorites'));
const UnionPlus = React.lazy(() => import('./pages/UnionPlus'));
const WhatsAppWidget = React.lazy(() => import('./components/common/WhatsAppWidget'));

import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AffiliationProvider } from './contexts/AffiliationContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { AmbassadorProvider } from './contexts/AmbassadorContext';
import { PerformanceProvider } from './contexts/PerformanceContext';
import { FittingRoomProvider } from './contexts/FittingRoomContext';
import { LoyaltyProvider } from './contexts/LoyaltyContext';
import { ToastProvider } from './components/ui/Toast';
import SkipLinks from './components/common/SkipLinks';

// Services - lazy loaded
const ServiceCatalog = React.lazy(() => import('./pages/services/ServiceCatalog'));
const ServiceDetails = React.lazy(() => import('./pages/services/ServiceDetails'));

// Financial Services - lazy loaded
const RechargeMonCash = React.lazy(() => import('./pages/services/RechargeMonCash'));
const RechargeNatCash = React.lazy(() => import('./pages/services/RechargeNatCash'));
const TransfertArgent = React.lazy(() => import('./pages/services/TransfertArgent'));
const PaiementEDH = React.lazy(() => import('./pages/services/PaiementEDH'));
const PaiementCAMEP = React.lazy(() => import('./pages/services/PaiementCAMEP'));

// Digital Products - lazy loaded
const DigitalProductPage = React.lazy(() => import('./pages/digital/ProductPage'));
const DigitalCheckoutPage = React.lazy(() => import('./pages/digital/CheckoutPage'));
const DigitalUpsellPage = React.lazy(() => import('./pages/digital/UpsellPage'));
const DigitalAnalyticsDashboard = React.lazy(() => import('./pages/digital/AnalyticsDashboard'));

// Static pages - lazy loaded
const CategoryLanding = React.lazy(() => import('./pages/CategoryLanding'));
const GiftCards = React.lazy(() => import('./pages/GiftCards'));
const CustomerService = React.lazy(() => import('./pages/CustomerService'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const StaticPage = React.lazy(() => import('./pages/StaticPage'));

function App() {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <BrowserRouter>
          <PerformanceProvider>
            <ThemeProvider>
              <LanguageProvider>
                <AffiliationProvider>
                  <AuthProvider>
                    <FavoritesProvider>
                      <AmbassadorProvider>
                        <FittingRoomProvider>
                          <CartProvider>
                            <WalletProvider>
                              <LoyaltyProvider>
                                <ToastProvider>
                                <SkipLinks />
                                <Suspense fallback={<PageLoader />}>
                                  <RouteTracker />
                                  <Routes>
                                    {/* Public Routes wrapped in MainLayout */}
                                    <Route element={<MainLayout />}>
                                      <Route path="/" element={<Home />} />
                                      <Route path="product/:id" element={<ProductDetails />} />
                                      <Route path="cart" element={<Cart />} />
                                      <Route path="checkout" element={<Checkout />} />
                                      <Route path="order-confirmation" element={<OrderConfirmation />} />

                                      {/* Catalog Routes */}
                                      <Route path="catalog" element={<Catalog />} />
                                      <Route path="category/:category" element={<Catalog />} />
                                      <Route path="union-dh" element={<Catalog predefinedFilter="Union DH" />} />
                                      <Route path="flash-sales" element={<Catalog predefinedFilter="Flash Sales" />} />
                                      <Route path="deals" element={<Catalog predefinedFilter="Flash Sales" />} />
                                      <Route path="new-arrivals" element={<Catalog predefinedFilter="New Arrivals" />} />
                                      <Route path="best-sellers" element={<Catalog predefinedFilter="Best Sellers" />} />
                                      <Route path="best-shops" element={<BestShops />} />

                                      {/* Category Landing Pages */}
                                      <Route path="music" element={<CategoryLanding type="music" />} />
                                      <Route path="apps" element={<CategoryLanding type="apps" />} />
                                      <Route path="business" element={<CategoryLanding type="business" />} />
                                      <Route path="sell-business" element={<CategoryLanding type="business" />} />

                                      {/* Functional & Static Pages */}
                                      <Route path="gift-cards" element={<GiftCards />} />
                                      <Route path="fierte-union" element={<UnionPlus />} />
                                      <Route path="prestige" element={<UnionPlus />} /> {/* Legacy redirect */}
                                      <Route path="union-plus" element={<UnionPlus />} />

                                      <Route path="customer-service" element={<CustomerService />} />
                                      <Route path="help" element={<CustomerService />} />
                                      <Route path="returns-replacements" element={<CustomerService />} />
                                      <Route path="analytics" element={<Analytics />} />
                                      <Route path="account" element={<Orders />} />

                                      <Route path="orders" element={<Orders />} />
                                      <Route path="library" element={<MyLibrary />} />
                                      <Route path="favorites" element={<Favorites />} />
                                      <Route path="travel" element={<Travel />} />
                                      <Route path="shipping-policy" element={<ShippingPolicy />} />
                                      <Route path="tracking/:orderId" element={<TrackingPage />} />

                                      {/* Services Routes */}
                                      <Route path="services" element={<Services />} />
                                      <Route path="services/:id" element={<ServiceDetails />} />

                                      {/* Vendor Routes */}
                                      <Route path="vendors" element={<VendorsPage />} />
                                      <Route path="vendor/:vendorId" element={<VendorShop />} />
                                      <Route path="offer/:offerId" element={<ProductDetails />} />

                                      {/* Financial Services */}
                                      <Route path="services/recharge-moncash" element={<RechargeMonCash />} />
                                      <Route path="services/recharge-natcash" element={<RechargeNatCash />} />
                                      <Route path="services/transfert-argent" element={<TransfertArgent />} />
                                      <Route path="services/paiement-edh" element={<PaiementEDH />} />
                                      <Route path="services/paiement-camep" element={<PaiementCAMEP />} />

                                      {/* Cars Routes */}
                                      <Route path="cars" element={<CarsCatalog />} />
                                      <Route path="car/:id" element={<CarDetails />} />

                                      {/* Utilities Routes */}
                                      <Route path="utilities" element={<UtilitiesHub />} />
                                      <Route path="utilities/electricity" element={<ElectricityPayment />} />
                                      <Route path="utilities/mobile" element={<MobileRecharge />} />

                                      {/* Pay Routes */}
                                      <Route path="pay" element={<PayHub />} />
                                      <Route path="pay/transfer" element={<Transfer />} />
                                      <Route path="pay/credit" element={<Credit />} />

                                      {/* Learn Routes */}
                                      <Route path="learn" element={<LearnCatalog />} />
                                      <Route path="learn/course/:id" element={<CourseDetails />} />
                                      <Route path="learn/my-courses" element={<MyCourses />} />

                                      {/* Real Estate Routes */}
                                      <Route path="real-estate" element={<RealEstateCatalog />} />
                                      <Route path="real-estate/:id" element={<RealEstateDetails />} />

                                      {/* Footer Static Pages */}
                                      <Route path="about-us" element={<StaticPage title="À propos d'Union Digitale" content="<p>Union Digitale est la plateforme e-commerce leader en Haïti...</p>" />} />
                                      <Route path="careers" element={<StaticPage title="Carrières" content="<p>Rejoignez notre équipe et aidez-nous à bâtir le futur du commerce haïtien.</p>" />} />
                                      <Route path="sustainability" element={<StaticPage title="Durabilité" content="<p>Nos engagements pour un environnement plus vert.</p>" />} />
                                      <Route path="sell-on-union" element={<StaticPage title="Vendre sur Union" content="<p>Ouvrez votre boutique en ligne dès aujourd'hui.</p>" />} />

                                      {/* Ambassador Program */}
                                      <Route path="ambassador/" element={<AmbassadorLanding />} />
                                      <Route path="ambassador/join" element={<AmbassadorOnboarding />} />
                                      <Route path="ambassador/dashboard" element={<AmbassadorDashboard />} />
                                      <Route path="ambassador/resources" element={<AmbassadorResources />} />
                                      <Route path="wallet" element={<Wallet />} />

                                      <Route path="digital/product/:id" element={<DigitalProductPage />} />
                                      <Route path="digital/checkout/:id" element={<DigitalCheckoutPage />} />
                                      <Route path="digital/upsell" element={<DigitalUpsellPage />} />
                                      <Route path="digital/analytics" element={<DigitalAnalyticsDashboard />} />
                                    </Route>

                                    {/* Standalone Pages (No Navbar usually, or specialized) */}
                                    <Route path="upsell" element={<UpsellPage />} />
                                    <Route path="funnel-builder" element={<FunnelBuilder />} />
                                    <Route path="login" element={<Login />} />
                                    <Route path="register" element={<RegisterChoice />} />
                                    <Route path="register/buyer" element={<BuyerRegister />} />
                                    <Route path="register/seller" element={<SellerRegister />} />
                                    <Route path="seller/welcome" element={<SellerLanding />} />
                                    <Route path="seller/onboarding" element={<SellerOnboarding />} />

                                    {/* Admin Routes */}
                                    <Route path="admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
                                    <Route path="admin/products" element={<AdminLayout><AdminProducts /></AdminLayout>} />
                                    <Route path="admin/orders" element={<AdminLayout><AdminOrders /></AdminLayout>} />
                                    <Route path="admin/moderation" element={<AdminLayout><StoreModeration /></AdminLayout>} />
                                    <Route path="admin/system-status" element={<AdminLayout><SystemStatus /></AdminLayout>} />
                                    <Route path="admin/compliance" element={<AdminLayout><ComplianceDashboard /></AdminLayout>} />
                                    <Route path="admin/users" element={<AdminLayout><AdminUsers /></AdminLayout>} />
                                    <Route path="admin/settings" element={<AdminLayout><AdminSettings /></AdminLayout>} />
                                    <Route path="admin/payouts" element={<AdminLayout><AdminPayouts /></AdminLayout>} />
                                    <Route path="admin/subscription" element={<AdminLayout><AdminSubscription /></AdminLayout>} />

                                    {/* General Routes */}
                                    <Route path="best-shops" element={<BestShops />} />
                                    <Route path="policies" element={<PoliciesPage />} />

                                    {/* Seller Routes (Cars) */}
                                    <Route path="seller/cars/new" element={<AddCar />} />
                                    <Route path="seller/products/new" element={<AddProduct />} />
                                    <Route path="seller/services/new" element={<AddService />} />
                                    <Route path="seller/real-estate/new" element={<AddRealEstate />} />
                                    <Route path="seller/settings" element={<SellerSettings />} />
                                    <Route path="seller/smart-audit" element={<SmartAudit />} />
                                    <Route path="seller/verify" element={<KYCVerification />} />
                                    <Route path="seller/dashboard" element={<DashboardUltimate />} />
                                    <Route path="seller/dashboard-pro" element={<SellerDashboard />} />
                                    <Route path="seller/analytics" element={<AdvancedAnalytics />} />
                                    <Route path="seller/pos" element={<POSTerminal />} />
                                    <Route path="seller/credit" element={<SellerCredit />} />
                                    <Route path="cars/:id" element={<CarDetails />} />

                                    {/* New Features */}
                                    <Route path="apps" element={<AppStore />} />
                                    <Route path="app-store" element={<AppStore />} />
                                    <Route path="loyalty" element={<LoyaltyDashboard />} />
                                    <Route path="rewards" element={<LoyaltyDashboard />} />

                                  </Routes>
                                </Suspense>
                                  <WhatsAppWidget />
                                </ToastProvider>
                              </LoyaltyProvider>
                            </WalletProvider>
                          </CartProvider>
                        </FittingRoomProvider>
                      </AmbassadorProvider>
                    </FavoritesProvider>
                  </AuthProvider>
                </AffiliationProvider>
              </LanguageProvider>
            </ThemeProvider>
          </PerformanceProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;

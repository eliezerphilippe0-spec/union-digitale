import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import ErrorBoundary from './components/common/ErrorBoundary';
import MaintenanceGuard from './components/MaintenanceGuard';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { AffiliationProvider } from './contexts/AffiliationContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { AmbassadorProvider } from './contexts/AmbassadorContext';
import { PerformanceProvider } from './contexts/PerformanceContext';
import { FittingRoomProvider } from './contexts/FittingRoomContext';
import { WalletProvider } from './contexts/WalletContext';
import { LoyaltyProvider } from './contexts/LoyaltyContext';
import { ToastProvider } from './components/ui/Toast';
import OnboardingTour from './components/OnboardingTour';
import RouteTracker from './components/common/RouteTracker';
import SaleNotificationListener from './components/SaleNotificationListener';
import SkipLinks from './components/common/SkipLinks';
import MainLayout from './layouts/MainLayout';
import WhatsAppWidget from './components/common/WhatsAppWidget';
import ProtectedRoute from './components/ProtectedRoute';

// Primary pages
import Home from './pages/Home';

// Lazy loaded components
const Services = React.lazy(() => import('./pages/Services'));
const ProductDetails = React.lazy(() => import('./pages/ProductDetails'));
const Cart = React.lazy(() => import('./pages/Cart'));
const Checkout = React.lazy(() => import('./pages/Checkout/OnePageCheckout'));
const UpsellPage = React.lazy(() => import('./pages/Checkout/UpsellPage'));
const OrderConfirmation = React.lazy(() => import('./pages/OrderConfirmation'));
const Catalog = React.lazy(() => import('./pages/Catalog'));
const DigitalStore = React.lazy(() => import('./pages/DigitalStore'));
const PayBills = React.lazy(() => import('./pages/PayBills'));
const DriverOnboarding = lazy(() => import('./pages/DriverOnboarding'));
const DriverDashboard = lazy(() => import('./pages/DriverDashboard'));
const Orders = lazy(() => import('./pages/Orders'));
const Login = React.lazy(() => import('./pages/Login'));
const RegisterChoice = React.lazy(() => import('./pages/RegisterChoice'));
const BuyerRegister = React.lazy(() => import('./pages/BuyerRegister'));
const SellerRegister = React.lazy(() => import('./pages/SellerRegister'));
const SellerLanding = React.lazy(() => import('./pages/SellerLanding'));
const SellerOnboarding = React.lazy(() => import('./pages/SellerOnboarding'));
const ShippingPolicy = React.lazy(() => import('./pages/ShippingPolicy'));
const BestShops = React.lazy(() => import('./pages/BestShops'));
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

// Salons
const SalonListing = React.lazy(() => import('./pages/salons/SalonListing'));
const SalonProfile = React.lazy(() => import('./pages/salons/SalonProfile'));
const SalonBooking = React.lazy(() => import('./pages/salons/SalonBooking'));
const MyBookings = React.lazy(() => import('./pages/account/MyBookings'));

// Admin
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
const RiskMonitoring = React.lazy(() => import('./pages/admin/RiskMonitoring'));
const TrustMonitoring = React.lazy(() => import('./pages/admin/TrustMonitoring'));

// Seller
const DashboardUltimate = React.lazy(() => import('./pages/seller/DashboardUltimate'));
const SellerDashboard = React.lazy(() => import('./pages/seller/SellerDashboard'));
const AddProduct = React.lazy(() => import('./pages/seller/AddProduct'));
const AddService = React.lazy(() => import('./pages/seller/AddService'));
const AddRealEstate = React.lazy(() => import('./pages/seller/AddRealEstate'));
const SmartAudit = React.lazy(() => import('./pages/seller/SmartAudit'));
const SellerSettings = React.lazy(() => import('./pages/seller/Settings'));
const SalonSetup = React.lazy(() => import('./pages/seller/salon/SalonSetup'));
const SalonCalendar = React.lazy(() => import('./pages/seller/salon/SalonCalendar'));
const SalonAnalytics = React.lazy(() => import('./pages/seller/salon/SalonAnalytics'));
const AdvancedAnalytics = React.lazy(() => import('./pages/seller/AdvancedAnalytics'));
const POSTerminal = React.lazy(() => import('./pages/seller/POSTerminal'));
const SellerCredit = React.lazy(() => import('./pages/seller/SellerCredit'));

// New Features - lazy loaded
const AppStore = React.lazy(() => import('./pages/AppStore'));
const LoyaltyDashboard = React.lazy(() => import('./pages/LoyaltyDashboard'));

// Ambassador
const AmbassadorLanding = React.lazy(() => import('./pages/Ambassador/Landing'));
const AmbassadorOnboarding = React.lazy(() => import('./pages/Ambassador/Onboarding'));
const AmbassadorDashboard = React.lazy(() => import('./pages/Ambassador/Dashboard'));
const AmbassadorResources = React.lazy(() => import('./pages/Ambassador/Resources'));

// Wallet
const Wallet = React.lazy(() => import('./pages/Wallet'));

// Other pages
const MyLibrary = React.lazy(() => import('./pages/MyLibrary'));
const Travel = React.lazy(() => import('./pages/Travel'));
const Favorites = React.lazy(() => import('./pages/Favorites'));
const ZabelyPlus = React.lazy(() => import('./pages/ZabelyPlus'));
const LoyaltyProgram = React.lazy(() => import('./pages/LoyaltyProgram'));

// Services
const ServiceCatalog = React.lazy(() => import('./pages/services/ServiceCatalog'));
const ServiceDetails = React.lazy(() => import('./pages/services/ServiceDetails'));
const RechargeMonCash = React.lazy(() => import('./pages/services/RechargeMonCash'));
const RechargeNatCash = React.lazy(() => import('./pages/services/RechargeNatCash'));
const TransfertArgent = React.lazy(() => import('./pages/services/TransfertArgent'));
const PaiementEDH = React.lazy(() => import('./pages/services/PaiementEDH'));
const PaiementCAMEP = React.lazy(() => import('./pages/services/PaiementCAMEP'));

// Digital Products
const DigitalProductPage = React.lazy(() => import('./pages/digital/ProductPage'));
const DigitalCheckoutPage = React.lazy(() => import('./pages/digital/CheckoutPage'));
const DigitalUpsellPage = React.lazy(() => import('./pages/digital/UpsellPage'));
const DigitalAnalyticsDashboard = React.lazy(() => import('./pages/digital/AnalyticsDashboard'));

// Static pages
const CategoryLanding = React.lazy(() => import('./pages/CategoryLanding'));
const GiftCards = React.lazy(() => import('./pages/GiftCards'));
const CustomerService = React.lazy(() => import('./pages/CustomerService'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const StaticPage = React.lazy(() => import('./pages/StaticPage'));

const PageLoader = () => (
  <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-slate-800">
    <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
    <p className="text-sm font-medium animate-pulse">Chargement...</p>
  </div>
);

function App() {
  console.log('🚀 Zabely: Initializing application core...');

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
                                  <SaleNotificationListener />
                                  <SkipLinks />
                                  <OnboardingTour />
                                  <Suspense fallback={<PageLoader />}>
                                    <RouteTracker />
                                    <Routes>
                                      {/* --- AUTH ROUTES --- */}
                                      <Route path="login" element={<Login />} />
                                      <Route path="register" element={<RegisterChoice />} />
                                      <Route path="register/buyer" element={<BuyerRegister />} />
                                      <Route path="register/seller" element={<SellerRegister />} />

                                      {/* --- PROTECTED BY MAINTENANCE GUARD --- */}
                                      <Route element={<MaintenanceGuard />}>
                                        <Route element={<MainLayout />}>
                                          <Route path="/" element={<Home />} />
                                          <Route path="product/:id" element={<ProductDetails />} />
                                          <Route path="cart" element={<Cart />} />
                                          <Route path="checkout" element={<Checkout />} />
                                          <Route path="order-confirmation" element={<OrderConfirmation />} />
                                          <Route path="/catalog" element={<Catalog />} />
                                          <Route path="/digital-store" element={<DigitalStore />} />
                                          <Route path="/pay-bills" element={<PayBills />} />
                                          <Route path="category/:category" element={<Catalog />} />
                                          <Route path="/zabely-dh" element={<Catalog predefinedFilter="Zabely DH" />} />
                                          <Route path="flash-sales" element={<Catalog predefinedFilter="Flash Sales" />} />
                                          <Route path="deals" element={<Catalog predefinedFilter="Flash Sales" />} />
                                          <Route path="new-arrivals" element={<Catalog predefinedFilter="New Arrivals" />} />
                                          <Route path="best-sellers" element={<Catalog predefinedFilter="Best Sellers" />} />
                                          <Route path="best-shops" element={<BestShops />} />
                                          <Route path="music" element={<CategoryLanding type="music" />} />
                                          <Route path="apps" element={<CategoryLanding type="apps" />} />
                                          <Route path="app-store" element={<AppStore />} />
                                          <Route path="business" element={<CategoryLanding type="business" />} />
                                          <Route path="sell-business" element={<CategoryLanding type="business" />} />
                                          <Route path="gift-cards" element={<GiftCards />} />
                                          <Route path="zabely-plus" element={<ZabelyPlus />} />
                                          <Route path="loyalty" element={<LoyaltyProgram />} />
                                          <Route path="loyalty-dashboard" element={<LoyaltyDashboard />} />
                                          <Route path="customer-service" element={<CustomerService />} />
                                          <Route path="help" element={<CustomerService />} />
                                          <Route path="returns-replacements" element={<CustomerService />} />
                                          <Route path="analytics" element={<Analytics />} />
                                          <Route path="account" element={<Orders />} />
                                          <Route path="account/bookings" element={<MyBookings />} />
                                          <Route path="/zabely-logistics/join" element={<DriverOnboarding />} />
                                          <Route path="/zabely-logistics/dashboard" element={<DriverDashboard />} />
                                          <Route path="/orders" element={<Orders />} />
                                          <Route path="library" element={<MyLibrary />} />
                                          <Route path="favorites" element={<Favorites />} />
                                          <Route path="travel" element={<Travel />} />
                                          <Route path="shipping-policy" element={<ShippingPolicy />} />
                                          <Route path="tracking/:orderId" element={<TrackingPage />} />
                                          <Route path="services" element={<Services />} />
                                          <Route path="services/:id" element={<ServiceDetails />} />
                                          <Route path="salons" element={<SalonListing />} />
                                          <Route path="salons/:slug" element={<SalonProfile />} />
                                          <Route path="salons/:slug/book" element={<SalonBooking />} />
                                          <Route path="vendors" element={<VendorsPage />} />
                                          <Route path="vendor/:vendorId" element={<VendorShop />} />
                                          <Route path="offer/:offerId" element={<ProductDetails />} />
                                          <Route path="services/recharge-moncash" element={<RechargeMonCash />} />
                                          <Route path="services/recharge-natcash" element={<RechargeNatCash />} />
                                          <Route path="services/transfert-argent" element={<TransfertArgent />} />
                                          <Route path="services/paiement-edh" element={<PaiementEDH />} />
                                          <Route path="services/paiement-camep" element={<PaiementCAMEP />} />
                                          <Route path="cars" element={<CarsCatalog />} />
                                          <Route path="car/:id" element={<CarDetails />} />
                                          <Route path="utilities" element={<UtilitiesHub />} />
                                          <Route path="utilities/electricity" element={<ElectricityPayment />} />
                                          <Route path="utilities/mobile" element={<MobileRecharge />} />
                                          <Route path="pay" element={<PayHub />} />
                                          <Route path="pay/transfer" element={<Transfer />} />
                                          <Route path="pay/credit" element={<Credit />} />
                                          <Route path="learn" element={<LearnCatalog />} />
                                          <Route path="learn/course/:id" element={<CourseDetails />} />
                                          <Route path="learn/my-courses" element={<MyCourses />} />
                                          <Route path="real-estate" element={<RealEstateCatalog />} />
                                          <Route path="real-estate/:id" element={<RealEstateDetails />} />
                                          <Route path="about-us" element={<StaticPage title="À propos de Zabely" content="<p>Zabely est la plateforme e-commerce leader en Haïti...</p>" />} />
                                          <Route path="careers" element={<StaticPage title="Carrières" content="<p>Rejoignez notre équipe et aidez-nous à bâtir le futur du commerce haïtien.</p>" />} />
                                          <Route path="sustainability" element={<StaticPage title="Durabilité" content="<p>Nos engagements pour un environnement plus vert.</p>" />} />
                                          <Route path="sell-on-zabely" element={<StaticPage title="Vendre sur Zabely" content="<p>Ouvrez votre boutique en ligne dès aujourd'hui.</p>" />} />
                                          <Route path="ambassador" element={<AmbassadorLanding />} />
                                          <Route path="ambassador/join" element={<AmbassadorOnboarding />} />
                                          <Route path="ambassador/dashboard" element={<AmbassadorDashboard />} />
                                          <Route path="ambassador/resources" element={<AmbassadorResources />} />
                                          <Route path="wallet" element={<Wallet />} />
                                          <Route path="digital/product/:id" element={<DigitalProductPage />} />
                                          <Route path="digital/checkout/:id" element={<DigitalCheckoutPage />} />
                                          <Route path="digital/upsell" element={<DigitalUpsellPage />} />
                                          <Route path="digital/analytics" element={<DigitalAnalyticsDashboard />} />
                                        </Route>

                                        {/* Standalone Pages */}
                                        <Route path="upsell" element={<UpsellPage />} />
                                        <Route path="funnel-builder" element={<FunnelBuilder />} />
                                        <Route path="seller/welcome" element={<SellerLanding />} />
                                        <Route path="seller/onboarding" element={<SellerOnboarding />} />

                                        {/* Admin Routes */}
                                        <Route path="admin" element={<ProtectedRoute requiredRole="admin"><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
                                        <Route path="admin/products" element={<ProtectedRoute requiredRole="admin"><AdminLayout><AdminProducts /></AdminLayout></ProtectedRoute>} />
                                        <Route path="admin/orders" element={<ProtectedRoute requiredRole="admin"><AdminLayout><AdminOrders /></AdminLayout></ProtectedRoute>} />
                                        <Route path="admin/moderation" element={<ProtectedRoute requiredRole="admin"><AdminLayout><StoreModeration /></AdminLayout></ProtectedRoute>} />
                                        <Route path="admin/system-status" element={<ProtectedRoute requiredRole="admin"><AdminLayout><SystemStatus /></AdminLayout></ProtectedRoute>} />
                                        <Route path="admin/compliance" element={<ProtectedRoute requiredRole="admin"><AdminLayout><ComplianceDashboard /></AdminLayout></ProtectedRoute>} />
                                        <Route path="admin/users" element={<ProtectedRoute requiredRole="admin"><AdminLayout><AdminUsers /></AdminLayout></ProtectedRoute>} />
                                        <Route path="admin/settings" element={<ProtectedRoute requiredRole="admin"><AdminLayout><AdminSettings /></AdminLayout></ProtectedRoute>} />
                                        <Route path="admin/payouts" element={<ProtectedRoute requiredRole="admin"><AdminLayout><AdminPayouts /></AdminLayout></ProtectedRoute>} />
                                        <Route path="admin/subscription" element={<ProtectedRoute requiredRole="admin"><AdminLayout><AdminSubscription /></AdminLayout></ProtectedRoute>} />
                                        <Route path="admin/risk-monitoring" element={<ProtectedRoute requiredRole="admin"><AdminLayout><RiskMonitoring /></AdminLayout></ProtectedRoute>} />
                                        <Route path="admin/trust" element={<ProtectedRoute requiredRole="admin"><AdminLayout><TrustMonitoring /></AdminLayout></ProtectedRoute>} />

                                        {/* Seller Routes */}
                                        <Route path="seller/dashboard" element={<DashboardUltimate />} />
                                        <Route path="seller/dashboard-pro" element={<SellerDashboard />} />
                                        <Route path="seller/salon" element={<SalonSetup />} />
                                        <Route path="seller/salon/calendar" element={<SalonCalendar />} />
                                        <Route path="seller/salon/analytics" element={<SalonAnalytics />} />
                                        <Route path="seller/cars/new" element={<AddCar />} />
                                        <Route path="seller/products/new" element={<AddProduct />} />
                                        <Route path="seller/services/new" element={<AddService />} />
                                        <Route path="seller/real-estate/new" element={<AddRealEstate />} />
                                        <Route path="seller/smart-audit" element={<SmartAudit />} />
                                        <Route path="seller/verify" element={<KYCVerification />} />
                                        <Route path="seller/settings" element={<SellerSettings />} />
                                        <Route path="seller/analytics" element={<AdvancedAnalytics />} />
                                        <Route path="seller/pos" element={<POSTerminal />} />
                                        <Route path="seller/credit" element={<SellerCredit />} />
                                      </Route>
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

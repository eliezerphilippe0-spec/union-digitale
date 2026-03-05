import React, { Suspense, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, RouteProps } from 'react-router-dom';
import ErrorBoundary from '../components/common/ErrorBoundary';
import MainLayout from '../layouts/MainLayout';

// Critical path - loaded immediately (NOT lazy!)
const Home = React.lazy(() => import('../pages/Home'));

// Lazy loaded routes
const Services = React.lazy(() => import('../pages/Services'));
const ProductDetails = React.lazy(() => import('../pages/ProductDetails'));
const Cart = React.lazy(() => import('../pages/Cart'));
const Checkout = React.lazy(() => import('../pages/Checkout/OnePageCheckout'));
const UpsellPage = React.lazy(() => import('../pages/Checkout/UpsellPage'));
const OrderConfirmation = React.lazy(() => import('../pages/OrderConfirmation'));
const Catalog = React.lazy(() => import('../pages/Catalog'));
const Orders = React.lazy(() => import('../pages/Orders'));
const Login = React.lazy(() => import('../pages/Login'));
const Register = React.lazy(() => import('../pages/Register'));
const RegisterChoice = React.lazy(() => import('../pages/RegisterChoice'));
const BuyerRegister = React.lazy(() => import('../pages/BuyerRegister'));
const SellerRegister = React.lazy(() => import('../pages/SellerRegister'));
const SellerLanding = React.lazy(() => import('../pages/SellerLanding'));
const SellerOnboarding = React.lazy(() => import('../pages/SellerOnboarding'));
const ShippingPolicy = React.lazy(() => import('../pages/ShippingPolicy'));
const ComingSoon = React.lazy(() => import('../pages/ComingSoon'));
const PlaceholderPage = React.lazy(() => import('../pages/PlaceholderPage'));
const BestShops = React.lazy(() => import('../pages/BestShops'));
const PoliciesPage = React.lazy(() => import('../pages/legal/PoliciesPage'));
const AddCar = React.lazy(() => import('../pages/seller/AddCar'));
const KYCVerification = React.lazy(() => import('../pages/seller/KYCVerification'));
const CarDetails = React.lazy(() => import('../pages/CarDetails'));
const CarsCatalog = React.lazy(() => import('../pages/cars/CarsCatalog'));
const RealEstateCatalog = React.lazy(() => import('../pages/real-estate/RealEstateCatalog'));
const RealEstateDetails = React.lazy(() => import('../pages/real-estate/RealEstateDetails'));
const UtilitiesHub = React.lazy(() => import('../pages/utilities/UtilitiesHub'));
const ElectricityPayment = React.lazy(() => import('../pages/utilities/ElectricityPayment'));
const MobileRecharge = React.lazy(() => import('../pages/utilities/MobileRecharge'));
const PayHub = React.lazy(() => import('../pages/pay/PayHub'));
const Transfer = React.lazy(() => import('../pages/pay/Transfer'));
const Credit = React.lazy(() => import('../pages/pay/Credit'));
const LearnCatalog = React.lazy(() => import('../pages/learn/LearnCatalog'));
const CourseDetails = React.lazy(() => import('../pages/learn/CourseDetails'));
const MyCourses = React.lazy(() => import('../pages/learn/MyCourses'));
const VendorShop = React.lazy(() => import('../pages/VendorShop'));
const VendorsPage = React.lazy(() => import('../pages/VendorsPage'));
const TrackingPage = React.lazy(() => import('../pages/TrackingPage'));

/**
 * Performance optimization: Preload Checkout component
 * 
 * Amazon pattern: preload next likely page
 * When cart is non-empty and user is viewing product details,
 * we preload the checkout component to provide instant navigation
 */
export const preloadCheckout = async (): Promise<void> => {
  try {
    await import('../pages/Checkout/OnePageCheckout');
  } catch (error) {
    console.warn('Failed to preload checkout:', error);
  }
};

/**
 * Performance optimization: Preload ProductDetail component
 * 
 * Preload when user is browsing catalog or searches
 * for near-instant product detail page loads
 */
export const preloadProductDetail = async (): Promise<void> => {
  try {
    await import('../pages/ProductDetails');
  } catch (error) {
    console.warn('Failed to preload product details:', error);
  }
};

/**
 * Preload cart when user adds items
 */
export const preloadCart = async (): Promise<void> => {
  try {
    await import('../pages/Cart');
  } catch (error) {
    console.warn('Failed to preload cart:', error);
  }
};

interface SuspenseFallbackProps {
  children: ReactNode;
}

const SuspenseFallback: React.FC<SuspenseFallbackProps> = ({ children }) => (
  <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
    {children}
  </Suspense>
);

/**
 * AppRouter: Centralized routing configuration
 * 
 * All routes are lazy-loaded for code splitting and optimal bundle size.
 * Critical pages like Home are still imported early to avoid loading delays
 * on initial navigation.
 * 
 * Chunk strategy:
 * - Core: 45-60KB (react-core chunk)
 * - Pages: 50-150KB each (lazy loaded)
 * - Vendors: firebase, stripe, recharts, framer-motion in separate chunks
 */
export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <MainLayout>
          <Routes>
            {/* Home - preload early but still in Suspense */}
            <Route
              path="/"
              element={
                <SuspenseFallback>
                  <Home />
                </SuspenseFallback>
              }
            />

            {/* Catalog & Products */}
            <Route
              path="/services"
              element={
                <SuspenseFallback>
                  <Services />
                </SuspenseFallback>
              }
            />
            <Route
              path="/product/:id"
              element={
                <SuspenseFallback>
                  <ProductDetails />
                </SuspenseFallback>
              }
            />
            <Route
              path="/catalog"
              element={
                <SuspenseFallback>
                  <Catalog />
                </SuspenseFallback>
              }
            />

            {/* Cars */}
            <Route
              path="/cars"
              element={
                <SuspenseFallback>
                  <CarsCatalog />
                </SuspenseFallback>
              }
            />
            <Route
              path="/car/:id"
              element={
                <SuspenseFallback>
                  <CarDetails />
                </SuspenseFallback>
              }
            />

            {/* Real Estate */}
            <Route
              path="/real-estate"
              element={
                <SuspenseFallback>
                  <RealEstateCatalog />
                </SuspenseFallback>
              }
            />
            <Route
              path="/real-estate/:id"
              element={
                <SuspenseFallback>
                  <RealEstateDetails />
                </SuspenseFallback>
              }
            />

            {/* Cart & Checkout */}
            <Route
              path="/cart"
              element={
                <SuspenseFallback>
                  <Cart />
                </SuspenseFallback>
              }
            />
            <Route
              path="/checkout"
              element={
                <SuspenseFallback>
                  <Checkout />
                </SuspenseFallback>
              }
            />
            <Route
              path="/upsell"
              element={
                <SuspenseFallback>
                  <UpsellPage />
                </SuspenseFallback>
              }
            />
            <Route
              path="/order-confirmation/:orderId"
              element={
                <SuspenseFallback>
                  <OrderConfirmation />
                </SuspenseFallback>
              }
            />

            {/* Auth */}
            <Route
              path="/login"
              element={
                <SuspenseFallback>
                  <Login />
                </SuspenseFallback>
              }
            />
            <Route
              path="/register"
              element={
                <SuspenseFallback>
                  <Register />
                </SuspenseFallback>
              }
            />
            <Route
              path="/register-choice"
              element={
                <SuspenseFallback>
                  <RegisterChoice />
                </SuspenseFallback>
              }
            />
            <Route
              path="/buyer-register"
              element={
                <SuspenseFallback>
                  <BuyerRegister />
                </SuspenseFallback>
              }
            />
            <Route
              path="/seller-register"
              element={
                <SuspenseFallback>
                  <SellerRegister />
                </SuspenseFallback>
              }
            />

            {/* Seller */}
            <Route
              path="/seller-landing"
              element={
                <SuspenseFallback>
                  <SellerLanding />
                </SuspenseFallback>
              }
            />
            <Route
              path="/seller-onboarding"
              element={
                <SuspenseFallback>
                  <SellerOnboarding />
                </SuspenseFallback>
              }
            />
            <Route
              path="/add-car"
              element={
                <SuspenseFallback>
                  <AddCar />
                </SuspenseFallback>
              }
            />
            <Route
              path="/kyc-verification"
              element={
                <SuspenseFallback>
                  <KYCVerification />
                </SuspenseFallback>
              }
            />

            {/* Utilities & Pay */}
            <Route
              path="/utilities"
              element={
                <SuspenseFallback>
                  <UtilitiesHub />
                </SuspenseFallback>
              }
            />
            <Route
              path="/utilities/electricity"
              element={
                <SuspenseFallback>
                  <ElectricityPayment />
                </SuspenseFallback>
              }
            />
            <Route
              path="/utilities/mobile-recharge"
              element={
                <SuspenseFallback>
                  <MobileRecharge />
                </SuspenseFallback>
              }
            />
            <Route
              path="/pay"
              element={
                <SuspenseFallback>
                  <PayHub />
                </SuspenseFallback>
              }
            />
            <Route
              path="/pay/transfer"
              element={
                <SuspenseFallback>
                  <Transfer />
                </SuspenseFallback>
              }
            />
            <Route
              path="/pay/credit"
              element={
                <SuspenseFallback>
                  <Credit />
                </SuspenseFallback>
              }
            />

            {/* Learning */}
            <Route
              path="/learn"
              element={
                <SuspenseFallback>
                  <LearnCatalog />
                </SuspenseFallback>
              }
            />
            <Route
              path="/course/:id"
              element={
                <SuspenseFallback>
                  <CourseDetails />
                </SuspenseFallback>
              }
            />
            <Route
              path="/my-courses"
              element={
                <SuspenseFallback>
                  <MyCourses />
                </SuspenseFallback>
              }
            />

            {/* Vendors & Shops */}
            <Route
              path="/vendors"
              element={
                <SuspenseFallback>
                  <VendorsPage />
                </SuspenseFallback>
              }
            />
            <Route
              path="/vendor/:id"
              element={
                <SuspenseFallback>
                  <VendorShop />
                </SuspenseFallback>
              }
            />
            <Route
              path="/best-shops"
              element={
                <SuspenseFallback>
                  <BestShops />
                </SuspenseFallback>
              }
            />

            {/* Orders & Tracking */}
            <Route
              path="/orders"
              element={
                <SuspenseFallback>
                  <Orders />
                </SuspenseFallback>
              }
            />
            <Route
              path="/tracking/:trackingId"
              element={
                <SuspenseFallback>
                  <TrackingPage />
                </SuspenseFallback>
              }
            />

            {/* Legal & Info */}
            <Route
              path="/shipping-policy"
              element={
                <SuspenseFallback>
                  <ShippingPolicy />
                </SuspenseFallback>
              }
            />
            <Route
              path="/policies"
              element={
                <SuspenseFallback>
                  <PoliciesPage />
                </SuspenseFallback>
              }
            />

            {/* Placeholders */}
            <Route
              path="/coming-soon"
              element={
                <SuspenseFallback>
                  <ComingSoon />
                </SuspenseFallback>
              }
            />
            <Route
              path="/placeholder"
              element={
                <SuspenseFallback>
                  <PlaceholderPage />
                </SuspenseFallback>
              }
            />
          </Routes>
        </MainLayout>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default AppRouter;

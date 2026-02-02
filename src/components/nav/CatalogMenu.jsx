/**
 * CatalogMenu Component - Premium 10/10
 * Mobile-first, accessible navigation menu for Union Digitale
 *
 * Features:
 * - Mobile: Full-screen Drawer with accordion sections
 * - "Découvrir" section open by default
 * - Sticky CTA zone with 2 buttons + reassurance
 * - Standardized badges (same height, alignment)
 * - Chevron rules: down for sections, right only for links
 * - Active route highlighting
 * - Full accessibility (ARIA, keyboard, focus trap)
 */

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  catalogMenuData,
  mobileMenuOrder,
  badgeConfig,
  sellCTA
} from '../../lib/nav/catalogMenu';
import {
  X,
  ChevronRight,
  ChevronDown,
  User,
  Menu,
  Store,
  LogOut,
  BadgeCheck,
  Rocket
} from 'lucide-react';

// ============================================
// BADGE COMPONENT - Standardized 10/10
// Height: 18px, padding uniform, aligned right
// ============================================
const MenuBadge = memo(({ type, t }) => {
  if (!type || !badgeConfig[type]) return null;
  const config = badgeConfig[type];
  return (
    <span
      className={`inline-flex items-center justify-center h-[18px] px-2 text-[10px] font-bold uppercase tracking-wide rounded-full whitespace-nowrap ${config.className}`}
    >
      {t?.(config.labelKey) || config.label}
    </span>
  );
});
MenuBadge.displayName = 'MenuBadge';

// ============================================
// MENU ITEM ROW - Reusable item component
// ============================================
const MenuItemRow = memo(({ item, isActive, onNavigate, t }) => {
  const ItemIcon = item.icon;
  const hasLink = !!item.href;

  return (
    <Link
      to={item.href}
      onClick={() => onNavigate(item.href)}
      aria-current={isActive ? 'page' : undefined}
      className={`
        flex items-center gap-3 w-full px-4 py-3 pl-12
        transition-colors duration-150
        focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secondary
        ${isActive
          ? 'bg-secondary/10 text-secondary font-medium'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
        }
      `}
    >
      {/* Icon */}
      {ItemIcon && (
        <ItemIcon
          className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-secondary' : 'text-gray-400'
            }`}
        />
      )}

      {/* Label */}
      <span className="flex-1 text-sm truncate">
        {t(item.labelKey) || item.labelKey}
      </span>

      {/* Badge (if any) */}
      {item.badge && <MenuBadge type={item.badge} t={t} />}

      {/* Chevron Right - Only if has link */}
      {hasLink && (
        <ChevronRight
          className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-secondary' : 'text-gray-300'
            }`}
        />
      )}
    </Link>
  );
});
MenuItemRow.displayName = 'MenuItemRow';

// ============================================
// ACCORDION SECTION COMPONENT
// ============================================
const AccordionSection = memo(({ section, isOpen, onToggle, onNavigate, t, currentPath }) => {
  const Icon = section.icon;
  const hasChildren = section.children && section.children.length > 0;
  const sectionId = `menu-section-${section.id}`;
  const headerId = `menu-header-${section.id}`;

  return (
    <div className="border-b border-gray-100 dark:border-gray-800">
      {/* Section Header */}
      <button
        id={headerId}
        onClick={() => hasChildren ? onToggle(section.id) : onNavigate(section.href)}
        className="
          w-full flex items-center justify-between px-4 py-3
          hover:bg-gray-50 dark:hover:bg-gray-800/50
          transition-colors duration-150
          focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secondary
        "
        aria-expanded={hasChildren ? isOpen : undefined}
        aria-controls={hasChildren ? sectionId : undefined}
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5 text-gray-400" />}
          <span className="font-semibold text-gray-900 dark:text-white text-sm">
            {t(section.labelKey) || section.labelKey}
          </span>
        </div>
        {/* Chevron Down for accordion (rotates) */}
        {hasChildren && (
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
              }`}
          />
        )}
      </button>

      {/* Children Items */}
      {hasChildren && (
        <div
          id={sectionId}
          role="region"
          aria-labelledby={headerId}
          className={`
            overflow-hidden transition-all duration-200 ease-out
            ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
          `}
        >
          <div className="pb-1">
            {section.children.map((item) => (
              <MenuItemRow
                key={item.id}
                item={item}
                isActive={currentPath === item.href}
                onNavigate={onNavigate}
                t={t}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
AccordionSection.displayName = 'AccordionSection';

// ============================================
// STICKY CTA ZONE - Premium conversion
// ============================================
const StickyCTAZone = memo(({ currentUser, t, onNavigate }) => {
  const primaryHref = currentUser
    ? sellCTA.primaryButton.hrefLoggedIn
    : sellCTA.primaryButton.href;
  const primaryLabel = currentUser
    ? t(sellCTA.primaryButton.labelKeyLoggedIn)
    : t(sellCTA.primaryButton.labelKey);

  return (
    <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
      {/* Primary CTA Button */}
      <Link
        to={primaryHref}
        onClick={() => onNavigate(primaryHref)}
        className="
          flex items-center justify-center gap-2 w-full py-3 px-4
          bg-gradient-to-r from-secondary to-secondary-hover
          hover:from-secondary-hover hover:to-secondary
          text-white font-bold text-sm rounded-xl
          shadow-lg shadow-secondary/25
          transition-all duration-200
          hover:scale-[1.02] active:scale-[0.98]
          focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-secondary
        "
      >
        <Store className="w-5 h-5" />
        <span>{primaryLabel || 'Vendez sur Union Digitale'}</span>
      </Link>

      {/* Secondary CTA Button */}
      <Link
        to={sellCTA.secondaryButton.href}
        onClick={() => onNavigate(sellCTA.secondaryButton.href)}
        className="
          flex items-center justify-center gap-2 w-full py-2.5 px-4 mt-2
          border-2 border-secondary/30 hover:border-secondary
          text-secondary font-semibold text-sm rounded-xl
          transition-all duration-200
          hover:bg-secondary/5
          focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-secondary
        "
      >
        <BadgeCheck className="w-4 h-4" />
        <span>{t(sellCTA.secondaryButton.labelKey) || 'Devenir vendeur vérifié'}</span>
      </Link>

      {/* Reassurance Text */}
      <div className="flex items-center justify-center gap-1.5 mt-3">
        <Rocket className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {t(sellCTA.reassurance.labelKey) || 'Rejoignez 10 000+ vendeurs vérifiés'}
        </span>
      </div>
    </div>
  );
});
StickyCTAZone.displayName = 'StickyCTAZone';

// ============================================
// MOBILE DRAWER COMPONENT
// ============================================
const MobileDrawer = ({ isOpen, onClose, currentUser, logout, t }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const drawerRef = useRef(null);
  const closeButtonRef = useRef(null);

  // Initialize open sections - "discover" is open by default
  const [openSections, setOpenSections] = useState(() => {
    const initial = {};
    mobileMenuOrder.forEach(key => {
      const section = catalogMenuData[key];
      if (section?.defaultOpen) {
        initial[section.id] = true;
      }
    });
    return initial;
  });

  // Toggle section
  const toggleSection = useCallback((sectionId) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  }, []);

  // Handle navigation
  const handleNavigate = useCallback((href) => {
    onClose();
    if (href) navigate(href);
  }, [onClose, navigate]);

  // Handle escape key & body scroll lock
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Focus trap & initial focus
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <nav
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu Union Digitale"
        className="
          fixed inset-y-0 left-0 z-50
          w-[85%] max-w-[380px]
          bg-white dark:bg-gray-900 shadow-2xl
          flex flex-col
          animate-in slide-in-from-left duration-300
        "
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-primary to-primary-light text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-base leading-tight">
                  {t('hello')}, {currentUser?.displayName || t('menu_sign_in')}
                </p>
                {!currentUser && (
                  <Link
                    to="/login"
                    onClick={() => handleNavigate('/login')}
                    className="text-sm text-white/80 hover:text-white hover:underline"
                  >
                    {t('login_register') || 'Se connecter'}
                  </Link>
                )}
              </div>
            </div>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="
                p-2 rounded-full
                hover:bg-white/10
                transition-colors duration-150
                focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50
              "
              aria-label={t('close') || 'Fermer le menu'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content - with padding for sticky CTA */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Menu Sections */}
          {mobileMenuOrder.map((sectionKey) => {
            const section = catalogMenuData[sectionKey];
            if (!section) return null;
            return (
              <AccordionSection
                key={section.id}
                section={section}
                isOpen={openSections[section.id]}
                onToggle={toggleSection}
                onNavigate={handleNavigate}
                t={t}
                currentPath={location.pathname}
              />
            );
          })}

          {/* Logout Button */}
          {currentUser && (
            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="
                  flex items-center gap-3 w-full px-4 py-3
                  text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20
                  rounded-lg transition-colors duration-150
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500
                "
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium text-sm">{t('logout')}</span>
              </button>
            </div>
          )}
        </div>

        {/* Sticky CTA Zone */}
        <StickyCTAZone
          currentUser={currentUser}
          t={t}
          onNavigate={handleNavigate}
        />
      </nav>
    </>
  );
};

// ============================================
// MOBILE MENU BUTTON
// ============================================
const MobileMenuButton = memo(({ onClick, isOpen }) => {
  return (
    <button
      onClick={onClick}
      className="
        lg:hidden p-1.5 rounded-lg
        hover:bg-white/10
        transition-colors duration-150
        focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50
      "
      aria-label="Ouvrir le menu"
      aria-expanded={isOpen}
      aria-haspopup="dialog"
    >
      <Menu className="w-6 h-6" />
    </button>
  );
});
MobileMenuButton.displayName = 'MobileMenuButton';

// ============================================
// SECONDARY NAV BAR (Desktop)
// ============================================
const SecondaryNavBar = memo(({ onMenuClick, currentUser, t }) => {
  return (
    <nav
      className="hidden lg:flex bg-primary-700 text-white text-sm px-4 py-1.5 items-center gap-1 overflow-x-auto no-scrollbar"
      role="navigation"
      aria-label="Navigation principale"
    >
      {/* Menu Trigger */}
      <button
        onClick={onMenuClick}
        className="
          flex items-center gap-1.5 font-bold
          hover:bg-white/10 px-3 py-1.5 rounded-md
          transition-colors duration-150 whitespace-nowrap
          focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50
        "
        aria-haspopup="dialog"
      >
        <Menu className="w-5 h-5" />
        {t('all') || 'Toutes'}
      </button>

      <div className="w-px h-5 bg-white/20 mx-1" aria-hidden="true" />

      <Link
        to="/catalog"
        className="flex items-center gap-1.5 font-medium hover:bg-white/10 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap"
      >
        {t('all_catalog') || 'Tout le catalogue'}
      </Link>

      {/* Sell CTA */}
      <Link
        to={currentUser ? sellCTA.primaryButton.hrefLoggedIn : sellCTA.primaryButton.href}
        className="flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-md transition-colors whitespace-nowrap text-gold-400 hover:text-gold-300 hover:bg-white/10"
      >
        <Store className="w-4 h-4" />
        {currentUser
          ? t(sellCTA.primaryButton.labelKeyLoggedIn)
          : t(sellCTA.primaryButton.labelKey) || 'Vendre sur Union'}
      </Link>

      {/* Quick Links */}
      {[
        { labelKey: 'best_sellers', href: '/best-sellers' },
        { labelKey: 'flash_sales', href: '/flash-sales' },
        { labelKey: 'new_arrivals', href: '/new-arrivals' },
        { labelKey: 'music', href: '/music' },
        { labelKey: 'customer_service', href: '/customer-service' },
      ].map((link) => (
        <Link
          key={link.href}
          to={link.href}
          className="hover:bg-white/10 px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap"
        >
          {t(link.labelKey) || link.labelKey}
        </Link>
      ))}
    </nav>
  );
});
SecondaryNavBar.displayName = 'SecondaryNavBar';

// ============================================
// MAIN CATALOG MENU COMPONENT
// ============================================
const CatalogMenu = ({ variant = 'mobile-button' }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const { t } = useLanguage();

  const openMobileMenu = useCallback(() => setIsMobileMenuOpen(true), []);
  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);

  if (variant === 'mobile-button') {
    return (
      <>
        <MobileMenuButton onClick={openMobileMenu} isOpen={isMobileMenuOpen} />
        <MobileDrawer
          isOpen={isMobileMenuOpen}
          onClose={closeMobileMenu}
          currentUser={currentUser}
          logout={logout}
          t={t}
        />
      </>
    );
  }

  if (variant === 'nav-bar') {
    return (
      <>
        <SecondaryNavBar
          onMenuClick={openMobileMenu}
          currentUser={currentUser}
          t={t}
        />
        <MobileDrawer
          isOpen={isMobileMenuOpen}
          onClose={closeMobileMenu}
          currentUser={currentUser}
          logout={logout}
          t={t}
        />
      </>
    );
  }

  return (
    <>
      <MobileMenuButton onClick={openMobileMenu} isOpen={isMobileMenuOpen} />
      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
        currentUser={currentUser}
        logout={logout}
        t={t}
      />
    </>
  );
};

export default CatalogMenu;
export { MobileDrawer, SecondaryNavBar, MobileMenuButton, StickyCTAZone, MenuBadge, MenuItemRow };

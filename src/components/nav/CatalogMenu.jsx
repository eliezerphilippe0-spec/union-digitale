/**
 * CatalogMenu Component - Premium 10/10
 * Mobile-first, accessible navigation menu for Union Digitale
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
  Rocket,
  Zap
} from 'lucide-react';

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

const MenuItemRow = memo(({ item, isActive, onNavigate, t }) => {
  const ItemIcon = item.icon;
  const hasLink = !!item.href;

  return (
    <Link
      to={item.href}
      onClick={() => onNavigate(item.href)}
      className={`flex items-center gap-3 w-full px-4 py-3 pl-12 transition-colors duration-150 ${isActive ? 'bg-secondary/10 text-secondary font-medium' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
    >
      {ItemIcon && <ItemIcon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-secondary' : 'text-gray-400'}`} />}
      <span className="flex-1 text-sm truncate">{t(item.labelKey) || item.labelKey}</span>
      {item.badge && <MenuBadge type={item.badge} t={t} />}
      {hasLink && <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-secondary' : 'text-gray-300'}`} />}
    </Link>
  );
});

const AccordionSection = memo(({ section, isOpen, onToggle, onNavigate, t, currentPath }) => {
  const Icon = section.icon;
  const hasChildren = section.children && section.children.length > 0;

  return (
    <div className="border-b border-gray-100 dark:border-gray-800">
      <button
        onClick={() => hasChildren ? onToggle(section.id) : onNavigate(section.href)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5 text-gray-400" />}
          <span className="font-semibold text-gray-900 dark:text-white text-sm">{t(section.labelKey) || section.labelKey}</span>
        </div>
        {hasChildren && <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />}
      </button>

      {hasChildren && (
        <div className={`overflow-hidden transition-all duration-200 ease-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="pb-1">
            {section.children.map((item) => (
              <MenuItemRow key={item.id} item={item} isActive={currentPath === item.href} onNavigate={onNavigate} t={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

const StickyCTAZone = memo(({ currentUser, t, onNavigate }) => {
  const primaryHref = currentUser ? sellCTA.primaryButton.hrefLoggedIn : sellCTA.primaryButton.href;
  const primaryLabel = currentUser ? t(sellCTA.primaryButton.labelKeyLoggedIn) : t(sellCTA.primaryButton.labelKey);

  return (
    <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
      <Link
        to={primaryHref}
        onClick={() => onNavigate(primaryHref)}
        className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gradient-to-r from-secondary to-secondary-hover text-white font-bold text-sm rounded-xl shadow-lg shadow-secondary/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
      >
        <Store className="w-5 h-5" />
        <span>{primaryLabel || 'Vendez sur Union Digitale'}</span>
      </Link>
      <Link
        to={sellCTA.secondaryButton.href}
        onClick={() => onNavigate(sellCTA.secondaryButton.href)}
        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 mt-2 border-2 border-secondary/30 hover:border-secondary text-secondary font-semibold text-sm rounded-xl transition-all hover:bg-secondary/5"
      >
        <BadgeCheck className="w-4 h-4" />
        <span>{t(sellCTA.secondaryButton.labelKey) || 'Devenir vendeur vérifié'}</span>
      </Link>
      <div className="flex items-center justify-center gap-1.5 mt-3">
        <Rocket className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-xs text-gray-500 dark:text-gray-400">{t(sellCTA.reassurance.labelKey) || 'Rejoignez 10 000+ vendeurs vérifiés'}</span>
      </div>
    </div>
  );
});

const MobileDrawer = ({ isOpen, onClose, currentUser, logout, t }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState(() => {
    const initial = {};
    mobileMenuOrder.forEach(key => {
      const section = catalogMenuData[key];
      if (section?.defaultOpen) initial[section.id] = true;
    });
    return initial;
  });

  const toggleSection = useCallback((sectionId) => {
    setOpenSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  }, []);

  const handleNavigate = useCallback((href) => {
    onClose();
    if (href) navigate(href);
  }, [onClose, navigate]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
      <nav className="fixed inset-y-0 left-0 z-50 w-[85%] max-w-[380px] bg-white dark:bg-gray-900 shadow-2xl flex flex-col">
        <div className="flex-shrink-0 bg-gradient-to-r from-primary to-primary-light text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"><User className="w-5 h-5" /></div>
              <div>
                <p className="font-bold text-base leading-tight">{t('hello')}, {currentUser?.displayName || t('menu_sign_in')}</p>
                {!currentUser && <Link to="/login" onClick={() => handleNavigate('/login')} className="text-sm text-white/80 hover:text-white underline">{t('login_register') || 'Se connecter'}</Link>}
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
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

          {currentUser && (
            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
              <button onClick={() => { logout(); onClose(); }} className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <LogOut className="w-5 h-5" />
                <span className="font-medium text-sm">{t('logout')}</span>
              </button>
            </div>
          )}
        </div>

        <StickyCTAZone currentUser={currentUser} t={t} onNavigate={handleNavigate} />
      </nav>
    </>
  );
};

const MobileMenuButton = memo(({ onClick, isOpen }) => (
  <button onClick={onClick} className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 transition-colors">
    <Menu className="w-6 h-6" />
  </button>
));

const SecondaryNavBar = memo(({ onMenuClick, currentUser, t }) => (
  <nav className="hidden lg:flex bg-primary-700 text-white text-sm px-4 py-1.5 items-center gap-1 overflow-x-auto no-scrollbar">
    <button onClick={onMenuClick} className="flex items-center gap-1.5 font-bold hover:bg-white/10 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap">
      <Menu className="w-5 h-5" />
      {t('all') || 'Toutes'}
    </button>
    <div className="w-px h-5 bg-white/20 mx-1" />
    <Link to="/catalog" className="hover:bg-white/10 px-3 py-1.5 rounded-md">Tout le catalogue</Link>
    <Link to="/digital-store" className="flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-md text-secondary bg-indigo-50/10"><Rocket className="w-4 h-4" />UD Digital</Link>
    <Link to="/pay-bills" className="flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-md text-yellow-400 bg-yellow-400/10"><Zap className="w-4 h-4" />Peye Bil</Link>

    <Link to={currentUser ? sellCTA.primaryButton.hrefLoggedIn : sellCTA.primaryButton.href} className="flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-md text-gold-400 hover:bg-white/10">
      <Store className="w-4 h-4" />{currentUser ? t(sellCTA.primaryButton.labelKeyLoggedIn) : t(sellCTA.primaryButton.labelKey)}
    </Link>

    {[{ labelKey: 'best_sellers', href: '/best-sellers' }, { labelKey: 'flash_sales', href: '/flash-sales' }].map(link => (
      <Link key={link.href} to={link.href} className="hover:bg-white/10 px-2.5 py-1.5 rounded-md">{t(link.labelKey) || link.labelKey}</Link>
    ))}
  </nav>
));

const CatalogMenu = ({ variant = 'mobile-button' }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const { t } = useLanguage();

  const openMobileMenu = useCallback(() => setIsMobileMenuOpen(true), []);
  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);

  return (
    <>
      {variant === 'nav-bar' ? (
        <SecondaryNavBar onMenuClick={openMobileMenu} currentUser={currentUser} t={t} />
      ) : (
        <MobileMenuButton onClick={openMobileMenu} isOpen={isMobileMenuOpen} />
      )}
      <MobileDrawer isOpen={isMobileMenuOpen} onClose={closeMobileMenu} currentUser={currentUser} logout={logout} t={t} />
    </>
  );
};

export default CatalogMenu;

import React from 'react';
import { NavLink } from 'react-router-dom';
import '../styles/MobileNav.css';

/**
 * MobileNav Component
 * 
 * Bottom navigation bar for mobile devices with 5 main tabs:
 * - Home (Dakèy) - Creole for "home"
 * - Search (Chèche) - Creole for "search"
 * - Cart (Panye) - Creole for "cart"
 * - Favorites (Favori) - Creole for "favorites"
 * - Account (Kont) - Creole for "account"
 * 
 * Features:
 * - Fixed bottom positioning for mobile
 * - Spring animation on active state
 * - Cart badge count display
 * - Responsive design
 * - Touch-optimized tap targets
 */

interface MobileNavProps {
  cartCount?: number;
  className?: string;
}

const MobileNav: React.FC<MobileNavProps> = ({ cartCount = 0, className = '' }) => {
  const navItems = [
    {
      id: 'home',
      label: 'Dakèy',
      icon: '🏠',
      path: '/',
      ariaLabel: 'Go to home page',
    },
    {
      id: 'search',
      label: 'Chèche',
      icon: '🔍',
      path: '/search',
      ariaLabel: 'Search for products',
    },
    {
      id: 'cart',
      label: 'Panye',
      icon: '🛒',
      path: '/cart',
      ariaLabel: `Shopping cart with ${cartCount} items`,
      badge: cartCount > 0 ? cartCount : null,
    },
    {
      id: 'favorites',
      label: 'Favori',
      icon: '❤️',
      path: '/favorites',
      ariaLabel: 'View favorite items',
    },
    {
      id: 'account',
      label: 'Kont',
      icon: '👤',
      path: '/account',
      ariaLabel: 'Go to account settings',
    },
  ];

  return (
    <nav
      className={`mobile-nav ${className}`}
      role="navigation"
      aria-label="Mobile main navigation"
    >
      <div className="mobile-nav__container">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) =>
              `mobile-nav__item ${isActive ? 'mobile-nav__item--active' : ''}`
            }
            aria-label={item.ariaLabel}
            aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
          >
            <div className="mobile-nav__icon-wrapper">
              <span className="mobile-nav__icon" aria-hidden="true">
                {item.icon}
              </span>
              {item.badge !== null && (
                <span className="mobile-nav__badge" aria-label={`${item.badge} item${item.badge !== 1 ? 's' : ''}`}>
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </div>
            <span className="mobile-nav__label">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;

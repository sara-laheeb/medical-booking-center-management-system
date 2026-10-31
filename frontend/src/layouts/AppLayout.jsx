import { useState, useEffect, useRef, useMemo } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import ThemeToggle from '../components/ThemeToggle';
import LanguageToggle from '../components/LanguageToggle';
import BrandLogo from '../components/BrandLogo';
import notificationService from '../services/notificationService';
import {
  CalendarIcon,
  UsersIcon,
  StethoscopeIcon,
  InvoiceIcon,
  ChartIcon,
  ShieldIcon,
  MedicalCrossIcon,
  MenuIcon,
  CloseIcon,
  SearchIcon,
  LogoutIcon,
  ChevronLeftIcon,
  PillIcon,
  BellIcon,
  PlusIcon,
} from '../components/icons';

export default function AppLayout() {
  const { user, role, logout } = useAuth();
  const { t, lang } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const isAr = lang === 'ar';

  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Poll for unread notifications count
  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const fetchUnread = () => {
      notificationService
        .getAll({ unread: true, limit: 1 })
        .then((res) => {
          if (isMounted && res?.meta?.unread_count !== undefined) {
            setUnreadNotifications(res.meta.unread_count);
          }
        })
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user, location.pathname]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);

  const searchInputRef = useRef(null);
  const searchWrapperRef = useRef(null);
  const navScrollRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Build navigation items filtered by role and medical discipline
  const navSections = useMemo(() => {
    // Dedicated, warm, modern navigation for registered patients
    if (role === 'patient') {
      return [
        {
          key: 'patient-portal',
          label: isAr ? 'بوابة صحة المريض' : 'Patient Health Portal',
          items: [
            {
              key: 'dashboard',
              label: t.appNav?.dashboard || (isAr ? 'لوحة التحكم' : 'Dashboard'),
              to: '/app',
              end: true,
              icon: <ChartIcon width={17} height={17} />,
              roles: ['patient'],
            },
            {
              key: 'book-appointment',
              label: isAr ? 'حجز موعد' : 'Book Appointment',
              to: '/app/book-appointment',
              icon: <PlusIcon width={17} height={17} />,
              roles: ['patient'],
            },
            {
              key: 'my-appointments',
              label: isAr ? 'مواعيدي' : 'My Appointments',
              to: '/app/my-appointments',
              icon: <CalendarIcon width={17} height={17} />,
              roles: ['patient'],
            },
            {
              key: 'my-records',
              label: isAr ? 'سجلاتي الطبية والنتائج' : 'My Medical Records & Results',
              to: '/app/my-records',
              icon: <ShieldIcon width={17} height={17} />,
              roles: ['patient'],
            },
            {
              key: 'my-prescriptions',
              label: isAr ? 'وصفاتي الطبية' : 'My Prescriptions',
              to: '/app/my-prescriptions',
              icon: <PillIcon width={17} height={17} />,
              roles: ['patient'],
            },
            {
              key: 'notifications',
              label: isAr ? 'الإشعارات' : 'Notifications',
              to: '/app/notifications',
              icon: <BellIcon width={17} height={17} />,
              badge: unreadNotifications > 0 ? unreadNotifications : null,
              roles: ['patient'],
            },
            {
              key: 'profile',
              label: isAr ? 'الملف الشخصي والإعدادات' : 'Profile & Settings',
              to: '/app/profile',
              icon: <UsersIcon width={17} height={17} />,
              roles: ['patient'],
            },
          ],
        },
      ];
    }

    // Detect clinician specialty
    const userSpecialty = (user?.doctor?.specialty_name || '').toLowerCase();
    const isRadiologyDoctor =
      role === 'doctor' &&
      (userSpecialty.includes('radiology') ||
        userSpecialty.includes('ultrasound') ||
        userSpecialty.includes('أشعة') ||
        userSpecialty.includes('سونار'));
    const isLabDoctor =
      role === 'doctor' &&
      (userSpecialty.includes('laboratory') ||
        userSpecialty.includes('مختبر') ||
        userSpecialty.includes('lab'));
    const isDiagnosticDoctor = isRadiologyDoctor || isLabDoctor;
    const isPrescribingDoctor = role === 'doctor' && !isDiagnosticDoctor;

    // Tailored label for appointments based on specialty
    let appointmentsLabel = t.appNav?.appointments || (isAr ? 'المواعيد' : 'Appointments');
    if (isRadiologyDoctor) {
      appointmentsLabel = isAr ? 'مواعيد وطلبات الأشعة' : 'Imaging Requests';
    } else if (isLabDoctor) {
      appointmentsLabel = isAr ? 'مواعيد وطلبات التحاليل' : 'Laboratory Requests';
    }

    // Tailored label for medical records based on specialty
    let recordsLabel = t.appNav?.records || (isAr ? 'السجلات الطبية' : 'Medical Records');
    if (isRadiologyDoctor) {
      recordsLabel = isAr ? 'تقارير وسجلات الأشعة' : 'Radiology Reports';
    } else if (isLabDoctor) {
      recordsLabel = isAr ? 'نتائج وسجلات التحاليل' : 'Laboratory Results';
    }

    // Dynamic section title for specialized clinical wings
    let groupManagementLabel = t.appNav?.grpManagement || (isAr ? 'العمليات السريرية' : 'Clinical Operations');
    if (isRadiologyDoctor) {
      groupManagementLabel = isAr ? 'جناح الأشعة والسونار' : 'Radiology Workspace';
    } else if (isLabDoctor) {
      groupManagementLabel = isAr ? 'المختبر الطبي والتشخيص' : 'Laboratory Workspace';
    }

    return [
      {
        key: 'management',
        label: groupManagementLabel,
        items: [
          {
            key: 'dashboard',
            label: t.appNav?.dashboard || (isAr ? 'لوحة التحكم' : 'Dashboard'),
            to: '/app',
            end: true,
            icon: <ChartIcon width={17} height={17} />,
            roles: ['admin', 'doctor', 'receptionist', 'pharmacist', 'patient'],
          },
          {
            key: 'appointments',
            label: appointmentsLabel,
            to: '/app/appointments',
            icon: <CalendarIcon width={17} height={17} />,
            roles: ['admin', 'doctor', 'receptionist', 'patient'],
          },
          {
            key: 'patients',
            label: t.appNav?.patients || (isAr ? 'المرضى' : 'Patients'),
            to: '/app/patients',
            icon: <UsersIcon width={17} height={17} />,
            roles: ['admin', 'doctor', 'receptionist'],
          },
          {
            key: 'doctors',
            label: t.appNav?.doctors || (isAr ? 'الأطباء' : 'Doctors'),
            to: '/app/doctors',
            icon: <StethoscopeIcon width={17} height={17} />,
            roles: ['admin', 'receptionist'],
          },
          {
            key: 'records',
            label: recordsLabel,
            to: '/app/records',
            icon: <ShieldIcon width={17} height={17} />,
            roles: ['admin', 'doctor', 'patient'],
          },
          // Prescriptions: Visible ONLY to Prescribing Clinical Doctors (Dental, Ophthalmology, Orthopedics) and Admin.
          // Completely removed from Radiology & Ultrasound and Medical Laboratory doctors!
          // Completely removed from Receptionist, Pharmacist, Patient.
          ...(isPrescribingDoctor || role === 'admin'
            ? [
                {
                  key: 'prescriptions',
                  label: t.appNav?.prescriptions || (isAr ? 'الوصفات الطبية' : 'Prescriptions'),
                  to: '/app/prescriptions',
                  icon: <PillIcon width={17} height={17} />,
                  roles: ['admin', 'doctor'],
                },
              ]
            : []),
          {
            key: 'overview',
            label: t.appNav?.overview || (isAr ? 'نظرة عامة على النظام' : 'System Overview'),
            to: '/app/overview',
            icon: <ChartIcon width={17} height={17} />,
            roles: ['admin'],
          },
        ],
      },
      {
        key: 'finance',
        label: t.appNav?.grpFinance || (isAr ? 'الصيدلية والفوترة' : 'Pharmacy & Billing'),
        items: [
          // Pharmacy: Visible ONLY to Pharmacist and Admin.
          // Completely HIDDEN from ALL doctors (Dentistry, Ophthalmology, Orthopedics, Radiology, Lab)!
          // Completely HIDDEN from Receptionist, Patient.
          {
            key: 'pharmacy',
            label: t.appNav?.pharmacy || (isAr ? 'الصيدلية والمخزون' : 'Pharmacy & Inventory'),
            to: '/app/pharmacy',
            icon: <MedicalCrossIcon width={17} height={17} stroke="currentColor" />,
            roles: ['admin', 'pharmacist'],
          },
          {
            key: 'billing',
            label: t.appNav?.invoices || (isAr ? 'الفواتير والمالية' : 'Invoices & Billing'),
            to: '/app/billing',
            icon: <InvoiceIcon width={17} height={17} />,
            roles: ['admin', 'receptionist', 'accountant'],
          },
        ],
      },
    ];
  }, [t, isAr, role, user, unreadNotifications]);

  // Flattened visible items for search filtering
  const allNavItems = useMemo(() => {
    const list = [];
    navSections.forEach((sec) => {
      sec.items.forEach((item) => {
        if (!item.roles || item.roles.includes(role || 'patient')) {
          list.push({
            ...item,
            groupLabel: sec.label,
          });
        }
      });
    });
    return list;
  }, [navSections, role]);

  // Matching items based on search query in the current language
  const matchingItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return allNavItems.filter((item) => {
      const matchTitle = item.label.toLowerCase().includes(q);
      const matchGroup = item.groupLabel?.toLowerCase().includes(q);
      return matchTitle || matchGroup;
    });
  }, [allNavItems, searchQuery]);

  // Keep active search index in range
  useEffect(() => {
    setActiveSearchIndex(0);
  }, [matchingItems]);

  // Global keyboard shortcuts (Cmd+K / Ctrl+K) and outside click handling
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (collapsed) setCollapsed(false);
        searchInputRef.current?.focus();
        if (searchQuery.trim()) {
          setIsSearchOpen(true);
        }
      }
    };

    const handleClickOutside = (e) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [collapsed, searchQuery]);

  // Keyboard navigation within the search input
  const handleSearchKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      if (matchingItems.length > 0) {
        e.preventDefault();
        setActiveSearchIndex((prev) => (prev + 1) % matchingItems.length);
      }
    } else if (e.key === 'ArrowUp') {
      if (matchingItems.length > 0) {
        e.preventDefault();
        setActiveSearchIndex((prev) => (prev - 1 + matchingItems.length) % matchingItems.length);
      }
    } else if (e.key === 'Enter') {
      if (matchingItems.length > 0 && activeSearchIndex >= 0 && activeSearchIndex < matchingItems.length) {
        e.preventDefault();
        const target = matchingItems[activeSearchIndex];
        navigate(target.to);
        setIsSearchOpen(false);
        setSearchQuery('');
        searchInputRef.current?.blur();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsSearchOpen(false);
      searchInputRef.current?.blur();
    }
  };

  // Keyboard navigation through sidebar menu items (independent of page scroll)
  const handleNavKeyDown = (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;

    // Prevent default so the whole window doesn't scroll!
    e.preventDefault();

    const container = navScrollRef.current;
    if (!container) return;

    const links = Array.from(container.querySelectorAll('a.nav-item-link'));
    if (links.length === 0) return;

    const currentIndex = links.indexOf(document.activeElement);
    let nextIndex = 0;

    if (e.key === 'ArrowDown') {
      nextIndex = currentIndex >= 0 && currentIndex < links.length - 1 ? currentIndex + 1 : 0;
    } else if (e.key === 'ArrowUp') {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : links.length - 1;
    }

    const target = links[nextIndex];
    if (target) {
      target.focus();
      // Scroll focused menu item into view inside the sidebar without scrolling the whole page
      target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  };

  // Derive current section name for breadcrumb
  const currentPath = location.pathname;
  let activeSectionName = t.appNav?.dashboard || 'Dashboard';
  for (const group of navSections) {
    for (const item of group.items) {
      if (item.end ? currentPath === item.to : currentPath.startsWith(item.to)) {
        activeSectionName = item.label;
      }
    }
  }

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'MD';

  // Standardized role display label
  const roleLabel =
    role && t.auth?.[`role${role.charAt(0).toUpperCase() + role.slice(1)}`]
      ? t.auth[`role${role.charAt(0).toUpperCase() + role.slice(1)}`]
      : role || 'Staff';

  // Specialty-specific clinician badge if user is an authenticated doctor
  const doctorSpecialtyLabel =
    user?.doctor
      ? (isAr ? user.doctor.specialty_name_ar : user.doctor.specialty_name)
      : null;

  return (
    <div className="shell">
      {/* Desktop Sidenav */}
      <aside className={`sidenav ${collapsed ? 'collapsed' : ''}`}>
        {/* Brand Header */}
        <div className="brand">
          <Link
            to="/app"
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', minWidth: 0, textDecoration: 'none' }}
          >
            {collapsed ? (
              <div className="brand-mark" title={t.brandName}>
                <BrandLogo variant="icon" size={24} />
              </div>
            ) : (
              <BrandLogo variant="full" size={30} showSubtitle />
            )}
          </Link>

          <button
            type="button"
            className="collapse-btn"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? (t.appNav?.expand || 'Expand sidebar') : (t.appNav?.collapse || 'Collapse sidebar')}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeftIcon
              width={16}
              height={16}
              style={{
                transform: collapsed ? 'rotate(180deg)' : 'none',
                transition: 'transform var(--dur) var(--ease)',
              }}
            />
          </button>
        </div>

        {/* Workspace Branch Indicator */}
        {!collapsed && (
          <div className="workspace-tag">
            {t.appNav?.branchTag || 'Baghdad · Main Branch'}
          </div>
        )}

        {/* Functional Search Bar with Suggestions */}
        {!collapsed && (
          <div className="search-wrapper" ref={searchWrapperRef}>
            <div className="search-bar">
              <SearchIcon width={15} height={15} />
              <input
                ref={searchInputRef}
                type="text"
                className="search-input"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => {
                  if (searchQuery.trim()) setIsSearchOpen(true);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder={t.appNav?.searchPlaceholder || 'Search patients, records...'}
                aria-label={t.appNav?.searchPlaceholder || 'Search sidebar pages'}
                aria-expanded={isSearchOpen}
                aria-autocomplete="list"
              />
              {searchQuery ? (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchOpen(false);
                    searchInputRef.current?.focus();
                  }}
                  aria-label={isAr ? 'مسح البحث' : 'Clear search'}
                  title={isAr ? 'مسح البحث' : 'Clear search'}
                >
                  ✕
                </button>
              ) : (
                <kbd>⌘K</kbd>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {isSearchOpen && searchQuery.trim() && (
              <div className="search-dropdown" role="listbox">
                {matchingItems.length > 0 ? (
                  matchingItems.map((item, idx) => (
                    <button
                      key={item.key}
                      type="button"
                      role="option"
                      aria-selected={idx === activeSearchIndex}
                      className={`search-item ${idx === activeSearchIndex ? 'selected' : ''}`}
                      onClick={() => {
                        navigate(item.to);
                        setIsSearchOpen(false);
                        setSearchQuery('');
                        searchInputRef.current?.blur();
                      }}
                      onMouseEnter={() => setActiveSearchIndex(idx)}
                    >
                      <span style={{ display: 'inline-flex', flexShrink: 0 }}>
                        {item.icon}
                      </span>
                      <div className="search-item-info">
                        <span className="search-item-title">{item.label}</span>
                        <span className="search-item-group">{item.groupLabel}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="search-empty">
                    {isAr ? 'لا توجد صفحات مطابقة للبحث' : 'No matching pages found'}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Grouped Navigation Scroll Area (Scrolls independently) */}
        <div
          className="nav-scroll"
          ref={navScrollRef}
          onKeyDown={handleNavKeyDown}
        >
          {navSections.map((sec) => {
            const filteredItems = sec.items.filter((item) =>
              item.roles ? item.roles.includes(role || 'patient') : true
            );
            if (filteredItems.length === 0) return null;

            return (
              <div key={sec.key} className="nav-group">
                {!collapsed && <div className="nav-group-label">{sec.label}</div>}
                <nav>
                  {filteredItems.map((item) => (
                    <NavLink
                      key={item.key}
                      to={item.to}
                      end={item.end}
                      title={collapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        ['nav-item-link', isActive ? 'active-link' : ''].filter(Boolean).join(' ')
                      }
                    >
                      {item.icon}
                      {!collapsed && <span className="sidenav-text">{item.label}</span>}
                      {!collapsed && item.badge ? (
                        <span style={{ marginInlineStart: 'auto', fontSize: 10, fontWeight: 800, padding: '2px 6px', background: 'var(--brand)', color: '#fff', borderRadius: 'var(--r-full)', lineHeight: 1 }}>
                          {item.badge}
                        </span>
                      ) : null}
                    </NavLink>
                  ))}
                </nav>
              </div>
            );
          })}
        </div>

        {/* Sidenav Footer: User Profile & Logout */}
        <div className="sidenav-footer">
          <div className="user-avatar" title={user?.name}>
            {userInitials}
          </div>
          {!collapsed && (
            <div className="user-meta">
              <div className="user-name" title={user?.name}>
                {user?.name || 'Staff User'}
              </div>
              {/* Display clinician's specialty or standardized role */}
              <div className="user-role">{doctorSpecialtyLabel || roleLabel}</div>
            </div>
          )}
          <button
            type="button"
            className="icon-btn"
            onClick={handleLogout}
            title={t.appNav?.logout || 'Sign out'}
            aria-label={t.appNav?.logout || 'Sign out'}
            style={{
              transition: 'all var(--dur) var(--ease)',
            }}
          >
            <LogoutIcon width={16} height={16} />
          </button>
        </div>
      </aside>

      {/* Main App Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: '100vh' }}>
        {/* Sticky Glassmorphic Topbar Header */}
        <header className="app-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
            {/* Mobile Nav Toggle */}
            <button
              type="button"
              className="icon-btn"
              onClick={() => setMobileMenuOpen(true)}
              style={{ display: 'none' }}
              id="mobile-nav-toggle"
              aria-label="Open navigation menu"
            >
              <MenuIcon width={18} height={18} />
            </button>

            {/* Breadcrumb Navigation */}
            <div className="breadcrumb">
              <NavLink to="/app" style={{ color: 'var(--text-secondary)' }}>
                {t.brandName}
              </NavLink>
              <span className="sep icon-mirror">›</span>
              <span className="current">{activeSectionName}</span>
            </div>

            {/* Live System Indicator */}
            <div className="live-pill" style={{ marginInlineStart: 8 }}>
              <span>{isAr ? 'النظام متصل' : 'Live System'}</span>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="app-header-actions">
            <ThemeToggle className="btn-outline" />
            <LanguageToggle className="btn-outline" />

            <div className="app-header-divider" />

            {/* User Profile Quick Chip */}
            <div
              className="app-header-user"
              title={`${user?.name || 'User'} (${roleLabel}) — ${isAr ? 'انقر لتسجيل الخروج' : 'Click to sign out'}`}
              onClick={handleLogout}
              role="button"
              tabIndex={0}
            >
              <div className="user-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                {userInitials}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                {user?.name || 'User'}
              </span>
              {/* Top header badge showing doctor's medical specialty or system role */}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  background: 'var(--brand-soft)',
                  color: 'var(--brand)',
                  padding: '2px 7px',
                  borderRadius: 'var(--r-full)',
                }}
              >
                {doctorSpecialtyLabel || roleLabel}
              </span>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              display: 'flex',
            }}
          >
            {/* Backdrop */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(4px)',
              }}
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Drawer */}
            <div
              style={{
                position: 'relative',
                width: 280,
                maxWidth: '85%',
                height: '100%',
                background: 'var(--bg-surface)',
                boxShadow: 'var(--shadow-lg)',
                padding: 'var(--sp-5) var(--sp-4)',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 101,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <Link to="/app" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none' }}>
                  <BrandLogo variant="full" size={26} showSubtitle />
                </Link>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <CloseIcon width={18} height={18} />
                </button>
              </div>

              <div className="nav-scroll" style={{ flex: 1 }}>
                {navSections.map((sec) => {
                  const filteredItems = sec.items.filter((item) =>
                    item.roles ? item.roles.includes(role || 'patient') : true
                  );
                  if (filteredItems.length === 0) return null;

                  return (
                    <div key={sec.key} className="nav-group">
                      <div className="nav-group-label">{sec.label}</div>
                      <nav>
                        {filteredItems.map((item) => (
                          <NavLink
                            key={item.key}
                            to={item.to}
                            end={item.end}
                            onClick={() => setMobileMenuOpen(false)}
                            className={({ isActive }) =>
                              ['nav-item-link', isActive ? 'active-link' : ''].filter(Boolean).join(' ')
                            }
                          >
                            {item.icon}
                            <span>{item.label}</span>
                            {item.badge ? (
                              <span style={{ marginInlineStart: 'auto', fontSize: 10, fontWeight: 800, padding: '2px 6px', background: 'var(--brand)', color: '#fff', borderRadius: 'var(--r-full)', lineHeight: 1 }}>
                                {item.badge}
                              </span>
                            ) : null}
                          </NavLink>
                        ))}
                      </nav>
                    </div>
                  );
                })}
              </div>

              <div className="sidenav-footer">
                <div className="user-avatar">{userInitials}</div>
                <div className="user-meta">
                  <div className="user-name">{user?.name}</div>
                  <div className="user-role">{doctorSpecialtyLabel || roleLabel}</div>
                </div>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={handleLogout}
                  title={t.appNav?.logout || 'Sign out'}
                >
                  <LogoutIcon width={16} height={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Nested Page Content */}
        <main
          className="page-enter"
          style={{
            flex: 1,
            padding: '32px var(--sp-6) 64px',
            maxWidth: 1320,
            width: '100%',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

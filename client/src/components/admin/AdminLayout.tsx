import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AdminProtected } from "./AdminProtected";
import { useAdminLTE } from "@/hooks/useAdminLTE";
import { useAdminTheme } from "@/hooks/useAdminTheme";
import { apiRequest } from "@/lib/queryClient";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const [adminLTEReady, setAdminLTEReady] = useState(false);

  // Dynamically load AdminLTE CSS and JS only for admin pages
  useAdminLTE();

  // Apply admin-specific body classes for proper CSS isolation
  useAdminTheme();

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
      window.location.href = "/login";
    }
  };

  useEffect(() => {
    // Wait for AdminLTE to be available before initializing
    const checkAdminLTE = setInterval(() => {
      if (typeof (window as any).$ !== 'undefined' && typeof (window as any).$.fn?.Treeview !== 'undefined') {
        setAdminLTEReady(true);
        clearInterval(checkAdminLTE);
      }
    }, 100);

    return () => clearInterval(checkAdminLTE);
  }, []);

  useEffect(() => {
    // Initialize AdminLTE sidebar once it's loaded
    if (adminLTEReady && typeof (window as any).$ !== 'undefined') {
      try {
        (window as any).$('[data-widget="treeview"]').Treeview('init');
      } catch (error) {
        console.warn("AdminLTE Treeview initialization failed:", error);
      }
    }
  }, [adminLTEReady]);

  return (
    <AdminProtected>
      <div className="wrapper">
        {/* Navbar */}
      <nav className="main-header navbar navbar-expand navbar-white navbar-light">
        <ul className="navbar-nav">
          <li className="nav-item">
            <a className="nav-link" data-widget="pushmenu" href="#" role="button" data-testid="button-sidebar-toggle">
              <i className="fas fa-bars"></i>
            </a>
          </li>
          <li className="nav-item d-none d-sm-inline-block">
            <Link href="/admin" className="nav-link">
              <i className="fas fa-home mr-1"></i> Dashboard
            </Link>
          </li>
        </ul>
        <ul className="navbar-nav ml-auto">
          <li className="nav-item">
            <span className="nav-link font-serif font-semibold" style={{ color: 'hsl(25, 50%, 35%)' }}>
              Artisan Coffee & Fine Teas
            </span>
          </li>
          {user && (
            <>
              <li className="nav-item">
                <span className="nav-link text-sm">
                  <i className="fas fa-user-shield mr-1"></i>
                  {user.email || 'Admin'}
                </span>
              </li>
              <li className="nav-item">
                <button onClick={handleLogout} className="nav-link btn btn-link" data-testid="button-logout">
                  <i className="fas fa-sign-out-alt"></i>
                </button>
              </li>
            </>
          )}
        </ul>
      </nav>

      {/* Sidebar */}
      <aside className="main-sidebar elevation-4" style={{ backgroundColor: 'hsl(30, 6%, 96%)' }}>
        <Link href="/admin" className="brand-link text-center" style={{ backgroundColor: 'hsl(25, 50%, 35%)' }}>
          <span className="brand-text font-weight-light text-white font-serif">Admin Panel</span>
        </Link>

        <div className="sidebar">
          <nav className="mt-2">
            <ul className="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu">
              <li className="nav-item">
                <Link href="/admin" className={`nav-link ${location === '/admin' ? 'active' : ''}`} data-testid="link-dashboard">
                  <i className="nav-icon fas fa-tachometer-alt"></i>
                  <p>Dashboard</p>
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/admin/products" className={`nav-link ${location === '/admin/products' ? 'active' : ''}`} data-testid="link-products">
                  <i className="nav-icon fas fa-boxes"></i>
                  <p>Products</p>
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/admin/orders" className={`nav-link ${location === '/admin/orders' ? 'active' : ''}`} data-testid="link-orders">
                  <i className="nav-icon fas fa-shopping-cart"></i>
                  <p>Sales</p>
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/admin/customers" className={`nav-link ${location === '/admin/customers' ? 'active' : ''}`} data-testid="link-customers">
                  <i className="nav-icon fas fa-users"></i>
                  <p>Customers</p>
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/admin/invoices" className={`nav-link ${location === '/admin/invoices' ? 'active' : ''}`} data-testid="link-invoices">
                  <i className="nav-icon fas fa-file-invoice"></i>
                  <p>Invoices</p>
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/admin/accounting" className={`nav-link ${location === '/admin/accounting' ? 'active' : ''}`} data-testid="link-accounting-reports">
                  <i className="nav-icon fas fa-file-excel"></i>
                  <p>Accounting Reports</p>
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/admin/roasts" className={`nav-link ${location === '/admin/roasts' ? 'active' : ''}`} data-testid="link-roasts">
                  <i className="nav-icon fas fa-fire"></i>
                  <p>Roasts</p>
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/admin/supplier-orders" className={`nav-link ${location.startsWith('/admin/supplier-orders') ? 'active' : ''}`} data-testid="link-supplier-orders">
                  <i className="nav-icon fas fa-truck"></i>
                  <p>Supplier Orders</p>
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/admin/boeren-import" className={`nav-link ${location === '/admin/boeren-import' ? 'active' : ''}`} data-testid="link-boeren-import">
                  <i className="nav-icon fas fa-file-import"></i>
                  <p>Boeren Import</p>
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/admin/counting-sessions" className={`nav-link ${location === '/admin/counting-sessions' ? 'active' : ''}`} data-testid="link-counting-sessions">
                  <i className="nav-icon fas fa-clipboard-check"></i>
                  <p>Counting Sessions</p>
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/admin/settings" className={`nav-link ${location === '/admin/settings' ? 'active' : ''}`} data-testid="link-settings">
                  <i className="nav-icon fas fa-cog"></i>
                  <p>Settings</p>
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/admin/media" className={`nav-link ${location === '/admin/media' ? 'active' : ''}`} data-testid="link-media">
                  <i className="nav-icon fas fa-images"></i>
                  <p>Media Library</p>
                </Link>
              </li>
              <li className="nav-header">OTHER</li>
              <li className="nav-item">
                <Link href="/" className="nav-link" data-testid="link-storefront">
                  <i className="nav-icon fas fa-store"></i>
                  <p>View Storefront</p>
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/pos" className="nav-link" data-testid="link-pos">
                  <i className="nav-icon fas fa-cash-register"></i>
                  <p>POS System</p>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* Content Wrapper */}
      <div className="content-wrapper">
        <div className="content">
          <div className="container-fluid py-4">
            {children}
          </div>
        </div>
      </div>
    </div>
    </AdminProtected>
  );
}

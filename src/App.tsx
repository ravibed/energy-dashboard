import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DeviceList } from './components/DeviceList';
import { DeviceDetail } from './components/DeviceDetail';
import { BoltIcon } from './components/icons';
import { ThemeToggle } from './components/ThemeToggle';
import { useApplyTheme } from './hooks/useTheme';

export default function App() {
  const location = useLocation();
  useApplyTheme();
  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/devices" className="brand">
            <span className="brand-icon">
              <BoltIcon />
            </span>
            Energy Monitor
          </Link>
          <div className="topbar-right">
            <span className="site muted">Solar &amp; storage site</span>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="container">
        <ErrorBoundary key={location.pathname}>
        <Routes>
          <Route path="/" element={<Navigate to="/devices" replace />} />
          <Route path="/devices" element={<DeviceList />} />
          <Route path="/devices/:id" element={<DeviceDetail />} />
          <Route path="*" element={<p>Page not found.</p>} />
        </Routes>
        </ErrorBoundary>
      </main>
    </div>
  );
}

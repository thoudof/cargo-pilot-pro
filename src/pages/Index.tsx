
import { AuthProvider, useAuth } from '@/components/Auth/AuthProvider';
import { AuthPage } from '@/components/Auth/AuthPage';
import { Dashboard } from '@/components/Dashboard/Dashboard';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TripsPage } from '@/pages/TripsPage';
import { ContractorsPage } from '@/pages/ContractorsPage';
import { DriversPage } from '@/pages/DriversPage';
import { VehiclesPage } from '@/pages/VehiclesPage';
import { RoutesPage } from '@/pages/RoutesPage';
import { CargoTypesPage } from '@/pages/CargoTypesPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { NotFound } from '@/pages/NotFound';
import { MobileLayout } from '@/components/Layout/MobileLayout';
import { activityLogger } from '@/services/activityLogger';
import { useEffect } from 'react';

const AuthenticatedApp = () => {
  const {
    user,
    loading
  } = useAuth();

  useEffect(() => {
    if (user) {
      // Логируем вход пользователя при загрузке приложения
      activityLogger.logLogin();
    }
  }, [user]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>;
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <MobileLayout>
            <Dashboard onNavigate={() => {}} />
          </MobileLayout>
        } />
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/contractors" element={<ContractorsPage />} />
        <Route path="/drivers" element={<DriversPage />} />
        <Route path="/vehicles" element={<VehiclesPage />} />
        <Route path="/routes" element={<RoutesPage />} />
        <Route path="/cargo-types" element={<CargoTypesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

const Index = () => {
  return <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>;
};

export default Index;

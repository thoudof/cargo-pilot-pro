
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/components/Auth/AuthProvider";
import { AuthPage } from "@/components/Auth/AuthPage";
import { MobileLayout } from "@/components/Layout/MobileLayout";
import { Dashboard } from "@/components/Dashboard/Dashboard";
import { PushNotificationManager } from "@/components/Notifications/PushNotificationManager";
import { useActivityLogger } from "@/hooks/useActivityLogger";
import { PageTransition } from "@/components/Layout/PageTransition";
import { TripsPage } from "./TripsPage";
import { ContractorsPage } from "./ContractorsPage";
import { DriversPage } from "./DriversPage";
import { VehiclesPage } from "./VehiclesPage";
import { RoutesPage } from "./RoutesPage";
import { CargoTypesPage } from "./CargoTypesPage";
import { SettingsPage } from "./SettingsPage";
import { ProfilePage } from "./ProfilePage";
import AdminPage from "./AdminPage";
import { ReportsPage } from './ReportsPage';
import { DocumentsPage } from './DocumentsPage';
import NotificationsPage from './NotificationsPage';
import FinancialAnalyticsPage from './FinancialAnalyticsPage';
import DriverDashboardPage from './DriverDashboardPage';
import InstallPage from './InstallPage';
import { AdminRoute } from "@/components/Admin/AdminRoute";
import { AnimatePresence } from "framer-motion";

const Index = () => {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();
  
  useActivityLogger();

  console.log('Index render - user:', !!user, 'loading:', loading);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-3 text-lg">Загрузка приложения...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  // Redirect drivers to their dashboard from home page
  const isDriver = hasRole('driver');
  const isOnHomePage = location.pathname === '/';
  
  if (isDriver && isOnHomePage) {
    return <Navigate to="/driver" replace />;
  }

  return (
    <MobileLayout>
      <PushNotificationManager />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={
            <PageTransition>
              <Dashboard />
            </PageTransition>
          } />
          <Route path="/trips" element={
            <PageTransition>
              <TripsPage />
            </PageTransition>
          } />
          <Route path="/reports" element={
            <PageTransition>
              <ReportsPage />
            </PageTransition>
          } />
          <Route path="/analytics" element={
            <PageTransition>
              <FinancialAnalyticsPage />
            </PageTransition>
          } />
          <Route path="/documents" element={
            <PageTransition>
              <DocumentsPage />
            </PageTransition>
          } />
          <Route path="/contractors" element={
            <PageTransition>
              <ContractorsPage />
            </PageTransition>
          } />
          <Route path="/drivers" element={
            <PageTransition>
              <DriversPage />
            </PageTransition>
          } />
          <Route path="/vehicles" element={
            <PageTransition>
              <VehiclesPage />
            </PageTransition>
          } />
          <Route path="/routes" element={
            <PageTransition>
              <RoutesPage />
            </PageTransition>
          } />
          <Route path="/cargo-types" element={
            <PageTransition>
              <CargoTypesPage />
            </PageTransition>
          } />
          <Route path="/settings" element={
            <PageTransition>
              <SettingsPage />
            </PageTransition>
          } />
          <Route path="/profile" element={
            <PageTransition>
              <ProfilePage />
            </PageTransition>
          } />
          <Route path="/notifications" element={
            <PageTransition>
              <NotificationsPage />
            </PageTransition>
          } />
          <Route path="/install" element={
            <PageTransition>
              <InstallPage />
            </PageTransition>
          } />
          <Route path="/driver" element={
            <PageTransition>
              <DriverDashboardPage />
            </PageTransition>
          } />
          <Route path="/admin" element={
            <AdminRoute>
              <PageTransition>
                <AdminPage />
              </PageTransition>
            </AdminRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </MobileLayout>
  );
};

export default Index;


import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/components/Auth/AuthProvider";
import { AuthPage } from "@/components/Auth/AuthPage";
import { MobileLayout } from "@/components/Layout/MobileLayout";
import { Dashboard } from "@/components/Dashboard/Dashboard";
import { PushNotificationManager } from "@/components/Notifications/PushNotificationManager";
import { TripsPage } from "./TripsPage";
import { ContractorsPage } from "./ContractorsPage";
import { DriversPage } from "./DriversPage";
import { VehiclesPage } from "./VehiclesPage";
import { RoutesPage } from "./RoutesPage";
import { CargoTypesPage } from "./CargoTypesPage";
import { SettingsPage } from "./SettingsPage";
import AdminPage from "./AdminPage";

const Index = () => {
  const { user, loading } = useAuth();

  console.log('Index: Current state', { user: !!user, loading });

  if (loading) {
    console.log('Index: Auth loading, showing spinner');
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    console.log('Index: No user, showing auth page');
    return <AuthPage />;
  }

  console.log('Index: User authenticated, showing main app');
  return (
    <MobileLayout>
      <PushNotificationManager />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/contractors" element={<ContractorsPage />} />
        <Route path="/drivers" element={<DriversPage />} />
        <Route path="/vehicles" element={<VehiclesPage />} />
        <Route path="/routes" element={<RoutesPage />} />
        <Route path="/cargo-types" element={<CargoTypesPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MobileLayout>
  );
};

export default Index;

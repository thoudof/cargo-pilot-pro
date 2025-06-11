
import { AuthProvider, useAuth } from '@/components/Auth/AuthProvider';
import { AuthPage } from '@/components/Auth/AuthPage';
import { Dashboard } from '@/components/Dashboard/Dashboard';
import { Button } from '@/components/ui/button';
import { supabaseService } from '@/services/supabaseService';
import { LogOut } from 'lucide-react';

const AuthenticatedApp = () => {
  const { user, loading } = useAuth();

  const handleSignOut = async () => {
    await supabaseService.signOut();
  };

  const handleNavigate = (view: string) => {
    console.log('Navigate to:', view);
    // TODO: Implement navigation logic
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              Транспортная система
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Выйти</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main>
        <Dashboard onNavigate={handleNavigate} />
      </main>
    </div>
  );
};

const Index = () => {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
};

export default Index;

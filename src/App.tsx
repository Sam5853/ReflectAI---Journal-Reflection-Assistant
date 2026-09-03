import React from 'react';
import { AuthProvider, useAuth } from './firebase/authContext';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { Loader2 } from 'lucide-react';

const MainView: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center text-stone-600">
        <Loader2 className="w-8 h-8 animate-spin text-amber-700 mb-3" />
        <span className="text-sm font-medium font-serif">Initializing ReflectAI sanctuary...</span>
      </div>
    );
  }

  return user ? <Dashboard /> : <LandingPage />;
};

export default function App() {
  return (
    <AuthProvider>
      <MainView />
    </AuthProvider>
  );
}

import { Routes, Route, Navigate } from 'react-router-dom';
import SetupWizard from './components/SetupWizard';
import Dashboard from './components/Dashboard';
import Todos from './components/Todos';
import Calendar from './components/Calendar';
import Today from './components/Today';
import Garden from './components/Garden';
import Habits from './components/Habits';
import Activities from './components/Activities';
import Layout from './components/Layout';
import Login from './components/Login';
import { isConfigured, isNewUser } from './utils/storage';
import useAuth from './hooks/useAuth';

export default function App() {
  const { user, loading } = useAuth();
  const configured = isConfigured(user?.uid);
  const newUser = isNewUser(user?.uid);

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-white dark:bg-black">
        <div className="text-lg text-gray-900 dark:text-gray-100">Caricamento...</div>
      </main>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          newUser ? (
            <SetupWizard />
          ) : configured ? (
            <Navigate to="/today" replace />
          ) : (
            <SetupWizard />
          )
        }
      />
      <Route
        element={<Layout />}
      >
        <Route path="todos" element={<Todos />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="today" element={<Today />} />
        <Route path="garden" element={<Garden />} />
        <Route path="habits" element={<Habits />} />
        <Route path="activities" element={<Activities />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
} 
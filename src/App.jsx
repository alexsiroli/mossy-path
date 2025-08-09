import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
import { loadEssentialDataFromServer, loadRemainingDataFromServer, subscribeEssential, unsubscribeUserSubscriptions } from './utils/db';
import useAuth from './hooks/useAuth';

export default function App() {
  const { user, loading } = useAuth();
  const [syncedWithRemote, setSyncedWithRemote] = useState(false);
  const [isSetupCompleted, setIsSetupCompleted] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // FASE 0: calcola il dateKey di oggi (Europe/Rome, cutoff 6:00)
  function romeNow() {
    const now = new Date();
    return new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Rome' }));
  }
  function appDayFrom(date) {
    const d = new Date(date);
    if (d.getHours() < 6) d.setDate(d.getDate() - 1);
    d.setHours(0,0,0,0);
    return d;
  }
  function formatKey(dateObj) {
    return dateObj.toLocaleDateString('en-CA', { timeZone: 'Europe/Rome' });
  }
  const todayKey = formatKey(appDayFrom(romeNow()));

  // FASE 1: Realtime per settings + completions di oggi, poi background fetch completo
  useEffect(() => {
    // Cleanup vecchie sottoscrizioni quando cambia utente
    unsubscribeUserSubscriptions();
    if (user && !syncedWithRemote && !isSyncing) {
      setIsSyncing(true);

      
      const unsubscribe = subscribeEssential(user.uid, todayKey, (hasCompletedSetup) => {

        setIsSetupCompleted(hasCompletedSetup);
        setSyncedWithRemote(true);
        setIsSyncing(false);
        // Background load completo
        loadRemainingDataFromServer(user.uid);
      });
      return unsubscribe;
    }
    if (!user) {

      setSyncedWithRemote(false);
      setIsSetupCompleted(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, todayKey]);
  
  // Firebase puro - no più controllo localStorage
  
  // Usa i dati locali come fallback se la sincronizzazione non è ancora avvenuta
  const configured = syncedWithRemote ? isSetupCompleted : isConfigured(user?.uid);
  const newUser = syncedWithRemote ? !isSetupCompleted : isNewUser(user?.uid);

  // Mostra la schermata di caricamento durante il login o la sincronizzazione
  if (loading || (user && isSyncing)) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-black">
        {/* Logo o icona dell'app */}
        <div className="mb-8 relative">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl">
            <div className="text-3xl text-white font-bold">🌱</div>
          </div>
          {/* Anello di caricamento */}
          <div className="absolute -inset-2 border-4 border-emerald-200 dark:border-emerald-800 rounded-3xl border-t-emerald-500 dark:border-t-emerald-400 animate-spin"></div>
        </div>
        
        {/* Testo di caricamento con animazione */}
        <div className="flex flex-col items-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 animate-pulse">
            MossyPath
          </h2>
          <div className="flex items-center space-x-1">
            <span className="text-lg text-emerald-600 dark:text-emerald-400">
              {loading ? "Caricamento" : "Download dati"}
            </span>
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
            </div>
          </div>
        </div>
        
        {/* Barra di progresso infinita */}
        <div className="mt-8 w-64 h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full animate-progress-infinite"></div>
        </div>
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
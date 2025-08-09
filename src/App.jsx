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
import { syncUserData } from './utils/db';
import useAuth from './hooks/useAuth';

export default function App() {
  const { user, loading } = useAuth();
  const [syncedWithRemote, setSyncedWithRemote] = useState(false);
  const [isSetupCompleted, setIsSetupCompleted] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Sincronizza i dati quando l'utente è autenticato
  useEffect(() => {
    if (user && !syncedWithRemote && !isSyncing) {
      setIsSyncing(true);
      console.log('Avvio sincronizzazione per utente:', user.uid);
      
      // Sincronizza i dati da Firebase con timeout di 5 secondi
      syncUserData(user.uid, 5000).then(hasCompletedSetup => {
        console.log('Sincronizzazione completata. Setup completato:', hasCompletedSetup);
        setIsSetupCompleted(hasCompletedSetup);
        setSyncedWithRemote(true);
        setIsSyncing(false);
      }).catch((error) => {
        console.warn('Sincronizzazione fallita, uso dati locali:', error);
        // In caso di errore o timeout, usa i dati locali
        const localSetupCompleted = isConfigured(user.uid);
        console.log('Setup locale completato:', localSetupCompleted);
        setIsSetupCompleted(localSetupCompleted);
        setSyncedWithRemote(true);
        setIsSyncing(false);
      });
    } else if (!user) {
      // Reset dello stato quando l'utente si disconnette
      setSyncedWithRemote(false);
      setIsSetupCompleted(false);
    }
  }, [user]);
  
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
              {loading ? "Caricamento" : "Sincronizzazione dati"}
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
        
        {/* Pulsante per saltare la sincronizzazione se sta impiegando troppo tempo */}
        {isSyncing && (
          <button 
            onClick={() => {
              console.log('Sincronizzazione saltata dall\'utente');
              const localSetupCompleted = isConfigured(user?.uid);
              setIsSetupCompleted(localSetupCompleted);
              setSyncedWithRemote(true);
              setIsSyncing(false);
            }}
            className="mt-6 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm"
          >
            Continua offline
          </button>
        )}
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
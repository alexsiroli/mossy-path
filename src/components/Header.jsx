import { NavLink } from 'react-router-dom';
import { MoonIcon, SunIcon, CheckCircleIcon, CalendarIcon, HomeIcon, SparklesIcon, ChartBarIcon } from '@heroicons/react/24/solid';
import useDarkMode from '../hooks/useDarkMode';
import useAuth from '../hooks/useAuth';
import { load } from '../utils/storage';
import { useState, useEffect } from 'react';

export default function Header({ onAccountClick }) {
  const [dark, setDark] = useDarkMode();
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  // Funzione per ottenere le iniziali dell'utente
  const getUserInitials = () => {
    if (!user?.uid) return '?';
    
    // Carica i dati personali dal localStorage
    const userData = load(user.uid);
    const { personalInfo } = userData || {};
    
    // Se abbiamo nome e cognome, usa le loro iniziali
    if (personalInfo?.firstName && personalInfo?.lastName) {
      const firstInitial = personalInfo.firstName.charAt(0).toUpperCase();
      const lastInitial = personalInfo.lastName.charAt(0).toUpperCase();
      return `${firstInitial}${lastInitial}`;
    }
    
    // Fallback: usa le prime due lettere dell'email
    if (user?.email) {
      const email = user.email;
      const name = email.split('@')[0];
      return name.substring(0, 2).toUpperCase();
    }
    
    return '?';
  };

  // Effetto per ricaricare i dati quando cambiano
  useEffect(() => {
    const handleDataRefresh = () => {
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('dataRefresh', handleDataRefresh);
    
    return () => {
      window.removeEventListener('dataRefresh', handleDataRefresh);
    };
  }, []);

  return (
    <header className="fixed top-2 inset-x-4 sm:inset-x-0 sm:max-w-screen-md sm:mx-auto bg-emerald-500/20 dark:bg-emerald-600/20 backdrop-blur-xl ring-1 ring-emerald-200/60 dark:ring-emerald-700/40 shadow-xl rounded-2xl px-5 py-3 flex items-center justify-between text-sm z-30">
      <nav className="flex items-center gap-4">
        <div className="sm:hidden flex items-center gap-3">
          <img src="/icons/icon-192.png" alt="MossyPath Logo" className="w-8 h-8" />
          <span className="text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">MossyPath</span>
        </div>
        <NavLink
          to="/todos"
          className={({ isActive }) =>
            `hidden sm:block p-2 rounded hover:bg-white/20 dark:hover:bg-black/20 ${isActive ? 'text-emerald-600 dark:text-emerald-400 bg-white/30 dark:bg-black/30' : 'text-gray-700 dark:text-gray-300'}`
          }
        >
          <CheckCircleIcon className="h-6 w-6" />
        </NavLink>
        <NavLink
          to="/calendar"
          className={({ isActive }) =>
            `hidden sm:block p-2 rounded hover:bg-white/20 dark:hover:bg-black/20 ${isActive ? 'text-emerald-600 dark:text-emerald-400 bg-white/30 dark:bg-black/30' : 'text-gray-700 dark:text-gray-300'}`
          }
        >
          <CalendarIcon className="h-6 w-6" />
        </NavLink>
        <NavLink
          to="/today"
          className={({ isActive }) =>
            `hidden sm:block p-2 rounded hover:bg-white/20 dark:hover:bg-black/20 ${isActive ? 'text-emerald-600 dark:text-emerald-400 bg-white/30 dark:bg-black/30' : 'text-gray-700 dark:text-gray-300'}`
          }
        >
          <HomeIcon className="h-6 w-6" />
        </NavLink>
        <NavLink
          to="/garden"
          className={({ isActive }) =>
            `hidden sm:block p-2 rounded hover:bg-white/20 dark:hover:bg-black/20 ${isActive ? 'text-emerald-600 dark:text-emerald-400 bg-white/30 dark:bg-black/30' : 'text-gray-700 dark:text-gray-300'}`
          }
        >
          <SparklesIcon className="h-6 w-6" />
        </NavLink>
        <NavLink
          to="/activities"
          className={({ isActive }) =>
            `hidden sm:block p-2 rounded hover:bg-white/20 dark:hover:bg-black/20 ${isActive ? 'text-emerald-600 dark:text-emerald-400 bg-white/30 dark:bg-black/30' : 'text-gray-700 dark:text-gray-300'}`
          }
        >
          <ChartBarIcon className="h-6 w-6" />
        </NavLink>
      </nav>

      {/* Bottoni allineati a destra */}
      <div className="flex items-center gap-3">
        {/* Pallino con iniziali utente */}
        <button 
          key={refreshKey}
          className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-semibold cursor-pointer hover:bg-emerald-600 transition-colors"
          onClick={onAccountClick}
        >
          {getUserInitials()}
        </button>

        {/* Toggle tema */}
        <button
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          onClick={() => setDark(!dark)}
          aria-label="Toggle dark mode"
        >
          {dark ? (
            <SunIcon className="h-7 w-7 text-yellow-400" />
          ) : (
            <MoonIcon className="h-7 w-7 text-gray-800" />
          )}
        </button>
        

      </div>
    </header>
  );
} 
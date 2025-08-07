import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { MoonIcon, SunIcon, CheckCircleIcon, CalendarIcon, HomeIcon, SparklesIcon, ChartBarIcon, XMarkIcon, ArrowRightOnRectangleIcon, TrashIcon, PencilSquareIcon } from '@heroicons/react/24/solid';
import useDarkMode from '../hooks/useDarkMode';
import useAuth from '../hooks/useAuth';

export default function Header() {
  const [dark, setDark] = useDarkMode();
  const { user, logout } = useAuth();
  const [showAccountPopup, setShowAccountPopup] = useState(false);
  const popupRef = useRef(null);
  const navigate = useNavigate();

  // Funzione per ottenere le iniziali dell'utente
  const getUserInitials = () => {
    if (!user?.email) return '?';
    const email = user.email;
    const name = email.split('@')[0];
    return name.substring(0, 2).toUpperCase();
  };
  
  // Funzione per ottenere il nome dell'utente
  const getUserName = () => {
    if (!user?.email) return 'Utente';
    const email = user.email;
    const name = email.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  };
  
  // Funzione per gestire il logout
  const handleLogout = async () => {
    await logout();
    setShowAccountPopup(false);
    navigate('/login');
  };
  
  // Funzione per gestire la cancellazione dell'account (per ora solo chiude il popup)
  const handleDeleteAccount = () => {
    setShowAccountPopup(false);
    // Qui andrebbe implementata la vera cancellazione dell'account
  };
  
  // Effetto per chiudere il popup quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setShowAccountPopup(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [popupRef]);

  return (
    <header className="fixed top-2 inset-x-4 sm:inset-x-0 sm:max-w-screen-md sm:mx-auto bg-emerald-500/20 dark:bg-emerald-600/20 backdrop-blur-xl ring-1 ring-emerald-200/60 dark:ring-emerald-700/40 shadow-xl rounded-2xl px-5 py-3 flex items-center justify-between text-sm z-30">
      <nav className="flex items-center gap-4">
        <span className="sm:hidden text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">MossyPath</span>
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
          to="/habits"
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
          className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-semibold cursor-pointer hover:bg-emerald-600 transition-colors"
          onClick={() => setShowAccountPopup(!showAccountPopup)}
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
        
        {/* Popup account */}
        {showAccountPopup && (
          <div 
            ref={popupRef}
            className="absolute top-16 right-4 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-2xl ring-1 ring-gray-200 dark:ring-gray-700 overflow-hidden z-50 animate-fade-in"
          >
            <div className="p-4 bg-emerald-500/10 dark:bg-emerald-600/10 border-b border-gray-200 dark:border-gray-700 relative">
              <button 
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                onClick={() => setShowAccountPopup(false)}
              >
                <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white text-lg font-semibold">
                  {getUserInitials()}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{getUserName()}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Account creato il: {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('it-IT') : 'Data non disponibile'}
              </p>
            </div>
            
            <div className="p-2">
              <button 
                className="w-full text-left px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={handleLogout}
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <span>Logout</span>
              </button>
              
              <button 
                className="w-full text-left px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-red-600 dark:text-red-400"
                onClick={handleDeleteAccount}
              >
                <TrashIcon className="h-5 w-5" />
                <span>Cancella account</span>
              </button>
              
              <button 
                className="w-full text-left px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setShowAccountPopup(false)}
              >
                <PencilSquareIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span>Modifica attività base</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
} 
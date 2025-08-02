import { NavLink } from 'react-router-dom';
import { MoonIcon, SunIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/solid';
import useDarkMode from '../hooks/useDarkMode';
import useAuth from '../hooks/useAuth';

export default function Header() {
  const [dark, setDark] = useDarkMode();
  const { logout } = useAuth();

  return (
    <header className="fixed top-2 inset-x-4 sm:inset-x-0 sm:max-w-screen-md sm:mx-auto bg-emerald-200/30 dark:bg-emerald-900/25 backdrop-blur-xl ring-1 ring-emerald-300/50 dark:ring-emerald-800/40 shadow-xl rounded-2xl px-5 py-3 flex items-center gap-4 text-sm z-30">
      <nav className="flex items-center gap-4 flex-1">
        <span className="sm:hidden text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">GameLife</span>
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `hidden sm:block hover:underline ${isActive ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`
          }
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/stats"
          className={({ isActive }) =>
            `hidden sm:block hover:underline ${isActive ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`
          }
        >
          Statistiche
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `hidden sm:block hover:underline ${isActive ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`
          }
        >
          Impostazioni
        </NavLink>

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

        <button
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          onClick={logout}
          aria-label="Logout"
        >
          <ArrowRightOnRectangleIcon className="h-7 w-7 text-gray-800 dark:text-gray-200" />
        </button>
      </nav>
    </header>
  );
} 
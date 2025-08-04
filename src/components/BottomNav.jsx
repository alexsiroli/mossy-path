import { NavLink } from 'react-router-dom';
import { HomeIcon, ChartBarIcon, Cog6ToothIcon } from '@heroicons/react/24/solid';

export default function BottomNav() {
  const links = [
    { to: '/dashboard', icon: HomeIcon, label: 'Home' },
    { to: '/stats', icon: ChartBarIcon, label: 'Stats' },
    { to: '/settings', icon: Cog6ToothIcon, label: 'Settings' },
  ];
  return (
    <nav className="sm:hidden fixed bottom-6 inset-x-4 bg-white/30 dark:bg-black/30 backdrop-blur-xl ring-1 ring-white/50 dark:ring-white/10 shadow-xl rounded-2xl px-5 py-2 flex justify-around text-[11px] pb-safe">
      {links.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-3 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-300'}`
          }
        >
          {({ isActive }) => (
            <>
              <Icon className="h-7 w-7" />
              <span className="mb-1">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
} 
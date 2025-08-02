import Header from './Header';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function Layout({ children }) {
  return (
    <>
      <Header />
      <div className="mt-20 sm:mt-24 px-4 sm:px-0 pb-20">
        {children || <Outlet />}
      </div>
      <BottomNav />
    </>
  );
} 
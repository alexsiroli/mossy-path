import { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import FloatingImage from './FloatingImage';
import useDarkMode from '../hooks/useDarkMode';
import { SunIcon, MoonIcon, UserIcon, KeyIcon } from '@heroicons/react/24/outline';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useDarkMode();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = isSignUp 
      ? await signUp(email, password)
      : await signIn(email, password);

    if (result.success) {
      navigate('/'); // Redirect to root instead of dashboard
    } else {
      setError(result.error);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    const result = await signInWithGoogle();
    
    if (result.success) {
      navigate('/'); // Redirect to root instead of dashboard
    } else {
      setError(result.error);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen py-4">
      <FloatingImage isLogin={!isSignUp} />
      
      {/* Bottone toggle tema */}
      <button
        onClick={toggleDarkMode}
        className="fixed top-4 right-4 p-2 rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-sm border border-gray-300/50 dark:border-gray-600/50 hover:bg-white/30 dark:hover:bg-black/30 transition-all duration-300 z-50 cursor-pointer"
        aria-label="Toggle dark mode"
      >
        {darkMode ? (
          <SunIcon className="w-4 h-4 text-yellow-500" />
        ) : (
          <MoonIcon className="w-4 h-4 text-gray-700" />
        )}
      </button>
      
      <div className={`glass p-6 max-w-sm w-full mx-4 animate-fade-in-up ${isSignUp ? 'border-2 border-emerald-500 dark:border-emerald-700' : 'border-2 border-gray-300 dark:border-gray-700'}`}>
        <h1 className={`text-xl font-bold mb-4 text-center animate-fade-in-delay ${isSignUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-800 dark:text-gray-200'}`}>
          {isSignUp ? '✨ Registrati' : '🔑 Accedi'} a MossyPath
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-3 animate-fade-in-delay-2">
          <div className="animate-slide-in-left relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 dark:text-gray-400">
              <UserIcon className="h-4 w-4" />
            </div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full pl-9 pr-3 py-2.5 border ${isSignUp ? 'border-emerald-400 dark:border-emerald-600' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm`}
              required
            />
          </div>
          
          <div className="animate-slide-in-right relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 dark:text-gray-400">
              <KeyIcon className="h-4 w-4" />
            </div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full pl-9 pr-3 py-2.5 border ${isSignUp ? 'border-emerald-400 dark:border-emerald-600' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm`}
              required
            />
          </div>

          {error && (
            <p className="text-red-600 dark:text-red-400 text-xs animate-shake">{error}</p>
          )}

          <button type="submit" className={`w-full py-2.5 rounded-lg font-semibold text-white shadow-md hover:shadow-lg active:scale-95 transition animate-bounce-in text-sm ${isSignUp ? 'bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800' : 'bg-gradient-to-r from-gray-600 to-gray-800 hover:from-gray-700 hover:to-gray-900 dark:from-gray-700 dark:to-gray-900 dark:hover:from-gray-600 dark:hover:to-gray-800'}`}>
            {isSignUp ? '✨ Registrati' : '🔑 Accedi'}
          </button>
        </form>

        <div className="relative my-4 animate-fade-in-delay-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">oppure</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 border ${isSignUp ? 'border-emerald-400 dark:border-emerald-600' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 text-gray-900 dark:text-gray-100 hover:scale-105 animate-bounce-in-delay text-sm`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continua con Google
        </button>

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className={`w-full mt-4 text-xs ${isSignUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400'} hover:underline transition-colors duration-300 animate-fade-in-delay-4`}
        >
          {isSignUp ? '🔑 Hai già un account? Accedi' : '✨ Non hai un account? Registrati'}
        </button>
      </div>
    </main>
  );
} 
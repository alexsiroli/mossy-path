import Header from './Header';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon, ArrowRightOnRectangleIcon, TrashIcon, PencilSquareIcon } from '@heroicons/react/24/solid';
import { deleteUser } from 'firebase/auth';
import { auth } from '../config/firebase';
import useAuth from '../hooks/useAuth';
import { load, save } from '../utils/storage';
import { saveUserSettings } from '../utils/db';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const [showAccountPopup, setShowAccountPopup] = useState(false);
  const popupRef = useRef(null);
  const navigate = useNavigate();
  const [showEditBasics, setShowEditBasics] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [baseActivities, setBaseActivities] = useState(Array(5).fill(''));
  const [bedtime, setBedtime] = useState('22:30');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [malus, setMalus] = useState(Array(5).fill({ name: '', weekdaysOnly: true }));

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
  
  // Funzione per ottenere il nome dell'utente
  const getUserName = () => {
    if (!user?.uid) return 'Utente';
    
    // Carica i dati personali dal localStorage
    const userData = load(user.uid);
    const { personalInfo } = userData || {};
    
    // Se abbiamo nome e cognome, usali
    if (personalInfo?.firstName && personalInfo?.lastName) {
      return `${personalInfo.firstName} ${personalInfo.lastName}`;
    }
    
    // Fallback: usa la prima parte dell'email
    if (user?.email) {
      const email = user.email;
      const name = email.split('@')[0];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    
    return 'Utente';
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

  useEffect(() => {
    // load current settings when opening edit
    if (showEditBasics) {
      const initial = load(user?.uid);
      setBaseActivities(initial.baseActivities || Array(5).fill(''));
      setBedtime(initial.sleep?.bedtime || '22:30');
      setWakeTime(initial.sleep?.wakeup || initial.sleep?.wakeTime || '07:00');
      setMalus(initial.malus || Array(5).fill({ name: '', weekdaysOnly: true }));
    }
  }, [showEditBasics, user?.uid]);

  const handleSaveBasics = async () => {
    const data = load(user?.uid);
    const payload = {
      ...data,
      baseActivities,
      sleep: { bedtime, wakeup: wakeTime },
      malus,
    };
    save(payload, user?.uid);
    await saveUserSettings(user?.uid, { baseActivities, sleep: { bedtime, wakeup: wakeTime }, malus });
    setShowEditBasics(false);
  };

  return (
    <>
      <Header onAccountClick={() => setShowAccountPopup(!showAccountPopup)} />
      <div className="mt-20 sm:mt-24 px-4 sm:px-0 pb-20">
        {children || <Outlet />}
      </div>
      <BottomNav />
      
      {/* Popup account - FUORI dall'header */}
      {showAccountPopup && (
        <div 
          ref={popupRef}
          className="fixed top-16 right-4 w-80 bg-white/30 dark:bg-black/30 backdrop-blur-xl rounded-2xl shadow-2xl ring-1 ring-white/50 dark:ring-white/10 overflow-hidden z-[9999] animate-fade-in"
        >
          <div className="p-4 bg-emerald-500/20 dark:bg-emerald-600/20 border-b border-white/20 relative">
            <button 
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              onClick={() => setShowAccountPopup(false)}
            >
              <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white text-lg font-semibold">
                {getUserInitials()}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white">{getUserName()}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
            </div>
            
            {/* Informazioni personali */}
            {(() => {
              const userData = load(user?.uid);
              const { personalInfo } = userData || {};
              
              if (personalInfo?.firstName && personalInfo?.lastName) {
                return (
                  <div className="space-y-2 mb-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Nome:</span>
                        <span className="ml-1 text-gray-700 dark:text-gray-300 font-medium">{personalInfo.firstName}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Cognome:</span>
                        <span className="ml-1 text-gray-700 dark:text-gray-300 font-medium">{personalInfo.lastName}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Età:</span>
                        <span className="ml-1 text-gray-700 dark:text-gray-300 font-medium">{personalInfo.age} anni</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Città:</span>
                        <span className="ml-1 text-gray-700 dark:text-gray-300 font-medium">{personalInfo.city}</span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
            
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
              className="w-full text-left px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => { setShowAccountPopup(false); setShowEditBasics(true); }}
            >
              <PencilSquareIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <span>Modifica attività</span>
            </button>

            <button 
              className="mt-1 w-full text-left px-4 py-2 rounded flex items-center gap-2 hover:bg-red-500/10 transition-colors text-red-600 dark:text-red-400"
              onClick={() => { setShowAccountPopup(false); setShowDeleteConfirm(true); }}
            >
              <TrashIcon className="h-5 w-5" />
              <span>Cancella account</span>
            </button>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)}></div>
          <div className="relative w-full max-w-md bg-white/30 dark:bg-black/30 backdrop-blur-xl ring-1 ring-white/50 dark:ring-white/10 rounded-2xl shadow-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">Conferma cancellazione</h3>
              <button className="p-1 rounded-md hover:bg-white/20" onClick={() => setShowDeleteConfirm(false)}>
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm mb-3">Scrivi "conferma" per procedere. Questa azione è irreversibile.</p>
            <input type="text" className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="conferma" />
            <div className="mt-4 flex justify-end gap-2">
              <button className="px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700" onClick={() => setShowDeleteConfirm(false)}>Annulla</button>
              <button
                className={`px-3 py-1.5 rounded-lg ${confirmText.toLowerCase()==='conferma' ? 'bg-red-600 text-white' : 'bg-red-600/40 text-white/60 cursor-not-allowed'}`}
                disabled={confirmText.toLowerCase()!=='conferma'}
                onClick={async () => {
                  try {
                    if (auth.currentUser) {
                      await deleteUser(auth.currentUser);
                    }
                  } catch (e) {
                    alert('Impossibile cancellare l\'account senza una recente autenticazione. Esegui logout e login, poi riprova.');
                    return;
                  }
                  setShowDeleteConfirm(false);
                  navigate('/');
                }}
              >
                Cancella definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditBasics && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEditBasics(false)}></div>
          <div className="relative w-full max-w-md bg-white/30 dark:bg-black/30 backdrop-blur-xl ring-1 ring-white/50 dark:ring-white/10 rounded-2xl shadow-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">Attività e impostazioni</h3>
              <button className="p-1 rounded-md hover:bg-white/20" onClick={() => setShowEditBasics(false)}>
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {/* Attività base - verde */}
              <div className="bg-gradient-to-br from-emerald-500/25 to-emerald-600/20 rounded-xl p-3 ring-1 ring-emerald-500/30 dark:ring-emerald-500/30">
                <h4 className="font-semibold mb-2 text-emerald-700 dark:text-emerald-300">Attività base</h4>
                {baseActivities.map((a, idx) => (
                  <input
                    key={idx}
                    className="w-full mb-2 px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                    type="text"
                    placeholder={`Attività ${idx+1}`}
                    value={a}
                    onChange={(e) => { const arr = [...baseActivities]; arr[idx] = e.target.value; setBaseActivities(arr); }}
                  />
                ))}
              </div>
              {/* Sonno - blu */}
              <div className="bg-gradient-to-br from-blue-500/25 to-blue-600/20 rounded-xl p-3 ring-1 ring-blue-500/30 dark:ring-blue-500/30">
                <h4 className="font-semibold mb-2 text-blue-700 dark:text-blue-300">Sonno</h4>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-sm">A letto
                    <input type="time" className="mt-1 w-full px-3 py-1.5 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600" value={bedtime} onChange={(e) => setBedtime(e.target.value)} />
                  </label>
                  <label className="block text-sm">Sveglia
                    <input type="time" className="mt-1 w-full px-3 py-1.5 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} />
                  </label>
                </div>
              </div>
              {/* Malus - rosso */}
              <div className="bg-gradient-to-br from-red-500/25 to-red-600/20 rounded-xl p-3 ring-1 ring-red-500/30 dark:ring-red-500/30">
                <h4 className="font-semibold mb-2 text-red-700 dark:text-red-300">Malus</h4>
                {malus.map((m, idx) => (
                  <div key={idx} className="flex gap-2 mb-2 items-center">
                    <input
                      className="flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                      type="text"
                      placeholder={`Malus ${idx+1}`}
                      value={m.name}
                      onChange={(e) => { const arr = [...malus]; arr[idx] = { ...arr[idx], name: e.target.value }; setMalus(arr); }}
                    />
                    <div className="inline-flex rounded-lg overflow-hidden ring-1 ring-gray-300 dark:ring-gray-600">
                      <button
                        type="button"
                        className={`px-2 py-1 text-xs ${m.weekdaysOnly ? 'bg-emerald-500 text-white' : 'bg-transparent text-gray-700 dark:text-gray-300'}`}
                        onClick={() => { const arr = [...malus]; arr[idx] = { ...arr[idx], weekdaysOnly: true }; setMalus(arr); }}
                        title="Solo feriali"
                      >
                        F
                      </button>
                      <button
                        type="button"
                        className={`px-2 py-1 text-xs ${!m.weekdaysOnly ? 'bg-emerald-500 text-white' : 'bg-transparent text-gray-700 dark:text-gray-300'}`}
                        onClick={() => { const arr = [...malus]; arr[idx] = { ...arr[idx], weekdaysOnly: false }; setMalus(arr); }}
                        title="Tutti i giorni"
                      >
                        T
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700" onClick={() => setShowEditBasics(false)}>Annulla</button>
              <button className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white" onClick={handleSaveBasics}>Salva</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 
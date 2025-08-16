import { useState, useEffect, useCallback } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, GiftIcon } from '@heroicons/react/24/solid';
import useAuth from '../hooks/useAuth';
import { getPointsForDate, getCollectiblesForDate, unlockCollectible, openGiftForDate, canOpenGiftForDate } from '../utils/collectibles';
import SectionTitle from './SectionTitle';

export default function Collectibles() {
  const { user } = useAuth();
  const [currentDay, setCurrentDay] = useState(undefined); // undefined = non ancora impostato
  const [collectibles, setCollectibles] = useState([]);
  const [points, setPoints] = useState(0);
  const [canOpenGift, setCanOpenGift] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [unlockedItem, setUnlockedItem] = useState(null);

  const [testMode, setTestMode] = useState(false);

  const days = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

  // Imposta il giorno corrente all'apertura e carica i dati
  useEffect(() => {
    const today = new Date().getDay();
    // Converti da domenica=0 a lunedì=0
    const adjustedDay = today === 0 ? 6 : today - 1;
    setCurrentDay(adjustedDay);
  }, []);

  const loadDayData = useCallback(async () => {
    if (!user || currentDay === undefined) return;
    
    try {
      console.log('Debug - Caricamento dati per giorno:', currentDay, 'Nome giorno:', ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'][currentDay]);
      const dayPoints = await getPointsForDate(user.uid, currentDay);
      const dayCollectibles = await getCollectiblesForDate(user.uid, currentDay);
      
      setPoints(dayPoints);
      setCollectibles(dayCollectibles);
      
      // Controlla se può aprire un regalo (solo per giorni precedenti con 100+ punti)
      const today = new Date().getDay();
      const adjustedToday = today === 0 ? 6 : today - 1;
      
      // Può aprire solo se è un giorno precedente e ha 100+ punti
      const canOpen = currentDay < adjustedToday && dayPoints >= 100;
      
      if (canOpen) {
        // Controlla anche se il regalo è già stato aperto
        const canOpenGift = await canOpenGiftForDate(user.uid, currentDay);
        setCanOpenGift(canOpenGift);
      } else {
        setCanOpenGift(false);
      }
    } catch (error) {
      console.error('Errore nel caricamento dati:', error);
    }
  }, [user, currentDay]);

  // Carica i collezionabili e i punti per il giorno corrente
  useEffect(() => {
    // Carica solo se currentDay è stato impostato correttamente
    if (currentDay !== undefined) {
      loadDayData();
    }
  }, [currentDay, loadDayData]);

  const nextDay = () => {
    setCurrentDay((prev) => (prev + 1) % 7);
  };

  const prevDay = () => {
    setCurrentDay((prev) => (prev - 1 + 7) % 7);
  };

  const goToDay = (dayIndex) => {
    setCurrentDay(dayIndex);
  };



  const openGift = async () => {
    if (!canOpenGift) return;
    
    const item = await openGiftForDate(user.uid, currentDay);
    setUnlockedItem(item);
    setShowGiftModal(true);
    
    // Ricarica i dati per aggiornare la visualizzazione
    await loadDayData();
  };

  const closeGiftModal = () => {
    setShowGiftModal(false);
    setUnlockedItem(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-20">
      {/* Header con SectionTitle come nelle altre sezioni */}
      <SectionTitle title="Collezionabili">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTestMode(!testMode)}
            className={`px-2 py-1 rounded-lg font-medium transition-all hover:scale-105 active:scale-95 text-sm ${
              testMode 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
          >
            {testMode ? 'Test ON' : 'Test OFF'}
          </button>
          {canOpenGift && (
                          <button
                onClick={openGift}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-medium transition-all hover:scale-105 active:scale-95 text-sm"
              >
              <GiftIcon className="h-4 w-4" />
              Premio
            </button>
          )}
        </div>
      </SectionTitle>

      {/* Selettore giorno della settimana in stile tile */}
      <div className="mt-36 px-0">
        <div className="bg-white/30 dark:bg-black/30 backdrop-blur-xl ring-1 ring-white/50 dark:ring-white/10 shadow-xl rounded-2xl px-6 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={prevDay}
              className="p-2 hover:bg-white/20 dark:hover:bg-black/20 rounded-xl transition-all hover:scale-110 active:scale-95"
            >
              <ChevronLeftIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
            </button>
            
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white m-0">
                Collezione del <span className="text-emerald-600 dark:text-emerald-400">{days[currentDay]}</span>
              </h2>
            </div>
            
            <button
              onClick={nextDay}
              className="p-2 hover:bg-white/20 dark:hover:bg-black/20 rounded-xl transition-all hover:scale-110 active:scale-95"
            >
              <ChevronRightIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Griglia collezionabili compatta */}
      <div className="p-3 mt-4">
        <div className="grid grid-cols-4 gap-4">
          {collectibles.map((item, index) => (
                      <div
          key={`${currentDay}_${index}`}
          className="w-full h-full"
        >
          <CollectibleItem item={item} testMode={testMode} />
        </div>
          ))}
        </div>
      </div>

      {/* Modal regalo aperto */}
      {showGiftModal && unlockedItem && (
        <GiftModal item={unlockedItem} onClose={closeGiftModal} />
      )}
    </div>
  );
}

// Componente per ogni collezionabile
function CollectibleItem({ item, testMode }) {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <>
      <div
        onClick={() => setShowDetail(true)}
        className={`collectible-tile relative aspect-square rounded-lg border-2 cursor-pointer transition-all p-0.5 ${
          (item.unlocked || testMode)
            ? `bg-white dark:bg-gray-800 ${
                item.rarity === 'common' ? 'border-gray-500 common-glow' :
                item.rarity === 'rare' ? 'border-blue-500 rare-glow' :
                item.rarity === 'epic' ? 'border-purple-500 epic-glow' :
                'border-yellow-500 legendary-glow'
              }`
            : `${
                item.rarity === 'common' ? 'border-gray-500' :
                item.rarity === 'rare' ? 'border-blue-500' :
                item.rarity === 'epic' ? 'border-purple-500' :
                'border-yellow-500'
              } bg-gray-100 dark:bg-gray-900`
        }`}
      >
        {/* Immagine del collezionabile o placeholder */}
        <div className="w-full h-full p-2 relative">
          {item.hasImage ? (
            <img
              src={item.image}
              alt={item.name}
              className={`w-full h-full object-contain pixel-art transition-all duration-300 ${
                (item.unlocked || testMode) ? 'opacity-100' : 'opacity-100'
              }`}
              style={{
                filter: (item.unlocked || testMode) ? 'none' : 'brightness(0)'
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-4xl text-gray-400 dark:text-gray-600 font-bold">?</div>
            </div>
          )}
        </div>
        
                        {/* Solo il nome sotto l'immagine */}
                {(item.unlocked || testMode) ? (
                  <div className="mt-2 text-center collectible-name">
                    <div className="font-medium text-xs text-gray-900 dark:text-white truncate">{item.name}</div>
                  </div>
                ) : (
                  <div className="mt-2 text-center collectible-name">
                    <div className="text-gray-400 dark:text-gray-500 text-xs">???</div>
                  </div>
                )}
      </div>

      {/* Modal dettaglio */}
      {showDetail && (
        <CollectibleDetailModal item={item} onClose={() => setShowDetail(false)} testMode={testMode} />
      )}
    </>
  );
}

// Modal per visualizzare il dettaglio del collezionabile
function CollectibleDetailModal({ item, onClose, testMode }) {
  // Classe per il bagliore colorato in base alla rarità
  const getRarityGlow = () => {
    switch (item.rarity) {
      case 'common': return 'common-detail-glow';
      case 'rare': return 'rare-detail-glow';
      case 'epic': return 'epic-detail-glow';
      case 'legendary': return 'legendary-detail-glow';
      default: return '';
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className={`bg-gray-100 dark:bg-gray-900 rounded-2xl pt-4 pb-6 px-6 w-80 h-80 ${getRarityGlow()}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center h-full flex flex-col">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            {item.unlocked || testMode ? item.name : '???'}
          </h3>
          
          {/* Immagine ingrandita che occupa buona parte della finestra */}
          <div className="flex-1 flex items-center justify-center mb-4">
            <div className="w-48 h-48">
              {item.hasImage ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-contain pixel-art"
                  style={{
                    filter: (item.unlocked || testMode) ? 'none' : 'brightness(0)'
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-8xl text-gray-400 dark:text-gray-600 font-bold">?</div>
                </div>
              )}
            </div>
          </div>
          
          <div className={`text-sm font-medium ${
            item.rarity === 'common' ? 'text-gray-600 dark:text-gray-400' :
            item.rarity === 'rare' ? 'text-blue-600 dark:text-blue-400' :
            item.rarity === 'epic' ? 'text-purple-600 dark:text-purple-400' :
            'text-yellow-600 dark:text-yellow-400'
          }`}>
            {item.rarity === 'common' ? 'Comune' :
             item.rarity === 'rare' ? 'Raro' :
             item.rarity === 'epic' ? 'Epico' :
             'Leggendario'}
          </div>
        </div>
      </div>
    </div>
  );
}

// Modal per il regalo aperto
function GiftModal({ item, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-black rounded-2xl p-6 max-w-sm w-full text-center">
        <div className="text-6xl mb-4">🎁</div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Hai sbloccato!
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {item.name}
        </p>
        
                {/* Immagine del nuovo collezionabile */}
        <div className="w-24 h-24 mx-auto mb-4 border-2 border-emerald-500 rounded-lg overflow-hidden">
          {item.hasImage ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-contain pixel-art"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-3xl text-gray-400 dark:text-gray-600 font-bold">?</div>
            </div>
          )}
        </div>
        
        <button
          onClick={onClose}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-medium transition-all hover:scale-105 active:scale-95"
        >
          Fantastico!
        </button>
      </div>
        </div>
    );
  } 
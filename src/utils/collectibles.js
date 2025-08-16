import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

// Struttura dati per i collezionabili
const COLLECTIBLES_DATA = {
  monday: generateDayCollectibles('monday'),
  tuesday: generateDayCollectibles('tuesday'),
  wednesday: generateDayCollectibles('wednesday'),
  thursday: generateDayCollectibles('thursday'),
  friday: generateDayCollectibles('friday'),
  saturday: generateDayCollectibles('saturday'),
  sunday: generateDayCollectibles('sunday')
};

// Genera i collezionabili per un giorno specifico
function generateDayCollectibles(day) {
  // Dati specifici per ogni giorno
  const dayData = {
    monday: {
      common: ['cane', 'gatto', 'pesciolino', 'uccellino'],
      rare: ['lupo', 'rana', 'tartaruga', 'volpe'],
      epic: ['aquila', 'gufo', 'pinguino', 'polpo'],
      legendary: ['lince', 'narvalo', 'orca', 'tigre_bianca']
    },
    tuesday: {
      common: ['utilitaria', 'barca_a_remi', 'scooter', 'bicicletta'],
      rare: ['furgoncino', 'barca_a_vela', 'elicottero', 'moto'],
      epic: ['aereo_a_elica', 'sottomarino', 'treno', 'auto_sportiva'],
      legendary: ['dirigibile', 'razzo', 'rover_lunare', 'jet_supersonico']
    },
    wednesday: {
      common: ['felce', 'cactus', 'piantina', 'margherita'],
      rare: ['fungo', 'bonsai', 'girasole', 'rosa'],
      epic: ['orchidea', 'vite', 'acero', 'palma'],
      legendary: ['pianta_carnivora', 'sakura_in_fiore', 'fiore_di_loto_dorato', 'albero_secolare']
    },
    thursday: {
      common: ['formaggio', 'carota', 'pane', 'mela'],
      rare: ['hamburger', 'ramen', 'gelato', 'pizza'],
      epic: ['kebab', 'bistecca', 'torta', 'sushi'],
      legendary: ['tiramisu', 'ostrica', 'caviale', 'aragosta']
    },
    friday: {
      common: ['pianeta', 'sole', 'luna', 'stella'],
      rare: ['costellazione', 'meteorite', 'telescopio', 'cometa'],
      epic: ['eclissi', 'satellite', 'buco_nero', 'nebulosa'],
      legendary: ['quasar', 'pulsar', 'galassia', 'supernova']
    },
    saturday: {
      common: ['placeholder_1', 'placeholder_2', 'placeholder_3', 'placeholder_4'],
      rare: ['placeholder_5', 'placeholder_6', 'placeholder_7', 'placeholder_8'],
      epic: ['placeholder_9', 'placeholder_10', 'placeholder_11', 'placeholder_12'],
      legendary: ['placeholder_13', 'placeholder_14', 'placeholder_15', 'placeholder_16']
    },
    sunday: {
      common: ['placeholder_17', 'placeholder_18', 'placeholder_19', 'placeholder_20'],
      rare: ['placeholder_21', 'placeholder_22', 'placeholder_23', 'placeholder_24'],
      epic: ['placeholder_25', 'placeholder_26', 'placeholder_27', 'placeholder_28'],
      legendary: ['placeholder_29', 'placeholder_30', 'placeholder_31', 'placeholder_32']
    }
  };

  const currentDayData = dayData[day];
  const hasImages = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(day);
  
  return [
    // Comuni (60% probabilità)
    ...currentDayData.common.map((name, index) => ({
      id: `${day}_common_${index + 1}`,
      name: hasImages ? (name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' ')) : '???',
      rarity: 'common',
      image: hasImages ? `/images/collectibles/${day}/common/${name}.png` : null,
      unlocked: false,
      hasImage: hasImages
    })),
    // Rari (25% probabilità)
    ...currentDayData.rare.map((name, index) => ({
      id: `${day}_rare_${index + 1}`,
      name: hasImages ? (name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' ')) : '???',
      rarity: 'rare',
      image: hasImages ? `/images/collectibles/${day}/rare/${name}.png` : null,
      unlocked: false,
      hasImage: hasImages
    })),
    // Epici (10% probabilità)
    ...currentDayData.epic.map((name, index) => ({
      id: `${day}_epic_${index + 1}`,
      name: hasImages ? (name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' ')) : '???',
      rarity: 'epic',
      image: `/images/collectibles/${day}/epic/${name}.png`,
      unlocked: false,
      hasImage: hasImages
    })),
    // Leggendari (5% probabilità)
    ...currentDayData.legendary.map((name, index) => ({
      id: `${day}_legendary_${index + 1}`,
      name: hasImages ? (name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' ')) : '???',
      rarity: 'legendary',
      image: hasImages ? `/images/collectibles/${day}/legendary/${name}.png` : null,
      unlocked: false,
      hasImage: hasImages
    }))
  ];
}



// Mappa dei giorni
const DAY_MAP = {
  0: 'monday',
  1: 'tuesday', 
  2: 'wednesday',
  3: 'thursday',
  4: 'friday',
  5: 'saturday',
  6: 'sunday'
};

// Ottieni i punti per una data specifica
export async function getPointsForDate(userId, dayIndex) {
  try {
    const dayKey = DAY_MAP[dayIndex];
    const today = new Date();
    const targetDate = new Date(today);
    
    // Calcola la data target (lunedì = 0, martedì = 1, etc.)
    const currentDay = today.getDay();
    const targetDay = dayIndex;
    
    // Converti da domenica=0 a lunedì=0
    const adjustedCurrentDay = currentDay === 0 ? 6 : currentDay - 1;
    
    // Calcola la differenza di giorni
    let daysDiff = targetDay - adjustedCurrentDay;
    
    // Se la differenza è positiva, va alla prossima settimana
    if (daysDiff > 0) {
      daysDiff -= 7;
    }
    
    targetDate.setDate(today.getDate() + daysDiff);
    const dateKey = targetDate.toLocaleDateString('en-CA');
    
    const docRef = doc(db, 'users', userId, 'completions', dateKey);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.totalPoints || 0;
    }
    
    return 0;
  } catch (error) {
    console.error('Errore nel recupero punti:', error);
    return 0;
  }
}

// Ottieni i collezionabili per una data specifica
export async function getCollectiblesForDate(userId, dayIndex) {
  try {
    const dayKey = DAY_MAP[dayIndex];
    console.log('Debug - getCollectiblesForDate - dayIndex:', dayIndex, 'dayKey:', dayKey, 'DAY_MAP:', DAY_MAP);
    
    // Usa i dati per il giorno specifico
    const baseCollectibles = COLLECTIBLES_DATA[dayKey];
    
    // Recupera lo stato di sblocco dal database
    const userCollectiblesRef = doc(db, 'users', userId, 'collectibles', dayKey);
    const userCollectiblesSnap = await getDoc(userCollectiblesRef);
    
    if (userCollectiblesSnap.exists()) {
      const userData = userCollectiblesSnap.data();
      // Aggiorna i collezionabili con lo stato di sblocco
      return baseCollectibles.map(item => ({
        ...item,
        unlocked: userData[item.id]?.unlocked || false
      }));
    }
    
    // Se non esistono dati utente, crea la struttura iniziale
    const initialData = {};
    baseCollectibles.forEach(item => {
      initialData[item.id] = { unlocked: false };
    });
    
    await setDoc(userCollectiblesRef, initialData);
    
    return baseCollectibles;
  } catch (error) {
    console.error('Errore nel recupero collezionabili:', error);
    return [];
  }
}

// Sblocca un collezionabile specifico
export async function unlockCollectible(userId, dayIndex, collectibleId) {
  try {
    const dayKey = DAY_MAP[dayIndex];
    const userCollectiblesRef = doc(db, 'users', userId, 'collectibles', dayKey);
    
    await updateDoc(userCollectiblesRef, {
      [`${collectibleId}.unlocked`]: true,
      [`${collectibleId}.unlockedAt`]: new Date()
    });
    
    return true;
  } catch (error) {
    console.error('Errore nello sblocco collezionabile:', error);
    return false;
  }
}

// Apri un regalo per una data specifica
export async function openGiftForDate(userId, dayIndex) {
  try {
    const dayKey = DAY_MAP[dayIndex];
    
    // Controlla se il regalo è già stato aperto
    const giftRef = doc(db, 'users', userId, 'gifts', dayKey);
    const giftSnap = await getDoc(giftRef);
    
    if (giftSnap.exists() && giftSnap.data().opened) {
      throw new Error('Regalo già aperto per questo giorno');
    }
    
    // Genera un collezionabile casuale basato sulle probabilità
    const collectible = generateRandomCollectible(dayKey);
    
    // Sblocca il collezionabile
    await unlockCollectible(userId, dayIndex, collectible.id);
    
    // Marca il regalo come aperto
    await setDoc(giftRef, {
      opened: true,
      openedAt: new Date(),
      collectibleId: collectible.id
    });
    
    return collectible;
  } catch (error) {
    console.error('Errore nell\'apertura regalo:', error);
    throw error;
  }
}

// Genera un collezionabile casuale basato sulle probabilità
function generateRandomCollectible(dayKey) {
  const rand = Math.random();
  
  if (rand < 0.60) {
    // Comune (60%)
    const commonItems = COLLECTIBLES_DATA[dayKey].filter(item => item.rarity === 'common');
    return commonItems[Math.floor(Math.random() * commonItems.length)];
  } else if (rand < 0.85) {
    // Raro (25%)
    const rareItems = COLLECTIBLES_DATA[dayKey].filter(item => item.rarity === 'rare');
    return rareItems[Math.floor(Math.random() * rareItems.length)];
  } else if (rand < 0.95) {
    // Epico (10%)
    const epicItems = COLLECTIBLES_DATA[dayKey].filter(item => item.rarity === 'epic');
    return epicItems[Math.floor(Math.random() * epicItems.length)];
  } else {
    // Leggendario (5%)
    const legendaryItems = COLLECTIBLES_DATA[dayKey].filter(item => item.rarity === 'legendary');
    return legendaryItems[Math.floor(Math.random() * legendaryItems.length)];
  }
}

// Controlla se un regalo può essere aperto per una data
export async function canOpenGiftForDate(userId, dayIndex) {
  try {
    const dayKey = DAY_MAP[dayIndex];
    
    // Controlla se il regalo è già stato aperto
    const giftRef = doc(db, 'users', userId, 'gifts', dayKey);
    const giftSnap = await getDoc(giftRef);
    
    if (giftSnap.exists() && giftSnap.data().opened) {
      return false;
    }
    
    // Controlla se ha 100+ punti per quel giorno
    const points = await getPointsForDate(userId, dayIndex);
    return points >= 100;
  } catch (error) {
    console.error('Errore nel controllo regalo:', error);
    return false;
  }
}

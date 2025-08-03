import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { save } from '../utils/storage';
import { ChevronRightIcon } from '@heroicons/react/24/solid';
import { CubeIcon } from '@heroicons/react/24/outline';
import useAuth from '../hooks/useAuth';

export default function SetupWizard() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState('right');
  const [key, setKey] = useState(0);
  const [showValidation, setShowValidation] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [completionProgress, setCompletionProgress] = useState(0);
  const [data, setData] = useState({
    baseActivities: ['', '', '', '', ''],
    sleep: { bedtime: '23:00', wakeup: '07:00' },
    dailyActivities: [],
    malus: ['', '', '', '', '']
  });
  const navigate = useNavigate();
  const { user } = useAuth();

  // Lista delle abitudini casuali
  const randomHabits = [
    'Rifai il letto',
    'Apri finestre 10 min',
    'Bevi 1 bicchiere d\'acqua al risveglio',
    'Lavati i denti 2 volte',
    'Usa filo interdentale 1 volta',
    'Collutorio 1 volta',
    'Doccia 1 volta',
    'Idrata la pelle 1 volta',
    'Bevi 8 bicchieri d\'acqua',
    'Mangia 1 frutto',
    'Mangia 1 porzione di verdura',
    'Colazione seduto 10 min',
    'Cammina 20 min',
    'Stretching 5 min',
    '20 squat',
    '10 flessioni',
    'Plank 1 min',
    'Respira 10 respiri profondi',
    'Medita 5 min',
    'Leggi 5 pagine',
    'Scrivi 3 priorità',
    'Rivedi le priorità a fine giorno',
    'Diario: 3 righe',
    'Gratitudine: 1 cosa',
    'No social 30 min al risveglio',
    'Schermo off 30 min prima di dormire',
    'Dormi 7 ore',
    'A letto entro 23:30',
    'Archivia 10 email',
    'Elimina 5 foto',
    'Disinstalla 1 app inutile',
    'Backup rapido 1 volta',
    'Riordina 10 min',
    'Lava i piatti entro 30 min',
    'Pulisci piano cucina 1 volta',
    'Butta 1 oggetto inutile',
    'Controlla il frigo 1 volta',
    'Prepara vestiti per domani',
    'Registra 1 spesa',
    'Controlla saldo 1 volta',
    'Risparmia 2 €',
    'Bevi 1 tisana senza zucchero',
    '3 pause postura',
    'Pausa occhi 3×20s',
    '10 min all\'aria aperta',
    '1 messaggio a un amico',
    'Fai 1 complimento',
    '5 min di ordine digitale',
    'Caffè ≤2',
    'Alcol 0 unità'
  ];

  // Lista dei malus casuali
  const randomMalus = [
    'Mangiare cibo spazzatura',
    'Bere bevande zuccherate',
    'Saltare la colazione',
    'Mangiare troppo velocemente',
    'Mangiare davanti alla TV',
    'Bere alcolici',
    'Fumare sigarette',
    'Usare il telefono a letto',
    'Guardare social media >2h',
    'Giocare ai videogiochi >2h',
    'Guardare TV >3h',
    'Dormire <6 ore',
    'Andare a letto dopo mezzanotte',
    'Saltare la doccia',
    'Non lavarsi i denti',
    'Non fare esercizio fisico',
    'Stare seduti >8h',
    'Non bere acqua',
    'Mangiare fuori orario',
    'Spendere soldi inutili',
    'Comprare online impulsivamente',
    'Mangiare dolci',
    'Bere caffè >3 volte',
    'Saltare i pasti',
    'Mangiare in piedi',
    'Non fare stretching',
    'Non meditare',
    'Non leggere',
    'Non scrivere nel diario',
    'Non controllare le priorità',
    'Non fare backup',
    'Non riordinare',
    'Non lavare i piatti',
    'Non pulire la casa',
    'Non buttare oggetti inutili',
    'Non controllare il frigo',
    'Non preparare i vestiti',
    'Non registrare le spese',
    'Non controllare il saldo',
    'Non risparmiare',
    'Non bere tisane',
    'Non fare pause postura',
    'Non fare pause occhi',
    'Non uscire all\'aria aperta',
    'Non contattare amici',
    'Non fare complimenti',
    'Non ordinare il digitale',
    'Bere >2 caffè',
    'Bere alcolici'
  ];

  // Funzione per generare un'abitudine casuale
  const generateRandomHabit = () => {
    const randomIndex = Math.floor(Math.random() * randomHabits.length);
    return randomHabits[randomIndex];
  };

  // Funzione per generare un malus casuale
  const generateRandomMalus = () => {
    const randomIndex = Math.floor(Math.random() * randomMalus.length);
    return randomMalus[randomIndex];
  };

  const totalSteps = 7; // Aumentato per includere le due pagine di benvenuto

  const handleNext = () => {
    if (step < totalSteps) {
      // Validazione per le attività base (step 4)
      if (step === 4) {
        const allActivitiesFilled = data.baseActivities.every(activity => activity.trim() !== '');
        if (!allActivitiesFilled) {
          setShowValidation(true);
          return; // Non permette di continuare
        }
      }
      
      // Validazione per i malus (step 7)
      if (step === 7) {
        const allMalusFilled = data.malus.every(malus => malus.trim() !== '');
        if (!allMalusFilled) {
          setShowValidation(true);
          return; // Non permette di continuare
        }
      }
      
      setShowValidation(false); // Reset validation quando si cambia step
      setDirection('right');
      setKey(prev => prev + 1);
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setShowValidation(false); // Reset validation quando si torna indietro
      setDirection('left');
      setKey(prev => prev + 1);
      setStep(step - 1);
    }
  };

  const handleSave = () => {
    save(data, user?.uid);
    setShowCompletion(true);
    
    // Avvia il timer per il cerchio di completamento (5 secondi)
    const startTime = Date.now();
    const duration = 5000; // 5 secondi
    
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      setCompletionProgress(progress);
      
      if (progress < 100) {
        requestAnimationFrame(updateProgress);
      } else {
        // Dopo 10 secondi, naviga alla dashboard con animazione
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
      }
    };
    
    requestAnimationFrame(updateProgress);
  };

  const updateBaseActivity = (index, value) => {
    const newActivities = [...data.baseActivities];
    newActivities[index] = value;
    setData({ ...data, baseActivities: newActivities });
    
    // Reset showValidation se tutte le attività sono completate
    const updatedActivities = [...newActivities];
    updatedActivities[index] = value;
    const allActivitiesFilled = updatedActivities.every(activity => activity.trim() !== '');
    if (allActivitiesFilled) {
      setShowValidation(false);
    }
  };

  const updateSleep = (field, value) => {
    setData({ ...data, sleep: { ...data.sleep, [field]: value } });
  };

  const addDailyActivity = () => {
    const newActivity = {
      name: '',
      days: [],
      partOfDay: 'morning',
      repeat: 1,
      createdAt: new Date().toISOString()
    };
    setData({
      ...data,
      dailyActivities: [...data.dailyActivities, newActivity]
    });
  };

  const updateDailyActivity = (index, field, value) => {
    const newActivities = [...data.dailyActivities];
    newActivities[index] = { ...newActivities[index], [field]: value };
    setData({ ...data, dailyActivities: newActivities });
  };

  const removeDailyActivity = (index) => {
    const newActivities = data.dailyActivities.filter((_, i) => i !== index);
    setData({ ...data, dailyActivities: newActivities });
  };

  const updateMalus = (index, value) => {
    const newMalus = [...data.malus];
    newMalus[index] = value;
    setData({ ...data, malus: newMalus });
    
    // Reset showValidation se tutti i malus sono completati
    const updatedMalus = [...newMalus];
    updatedMalus[index] = value;
    const allMalusFilled = updatedMalus.every(malus => malus.trim() !== '');
    if (allMalusFilled) {
      setShowValidation(false);
    }
  };

  const renderCompletionStep = () => {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center items-center">
        <div className="animate-fade-in-up text-center">
          <h1 className="text-3xl font-bold mb-6">🎉 Complimenti!</h1>
          <p className="text-lg mb-8 px-4">
            Hai completato la configurazione di MossyPath.<br />
            Buona fortuna per il tuo percorso!
          </p>
          
          {/* Cerchio di progresso */}
          <div className="relative w-32 h-32 mx-auto mb-8">
            {/* Cerchio di sfondo */}
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
                className="dark:stroke-gray-600"
              />
              {/* Cerchio di progresso */}
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="#10b981"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 54}`}
                strokeDashoffset={`${2 * Math.PI * 54 * (1 - completionProgress / 100)}`}
                className="transition-all duration-100 ease-linear"
              />
            </svg>
            
            {/* Testo centrale */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {Math.round(completionProgress)}%
              </span>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 px-4">
            Preparazione in corso...
          </p>
        </div>
      </div>
    );
  };

  const renderStep = () => {
    // Se siamo nella schermata di completamento, mostra il passo 8
    if (showCompletion) {
      return renderCompletionStep();
    }
    
    switch (step) {
      case 1:
        return (
          <div className="text-center min-h-[60vh] flex flex-col justify-center">
            <div className="animate-fade-in-up">
              <h1 className="text-3xl font-bold mb-6">Benvenuto in MossyPath!</h1>
              <p className="text-lg mb-4 px-4">
                Il tuo compagno ideale per sviluppare buone abitudini e eliminare le cattive dalla tua vita.
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="text-center min-h-[60vh] flex flex-col justify-center">
            <div className="animate-fade-in-up">
              <h1 className="text-3xl font-bold mb-6">Iniziamo il Viaggio</h1>
              <p className="text-lg mb-4 px-4">
                Il nostro obiettivo è rendere questo processo divertente e gratificante, aiutandoti a raggiungere i tuoi traguardi attraverso la gamification.
              </p>
              <p className="text-gray-600 dark:text-gray-400 px-4">
                Le prime due settimane possono essere le più impegnative, quindi non preoccuparti se all'inizio ti sembra difficile organizzarti!
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="text-center min-h-[60vh] flex flex-col justify-center">
            <div className="animate-fade-in-up">
              <h1 className="text-3xl font-bold mb-6">Il Sistema di Punti</h1>
              <p className="text-lg mb-4 px-4">
                Ogni giorno, avrai una serie di attività da completare. Il tuo punteggio giornaliero va da 0 a 100 punti.
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="min-h-[60vh] flex flex-col justify-center">
            <div className="animate-fade-in-up">
              <h1 className="text-3xl font-bold mb-6 text-center">Attività Base</h1>
              <p className="mb-4 text-center px-4">
                Le attività base sono compiti facili e veloci che devono essere svolti ogni giorno. 
                Ogni attività completata vale 10 punti.
              </p>
              {showValidation && data.baseActivities.some(activity => activity.trim() === '') && (
                <p className="text-red-500 text-sm text-center mb-4 px-4">
                  Completa tutte le 5 attività per continuare
                </p>
              )}
              <div className="px-4">
                {data.baseActivities.map((activity, index) => {
                  const isEmpty = activity.trim() === '';
                  const hasContent = activity.trim() !== '';
                  
                  return (
                    <div key={index} className={index > 0 ? "mt-2" : ""}>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder={`Attività ${index + 1}`}
                          value={activity}
                          onChange={(e) => updateBaseActivity(index, e.target.value)}
                          className={`w-full h-12 px-3 py-2 pr-12 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                            hasContent 
                              ? 'border-green-500 ring-green-500' 
                              : isEmpty && showValidation
                              ? 'border-red-500 ring-red-500' 
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => updateBaseActivity(index, generateRandomHabit())}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors duration-200 hover:scale-110"
                          title="Genera abitudine casuale"
                        >
                          <CubeIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="min-h-[60vh] flex flex-col justify-center">
            <div className="animate-fade-in-up">
              <h1 className="text-3xl font-bold mb-6 text-center">Sonno</h1>
              <p className="mb-6 text-center px-4">
                Indica l'orario in cui vuoi andare a letto e svegliarti nei giorni feriali. 
                Ogni orario rispettato vale 15 punti nella tua giornata.
              </p>
              <div className="space-y-4 px-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Orario di andare a letto:</label>
                  <input
                    type="time"
                    value={data.sleep.bedtime}
                    onChange={(e) => updateSleep('bedtime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Orario di sveglia:</label>
                  <input
                    type="time"
                    value={data.sleep.wakeup}
                    onChange={(e) => updateSleep('wakeup', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="min-h-[60vh] flex flex-col justify-center">
            <div className="animate-fade-in-up">
              <h1 className="text-3xl font-bold mb-6 text-center">Attività Quotidiane</h1>
              <p className="mb-6 text-center px-4">
                Aggiungi attività che desideri svolgere ogni mattina e pomeriggio. 
                Se completi tutte le attività di una parte del giorno, accumuli 10 punti.
                (Se vuoi aggiungerle in futuro, fai avanti)
              </p>
              
              <div className="mb-4 px-4">
                <button onClick={addDailyActivity} className="btn-primary w-full">
                  Aggiungi Attività
                </button>
              </div>

                            <div className="px-4 space-y-3 max-h-80 overflow-y-auto">
                {data.dailyActivities.map((activity, index) => (
                  <div key={index} className="glass p-3">
                    <div className="flex justify-between items-center mb-3">
                      <input
                        type="text"
                        placeholder="Nome attività"
                        value={activity.name}
                        onChange={(e) => updateDailyActivity(index, 'name', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 mr-3"
                      />
                      <button
                        onClick={() => removeDailyActivity(index)}
                        className="btn-danger text-sm px-3 py-2"
                      >
                        Elimina
                      </button>
                    </div>
                    
                    <div className="mb-3">
                      <div className="grid grid-cols-7 gap-1 ml-4">
                        {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(day => (
                          <label key={day} className="flex flex-col items-center text-xs">
                            <input
                              type="checkbox"
                              checked={activity.days.includes(day)}
                              onChange={(e) => {
                                const newDays = e.target.checked
                                  ? [...activity.days, day]
                                  : activity.days.filter(d => d !== day);
                                updateDailyActivity(index, 'days', newDays);
                              }}
                              className="mb-1"
                            />
                            <span>{day}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium mb-1">Parte del giorno:</label>
                        <select
                          value={activity.partOfDay}
                          onChange={(e) => updateDailyActivity(index, 'partOfDay', e.target.value)}
                          className="select"
                        >
                          <option value="morning">Mattina</option>
                          <option value="afternoon">Pomeriggio</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Ripeti ogni:</label>
                        <select
                          value={activity.repeat}
                          onChange={(e) => updateDailyActivity(index, 'repeat', parseInt(e.target.value))}
                          className="select"
                        >
                          <option value={1}>1 settimana</option>
                          <option value={2}>2 settimane</option>
                          <option value={3}>3 settimane</option>
                          <option value={4}>4 settimane</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="min-h-[60vh] flex flex-col justify-center">
            <div className="animate-fade-in-up">
              <h1 className="text-3xl font-bold mb-6 text-center">Malus</h1>
              <p className="mb-4 text-center px-4">
                I "Malus" sono cattive abitudini che desideri eliminare dalla tua vita. 
                Ogni malus completato toglie 10 punti.
              </p>
              {showValidation && data.malus.some(malus => malus.trim() === '') && (
                <p className="text-red-500 text-sm text-center mb-4 px-4">
                  Completa tutti i 5 malus per continuare
                </p>
              )}
              <div className="px-4">
                {data.malus.map((malus, index) => {
                  const isEmpty = malus.trim() === '';
                  const hasContent = malus.trim() !== '';
                  
                  return (
                    <div key={index} className={index > 0 ? "mt-2" : ""}>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder={`Malus ${index + 1}`}
                          value={malus}
                          onChange={(e) => updateMalus(index, e.target.value)}
                          className={`w-full h-12 px-3 py-2 pr-12 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                            hasContent 
                              ? 'border-green-500 ring-green-500' 
                              : isEmpty && showValidation
                              ? 'border-red-500 ring-red-500' 
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => updateMalus(index, generateRandomMalus())}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors duration-200 hover:scale-110"
                          title="Genera malus casuale"
                        >
                          <CubeIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      {/* Animazioni continue di sfondo */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 w-2 h-3 bg-emerald-600 rounded-full animate-fall-slow opacity-70"></div>
        <div className="absolute top-20 right-20 w-1.5 h-2 bg-lime-600 rounded-full animate-fall-slower opacity-60"></div>
        <div className="absolute top-32 left-32 w-2.5 h-3.5 bg-emerald-500 rounded-full animate-fall-fast opacity-50"></div>
        <div className="absolute top-15 left-1/4 w-1.5 h-2 bg-emerald-400 rounded-full animate-fall-slow opacity-60"></div>
        <div className="absolute top-25 right-1/3 w-2 h-2.5 bg-lime-500 rounded-full animate-fall-slower opacity-50"></div>
        <div className="absolute top-40 left-2/3 w-1.8 h-2.2 bg-emerald-300 rounded-full animate-fall-fast opacity-40"></div>
        <div className="absolute top-50 right-1/4 w-1.2 h-1.8 bg-lime-400 rounded-full animate-fall-slow opacity-55"></div>
        <div className="absolute top-8 left-1/3 w-3 h-4 bg-emerald-500 rounded-full animate-fall-slower opacity-65"></div>
        <div className="absolute top-12 right-1/4 w-1 h-1.5 bg-lime-400 rounded-full animate-fall-slow opacity-45"></div>
        <div className="absolute top-18 left-2/3 w-2.2 h-2.8 bg-emerald-400 rounded-full animate-fall-fast opacity-55"></div>
        <div className="absolute top-28 right-1/2 w-1.8 h-2.3 bg-lime-500 rounded-full animate-fall-slower opacity-50"></div>
        <div className="absolute top-35 left-1/5 w-1.3 h-1.7 bg-emerald-300 rounded-full animate-fall-slow opacity-40"></div>
        <div className="absolute top-45 right-1/6 w-2.5 h-3.2 bg-lime-400 rounded-full animate-fall-fast opacity-60"></div>
        <div className="absolute top-22 left-3/4 w-1.6 h-2.1 bg-emerald-500 rounded-full animate-fall-slower opacity-55"></div>
        <div className="absolute top-38 right-3/4 w-1.1 h-1.4 bg-lime-300 rounded-full animate-fall-slow opacity-35"></div>
        <div className="absolute top-55 left-1/2 w-2.8 h-3.5 bg-emerald-400 rounded-full animate-fall-fast opacity-65"></div>
        <div className="absolute bottom-10 left-10 w-1 h-1 bg-emerald-400 rounded-full animate-float-moss opacity-40"></div>
        <div className="absolute bottom-20 right-20 w-1.5 h-1.5 bg-lime-400 rounded-full animate-float-moss-slow opacity-50"></div>
        <div className="absolute bottom-30 left-1/3 w-1.3 h-1.3 bg-emerald-300 rounded-full animate-float-moss-fast opacity-45"></div>
        <div className="absolute bottom-40 right-1/3 w-1.1 h-1.1 bg-lime-300 rounded-full animate-float-moss-slow opacity-35"></div>
      </div>

      {/* Header decorativo animato */}
      <div className="relative pt-8 pb-4 px-4">
        <div className="max-w-md mx-auto">
          {/* Logo e titolo animato */}
          <div className="text-center mb-6">
            <div className="relative inline-block mb-4">
              {/* Icona foglia animata */}
              <div className="w-16 h-16 mx-auto relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-lime-500 rounded-full animate-float opacity-80"></div>
                <div className="absolute inset-2 bg-gradient-to-br from-emerald-500 to-lime-600 rounded-full animate-float-slow"></div>
                <div className="absolute inset-4 bg-gradient-to-br from-emerald-600 to-lime-700 rounded-full animate-float"></div>
                {/* Foglia stilizzata */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-emerald-300 rounded-full animate-dew-drop flex items-center justify-center">
                    {/* Faccina stilizzata */}
                    <div className="w-4 h-4 flex flex-col justify-center items-center">
                      {/* Occhi */}
                      <div className="flex justify-between w-full mb-1">
                        <div className="w-1 h-1 bg-emerald-700 rounded-full"></div>
                        <div className="w-1 h-1 bg-emerald-700 rounded-full"></div>
                      </div>
                      {/* Sorriso felice */}
                      <div className="w-3 h-1 bg-emerald-700 rounded-b-full mt-0.5"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Particelle decorative */}
              <div className="absolute -top-2 -left-2 w-3 h-3 bg-emerald-400 rounded-full animate-float-moss-fast opacity-60"></div>
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-lime-400 rounded-full animate-float-moss-slow opacity-70"></div>
              <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-float-moss opacity-50"></div>
            </div>
            

            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent mx-auto animate-grow-moss"></div>
          </div>




        </div>
      </div>

      {/* Contenuto principale */}
      <div className="flex-1 flex flex-col justify-start -mt-4 px-4">
        <div 
          key={key}
          className={`glass p-6 max-w-md mx-auto w-full ${
            showCompletion ? '' : direction === 'right' ? 'animate-slide-in-right' : 'animate-slide-in-left'
          }`}
        >
          {renderStep()}
        </div>
        
        {/* Indicatori di progresso decorativi - nascosti durante il completamento */}
        {!showCompletion && (
          <div className="flex justify-center items-center space-x-2 mt-8 mb-8">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i < step 
                    ? 'w-4 h-4 bg-emerald-500 animate-bounce-in' 
                    : i === step - 1 
                    ? 'w-4 h-4 bg-emerald-400 animate-pulse' 
                    : 'w-3 h-3 bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Barra di progresso e navigazione - nascosta durante il completamento */}
      {!showCompletion && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/30 dark:bg-black/30 backdrop-blur-xl">
          <div className="max-w-md mx-auto">
            {/* Pulsanti di navigazione */}
            <div className="flex justify-between items-center py-1">
              {step > 1 ? (
                <button onClick={handlePrev} className="btn-ghost h-10 flex items-center justify-center translate-y-1">
                  Indietro
                </button>
              ) : (
                <div className="w-16 h-10"></div>
              )}
              
              {step < totalSteps ? (
                <button 
                  onClick={handleNext} 
                  className="btn-primary flex items-center justify-center gap-2 h-10 -translate-y-2"
                >
                  Continua
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              ) : (
                <button 
                  onClick={() => {
                    // Validazione finale per i malus
                    const allMalusFilled = data.malus.every(malus => malus.trim() !== '');
                    if (!allMalusFilled) {
                      setShowValidation(true);
                      return;
                    }
                    handleSave();
                  }}
                  className="btn-primary flex items-center justify-center gap-2 h-10 -translate-y-2"
                >
                  Inizia MossyPath!
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
} 
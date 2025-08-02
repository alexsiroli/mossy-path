import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { load, save } from '../utils/storage';

export default function SetupWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [baseActivities, setBaseActivities] = useState(Array(5).fill(''));
  const [bedtime, setBedtime] = useState('22:30');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [dailyActivities, setDailyActivities] = useState([]);
  const [malus, setMalus] = useState(Array(5).fill({ name: '', weekdaysOnly: true }));
  const [newDaily, setNewDaily] = useState({
    name: '',
    partOfDay: 'morning',
    days: [],
    repeat: 1,
  });

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(0, s - 1));

  const handleSave = () => {
    const data = load();
    const todayKey = new Date().toISOString().split('T')[0];
    save({
      ...data,
      baseActivities,
      sleep: { bedtime, wakeTime },
      dailyActivities: dailyActivities.map((a) => ({ ...a, createdAt: todayKey })),
      malus,
    });
    navigate('/dashboard');
  };

  return (
    <main>
      {step === 0 && (
        <section>
          <h1>Game Life</h1>
          <p>
            GameLife è il tuo compagno ideale per sviluppare buone abitudini e eliminare le cattive
            dalla tua vita. Il nostro obiettivo è rendere questo processo divertente e gratificante,
            aiutandoti a raggiungere i tuoi traguardi attraverso la gamification. Prima di iniziare,
            tieni presente che è consigliabile iniziare con attività semplici e gradualmente aumentare
            la complessità. Le prime due settimane possono essere le più impegnative, quindi non
            preoccuparti se all'inizio ti sembra difficile organizzarti!
          </p>
          <button onClick={next} className="btn-primary">Avanti</button>
        </section>
      )}

      {step === 1 && (
        <section>
          <p>
            Ogni giorno, avrai una serie di attività da completare. Se riesci a portare a termine
            tutte queste attività, guadagnerai 100 punti. Al contrario, se non ne svolgi nemmeno una,
            non otterrai alcun punto. Questo sistema è stato progettato per misurare con chiarezza e
            nel tempo la tua costanza e la tua forza di volontà.
          </p>
          <button onClick={back}>Indietro</button>
          <button onClick={next} className="btn-primary">Avanti</button>
        </section>
      )}

      {step === 2 && (
        <section>
          <h2>Attività base (5)</h2>
          {baseActivities.map((val, idx) => (
            <div key={idx}>
              <input
                type="text"
                placeholder={`Attività ${idx + 1}`}
                value={val}
                onChange={(e) => {
                  const arr = [...baseActivities];
                  arr[idx] = e.target.value;
                  setBaseActivities(arr);
                }}
              />
            </div>
          ))}
          <button onClick={back}>Indietro</button>
          <button onClick={next} disabled={baseActivities.some((a) => !a.trim())}>
            Avanti
          </button>
        </section>
      )}

      {step === 3 && (
        <section>
          <h2>Ciclo Sonno/Veglia</h2>
          <div>
            <label>
              Orario per andare a letto:
              <input type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)} />
            </label>
          </div>
          <div>
            <label>
              Orario di sveglia:
              <input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} />
            </label>
          </div>
          <button onClick={back}>Indietro</button>
          <button onClick={next} className="btn-primary">Avanti</button>
        </section>
      )}

      {step === 4 && (
        <section>
          <h2>Attività quotidiane</h2>
          <p>Aggiungi attività mattina/pomeriggio, specifica i giorni e ogni quante settimane.</p>
          <div>
            <input
              type="text"
              placeholder="Nome attività"
              value={newDaily.name}
              onChange={(e) => setNewDaily({ ...newDaily, name: e.target.value })}
            />
            <select
              className="select"
              value={newDaily.partOfDay}
              onChange={(e) => setNewDaily({ ...newDaily, partOfDay: e.target.value })}
            >
              <option value="morning">Mattina</option>
              <option value="afternoon">Pomeriggio</option>
            </select>
            <select
              multiple
              className="select h-32"
              value={newDaily.days}
              onChange={(e) =>
                setNewDaily({
                  ...newDaily,
                  days: Array.from(e.target.selectedOptions, (opt) => opt.value),
                })
              }
            >
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              value={newDaily.repeat}
              onChange={(e) => setNewDaily({ ...newDaily, repeat: Number(e.target.value) })}
            />
            <button
              onClick={() => {
                if (!newDaily.name.trim() || newDaily.days.length === 0) return;
                setDailyActivities([...dailyActivities, newDaily]);
                setNewDaily({ name: '', partOfDay: 'morning', days: [], repeat: 1 });
              }}
            >
              Aggiungi
            </button>
          </div>
          <ul>
            {dailyActivities.map((a, i) => (
              <li key={i}>{`${a.name} (${a.partOfDay})`}</li>
            ))}
          </ul>
          <button onClick={back}>Indietro</button>
          <button onClick={next} className="btn-primary">Avanti</button>
        </section>
      )}

      {step === 5 && (
        <section>
          <h2>Malus (5)</h2>
          {malus.map((m, idx) => (
            <div key={idx}>
              <input
                type="text"
                placeholder={`Malus ${idx + 1}`}
                value={m.name}
                onChange={(e) => {
                  const arr = [...malus];
                  arr[idx] = { ...arr[idx], name: e.target.value };
                  setMalus(arr);
                }}
              />
              <select
                className="select"
                value={m.weekdaysOnly ? 'weekday' : 'all'}
                onChange={(e) => {
                  const arr = [...malus];
                  arr[idx] = { ...arr[idx], weekdaysOnly: e.target.value === 'weekday' };
                  setMalus(arr);
                }}
              >
                <option value="weekday">Solo feriali</option>
                <option value="all">Anche festivi</option>
              </select>
            </div>
          ))}
          <button onClick={back}>Indietro</button>
          <button
            onClick={next}
            disabled={malus.some((m) => !m.name.trim())}
          >
            Avanti
          </button>
        </section>
      )}

      {step === 6 && (
        <section>
          <h2>Finito!</h2>
          <p>Hai completato la configurazione iniziale. Premi "Inizia" per salvare e cominciare.</p>
          <button onClick={back}>Indietro</button>
          <button onClick={handleSave} className="btn-primary">Inizia</button>
        </section>
      )}
    </main>
  );
} 
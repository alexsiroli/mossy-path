import { useState } from 'react';
import { load, save, clear } from '../utils/storage';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const initial = load(user?.uid);

  const [baseActivities, setBaseActivities] = useState(initial.baseActivities || Array(5).fill(''));
  const [bedtime, setBedtime] = useState(initial.sleep?.bedtime || '22:30');
  const [wakeTime, setWakeTime] = useState(initial.sleep?.wakeTime || '07:00');
  const [malus, setMalus] = useState(initial.malus || Array(5).fill({ name: '', weekdaysOnly: true }));
  const [dailyActivities, setDailyActivities] = useState(initial.dailyActivities || []);

  const handleSave = () => {
    const data = load(user?.uid);
    save({
      ...data,
      baseActivities,
      sleep: { bedtime, wakeTime },
      malus,
      dailyActivities,
    }, user?.uid);
    alert('Impostazioni salvate');
    // Torna alla pagina precedente dopo il salvataggio
    navigate(-1);
  };

  const resetData = () => {
    if (confirm('Sicuro di voler cancellare tutti i dati e ricominciare?')) {
      clear(user?.uid);
      navigate('/');
      window.location.reload();
    }
  };

  return (
    <main>
      <h1>Impostazioni</h1>

      <section>
        <h2>Attività base</h2>
        {baseActivities.map((a, idx) => (
          <div key={idx}>
            <input
              type="text"
              value={a}
              placeholder={`Attività ${idx + 1}`}
              onChange={(e) => {
                const arr = [...baseActivities];
                arr[idx] = e.target.value;
                setBaseActivities(arr);
              }}
            />
          </div>
        ))}
      </section>

      <section>
        <h2>Orari Sonno/Veglia</h2>
        <label>
          A letto:
          <input type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)} />
        </label>
        <br />
        <label>
          Sveglia:
          <input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} />
        </label>
      </section>

      <section>
        <h2>Malus</h2>
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
      </section>

      <section>
        <h2>Attività quotidiane ricorrenti</h2>
        {dailyActivities.length === 0 && <p className="text-sm text-gray-500">Nessuna attività.</p>}
        <ul>
          {dailyActivities.map((act, idx) => (
            <li key={idx} className="border p-2 my-2 rounded flex justify-between items-center">
              <div>
                <strong>{act.name}</strong> — {act.partOfDay} — repeat ogni {act.repeat} sett.
              </div>
              <button
                className="text-red-600 hover:underline text-sm"
                onClick={() => {
                  const arr = dailyActivities.filter((_, i) => i !== idx);
                  setDailyActivities(arr);
                }}
              >
                Elimina
              </button>
            </li>
          ))}
        </ul>
      </section>

      <button onClick={handleSave} className="btn-primary">
        Salva
      </button>
      <button
        className="ml-4 btn-danger"
        onClick={resetData}
      >
        Cancella tutti i dati e ricomincia
      </button>
    </main>
  );
} 
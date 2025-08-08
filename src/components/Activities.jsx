import { useEffect, useMemo, useState } from 'react';
import SectionTitle from './SectionTitle';
import useAuth from '../hooks/useAuth';
import { load, save } from '../utils/storage';
import { saveWeeklyActivities } from '../utils/db';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/solid';

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const WEEKDAY_LABELS = {
  Lun: 'Lunedì',
  Mar: 'Martedì',
  Mer: 'Mercoledì',
  Gio: 'Giovedì',
  Ven: 'Venerdì',
  Sab: 'Sabato',
  Dom: 'Domenica',
};

export default function Activities() {
  const { user } = useAuth();
  const initial = load(user?.uid);
  const [activities, setActivities] = useState(initial.dailyActivities || []);
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [form, setForm] = useState({ name: '', weekday: 'Lun', partOfDay: 'morning', repeat: 1, offset: 0 });

  useEffect(() => {
    const d = load(user?.uid);
    setActivities(d.dailyActivities || []);
  }, [user?.uid]);

  const grouped = useMemo(() => {
    const map = {};
    WEEKDAYS.forEach((w) => { map[w] = { morning: [], afternoon: [] }; });
    (activities || []).forEach((a) => {
      const w = a.weekday || 'Lun';
      map[w][a.partOfDay === 'afternoon' ? 'afternoon' : 'morning'].push(a);
    });
    return map;
  }, [activities]);

  const openNew = () => {
    setEditingIndex(null);
    setForm({ name: '', weekday: 'Lun', partOfDay: 'morning', repeat: 1, offset: 0 });
    setShowForm(true);
  };

  const openEdit = (idx) => {
    setEditingIndex(idx);
    const a = activities[idx];
    setForm({ name: a.name, weekday: a.weekday || 'Lun', partOfDay: a.partOfDay || 'morning', repeat: a.repeat || 1, offset: a.offset || 0 });
    setShowForm(true);
  };

  const persist = async (list) => {
    const data = load(user?.uid);
    const updated = { ...data, dailyActivities: list };
    save(updated, user?.uid);
    setActivities(list);
    await saveWeeklyActivities(user?.uid, list);
  };

  const submit = async () => {
    if (!form.name.trim()) return;
    const payload = { ...form, repeat: Math.max(1, Number(form.repeat || 1)), offset: Math.max(0, Number(form.offset || 0)), createdAt: new Date().toISOString() };
    if (editingIndex === null) {
      await persist([payload, ...activities]);
    } else {
      const list = [...activities];
      list[editingIndex] = { ...payload, createdAt: list[editingIndex].createdAt || payload.createdAt };
      await persist(list);
    }
    // Close modal after submit per new requirement
    setShowForm(false);
    setEditingIndex(null);
  };

  const remove = async (idx) => {
    const list = activities.filter((_, i) => i !== idx);
    await persist(list);
  };

  return (
    <>
      <SectionTitle title="Attività">
        <button onClick={openNew} className="bg-emerald-500/70 dark:bg-emerald-600/70 backdrop-blur-md text-white flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300 shadow-lg hover:bg-emerald-600/80 dark:hover:bg-emerald-700/80">
          <PlusIcon className="h-4 w-4" />
          <span>Nuova attività</span>
        </button>
      </SectionTitle>

      <div className="animate-fade-in-up mt-40">
        {WEEKDAYS.map((w) => (
          <div key={w} className="mb-6">
            <h3 className="text-lg font-semibold mb-2 ml-1 text-emerald-600 dark:text-emerald-400">{WEEKDAY_LABELS[w]}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {['morning','afternoon'].map((part) => (
                <div key={part} className="bg-white/30 dark:bg-black/30 backdrop-blur-xl ring-1 ring-white/50 dark:ring-white/10 rounded-xl p-3">
                  <div className="font-semibold mb-2">{part === 'morning' ? 'Mattina' : 'Pomeriggio'}</div>
                  {grouped[w][part].length === 0 && <p className="text-sm text-gray-500">Nessuna attività</p>}
                  <ul className="space-y-2">
                    {grouped[w][part].map((a, idx) => {
                      const globalIdx = activities.findIndex((x) => x === a);
                      return (
                        <li key={idx} className="flex items-center justify-between p-2 bg-white/20 dark:bg-black/20 rounded-lg">
                          <div>
                            <div className="font-medium">{a.name}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Ogni {a.repeat || 1} sett.{(a.offset || 0) > 0 ? ` (offset ${a.offset})` : ''}</div>
                          </div>
                          <div className="flex gap-2">
                            <button className="p-1 rounded hover:bg-white/20" onClick={() => openEdit(globalIdx)} aria-label="Modifica"><PencilIcon className="h-4 w-4" /></button>
                            <button className="p-1 rounded hover:bg-red-500/10 text-red-600" onClick={() => remove(globalIdx)} aria-label="Elimina"><TrashIcon className="h-4 w-4" /></button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)}></div>
          <div className="relative w-full max-w-md bg-white/30 dark:bg-black/30 backdrop-blur-xl ring-1 ring-white/50 dark:ring-white/10 rounded-2xl shadow-2xl p-4">
            <h3 className="text-lg font-semibold mb-3 text-emerald-700 dark:text-emerald-300">{editingIndex === null ? 'Nuova attività' : 'Modifica attività'}</h3>
            <div className="space-y-3">
              <input type="text" className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="Nome attività" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <select className="select" value={form.weekday} onChange={(e) => setForm({ ...form, weekday: e.target.value })}>
                  {WEEKDAYS.map((w) => (<option key={w} value={w}>{WEEKDAY_LABELS[w]}</option>))}
                </select>
                <select className="select" value={form.partOfDay} onChange={(e) => setForm({ ...form, partOfDay: e.target.value })}>
                  <option value="morning">Mattina</option>
                  <option value="afternoon">Pomeriggio</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2 items-center">
                <label className="block text-sm">Ripeti ogni</label>
                <div>
                  <input type="number" min="1" className="w-20 px-2 py-1 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" value={form.repeat} onChange={(e) => setForm({ ...form, repeat: Math.max(1, Number(e.target.value||1)) })} /> <span className="ml-1 text-sm">sett.</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 items-center">
                <label className="block text-sm">Offset (settimane)</label>
                <input type="number" min="0" className="w-20 px-2 py-1 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" value={form.offset} onChange={(e) => setForm({ ...form, offset: Math.max(0, Number(e.target.value||0)) })} />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700" onClick={() => setShowForm(false)}>Annulla</button>
              <button className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white" onClick={submit}>{editingIndex === null ? 'Crea' : 'Salva'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

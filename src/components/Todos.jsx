import { useState, useEffect, useRef } from 'react';
import SectionTitle from './SectionTitle';
import { load, save } from '../utils/storage';
import { saveTodosRemote } from '../utils/db';
import useAuth from '../hooks/useAuth';
import { PlusIcon, TrashIcon, PencilIcon, CheckIcon, XMarkIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

// Emoji predefiniti tra cui scegliere
const EMOJIS = ['📝', '🔖', '📌', '📋', '📚', '🎯', '🏆', '🛒', '🧹', '🎁', '🏠', '🚗', '✈️', '🏖️', '🍽️', '🎮', '💼', '💻', '📱', '🔧', '🎨', '🎵', '⚽', '🎪', '🌱', '🌸', '🌙', '⭐', '🔥', '💎', '🎭', '🎨'];

export default function Todos() {
  const { user } = useAuth();
  const [lists, setLists] = useState([]);
  const [expandedListId, setExpandedListId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [hasTriedToCreate, setHasTriedToCreate] = useState(false);
  const [addingItemToListId, setAddingItemToListId] = useState(null);
  const [newItemText, setNewItemText] = useState('');
  const [hasTriedToAddItem, setHasTriedToAddItem] = useState(false);
  const [newList, setNewList] = useState({ 
    emoji: '📝', 
    title: '', 
    items: [{ text: '', completed: false }],
    completed: false,
    id: null,
    createdAt: null
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingListId, setEditingListId] = useState(null);

  // Carica le liste dal localStorage
  useEffect(() => {
    const userData = load(user?.uid);
    if (userData && userData.todoLists) {
      setLists(userData.todoLists);
    } else {
      setLists([]);
    }
  }, [user?.uid]);

  // Salva le liste nel localStorage
  const saveLists = (newLists) => {
    const userData = load(user?.uid) || {};
    save({ ...userData, todoLists: newLists }, user?.uid);
    setLists(newLists);

    void saveTodosRemote(user?.uid, newLists);
  };

  // Gestisce l'espansione/collasso di una lista
  const toggleExpand = (listId) => {
    setExpandedListId(expandedListId === listId ? null : listId);
  };
  
  // Riferimento per gestire il focus sul nuovo elemento
  const newItemRef = useRef(null);

  // Calcola la percentuale di completamento di una lista
  const calculateProgress = (items) => {
    if (!items || items.length === 0) return 0;
    const completedItems = items.filter(item => item.completed).length;
    return Math.round((completedItems / items.length) * 100);
  };

  // Verifica se una lista è completamente completata
  const isListCompleted = (items) => {
    return items.length > 0 && items.every(item => item.completed);
  };

  // Gestisce il toggle di un item
  const toggleItem = (listId, itemIndex) => {
    const updatedLists = lists.map(list => {
      if (list.id === listId) {
        const updatedItems = [...list.items];
        updatedItems[itemIndex] = { 
          ...updatedItems[itemIndex], 
          completed: !updatedItems[itemIndex].completed 
        };
        
        // Aggiorna lo stato completed della lista
        const allCompleted = updatedItems.every(item => item.completed);
        
        return { 
          ...list, 
          items: updatedItems,
          completed: allCompleted
        };
      }
      return list;
    });
    
    saveLists(updatedLists);
  };

  // Aggiunge un nuovo item a una lista
  const addItemToList = (listId) => {
    setAddingItemToListId(listId);
    setNewItemText('');
    setHasTriedToAddItem(false);
  };

  // Conferma l'aggiunta di un nuovo item
  const confirmAddItem = () => {
    if (!newItemText.trim()) {
      setHasTriedToAddItem(true);
      return;
    }

    const updatedLists = lists.map(list => {
      if (list.id === addingItemToListId) {
        return { 
          ...list, 
          items: [...list.items, { text: newItemText.trim(), completed: false }],
          completed: false // Quando si aggiunge un nuovo item, la lista non è più completata
        };
      }
      return list;
    });
    
    saveLists(updatedLists);
    setAddingItemToListId(null);
    setNewItemText('');
    setHasTriedToAddItem(false);
  };

  // Cancella l'aggiunta di un nuovo item
  const cancelAddItem = () => {
    setAddingItemToListId(null);
    setNewItemText('');
    setHasTriedToAddItem(false);
  };

  // Rimuove un item da una lista
  const removeItemFromList = (listId, itemIndex) => {
    const updatedLists = lists.map(list => {
      if (list.id === listId) {
        const updatedItems = list.items.filter((_, idx) => idx !== itemIndex);
        
        // Aggiorna lo stato completed della lista
        const allCompleted = updatedItems.length > 0 && updatedItems.every(item => item.completed);
        
        return { 
          ...list, 
          items: updatedItems,
          completed: allCompleted
        };
      }
      return list;
    });
    
    saveLists(updatedLists);
  };

  // Aggiorna il testo di un item
  const updateItemText = (listId, itemIndex, text) => {
    const updatedLists = lists.map(list => {
      if (list.id === listId) {
        const updatedItems = [...list.items];
        updatedItems[itemIndex] = { ...updatedItems[itemIndex], text };
        return { ...list, items: updatedItems };
      }
      return list;
    });
    
    saveLists(updatedLists);
  };

  // Crea una nuova lista
  const createNewList = () => {
    setHasTriedToCreate(true);
    
    if (!newList.title.trim()) return;
    
    // Verifica che tutti gli elementi abbiano un testo
    const validItems = newList.items.filter(item => item.text.trim() !== '');
    if (validItems.length === 0) return; // Non creare la lista se non ci sono elementi validi
    
    const listWithValidItems = {
      ...newList,
      items: validItems,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      completed: false
    };
    
    const updatedLists = [listWithValidItems, ...lists];
    saveLists(updatedLists);
    
    // Reset del form
    setNewList({ 
      emoji: '📝', 
      title: '', 
      items: [{ text: '', completed: false }],
      completed: false,
      id: null,
      createdAt: null
    });
    setIsCreating(false);
    setHasTriedToCreate(false);
  };

  // Elimina una lista
  const deleteList = (listId) => {
    const updatedLists = lists.filter(list => list.id !== listId);
    saveLists(updatedLists);
    if (expandedListId === listId) {
      setExpandedListId(null);
    }
  };

  // Sposta un item verso l'alto
  const moveItemUp = (listId, itemIndex) => {
    if (itemIndex === 0) return;
    
    const updatedLists = lists.map(list => {
      if (list.id === listId) {
        const updatedItems = [...list.items];
        const temp = updatedItems[itemIndex];
        updatedItems[itemIndex] = updatedItems[itemIndex - 1];
        updatedItems[itemIndex - 1] = temp;
        return { ...list, items: updatedItems };
      }
      return list;
    });
    
    saveLists(updatedLists);
  };

  // Sposta un item verso il basso
  const moveItemDown = (listId, itemIndex) => {
    const list = lists.find(l => l.id === listId);
    if (!list || itemIndex >= list.items.length - 1) return;
    
    const updatedLists = lists.map(list => {
      if (list.id === listId) {
        const updatedItems = [...list.items];
        const temp = updatedItems[itemIndex];
        updatedItems[itemIndex] = updatedItems[itemIndex + 1];
        updatedItems[itemIndex + 1] = temp;
        return { ...list, items: updatedItems };
      }
      return list;
    });
    
    saveLists(updatedLists);
  };

  // Modifica una lista esistente
  const startEditingList = (list) => {
    setIsEditing(true);
    setEditingListId(list.id);
    setNewList({
      emoji: list.emoji,
      title: list.title,
      items: [...list.items],
      completed: list.completed,
      id: list.id,
      createdAt: list.createdAt
    });
  };

  // Salva le modifiche a una lista
  const saveEditedList = () => {
    if (!newList.title.trim()) return;
    
    // Verifica che tutti gli elementi abbiano un testo
    const validItems = newList.items.filter(item => item.text.trim() !== '');
    if (validItems.length === 0) return; // Non salvare la lista se non ci sono elementi validi
    
    const listWithValidItems = {
      ...newList,
      items: validItems
    };
    
    // Aggiorna lo stato completed della lista
    listWithValidItems.completed = listWithValidItems.items.every(item => item.completed);
    
    const updatedLists = lists.map(list => 
      list.id === editingListId ? listWithValidItems : list
    );
    
    saveLists(updatedLists);
    
    // Reset del form
    setNewList({ 
      emoji: '📝', 
      title: '', 
      items: [{ text: '', completed: false }],
      completed: false,
      id: null,
      createdAt: null
    });
    setIsEditing(false);
    setEditingListId(null);
  };

  // Ordina le liste: prima le non completate, poi le completate
  const sortedLists = [...lists].sort((a, b) => {
    // Prima ordina per stato di completamento
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    // Poi per data di creazione (più recenti prima)
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <>
      <SectionTitle title="To Do's">
        <button 
          onClick={() => {
            setIsCreating(!isCreating);
            setIsEditing(false);
            setEditingListId(null);
            setHasTriedToCreate(false);
            setNewList({ 
              emoji: '📝', 
              title: '', 
              items: [{ text: '', completed: false }],
              completed: false,
              id: null,
              createdAt: null
            });
          }}
          className="bg-emerald-500/70 dark:bg-emerald-600/70 backdrop-blur-md text-white flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300 shadow-lg hover:bg-emerald-600/80 dark:hover:bg-emerald-700/80"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Nuova Lista</span>
        </button>
      </SectionTitle>
      <div className="animate-fade-in-up mt-40 pb-20">

        {/* Form per creare/modificare una lista */}
        {(isCreating || isEditing) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => {
              setIsCreating(false);
              setIsEditing(false);
              setEditingListId(null);
            }}></div>
            <div className="relative w-full max-w-md p-4 bg-emerald-500/10 dark:bg-emerald-600/10 backdrop-blur-xl ring-1 ring-emerald-500/30 dark:ring-emerald-500/20 shadow-xl rounded-2xl transition-all duration-300 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative">
                <button 
                  type="button"
                  onClick={() => setShowEmojiPicker(prev => !prev)} 
                  className="text-3xl p-2 bg-gray-100 dark:bg-gray-800 rounded-lg"
                >
                  {newList.emoji}
                </button>
                {showEmojiPicker && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 bg-transparent"
                      onClick={() => setShowEmojiPicker(false)}
                    ></div>
                    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 p-3 pr-6 rounded-lg shadow-xl z-50 w-80 max-h-60 overflow-y-auto">
                      <div className="grid grid-cols-8 gap-2">
                        {EMOJIS.map(emoji => (
                          <button 
                            key={emoji} 
                            className="text-2xl p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            onClick={() => {
                              setNewList({ ...newList, emoji });
                              setShowEmojiPicker(false);
                            }}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <input
                type="text"
                placeholder="Nome della lista"
                value={newList.title}
                onChange={(e) => setNewList({ ...newList, title: e.target.value })}
                className={`flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                  hasTriedToCreate && !newList.title.trim() ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Elementi della lista:</h3>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                {newList.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 ml-1">
                  <input
                    type="text"
                    placeholder={`Elemento ${idx + 1}`}
                    value={item.text}
                    ref={idx === newList.items.length - 1 ? newItemRef : null}
                    onChange={(e) => {
                      const updatedItems = [...newList.items];
                      updatedItems[idx] = { ...item, text: e.target.value };
                      setNewList({ ...newList, items: updatedItems });
                    }}
                    className={`flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                      hasTriedToCreate && !item.text.trim() ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  <button
                    onClick={() => {
                      const updatedItems = newList.items.filter((_, i) => i !== idx);
                      setNewList({ ...newList, items: updatedItems.length ? updatedItems : [{ text: '', completed: false }] });
                    }}
                    className="p-2 text-red-500 hover:text-red-700"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => {
                  setNewList({
                    ...newList,
                    items: [...newList.items, { text: '', completed: false }]
                  });
                  // Focus sul nuovo elemento dopo il render
                  setTimeout(() => {
                    if (newItemRef.current) {
                      newItemRef.current.focus();
                    }
                  }, 10);
                }}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm flex items-center gap-1"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Aggiungi elemento</span>
              </button>

              <div className="flex gap-2">
                <button
                  onClick={isEditing ? saveEditedList : createNewList}
                  className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-sm"
                >
                  {isEditing ? 'Salva modifiche' : 'Crea lista'}
                </button>
              </div>
            </div>
          </div>
          </div>
        )}

        {/* Lista delle liste */}
        <div className="space-y-4">
          {sortedLists.map(list => (
            <div 
              key={list.id}
              className={`p-4 rounded-xl shadow-md transition-all duration-300 ${
                list.completed 
                  ? 'bg-emerald-500/20 dark:bg-emerald-600/20 ring-1 ring-emerald-500/30 dark:ring-emerald-500/20' 
                  : 'bg-white/30 dark:bg-black/30 backdrop-blur-xl ring-1 ring-white/50 dark:ring-white/10'
              }`}
            >
              {/* Intestazione della lista */}
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleExpand(list.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{list.emoji}</span>
                  <h3 className="font-semibold text-lg mt-[-4px]">{list.title}</h3>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Barra di avanzamento circolare */}
                  <div className="relative h-8 w-8">
                    <svg className="h-8 w-8" viewBox="0 0 36 36">
                      <path
                        className="stroke-current text-gray-300 dark:text-gray-600"
                        fill="none"
                        strokeWidth="3"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className={`stroke-current transition-all duration-500 ease-out ${
                          list.completed 
                            ? 'text-emerald-500' 
                            : calculateProgress(list.items) >= 50 
                              ? 'text-yellow-500' 
                              : 'text-red-500'
                        }`}
                        fill="none"
                        strokeWidth="3"
                        strokeDasharray={`${calculateProgress(list.items)}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <text x="18" y="21" textAnchor="middle" className="text-xs font-semibold fill-current">{calculateProgress(list.items)}</text>
                    </svg>
                  </div>
                  
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditingList(list);
                      }}
                      className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Sei sicuro di voler eliminare questa lista?')) {
                          deleteList(list.id);
                        }
                      }}
                      className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Contenuto espandibile della lista */}
              {expandedListId === list.id && (
                <div className="mt-4 space-y-2 border-t pt-4 border-gray-200 dark:border-gray-700 transition-all duration-300 animate-fade-in">
                  {list.items.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center gap-2 p-2 rounded-lg bg-white/20 dark:bg-black/20"
                    >
                      <button
                        onClick={() => toggleItem(list.id, idx)}
                        className={`flex-shrink-0 h-6 w-6 rounded-full border ${
                          item.completed 
                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                            : 'border-gray-300 dark:border-gray-600'
                        } flex items-center justify-center transition-colors duration-300`}
                      >
                        {item.completed && <CheckIcon className="h-4 w-4" />}
                      </button>
                      
                      <span className={`flex-1 ${item.completed ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>
                        {item.text}
                      </span>
                      
                      <div className="flex gap-1">
                        <button
                          onClick={() => moveItemUp(list.id, idx)}
                          disabled={idx === 0}
                          className={`p-1 ${
                            idx === 0 
                              ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed' 
                              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                          }`}
                        >
                          <ArrowUpIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => moveItemDown(list.id, idx)}
                          disabled={idx === list.items.length - 1}
                          className={`p-1 ${
                            idx === list.items.length - 1 
                              ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed' 
                              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                          }`}
                        >
                          <ArrowDownIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeItemFromList(list.id, idx)}
                          className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Bottone per aggiungere un nuovo elemento alla lista */}
                  {addingItemToListId === list.id ? (
                    <div className="w-full flex items-center gap-2 p-2 border border-gray-300 dark:border-gray-600 rounded-lg">
                      <input
                        type="text"
                        placeholder="Nuovo elemento"
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        className={`flex-1 px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                          hasTriedToAddItem && !newItemText.trim() ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            confirmAddItem();
                          }
                        }}
                      />
                      <button
                        onClick={confirmAddItem}
                        className="px-3 py-2 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600"
                      >
                        ✓
                      </button>
                      <button
                        onClick={cancelAddItem}
                        className="px-3 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addItemToList(list.id)}
                      className="w-full py-2 px-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center gap-2"
                    >
                      <PlusIcon className="h-4 w-4" />
                      <span>Aggiungi elemento</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {lists.length === 0 && !isCreating && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>Non hai ancora creato nessuna lista.</p>
              <p>Clicca su "Nuova Lista" per iniziare!</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
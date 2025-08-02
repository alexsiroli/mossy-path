import { CheckIcon } from '@heroicons/react/24/solid';

export default function TaskItem({ label, checked, onChange, disabled = false, onDelete }) {
  return (
    <label
      className={`flex items-center gap-2 mb-2 ${disabled ? 'opacity-50 cursor-default' : 'cursor-pointer'}`}
    >
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        className={
          'h-5 w-5 rounded border-2 flex items-center justify-center transition ' +
          (disabled
            ? 'border-gray-300 bg-gray-100 dark:bg-gray-700'
            : 'border-gray-400 peer-checked:border-emerald-600 peer-checked:bg-emerald-600 peer-checked:animate-pop-in')
        }
      >
        <CheckIcon className="h-4 w-4 text-white hidden peer-checked:block" />
      </span>
      <span className={checked ? 'line-through text-gray-400' : ''}>{label}</span>
      {onDelete && (
        <button
          className="ml-auto text-red-600 text-xs hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Elimina"
        >
          ✕
        </button>
      )}
    </label>
  );
} 
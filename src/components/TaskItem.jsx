import { CheckIcon, TrashIcon } from '@heroicons/react/24/solid';

export default function TaskItem({ label, checked, onChange, disabled = false, onDelete, hideCheckbox = false, className = '' }) {
  const containerClass = `flex items-center gap-2 mb-1 ${hideCheckbox ? 'cursor-default' : disabled ? 'opacity-50 cursor-default' : 'cursor-pointer'} ${className}`;
  const labelClass = hideCheckbox ? '' : checked ? 'line-through text-gray-400' : '';

  return (
    <label className={containerClass}>
      {!hideCheckbox && (
        <>
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
            <CheckIcon className={`h-4 w-4 text-white ${checked ? 'block' : 'hidden'}`} />
          </span>
        </>
      )}
      <span className={labelClass}>{label}</span>
      {onDelete && (
        <button
          className="ml-auto h-5 w-5 flex items-center justify-center rounded-md text-red-600 hover:bg-red-500/20"
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm('Sei sicuro di voler eliminare questa attività?')) {
              onDelete();
            }
          }}
          aria-label="Elimina"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      )}
    </label>
  );
}
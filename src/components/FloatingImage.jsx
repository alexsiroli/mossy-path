export default function FloatingImage() {
  return (
    <div className="flex justify-center mb-8">
      <div className="relative">
        {/* Immagine principale con animazione fluttuante */}
        <div className="animate-float">
          <svg 
            className="w-32 h-32 text-emerald-500 dark:text-emerald-400"
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            {/* Icona game controller stilizzata */}
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-3-3 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            <circle cx="8" cy="12" r="1.5"/>
            <circle cx="16" cy="12" r="1.5"/>
            <circle cx="12" cy="8" r="1.5"/>
            <circle cx="12" cy="16" r="1.5"/>
          </svg>
        </div>
        
        {/* Particelle decorative */}
        <div className="absolute -top-2 -left-2 w-3 h-3 bg-emerald-400 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute -top-4 right-2 w-2 h-2 bg-lime-400 rounded-full animate-pulse opacity-80"></div>
        <div className="absolute -bottom-2 -right-3 w-2.5 h-2.5 bg-emerald-300 rounded-full animate-pulse opacity-70"></div>
        <div className="absolute -bottom-4 left-4 w-2 h-2 bg-lime-300 rounded-full animate-pulse opacity-60"></div>
      </div>
    </div>
  );
} 
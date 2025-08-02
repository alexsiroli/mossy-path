export default function FloatingImage() {
  return (
    <div className="flex justify-center mb-12">
      <div className="relative">
        {/* Immagine principale con animazione fluttuante */}
        <div className="animate-float">
          <img 
            src="/icons/icon-1024.png"
            alt="GameLife"
            className="w-32 h-32 rounded-2xl shadow-lg"
          />
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
export default function FloatingImage() {
  return (
    <div className="flex justify-center mb-12">
      <div className="relative">
        {/* Immagine principale con animazione fluttuante */}
        <div className="animate-float-slow">
          <img 
            src="/icons/icon-1024.png"
            alt="MossyPath"
            className="w-48 h-48 rounded-2xl shadow-lg"
          />
        </div>
        
        {/* Particelle decorative originali */}
        <div className="absolute -top-3 -left-3 w-4 h-4 bg-emerald-400 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute -top-6 right-3 w-3 h-3 bg-lime-400 rounded-full animate-pulse opacity-80"></div>
        <div className="absolute -bottom-3 -right-4 w-3.5 h-3.5 bg-emerald-300 rounded-full animate-pulse opacity-70"></div>
        <div className="absolute -bottom-6 left-6 w-3 h-3 bg-lime-300 rounded-full animate-pulse opacity-60"></div>
        
        {/* Nuove animazioni Mossy Path */}
        {/* Foglie che cadono */}
        <div className="absolute -top-8 left-8 w-2 h-3 bg-emerald-600 rounded-full animate-fall-slow opacity-70"></div>
        <div className="absolute -top-12 right-12 w-1.5 h-2 bg-lime-600 rounded-full animate-fall-slower opacity-60"></div>
        <div className="absolute -top-16 left-16 w-2.5 h-3.5 bg-emerald-500 rounded-full animate-fall-fast opacity-50"></div>
        
        {/* Muschio che cresce */}
        <div className="absolute -bottom-8 left-4 w-6 h-2 bg-emerald-700 rounded-full animate-grow-moss opacity-80"></div>
        <div className="absolute -bottom-12 right-8 w-4 h-1.5 bg-lime-700 rounded-full animate-grow-moss-slow opacity-70"></div>
        <div className="absolute -bottom-16 left-12 w-5 h-2.5 bg-emerald-600 rounded-full animate-grow-moss-fast opacity-60"></div>
        
        {/* Particelle di muschio che fluttuano */}
        <div className="absolute top-4 -left-6 w-1 h-1 bg-emerald-400 rounded-full animate-float-moss opacity-40"></div>
        <div className="absolute top-8 -right-4 w-1.5 h-1.5 bg-lime-400 rounded-full animate-float-moss-slow opacity-50"></div>
        <div className="absolute top-12 -left-8 w-1 h-1 bg-emerald-300 rounded-full animate-float-moss-fast opacity-30"></div>
        
        {/* Gocce di rugiada */}
        <div className="absolute top-2 left-2 w-1 h-1 bg-blue-300 rounded-full animate-dew-drop opacity-90"></div>
        <div className="absolute top-6 right-6 w-1.5 h-1.5 bg-blue-200 rounded-full animate-dew-drop-slow opacity-80"></div>
        <div className="absolute top-10 left-10 w-1 h-1 bg-blue-400 rounded-full animate-dew-drop-fast opacity-70"></div>
      </div>
    </div>
  );
} 
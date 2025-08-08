import React from 'react';

export default function SectionTitle({ title, className = "", children }) {
  return (
    <div className={`fixed top-20 inset-x-4 sm:inset-x-0 sm:max-w-screen-md sm:mx-auto bg-white/30 dark:bg-black/30 backdrop-blur-xl ring-1 ring-white/50 dark:ring-white/10 shadow-xl rounded-2xl px-6 py-3 z-50 ${className}`}>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-black dark:text-white leading-none m-0">
          {title}
        </h1>
        {children}
      </div>
    </div>
  );
}

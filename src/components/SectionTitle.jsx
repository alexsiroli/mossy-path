import React from 'react';

export default function SectionTitle({ title, className = "" }) {
  return (
    <div className={`fixed top-20 inset-x-4 sm:inset-x-0 sm:max-w-screen-md sm:mx-auto bg-white/30 dark:bg-black/30 backdrop-blur-xl ring-1 ring-white/50 dark:ring-white/10 shadow-xl rounded-2xl px-6 py-3 z-50 animate-fade-in-up ${className}`}>
      <h1 className="text-xl font-bold text-white dark:text-white text-center leading-none m-0">
        {title}
      </h1>
    </div>
  );
}

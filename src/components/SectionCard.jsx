export default function SectionCard({ title, children, className = '', collapsible = false, expanded = true, onToggle }) {
  return (
    <section className={`glass pt-4 pb-3 px-4 ${className}`}>
      {title && (
        <div
          className={`flex items-center justify-between select-none ${collapsible ? 'cursor-pointer' : ''} mb-3`}
          onClick={collapsible ? onToggle : undefined}
          role={collapsible ? 'button' : undefined}
          aria-expanded={collapsible ? expanded : undefined}
        >
          <h2 className="font-semibold text-lg leading-none m-0">{title}</h2>
          {collapsible && (
            <svg
              className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 001.414 0l4-4a1 1 0 000-1.414l-4-4A1 1 0 007.293 6.293L10.586 9.5l-3.293 3.207a1 1 0 000 1.414z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      )}
      {collapsible ? (expanded ? children : null) : children}
    </section>
  );
}
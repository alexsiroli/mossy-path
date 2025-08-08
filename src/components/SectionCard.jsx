export default function SectionCard({ title, children }) {
  return (
    <section className="glass pt-0.5 pb-4 px-4 mb-6">
      {title && <h2 className="font-semibold text-lg leading-none">{title}</h2>}
      {children}
    </section>
  );
} 
export default function FormatCareNotes({ text }: { text: string }) {
  if (!text) return <p className="text-sm text-stone-500 italic">Aucun guide disponible pour le moment.</p>;

  const lines = text.split('\n');

  return (
    <div className="space-y-4">
      {lines.map((line, i) => {
        if (!line.trim()) return null;

        const isBullet = line.trim().startsWith('-') || line.trim().startsWith('* ');
        let content = line.trim();
        if (isBullet) content = content.replace(/^[-*]\s*/, '');

        const parts = content.split(/\*\*(.*?)\*\*/g);
        const formattedLine = parts.map((part, j) => {
          if (j % 2 === 1) return <strong key={j} className="text-emerald-900 font-bold">{part}</strong>;
          return part.replace(/\*/g, '');
        });

        if (isBullet) {
          return (
            <div key={i} className="flex gap-3 text-[15px] text-stone-700 leading-relaxed">
              <span className="text-emerald-500 font-black mt-0.5">•</span>
              <span className="flex-1">{formattedLine}</span>
            </div>
          );
        }

        if (content.startsWith('#')) {
          return (
            <h4 key={i} className="text-stone-900 font-extrabold text-base pt-3 pb-1 border-b border-stone-100">
              {content.replace(/^#+\s*/, '')}
            </h4>
          );
        }

        return (
          <p key={i} className="text-[15px] text-stone-700 leading-relaxed">{formattedLine}</p>
        );
      })}
    </div>
  );
}

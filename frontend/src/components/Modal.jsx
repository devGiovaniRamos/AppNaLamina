import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const DURACAO_MS = 280;
const EASING = 'ease-[cubic-bezier(0.16,1,0.3,1)]';

export default function Modal({ open, onClose, title, children }) {
  const [rendered, setRendered] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setRendered(true);
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    const timeout = setTimeout(() => setRendered(false), DURACAO_MS);
    return () => clearTimeout(timeout);
  }, [open]);

  if (!rendered) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/50 transition-all duration-[280ms] ${EASING} ${
          visible ? 'opacity-100 backdrop-blur-sm' : 'opacity-0 backdrop-blur-none'
        }`}
      />
      <div
        className={`relative bg-stone-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto transition-all duration-[280ms] ${EASING} ${
          visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-[0.93] translate-y-3'
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-stone-800">
          <h2 className="font-semibold text-stone-50">{title}</h2>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-300 p-1 rounded-lg hover:bg-stone-800">
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

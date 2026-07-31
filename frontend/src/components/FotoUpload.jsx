import { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { redimensionarParaBase64 } from '../utils/imagem';

export default function FotoUpload({ value, onChange, shape = 'square', size = 96 }) {
  const inputRef = useRef(null);
  const [erro, setErro] = useState('');

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErro('Selecione um arquivo de imagem');
      return;
    }
    setErro('');
    try {
      const base64 = await redimensionarParaBase64(file);
      onChange(base64);
    } catch {
      setErro('Não foi possível processar a imagem');
    }
  }

  const roundedClass = shape === 'circle' ? 'rounded-full' : 'rounded-xl';

  return (
    <div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{ width: size, height: size }}
          className={`shrink-0 ${roundedClass} bg-stone-800 border border-stone-700 border-dashed flex items-center justify-center overflow-hidden hover:border-gold-500/50 transition-colors`}
        >
          {value ? (
            <img src={value} alt="Foto" className="w-full h-full object-cover" />
          ) : (
            <ImagePlus size={20} className="text-stone-500" />
          )}
        </button>
        <div className="flex flex-col gap-1.5">
          <button type="button" onClick={() => inputRef.current?.click()} className="text-xs font-medium text-gold-400 hover:underline text-left">
            {value ? 'Trocar foto' : 'Enviar foto'}
          </button>
          {value && (
            <button type="button" onClick={() => onChange(null)} className="flex items-center gap-1 text-xs text-stone-500 hover:text-red-400">
              <X size={12} /> Remover
            </button>
          )}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {erro && <p className="text-red-400 text-xs mt-1.5">{erro}</p>}
    </div>
  );
}

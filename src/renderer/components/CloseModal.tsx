import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minimize2, Power, Check } from 'lucide-react';

interface CloseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimizeToTray: (remember: boolean) => void;
  onQuit: (remember: boolean) => void;
}

export default function CloseModal({ isOpen, onClose, onMinimizeToTray, onQuit }: CloseModalProps) {
  const [rememberChoice, setRememberChoice] = useState(false);

  // Reset remember choice when modal opens
  useEffect(() => {
    if (isOpen) {
      setRememberChoice(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-bg-secondary rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl border border-bg-tertiary"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-text-primary">Fechar SkllPlayer</h2>
            <button
              onClick={onClose}
              className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => onMinimizeToTray(rememberChoice)}
              className="w-full flex items-center gap-4 p-4 bg-bg-tertiary hover:bg-accent-primary/20 border border-transparent hover:border-accent-primary rounded-xl transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-accent-primary/20 flex items-center justify-center group-hover:bg-accent-primary/30 transition-colors">
                <Minimize2 className="w-6 h-6 text-accent-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-medium text-text-primary">Minimizar na bandeja</h3>
                <p className="text-sm text-text-muted">Continuar tocando em segundo plano</p>
              </div>
            </button>

            <button
              onClick={() => onQuit(rememberChoice)}
              className="w-full flex items-center gap-4 p-4 bg-bg-tertiary hover:bg-red-500/20 border border-transparent hover:border-red-500 rounded-xl transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center group-hover:bg-red-500/30 transition-colors">
                <Power className="w-6 h-6 text-red-400" />
              </div>
              <div className="text-left">
                <h3 className="font-medium text-text-primary">Fechar aplicativo</h3>
                <p className="text-sm text-text-muted">Encerrar completamente o SkllPlayer</p>
              </div>
            </button>
          </div>

          {/* Remember choice */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                rememberChoice
                  ? 'bg-accent-primary border-accent-primary'
                  : 'border-text-muted group-hover:border-accent-primary'
              }`}
              onClick={() => setRememberChoice(!rememberChoice)}
            >
              {rememberChoice && <Check className="w-3.5 h-3.5 text-white" />}
            </div>
            <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
              Lembrar minha escolha
            </span>
          </label>

          {/* Footer hint */}
          <p className="mt-4 text-xs text-text-muted text-center">
            Você pode alterar isso em Configurações &gt; Sistema
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

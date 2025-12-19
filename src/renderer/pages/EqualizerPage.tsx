import { useState, useEffect } from 'react';
import { RotateCcw, Save, Volume2, Power } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEqualizerStore, EqualizerSettings } from '../stores/equalizerStore';

const presets: { name: string; values: Partial<EqualizerSettings> }[] = [
  { name: 'Flat', values: { '60': 0, '230': 0, '910': 0, '3600': 0, '14000': 0, bassBoost: 0, reverb: 0, balance: 0, amplifier: 0 } },
  { name: 'Rock', values: { '60': 4, '230': 2, '910': -1, '3600': 3, '14000': 4 } },
  { name: 'Pop', values: { '60': -1, '230': 2, '910': 4, '3600': 2, '14000': -1 } },
  { name: 'Jazz', values: { '60': 3, '230': 1, '910': -1, '3600': 1, '14000': 3 } },
  { name: 'Classical', values: { '60': 4, '230': 2, '910': -1, '3600': 2, '14000': 3 } },
  { name: 'Bass Boost', values: { '60': 6, '230': 4, '910': 0, '3600': 0, '14000': 0, bassBoost: 5 } },
  { name: 'Vocal', values: { '60': -2, '230': 0, '910': 4, '3600': 3, '14000': 1 } },
  { name: 'Electronic', values: { '60': 5, '230': 3, '910': 0, '3600': 2, '14000': 4 } },
];

const frequencies = [
  { key: '60', label: '60Hz' },
  { key: '230', label: '230Hz' },
  { key: '910', label: '910Hz' },
  { key: '3600', label: '3.6kHz' },
  { key: '14000', label: '14kHz' },
] as const;

export default function EqualizerPage(): JSX.Element {
  const { settings, updateSetting, setSettings, resetSettings, saveSettings, isInitialized } = useEqualizerStore();
  const [activePreset, setActivePreset] = useState<string>('');

  // Detect active preset
  useEffect(() => {
    const currentPreset = presets.find(preset => {
      const presetKeys = Object.keys(preset.values) as (keyof EqualizerSettings)[];
      return presetKeys.every(key => {
        const presetValue = preset.values[key];
        return presetValue === undefined || settings[key] === presetValue;
      });
    });
    setActivePreset(currentPreset?.name || '');
  }, [settings]);

  const handleChange = (key: keyof EqualizerSettings, value: number) => {
    updateSetting(key, value);
    setActivePreset('');
  };

  const handleToggleEnabled = () => {
    updateSetting('enabled', !settings.enabled);
  };

  const handleReset = () => {
    resetSettings();
    setActivePreset('Flat');
  };

  const handleSave = async () => {
    await saveSettings();
  };

  const applyPreset = (preset: typeof presets[0]) => {
    setSettings(preset.values);
    setActivePreset(preset.name);
  };

  return (
    <div className="space-y-8 animate-slideUp">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-theme-title font-bold text-text-primary">Equalizador</h1>
          <p className="text-text-secondary">
            Ajuste o som do seu jeito
            {isInitialized && (
              <span className="ml-2 text-xs text-accent-primary">(Ativo)</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Enable/Disable toggle */}
          <button
            onClick={handleToggleEnabled}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              settings.enabled
                ? 'bg-accent-primary text-white'
                : 'bg-bg-tertiary text-text-secondary hover:bg-accent-primary/20'
            }`}
            title={settings.enabled ? 'Desativar equalizador' : 'Ativar equalizador'}
          >
            <Power className="w-4 h-4" />
            <span>{settings.enabled ? 'Ligado' : 'Desligado'}</span>
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary hover:bg-accent-primary/20 text-text-secondary hover:text-text-primary rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Resetar</span>
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-accent-primary hover:bg-accent-hover text-white rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Salvar</span>
          </button>
        </div>
      </div>

      {/* Presets */}
      <section className="bg-bg-secondary rounded-xl p-6 border border-bg-tertiary">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Presets</h2>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activePreset === preset.name
                  ? 'bg-accent-primary text-white'
                  : 'bg-bg-tertiary text-text-secondary hover:text-text-primary hover:bg-accent-primary/20'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </section>

      {/* EQ Sliders */}
      <section className={`bg-bg-secondary rounded-xl p-6 border border-bg-tertiary transition-opacity ${!settings.enabled ? 'opacity-50' : ''}`}>
        <h2 className="text-lg font-semibold text-text-primary mb-6">Frequências</h2>
        <div className="flex items-end justify-around gap-4 h-64 mb-4">
          {frequencies.map((freq) => (
            <div key={freq.key} className="flex flex-col items-center gap-2 flex-1">
              {/* dB value */}
              <span className="text-sm text-text-secondary">
                {(settings[freq.key as keyof EqualizerSettings] as number) > 0 ? '+' : ''}
                {settings[freq.key as keyof EqualizerSettings]}dB
              </span>

              {/* Vertical slider */}
              <div className="relative h-48 w-8 flex items-center justify-center">
                <div className="absolute h-full w-1 bg-bg-tertiary rounded-full" />
                <div
                  className="absolute w-1 bg-accent-primary rounded-full transition-all"
                  style={{
                    height: `${Math.abs(settings[freq.key as keyof EqualizerSettings] as number) * 4}%`,
                    bottom: (settings[freq.key as keyof EqualizerSettings] as number) >= 0 ? '50%' : 'auto',
                    top: (settings[freq.key as keyof EqualizerSettings] as number) < 0 ? '50%' : 'auto',
                  }}
                />
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={settings[freq.key as keyof EqualizerSettings] as number}
                  onChange={(e) =>
                    handleChange(freq.key as keyof EqualizerSettings, parseInt(e.target.value))
                  }
                  disabled={!settings.enabled}
                  className="absolute h-full w-8 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                />
                <motion.div
                  className="absolute w-4 h-4 bg-white rounded-full shadow-lg cursor-pointer"
                  style={{
                    bottom: `${(((settings[freq.key as keyof EqualizerSettings] as number) + 12) / 24) * 100}%`,
                    transform: 'translateY(50%)',
                  }}
                  whileHover={{ scale: 1.2 }}
                />
              </div>

              {/* Label */}
              <span className="text-xs text-text-muted">{freq.label}</span>
            </div>
          ))}
        </div>

        {/* Zero line indicator */}
        <div className="flex justify-around text-xs text-text-muted">
          <span>Graves</span>
          <span>Médios</span>
          <span>Agudos</span>
        </div>
      </section>

      {/* Additional controls */}
      <section className={`bg-bg-secondary rounded-xl p-6 border border-bg-tertiary transition-opacity ${!settings.enabled ? 'opacity-50' : ''}`}>
        <h2 className="text-lg font-semibold text-text-primary mb-6">Efeitos Adicionais</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SliderControl
            label="Reforço de Graves"
            value={settings.bassBoost}
            min={0}
            max={10}
            onChange={(v) => handleChange('bassBoost', v)}
            disabled={!settings.enabled}
          />
          <SliderControl
            label="Virtualizador"
            value={settings.virtualizer}
            min={0}
            max={10}
            onChange={(v) => handleChange('virtualizer', v)}
            disabled={!settings.enabled}
            hint="Em desenvolvimento"
          />
          <SliderControl
            label="Reverberação"
            value={settings.reverb}
            min={0}
            max={10}
            onChange={(v) => handleChange('reverb', v)}
            disabled={!settings.enabled}
          />
          <SliderControl
            label="Balanço de Som"
            value={settings.balance}
            min={-10}
            max={10}
            onChange={(v) => handleChange('balance', v)}
            showCenter
            disabled={!settings.enabled}
          />
          <SliderControl
            label="Amplificador"
            value={settings.amplifier}
            min={0}
            max={10}
            onChange={(v) => handleChange('amplifier', v)}
            icon={<Volume2 className="w-4 h-4" />}
            disabled={!settings.enabled}
          />
        </div>
      </section>
    </div>
  );
}

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  showCenter?: boolean;
  icon?: React.ReactNode;
  disabled?: boolean;
  hint?: string;
}

function SliderControl({
  label,
  value,
  min,
  max,
  onChange,
  showCenter,
  icon,
  disabled,
  hint,
}: SliderControlProps): JSX.Element {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-text-secondary">
          {icon}
          <span className="text-sm">{label}</span>
          {hint && <span className="text-xs text-text-muted">({hint})</span>}
        </div>
        <span className="text-sm text-text-primary font-medium">
          {showCenter && value > 0 ? '+' : ''}
          {value}
        </span>
      </div>
      <div className="relative h-2 bg-bg-tertiary rounded-full">
        {showCenter && (
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-text-muted" />
        )}
        <div
          className="absolute h-full bg-accent-primary rounded-full transition-all"
          style={{
            width: showCenter
              ? `${Math.abs(value) * (50 / max)}%`
              : `${percentage}%`,
            left: showCenter ? (value >= 0 ? '50%' : `${50 - Math.abs(value) * (50 / max)}%`) : 0,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg"
          style={{ left: `calc(${percentage}% - 8px)` }}
          whileHover={{ scale: 1.2 }}
        />
      </div>
    </div>
  );
}

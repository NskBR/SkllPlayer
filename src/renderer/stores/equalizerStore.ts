import { create } from 'zustand';

export interface EqualizerSettings {
  '60': number;
  '230': number;
  '910': number;
  '3600': number;
  '14000': number;
  bassBoost: number;
  virtualizer: number;
  reverb: number;
  balance: number;
  amplifier: number;
  enabled: boolean;
}

const defaultEqualizer: EqualizerSettings = {
  '60': 0,
  '230': 0,
  '910': 0,
  '3600': 0,
  '14000': 0,
  bassBoost: 0,
  virtualizer: 0,
  reverb: 0,
  balance: 0,
  amplifier: 0,
  enabled: true,
};

interface EqualizerState {
  settings: EqualizerSettings;
  audioContext: AudioContext | null;
  filters: {
    band60: BiquadFilterNode | null;
    band230: BiquadFilterNode | null;
    band910: BiquadFilterNode | null;
    band3600: BiquadFilterNode | null;
    band14000: BiquadFilterNode | null;
    bassBoost: BiquadFilterNode | null;
    balance: StereoPannerNode | null;
    amplifier: GainNode | null;
  };
  inputNode: GainNode | null;
  outputNode: GainNode | null;
  convolverNode: ConvolverNode | null;
  reverbGain: GainNode | null;
  dryGain: GainNode | null;
  isInitialized: boolean;

  // Actions
  initAudioContext: () => void;
  connectSource: (source: AudioNode) => void;
  disconnectSource: (source: AudioNode) => void;
  connectMediaElement: (element: HTMLMediaElement) => MediaElementAudioSourceNode | null;
  getOutputNode: () => AudioNode | null;
  updateSetting: (key: keyof EqualizerSettings, value: number | boolean) => void;
  setSettings: (settings: Partial<EqualizerSettings>) => void;
  resetSettings: () => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
}

// Create impulse response for reverb
function createImpulseResponse(audioContext: AudioContext, duration: number, decay: number): AudioBuffer {
  const sampleRate = audioContext.sampleRate;
  const length = sampleRate * duration;
  const impulse = audioContext.createBuffer(2, length, sampleRate);
  const leftChannel = impulse.getChannelData(0);
  const rightChannel = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const n = i / length;
    const envelope = Math.pow(1 - n, decay);
    leftChannel[i] = (Math.random() * 2 - 1) * envelope;
    rightChannel[i] = (Math.random() * 2 - 1) * envelope;
  }

  return impulse;
}

// Map to track already connected audio elements
const connectedElements = new WeakMap<HTMLMediaElement, MediaElementAudioSourceNode>();

export const useEqualizerStore = create<EqualizerState>((set, get) => ({
  settings: { ...defaultEqualizer },
  audioContext: null,
  filters: {
    band60: null,
    band230: null,
    band910: null,
    band3600: null,
    band14000: null,
    bassBoost: null,
    balance: null,
    amplifier: null,
  },
  inputNode: null,
  outputNode: null,
  convolverNode: null,
  reverbGain: null,
  dryGain: null,
  isInitialized: false,

  initAudioContext: () => {
    const { isInitialized, settings } = get();
    if (isInitialized) return;

    try {
      // Create audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Create input and output gain nodes
      const inputNode = audioContext.createGain();
      const outputNode = audioContext.createGain();

      // Create EQ band filters (peaking filters)
      const band60 = audioContext.createBiquadFilter();
      band60.type = 'peaking';
      band60.frequency.value = 60;
      band60.Q.value = 1.4;
      band60.gain.value = settings['60'];

      const band230 = audioContext.createBiquadFilter();
      band230.type = 'peaking';
      band230.frequency.value = 230;
      band230.Q.value = 1.4;
      band230.gain.value = settings['230'];

      const band910 = audioContext.createBiquadFilter();
      band910.type = 'peaking';
      band910.frequency.value = 910;
      band910.Q.value = 1.4;
      band910.gain.value = settings['910'];

      const band3600 = audioContext.createBiquadFilter();
      band3600.type = 'peaking';
      band3600.frequency.value = 3600;
      band3600.Q.value = 1.4;
      band3600.gain.value = settings['3600'];

      const band14000 = audioContext.createBiquadFilter();
      band14000.type = 'peaking';
      band14000.frequency.value = 14000;
      band14000.Q.value = 1.4;
      band14000.gain.value = settings['14000'];

      // Bass boost (low shelf filter)
      const bassBoost = audioContext.createBiquadFilter();
      bassBoost.type = 'lowshelf';
      bassBoost.frequency.value = 150;
      bassBoost.gain.value = settings.bassBoost;

      // Balance (stereo panner)
      const balance = audioContext.createStereoPanner();
      balance.pan.value = settings.balance / 10; // -10 to 10 -> -1 to 1

      // Amplifier (gain)
      const amplifier = audioContext.createGain();
      amplifier.gain.value = 1 + (settings.amplifier / 10); // 0 to 10 -> 1 to 2

      // Reverb setup
      const convolverNode = audioContext.createConvolver();
      const impulseResponse = createImpulseResponse(audioContext, 2, 2);
      convolverNode.buffer = impulseResponse;

      const reverbGain = audioContext.createGain();
      reverbGain.gain.value = settings.reverb / 10; // 0 to 10 -> 0 to 1

      const dryGain = audioContext.createGain();
      dryGain.gain.value = 1;

      // Connect the audio chain
      // Input -> EQ bands -> Bass boost -> Balance -> Amplifier -> Dry/Wet mix -> Output
      inputNode.connect(band60);
      band60.connect(band230);
      band230.connect(band910);
      band910.connect(band3600);
      band3600.connect(band14000);
      band14000.connect(bassBoost);
      bassBoost.connect(balance);
      balance.connect(amplifier);

      // Dry path (direct)
      amplifier.connect(dryGain);
      dryGain.connect(outputNode);

      // Wet path (reverb)
      amplifier.connect(convolverNode);
      convolverNode.connect(reverbGain);
      reverbGain.connect(outputNode);

      // Connect output to destination
      outputNode.connect(audioContext.destination);

      set({
        audioContext,
        filters: {
          band60,
          band230,
          band910,
          band3600,
          band14000,
          bassBoost,
          balance,
          amplifier,
        },
        inputNode,
        outputNode,
        convolverNode,
        reverbGain,
        dryGain,
        isInitialized: true,
      });

      console.log('Equalizer audio context initialized');
    } catch (error) {
      console.error('Error initializing audio context:', error);
    }
  },

  connectSource: (source: AudioNode) => {
    const { isInitialized, initAudioContext } = get();

    if (!isInitialized) {
      initAudioContext();
    }

    const currentInputNode = get().inputNode;
    if (currentInputNode) {
      try {
        source.connect(currentInputNode);
      } catch (error) {
        console.error('Error connecting source to equalizer:', error);
      }
    }
  },

  disconnectSource: (source: AudioNode) => {
    const { inputNode } = get();
    if (inputNode) {
      try {
        source.disconnect(inputNode);
      } catch (error) {
        // Ignore disconnect errors
      }
    }
  },

  connectMediaElement: (element: HTMLMediaElement) => {
    const { isInitialized, initAudioContext } = get();

    if (!isInitialized) {
      initAudioContext();
    }

    const ctx = get().audioContext;
    const input = get().inputNode;

    if (!ctx || !input) {
      console.error('Audio context not initialized');
      return null;
    }

    // Check if this element was already connected
    let mediaSource = connectedElements.get(element);

    if (mediaSource) {
      // Element already has a source node, just reconnect it
      try {
        mediaSource.disconnect();
      } catch (e) {
        // Ignore if not connected
      }
      mediaSource.connect(input);
      console.log('Reusing existing MediaElementSourceNode');
      return mediaSource;
    }

    // Create new MediaElementAudioSourceNode
    try {
      mediaSource = ctx.createMediaElementSource(element);
      mediaSource.connect(input);
      connectedElements.set(element, mediaSource);
      console.log('Created new MediaElementSourceNode');
      return mediaSource;
    } catch (error) {
      console.error('Error creating MediaElementSourceNode:', error);
      return null;
    }
  },

  getOutputNode: () => {
    const { audioContext } = get();
    return audioContext?.destination || null;
  },

  updateSetting: (key: keyof EqualizerSettings, value: number | boolean) => {
    const { filters, reverbGain, dryGain, settings } = get();

    set({
      settings: { ...settings, [key]: value },
    });

    // Apply the setting to the audio nodes
    if (typeof value === 'number') {
      switch (key) {
        case '60':
          if (filters.band60) filters.band60.gain.value = value;
          break;
        case '230':
          if (filters.band230) filters.band230.gain.value = value;
          break;
        case '910':
          if (filters.band910) filters.band910.gain.value = value;
          break;
        case '3600':
          if (filters.band3600) filters.band3600.gain.value = value;
          break;
        case '14000':
          if (filters.band14000) filters.band14000.gain.value = value;
          break;
        case 'bassBoost':
          if (filters.bassBoost) filters.bassBoost.gain.value = value;
          break;
        case 'balance':
          if (filters.balance) filters.balance.pan.value = value / 10;
          break;
        case 'amplifier':
          if (filters.amplifier) filters.amplifier.gain.value = 1 + (value / 10);
          break;
        case 'reverb':
          if (reverbGain && dryGain) {
            reverbGain.gain.value = value / 10;
            dryGain.gain.value = 1 - (value / 20); // Reduce dry signal slightly as reverb increases
          }
          break;
      }
    }
  },

  setSettings: (newSettings: Partial<EqualizerSettings>) => {
    const { updateSetting } = get();

    // Update each setting
    Object.entries(newSettings).forEach(([key, value]) => {
      updateSetting(key as keyof EqualizerSettings, value);
    });
  },

  resetSettings: () => {
    const { setSettings } = get();
    setSettings(defaultEqualizer);
  },

  loadSettings: async () => {
    try {
      if (window.electronAPI) {
        const appSettings = await window.electronAPI.getSettings();
        if (appSettings.equalizer) {
          const { setSettings } = get();
          setSettings(appSettings.equalizer);
        }
      }
    } catch (error) {
      console.error('Error loading equalizer settings:', error);
    }
  },

  saveSettings: async () => {
    try {
      if (window.electronAPI) {
        const { settings } = get();
        const appSettings = await window.electronAPI.getSettings();
        await window.electronAPI.saveSettings({
          ...appSettings,
          equalizer: settings,
        });
      }
    } catch (error) {
      console.error('Error saving equalizer settings:', error);
    }
  },
}));

// Initialize the audio context when the store is first used
if (typeof window !== 'undefined') {
  // Load settings on initialization
  useEqualizerStore.getState().loadSettings();
}

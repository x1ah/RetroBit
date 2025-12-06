import React from 'react';
import { AudioState } from '../types';

interface ControlsProps {
  audioState: AudioState;
  setAudioState: React.Dispatch<React.SetStateAction<AudioState>>;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
}

// Preset Configurations
const PRESETS: Record<string, Partial<AudioState>> = {
  "NES": { bitDepth: 8, frequencyReduction: 0.45, drive: 2.5, lowPassFreq: 8000 }, // Cleaned up NES
  "GB": { bitDepth: 4, frequencyReduction: 0.75, drive: 4.0, lowPassFreq: 2000 },
  "DOS": { bitDepth: 8, frequencyReduction: 0.1, drive: 1.5, lowPassFreq: 12000 },
  "VAPOR": { bitDepth: 6, frequencyReduction: 0.9, drive: 3.0, lowPassFreq: 600 },
  "ORIG": { bitDepth: 16, frequencyReduction: 0, drive: 1.0, lowPassFreq: 22000 } // Original Sound
};

export const Controls: React.FC<ControlsProps> = ({ audioState, setAudioState, onPlayPause, onSeek }) => {
  
  const handleChange = (key: keyof AudioState, value: number) => {
    setAudioState(prev => ({ ...prev, [key]: value }));
  };

  const applyPreset = (name: string) => {
    const preset = PRESETS[name];
    if (preset) {
      setAudioState(prev => ({ ...prev, ...preset }));
    }
  };

  // 检查当前状态是否匹配某个预设（允许小的浮点数误差）
  const matchesPreset = (presetName: string): boolean => {
    const preset = PRESETS[presetName];
    if (!preset) return false;
    
    const tolerance = 0.01; // 容差
    
    const checkValue = (actual: number, expected: number | undefined) => {
      if (expected === undefined) return true;
      return Math.abs(actual - expected) < tolerance;
    };
    
    return (
      checkValue(audioState.bitDepth, preset.bitDepth) &&
      checkValue(audioState.frequencyReduction, preset.frequencyReduction) &&
      checkValue(audioState.drive, preset.drive) &&
      checkValue(audioState.lowPassFreq, preset.lowPassFreq)
    );
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-zinc-800 p-4 border-4 border-t-gray-600 border-l-gray-600 border-r-gray-900 border-b-gray-900 mt-4 text-green-400 shadow-2xl">
      
      {/* Row 1: Progress & Play Controls */}
      <div className="mb-5 bg-black p-3 border-2 border-gray-700 rounded flex items-center gap-4">
         <div className="text-xs font-mono text-green-500 w-10 text-right">
           {formatTime(audioState.currentTime)}
         </div>
         
         <input
            type="range"
            min="0"
            max={audioState.duration || 100}
            value={audioState.currentTime}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="flex-1 h-4 appearance-none bg-zinc-900 border border-green-900 rounded-none focus:outline-none [&::-webkit-slider-thumb]:bg-green-500 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-black cursor-pointer"
          />

         <div className="text-xs font-mono text-gray-500 w-10">
           {formatTime(audioState.duration)}
         </div>

         <button 
            onClick={onPlayPause}
            className={`w-10 h-8 flex items-center justify-center border-2 ${audioState.isPlaying ? 'border-green-500 bg-green-900 text-white' : 'border-gray-500 bg-gray-800 text-gray-400'} hover:bg-gray-700 active:translate-y-0.5 transition-all`}
            title={audioState.isPlaying ? "Pause" : "Play"}
          >
            {audioState.isPlaying ? 
              <span className="block w-3 h-3 border-l-4 border-r-4 border-current"></span> : 
              <span className="block w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-current border-b-[6px] border-b-transparent ml-1"></span>
            }
          </button>
      </div>

      {/* Row 2: Presets */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        <span className="text-[10px] font-retro text-gray-500 mr-2 shrink-0">PRESETS:</span>
        {Object.keys(PRESETS).map(key => {
          const isActive = matchesPreset(key);
          return (
           <button
             key={key}
             onClick={() => applyPreset(key)}
             className={`px-3 py-1 border-b-2 border-black text-[10px] font-retro transition-colors rounded-t ${
                 isActive ? "bg-green-800 text-white hover:bg-green-700" : "bg-zinc-700 text-gray-300 hover:bg-zinc-600"
             }`}
           >
             {key}
           </button>
          );
        })}
      </div>

      {/* Row 3: FX Controls Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        
        {/* 1. Bit Depth */}
        <div className="space-y-2 p-2 border border-gray-700 bg-black/20 rounded hover:border-pink-900 transition-colors">
          <label className="text-[10px] font-retro text-pink-500 block text-center">BITS ({Math.round(audioState.bitDepth)})</label>
          <input 
            type="range" 
            min="1" 
            max="16" 
            step="1"
            value={audioState.bitDepth}
            onChange={(e) => handleChange('bitDepth', Number(e.target.value))}
            className="w-full accent-pink-500 h-2 bg-gray-800 appearance-none rounded-full"
          />
        </div>

        {/* 2. Frequency / Downsample */}
        <div className="space-y-2 p-2 border border-gray-700 bg-black/20 rounded hover:border-blue-900 transition-colors">
          <label className="text-[10px] font-retro text-blue-400 block text-center">LO-FI ({(1 - audioState.frequencyReduction).toFixed(2)})</label>
          <input 
            type="range" 
            min="0" 
            max="0.98" 
            step="0.01"
            value={audioState.frequencyReduction}
            onChange={(e) => handleChange('frequencyReduction', Number(e.target.value))}
            className="w-full accent-blue-500 h-2 bg-gray-800 appearance-none rounded-full"
          />
        </div>

        {/* 3. Drive */}
        <div className="space-y-2 p-2 border border-gray-700 bg-black/20 rounded hover:border-red-900 transition-colors">
          <label className="text-[10px] font-retro text-red-500 block text-center">DRIVE ({audioState.drive.toFixed(1)})</label>
          <input 
            type="range" 
            min="1" 
            max="10" 
            step="0.5"
            value={audioState.drive}
            onChange={(e) => handleChange('drive', Number(e.target.value))}
            className="w-full accent-red-500 h-2 bg-gray-800 appearance-none rounded-full"
          />
        </div>

        {/* 4. Tone/LPF */}
        <div className="space-y-2 p-2 border border-gray-700 bg-black/20 rounded hover:border-yellow-900 transition-colors">
          <label className="text-[10px] font-retro text-yellow-400 block text-center">TONE</label>
          <input 
            type="range" 
            min="500" 
            max="22000" 
            step="100"
            value={audioState.lowPassFreq}
            onChange={(e) => handleChange('lowPassFreq', Number(e.target.value))}
            className="w-full accent-yellow-400 h-2 bg-gray-800 appearance-none rounded-full"
          />
          <div className="flex justify-between px-1">
            <span className="text-[8px] text-gray-600 font-mono cursor-pointer hover:text-yellow-200" onClick={() => handleChange('lowPassFreq', 1500)}>DARK</span>
            <span className="text-[8px] text-gray-600 font-mono cursor-pointer hover:text-yellow-200" onClick={() => handleChange('lowPassFreq', 4000)}>MID</span>
            <span className="text-[8px] text-gray-600 font-mono cursor-pointer hover:text-yellow-200" onClick={() => handleChange('lowPassFreq', 22000)}>FULL</span>
          </div>
        </div>
        
      </div>

      {/* Row 4: Volume & Speed Combined */}
      <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-800">
         
         <div className="flex flex-col gap-1">
             <div className="flex justify-between">
                <span className="font-retro text-[10px] text-gray-400">VOL</span>
                <span className="font-mono text-[10px] text-gray-500">{Math.round(audioState.volume * 100)}%</span>
             </div>
             <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05"
                value={audioState.volume}
                onChange={(e) => handleChange('volume', Number(e.target.value))}
                className="w-full h-2 bg-gray-700 accent-white rounded-full"
            />
         </div>

         <div className="flex flex-col gap-1">
            <div className="flex justify-between">
                <span className="font-retro text-[10px] text-gray-400">SPEED</span>
                <span className="font-mono text-[10px] text-gray-500">{audioState.playbackRate}x</span>
            </div>
            <input 
                type="range" 
                min="0.5" 
                max="2.0" 
                step="0.1"
                value={audioState.playbackRate}
                onChange={(e) => handleChange('playbackRate', Number(e.target.value))}
                className="w-full h-2 bg-gray-700 accent-gray-400 rounded-full"
            />
        </div>
      </div>

    </div>
  );
};
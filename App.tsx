import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AudioState, AudioSourceType, SongMetadata } from './types';
import { Controls } from './components/Controls';
import { Visualizer } from './components/Visualizer';
import { generatePixelArtCover, generateSongDescription } from './services/geminiService';

// 内置音频文件映射
const BUILTIN_TRACKS = [
  { 
    title: "Seven Nation Army", 
    artist: "The White Stripes",
    filename: "seven-nation-army.mp3"
  },
  { 
    title: "Axel F", 
    artist: "Harold Faltermeyer",
    filename: "axel-f.mp3"
  },
  { 
    title: "Blue (Da Ba Dee)", 
    artist: "Eiffel 65",
    filename: "blue-da-ba-dee.mp3"
  },
  { 
    title: "Billie Jean", 
    artist: "Michael Jackson",
    filename: "billie-jean.mp3"
  },
  { 
    title: "残酷天使的行动纲领", 
    artist: "高桥洋子",
    filename: "cruel-angel-thesis.mp3"
  },
  { 
    title: "Faded", 
    artist: "Alan Walker",
    filename: "faded.mp3"
  },
  { 
    title: "Toccata and Fugue in D Minor", 
    artist: "Bach",
    filename: "toccata-fugue.mp3"
  }
];

export default function App() {
  // UI State
  const [activeTab, setActiveTab] = useState<AudioSourceType>(AudioSourceType.DEMO);
  const [metadata, setMetadata] = useState<SongMetadata>({
    title: "INSERT CARTRIDGE",
    artist: "UNKNOWN",
    description: "系统就绪... 等待卡带插入"
  });
  const [isLoadingGenAI, setIsLoadingGenAI] = useState(false);

  // Audio State
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.6,
    playbackRate: 1.0,
    bitDepth: 4,
    frequencyReduction: 0.6,
    drive: 3.0, 
    lowPassFreq: 3000, 
  });

  // Web Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const scriptNodeRef = useRef<ScriptProcessorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const lowPassNodeRef = useRef<BiquadFilterNode | null>(null); 
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioElRef = useRef<HTMLAudioElement>(null);

  // Mutable ref for audio processor to access latest state inside the tight loop
  const audioParamsRef = useRef({ 
    bitDepth: 4, 
    frequencyReduction: 0.6,
    drive: 3.0
  });

  // Keep ref in sync with state
  useEffect(() => {
    audioParamsRef.current = {
      bitDepth: audioState.bitDepth,
      frequencyReduction: audioState.frequencyReduction,
      drive: audioState.drive
    };
    
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = audioState.volume;
    }
    if (lowPassNodeRef.current) {
        const currentTime = audioContextRef.current?.currentTime || 0;
        lowPassNodeRef.current.frequency.setTargetAtTime(audioState.lowPassFreq, currentTime, 0.1);
    }
    if (audioElRef.current) {
      audioElRef.current.playbackRate = audioState.playbackRate;
    }
  }, [audioState]);

  // Initialize Audio Context
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  // Setup Audio Graph
  const setupAudioGraph = useCallback(() => {
    if (!audioContextRef.current || !audioElRef.current) return;

    const ctx = audioContextRef.current;
    const audio = audioElRef.current;

    // Cleanup
    if (sourceNodeRef.current) sourceNodeRef.current.disconnect();
    if (scriptNodeRef.current) scriptNodeRef.current.disconnect();
    if (gainNodeRef.current) gainNodeRef.current.disconnect();
    if (analyserRef.current) analyserRef.current.disconnect();
    if (lowPassNodeRef.current) lowPassNodeRef.current.disconnect();

    // 1. Source
    if (!sourceNodeRef.current) {
        sourceNodeRef.current = ctx.createMediaElementSource(audio);
    }
    
    // 2. ScriptProcessor
    scriptNodeRef.current = ctx.createScriptProcessor(4096, 2, 2); 
    
    // 3. Low Pass Filter
    lowPassNodeRef.current = ctx.createBiquadFilter();
    lowPassNodeRef.current.type = 'lowpass';
    lowPassNodeRef.current.frequency.value = audioState.lowPassFreq;
    lowPassNodeRef.current.Q.value = 1;

    // 4. Master Gain
    gainNodeRef.current = ctx.createGain();
    gainNodeRef.current.gain.value = audioState.volume;

    // 5. Analyser
    analyserRef.current = ctx.createAnalyser();
    analyserRef.current.fftSize = 256;

    // --- DSP LOGIC ---
    scriptNodeRef.current.onaudioprocess = (audioProcessingEvent) => {
      const inputBuffer = audioProcessingEvent.inputBuffer;
      const outputBuffer = audioProcessingEvent.outputBuffer;

      const { bitDepth, frequencyReduction, drive } = audioParamsRef.current;

      const step = Math.pow(0.5, bitDepth); 
      const phaser = frequencyReduction; 
      const sampleRateFactor = Math.max(1, Math.round(1 + phaser * 40)); 

      for (let channel = 0; channel < inputBuffer.numberOfChannels; channel++) {
        const inputData = inputBuffer.getChannelData(channel);
        const outputData = outputBuffer.getChannelData(channel);

        for (let i = 0; i < inputBuffer.length; i++) {
          const index = i - (i % sampleRateFactor);
          let sample = inputData[index] * drive;

          if (sample > 1.0) sample = 1.0;
          if (sample < -1.0) sample = -1.0;

          let crunched = step * Math.floor(sample / step + 0.5);
          outputData[i] = crunched;
        }
      }
    };

    sourceNodeRef.current.connect(scriptNodeRef.current);
    scriptNodeRef.current.connect(lowPassNodeRef.current);
    lowPassNodeRef.current.connect(gainNodeRef.current);
    gainNodeRef.current.connect(analyserRef.current);
    analyserRef.current.connect(ctx.destination);

  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // File Upload Handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    initAudioContext();
    
    const url = URL.createObjectURL(file);
    if (audioElRef.current) {
      audioElRef.current.src = url;
      audioElRef.current.load();
    }

    // Metadata and AI
    const title = file.name.replace(/\.[^/.]+$/, "");
    updateMetadata(title, "Unknown Artist");
    
    // Switch to upload tab visually if not already
    if (activeTab !== AudioSourceType.FILE) {
        setActiveTab(AudioSourceType.FILE);
    }
  };

  const updateMetadata = async (title: string, artist: string) => {
     setMetadata({
      title: title,
      artist: artist,
      description: "正在解析卡带数据..."
    });

    setIsLoadingGenAI(true);
    setupAudioGraph(); 

    try {
      const [desc, cover] = await Promise.all([
        generateSongDescription(title),
        generatePixelArtCover(title)
      ]);
      
      setMetadata(prev => ({
        ...prev,
        description: desc,
        coverUrl: cover || undefined
      }));
    } catch (e) {
      console.error("AI Gen failed", e);
    } finally {
      setIsLoadingGenAI(false);
    }
  }

  const handleExternalLink = (source: string) => {
    alert(`注意：由于浏览器安全策略 (CORS)，本演示无法直接从 ${source} 拉取音频流。\n\n请下载歌曲后使用“上传文件”功能以获得完整的 8-bit 体验！`);
  };

  const togglePlay = () => {
    if (!audioElRef.current) return;
    
    // Fix: Prevent playing if no source is loaded
    if (!audioElRef.current.src || audioElRef.current.src === window.location.href) {
      alert("请先上传一个音频文件！(Please upload a song first)");
      return;
    }

    initAudioContext();
    
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }

    if (!sourceNodeRef.current) {
      setupAudioGraph();
    }

    if (audioState.isPlaying) {
      audioElRef.current.pause();
    } else {
      audioElRef.current.play().catch(e => {
        console.error("Play failed", e);
        // Error is also handled by onError event
      });
    }
    setAudioState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const handleSeek = (time: number) => {
    if(audioElRef.current) {
      audioElRef.current.currentTime = time;
      setAudioState(prev => ({ ...prev, currentTime: time }));
    }
  }
  
  const handleAudioError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    const audio = e.currentTarget;
    // Only report real errors, not empty src load resets
    if (!audio.src || audio.src === window.location.href) return;

    console.error("Audio playback error", audio.error);
    setAudioState(prev => ({ ...prev, isPlaying: false }));
    
    let msg = "无法播放音频。";
    if (audio.error?.code === 4) msg += "源文件无法访问或格式不支持。";
    if (audio.error?.code === 3) msg += "解码错误。";
    
    alert(`${msg}\n提示：Safari 可能不支持 OGG 格式，请尝试上传本地 MP3 文件。`);
  };

  // Sync Audio Element Events
  useEffect(() => {
    const audio = audioElRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setAudioState(prev => ({ ...prev, currentTime: audio.currentTime }));
    const onDurationChange = () => setAudioState(prev => ({ ...prev, duration: audio.duration }));
    const onEnded = () => setAudioState(prev => ({ ...prev, isPlaying: false }));

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  return (
    <div className="min-h-screen bg-zinc-900 text-gray-200 p-4 md:p-8 flicker flex flex-col items-center">
      <audio 
        ref={audioElRef} 
        crossOrigin="anonymous" 
        onError={handleAudioError}
      />

      <header className="w-full max-w-4xl mb-8 text-center border-b-4 border-green-600 pb-4">
        <h1 className="text-4xl md:text-6xl font-retro text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 tracking-tighter">
          RetroBit
        </h1>
        <p className="text-xl font-mono text-pink-500 mt-2 animate-pulse">
          &lt; 8-BIT CONVERTER SYSTEM v2.5 /&gt;
        </p>
      </header>

      <main className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="relative aspect-square bg-black border-4 border-gray-700 rounded-lg overflow-hidden shadow-[0_0_20px_rgba(74,222,128,0.2)] group">
            {isLoadingGenAI && (
               <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                 <div className="text-green-400 font-retro text-xs text-center">
                   正在生成像素封面...<br/>
                   <span className="inline-block w-2 h-2 bg-green-400 ml-1 animate-bounce"></span>
                 </div>
               </div>
            )}
            
            {metadata.coverUrl ? (
              <img 
                src={metadata.coverUrl} 
                alt="Album Art" 
                className="w-full h-full object-cover image-pixelated hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
                <div className="w-20 h-20 border-4 border-gray-600 rounded-full flex items-center justify-center mb-4 animate-spin-slow" style={{animationDuration: '10s'}}>
                   <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
                </div>
                <span className="font-retro text-xs">NO CARTRIDGE</span>
              </div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-3 border-t-2 border-green-900">
              <h2 className="text-green-400 font-bold font-retro text-sm truncate">{metadata.title}</h2>
              <p className="text-gray-400 text-xs font-mono mt-1 truncate">{metadata.artist}</p>
            </div>
          </div>

          <div className="bg-zinc-800 p-3 border-2 border-gray-700 rounded text-xs font-mono leading-relaxed text-gray-300">
            <span className="text-pink-500 font-bold mr-2">[背景设定]</span>
            {metadata.description}
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col gap-6">
          
          <div className="bg-zinc-800 p-1 rounded border-2 border-gray-700 flex gap-1">
            {[AudioSourceType.DEMO, AudioSourceType.FILE, AudioSourceType.NETEASE, AudioSourceType.QQ].map((type) => {
              const tabNames: Record<AudioSourceType, string> = {
                [AudioSourceType.DEMO]: '推荐',
                [AudioSourceType.FILE]: '上传',
                [AudioSourceType.NETEASE]: '网易云',
                [AudioSourceType.QQ]: 'QQ音乐'
              };
              const isQQ = type === AudioSourceType.QQ;
              return (
                <button
                  key={type}
                  onClick={() => setActiveTab(type)}
                  className={`flex-1 py-2 text-xs font-retro transition-colors ${
                    activeTab === type 
                      ? 'bg-green-700 text-white shadow-inner' 
                      : 'hover:bg-zinc-700 text-gray-400'
                  }`}
                >
                  {isQQ ? <span className="text-sm">{tabNames[type]}</span> : tabNames[type]}
                </button>
              );
            })}
          </div>

          <div className="bg-black p-4 border-4 border-dashed border-gray-800 min-h-[160px] flex flex-col justify-center">
            {activeTab === AudioSourceType.FILE && (
              <div className="text-center">
                 <label className="cursor-pointer inline-block group">
                    <span className="block text-green-500 font-retro text-xs mb-2 group-hover:text-green-400">
                      点击插入音频文件 (MP3/WAV)
                    </span>
                    <input 
                      type="file" 
                      accept="audio/*" 
                      onChange={handleFileUpload}
                      className="block w-full text-sm text-slate-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-green-900 file:text-green-300
                        hover:file:bg-green-700
                      "
                    />
                 </label>
              </div>
            )}

            {activeTab === AudioSourceType.DEMO && (
               <div className="w-full h-full">
                <div className="bg-zinc-900 p-4 rounded border border-gray-700 w-full overflow-y-auto max-h-[300px]">
                  <h3 className="text-yellow-400 font-retro text-xs mb-3 text-center">RECOMMENDED TRACKS</h3>
                  <p className="text-[10px] text-green-400 font-mono mb-3 text-center">
                     ✨ 点击下方曲目即可播放
                  </p>
                  <ul className="text-[10px] font-mono text-gray-400 space-y-2 list-none pl-2">
                    {BUILTIN_TRACKS.map((track, index) => (
                      <li 
                        key={index}
                        className="flex items-center justify-between group cursor-pointer hover:text-green-400 transition-colors py-1 px-2 rounded hover:bg-zinc-800"
                        onClick={async () => {
                          // 使用 import.meta.env.BASE_URL 确保在 GitHub Pages 上路径正确
                          const baseUrl = import.meta.env.BASE_URL;
                          const audioPath = `${baseUrl}audio/${track.filename}`;
                          initAudioContext();
                          
                          if (audioElRef.current) {
                            audioElRef.current.src = audioPath;
                            audioElRef.current.load();
                            
                            // 停止当前播放
                            if (audioState.isPlaying) {
                              audioElRef.current.pause();
                              setAudioState(prev => ({ ...prev, isPlaying: false }));
                            }
                            
                            // 尝试播放，如果失败则提示文件不存在
                            try {
                              await audioElRef.current.play();
                              if (!sourceNodeRef.current) {
                                setupAudioGraph();
                              }
                              setAudioState(prev => ({ ...prev, isPlaying: true }));
                              await updateMetadata(track.title, track.artist);
                            } catch (error) {
                              console.error("Play failed", error);
                              alert(`无法播放 ${track.title}\n\n请确保音频文件已放置在 public/audio/${track.filename}`);
                            }
                          }
                        }}
                      >
                        <span className="flex items-center">
                          <span className="text-green-500 mr-2 group-hover:text-green-400">▶</span>
                          {track.artist} - {track.title}
                        </span>
                        <span className="text-[8px] text-gray-600 group-hover:text-gray-500">CLICK</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {(activeTab === AudioSourceType.NETEASE || activeTab === AudioSourceType.QQ) && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Paste Song URL..." 
                    className="w-full bg-zinc-900 border border-gray-600 p-2 text-sm font-mono text-green-400 focus:outline-none focus:border-green-500"
                  />
                  <button 
                    onClick={() => handleExternalLink(activeTab)}
                    className="bg-gray-700 px-4 text-xs font-retro hover:bg-gray-600"
                  >
                    LOAD
                  </button>
                </div>
                <p className="text-[10px] text-yellow-600 font-mono">
                  * 警告：云音乐链接可能需要本地代理才能绕过 CORS 限制。建议直接下载 MP3 后上传。
                </p>
              </div>
            )}
          </div>

          <Visualizer analyser={analyserRef.current} isPlaying={audioState.isPlaying} />

          <Controls 
            audioState={audioState} 
            setAudioState={setAudioState} 
            onPlayPause={togglePlay}
            onSeek={handleSeek}
          />
        </div>
      </main>

      <footer className="mt-12 text-gray-600 text-[10px] font-mono">
        POWERED BY REACT + WEB AUDIO API + GOOGLE GEMINI
      </footer>
    </div>
  );
}
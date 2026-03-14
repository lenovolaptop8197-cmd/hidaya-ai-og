import { useEffect, useMemo, useRef, useState } from "react";
import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import {
  BookOpen,
  BookText,
  Calendar,
  HandHeart,
  Landmark,
  MessageSquare,
  Moon,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  X,
  Target,
  Sparkles,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import "@/App.css";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import ChatPage from "@/pages/ChatPage";
import DashboardPage from "@/pages/DashboardPage";
import DuaBookPage from "@/pages/DuaBookPage";
import HajjUmrahPage from "@/pages/HajjUmrahPage";
import PrayerPage from "@/pages/PrayerPage";
import QuranPage from "@/pages/QuranPage";
import ZakatPage from "@/pages/ZakatPage";
import TasbihPage from "@/pages/TasbihPage";
import NamesPage from "@/pages/NamesPage";
import IslamicCalendarPage from "@/pages/IslamicCalendarPage";

const navItems = [
  { to: "/", icon: Moon, label: "Dashboard" },
  { to: "/companion", icon: MessageSquare, label: "Hidaya Chat" },
  { to: "/mushaf", icon: BookOpen, label: "Mushaf" },
  { to: "/prayer", icon: Moon, label: "Prayer" },
  { to: "/tasbih", icon: Target, label: "Tasbih" },
  { to: "/names", icon: Sparkles, label: "99 Names" },
  { to: "/zakat", icon: Landmark, label: "Zakat" },
  { to: "/hajj-umrah", icon: HandHeart, label: "Hajj & Umrah" },
  { to: "/dua", icon: BookText, label: "Dua Book" },
  { to: "/islamic-calendar", icon: Calendar, label: "Calendar" },
];

const navSlug = (label) => label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

const initialAudio = {
  tracks: [],
  currentIndex: -1,
  isPlaying: false,
  title: "",
  reciter: "",
  surahNumber: null,
  reciterId: null,
  totalSurahs: 114,
};

const DEFAULT_TRACK_DURATION = 6;

const formatPlaybackTime = (secondsValue) => {
  const safeSeconds = Number.isFinite(secondsValue) ? Math.max(0, Math.floor(secondsValue)) : 0;
  const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, "0");
  const seconds = String(safeSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const buildDurationEstimates = (tracks, trackDurations) => {
  const knownDurations = Object.values(trackDurations).filter((value) => Number.isFinite(value) && value > 0);
  const averageKnownDuration = knownDurations.length
    ? knownDurations.reduce((sum, value) => sum + value, 0) / knownDurations.length
    : DEFAULT_TRACK_DURATION;

  return tracks.map((_, index) => {
    const direct = trackDurations[index];
    if (Number.isFinite(direct) && direct > 0) {
      return direct;
    }
    return averageKnownDuration;
  });
};

const computeGlobalTimeline = ({ tracks, trackDurations, currentIndex, currentTime }) => {
  if (!tracks.length || currentIndex < 0) {
    return { currentTime: 0, duration: 0 };
  }

  const estimates = buildDurationEstimates(tracks, trackDurations);
  const totalDuration = estimates.reduce((sum, value) => sum + value, 0);
  const elapsedBeforeCurrent = estimates
    .slice(0, currentIndex)
    .reduce((sum, value) => sum + value, 0);

  return {
    currentTime: Math.min(totalDuration, elapsedBeforeCurrent + (currentTime || 0)),
    duration: totalDuration,
  };
};

const mapGlobalTimeToTrack = ({ tracks, trackDurations, globalTime }) => {
  const estimates = buildDurationEstimates(tracks, trackDurations);
  let cursor = 0;

  for (let index = 0; index < estimates.length; index += 1) {
    const duration = estimates[index];
    if (globalTime <= cursor + duration || index === estimates.length - 1) {
      return {
        targetIndex: index,
        trackOffset: Math.max(0, globalTime - cursor),
      };
    }
    cursor += duration;
  }

  return { targetIndex: 0, trackOffset: 0 };
};

const Navigation = () => (
  <>
    <header className="sticky top-0 z-40 border-b border-[#23B574]/10 bg-[#f4f0e8]/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-8">
        <div className="flex items-center gap-3">
          <img 
            src="/hidaya-logo.png" 
            alt="Hidaya AI Logo" 
            className="h-12 w-auto"
            data-testid="brand-logo-image"
          />
          <div>
            <p data-testid="app-title" className="text-lg font-semibold tracking-tight text-[#1a202c]">
              Hidaya AI
            </p>
            <p data-testid="app-subtitle" className="text-xs text-[#4a5568]">
              Islamic Companion
            </p>
          </div>
        </div>

        <nav className="hidden items-center gap-2 lg:flex" data-testid="desktop-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              data-testid={`desktop-nav-${navSlug(item.label)}-link`}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm transition-colors ${
                  isActive ? "bg-[#23B574] text-white" : "text-[#23B574] hover:bg-[#23B574]/10"
                }`
              }
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>

    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#23B574]/10 bg-white/95 px-2 pb-4 pt-2 backdrop-blur-lg lg:hidden"
      data-testid="mobile-nav"
    >
      <div className="mx-auto grid max-w-3xl grid-cols-5 gap-1 sm:grid-cols-9">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              data-testid={`mobile-nav-${navSlug(item.label)}-link`}
              className={({ isActive }) =>
                `flex flex-col items-center rounded-xl px-1 py-2 text-[11px] ${
                  isActive ? "bg-[#23B574] text-white" : "text-[#23B574]"
                }`
              }
            >
              <Icon className="mb-1 h-4 w-4" />
              <span className="text-center leading-tight">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  </>
);

const PersistentAudioPlayer = ({
  audioState,
  playbackTime,
  onTogglePlay,
  onPrevious,
  onNext,
  onDismiss,
  onSeek,
}) => {
  const track = audioState.tracks[audioState.currentIndex];
  if (!track) {
    return null;
  }

  return (
    <div
      data-testid="persistent-audio-player"
      className="fixed bottom-24 left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-2xl -translate-x-1/2 rounded-2xl border border-[#23B574]/20 bg-white px-4 py-3 shadow-xl lg:bottom-6"
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p data-testid="audio-track-title" className="truncate text-sm font-semibold text-[#1a202c]">
            {audioState.title || "Quran Recitation"}
          </p>
          <p data-testid="audio-track-meta" className="truncate text-xs text-[#4a5568]">
            {audioState.reciter} • {track.label}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p data-testid="audio-track-position" className="text-xs text-[#4a5568]">
            {audioState.currentIndex + 1}/{audioState.tracks.length}
          </p>
          <Button
            data-testid="audio-overlay-dismiss-button"
            className="h-7 w-7 rounded-full bg-[#f4f0e8] p-0 text-[#23B574] hover:bg-[#e8e4dc]"
            onClick={onDismiss}
            type="button"
            variant="ghost"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="mb-3" data-testid="audio-time-slider-group">
        <Slider
          data-testid="audio-time-slider"
          max={Math.max(1, playbackTime.duration || 1)}
          min={0}
          onValueChange={onSeek}
          onValueCommit={onSeek}
          step={1}
          value={[Math.min(playbackTime.currentTime, Math.max(1, playbackTime.duration || 1))]}
        />
        <div className="mt-1 flex justify-between text-xs text-[#4a5568]">
          <span data-testid="audio-current-time-label">{formatPlaybackTime(playbackTime.currentTime)}</span>
          <span data-testid="audio-duration-time-label">{formatPlaybackTime(playbackTime.duration)}</span>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2">
        <Button
          data-testid="audio-previous-button"
          className="h-10 w-10 rounded-full bg-[#f4f0e8] text-[#23B574] hover:bg-[#e8e4dc]"
          onClick={onPrevious}
          disabled={audioState.currentIndex <= 0}
          type="button"
          variant="ghost"
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button
          data-testid="audio-play-pause-button"
          className="h-10 w-10 rounded-full bg-[#23B574] text-white hover:bg-[#1d9560]"
          onClick={onTogglePlay}
          type="button"
        >
          {audioState.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button
          data-testid="audio-next-button"
          className="h-10 w-10 rounded-full bg-[#f4f0e8] text-[#23B574] hover:bg-[#e8e4dc]"
          onClick={onNext}
          disabled={audioState.currentIndex >= audioState.tracks.length - 1}
          type="button"
          variant="ghost"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const AppRoutes = ({ onSetQueue }) => (
  <Routes>
    <Route path="/" element={<DashboardPage />} />
    <Route path="/companion" element={<ChatPage />} />
    <Route path="/mushaf" element={<QuranPage onSetQueue={onSetQueue} />} />
    <Route path="/prayer" element={<PrayerPage />} />
    <Route path="/tasbih" element={<TasbihPage />} />
    <Route path="/names" element={<NamesPage />} />
    <Route path="/zakat" element={<ZakatPage />} />
    <Route path="/hajj-umrah" element={<HajjUmrahPage />} />
    <Route path="/dua" element={<DuaBookPage />} />
    <Route path="/islamic-calendar" element={<IslamicCalendarPage />} />
  </Routes>
);

function App() {
  const audioRef = useRef(null);
  const pendingSeekRef = useRef(null);
  const [audioState, setAudioState] = useState(initialAudio);
  const [playbackTime, setPlaybackTime] = useState({ currentTime: 0, duration: 0 });
  const [trackDurations, setTrackDurations] = useState({});

  const currentTrack = useMemo(
    () => audioState.tracks[audioState.currentIndex] ?? null,
    [audioState.currentIndex, audioState.tracks],
  );

  const onSetQueue = ({ tracks, startIndex = 0, title = "", reciter = "", surahNumber = null, reciterId = null }) => {
    if (!tracks?.length) {
      return;
    }
    setAudioState({
      tracks,
      currentIndex: startIndex,
      isPlaying: true,
      title,
      reciter,
      surahNumber,
      reciterId,
      totalSurahs: 114,
    });
    setTrackDurations({});
    setPlaybackTime({ currentTime: 0, duration: 0 });
  };

  const onTogglePlay = () => {
    setAudioState((prev) => {
      const willPlay = !prev.isPlaying;
      toast(willPlay ? "Audio resumed" : "Audio paused", {
        id: "audio-playback-status",
        duration: 5000,
        closeButton: true,
        action: {
          label: "✕",
          onClick: () => toast.dismiss("audio-playback-status"),
        },
      });
      return { ...prev, isPlaying: willPlay };
    });
  };

  const onPrevious = () => {
    setAudioState((prev) => ({
      ...prev,
      currentIndex: Math.max(0, prev.currentIndex - 1),
      isPlaying: true,
    }));
  };

  const loadNextSurah = async () => {
    const { surahNumber, reciterId, totalSurahs } = audioState;
    
    if (!surahNumber || !reciterId) {
      return null;
    }
    
    const nextSurahNum = parseInt(surahNumber) + 1;
    
    if (nextSurahNum > totalSurahs) {
      toast.info("You've completed all 114 Surahs! May Allah accept your recitation.");
      return null;
    }
    
    try {
      // Dynamically import the API function
      const { getSurahDetails } = await import("@/lib/api");
      const data = await getSurahDetails(nextSurahNum.toString(), reciterId);
      
      if (data?.ayahs) {
        const tracks = data.ayahs
          .filter((ayah) => ayah.audio_url)
          .map((ayah) => ({
            url: ayah.audio_url,
            label: `Ayah ${ayah.number_in_surah}`,
            numberInSurah: ayah.number_in_surah,
          }));
        
        if (tracks.length > 0) {
          toast.success(`Auto-playing next Surah: ${data.name_english}`, {
            duration: 4000,
          });
          
          return {
            tracks,
            title: `Surah ${data.name_english || ""}`,
            reciter: data.reciter_name || audioState.reciter,
            surahNumber: nextSurahNum.toString(),
            reciterId,
          };
        }
      }
    } catch (error) {
      console.error("Failed to load next surah:", error);
      toast.error("Could not load next Surah");
    }
    
    return null;
  };

  const onNext = async () => {
    const atLastTrack = audioState.currentIndex >= audioState.tracks.length - 1;
    
    if (atLastTrack && audioState.surahNumber && audioState.reciterId) {
      // At the end of a Surah, try to load the next one
      const nextSurahData = await loadNextSurah();
      
      if (nextSurahData) {
        setAudioState({
          tracks: nextSurahData.tracks,
          currentIndex: 0,
          isPlaying: true,
          title: nextSurahData.title,
          reciter: nextSurahData.reciter,
          surahNumber: nextSurahData.surahNumber,
          reciterId: nextSurahData.reciterId,
          totalSurahs: 114,
        });
        setTrackDurations({});
        return;
      }
      
      // If no next Surah, stop playing
      setAudioState((prev) => ({ ...prev, isPlaying: false }));
      return;
    }
    
    if (atLastTrack) {
      setAudioState((prev) => ({ ...prev, isPlaying: false }));
      return;
    }
    
    // Normal case: move to next ayah
    setAudioState((prev) => ({
      ...prev,
      currentIndex: prev.currentIndex + 1,
      isPlaying: true,
    }));
  };

  const onDismiss = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
    }
    pendingSeekRef.current = null;
    toast.dismiss("audio-playback-status");
    setTrackDurations({});
    setPlaybackTime({ currentTime: 0, duration: 0 });
    setAudioState({ ...initialAudio });
  };

  const onSeek = (values) => {
    const nextValue = values?.[0] ?? 0;
    if (!Number.isFinite(nextValue) || !audioState.tracks.length) {
      return;
    }

    const { targetIndex, trackOffset } = mapGlobalTimeToTrack({
      tracks: audioState.tracks,
      trackDurations,
      globalTime: nextValue,
    });

    pendingSeekRef.current = trackOffset;

    if (targetIndex === audioState.currentIndex && audioRef.current) {
      audioRef.current.currentTime = trackOffset;
      pendingSeekRef.current = null;
    } else {
      setAudioState((prev) => ({
        ...prev,
        currentIndex: targetIndex,
      }));
    }

    setPlaybackTime((prev) => ({
      ...prev,
      currentTime: nextValue,
    }));
  };

  useEffect(() => {
    if (!audioRef.current || !currentTrack?.url) {
      return;
    }
    audioRef.current.src = currentTrack.url;
    if (audioState.isPlaying) {
      audioRef.current.play().catch(() => {
        setAudioState((prev) => ({ ...prev, isPlaying: false }));
      });
    }
  }, [currentTrack, audioState.isPlaying]);

  useEffect(() => {
    if (!audioRef.current || !currentTrack?.url) {
      return;
    }
    if (audioState.isPlaying) {
      audioRef.current.play().catch(() => {
        setAudioState((prev) => ({ ...prev, isPlaying: false }));
      });
      return;
    }
    audioRef.current.pause();
  }, [audioState.isPlaying, currentTrack]);

  useEffect(() => {
    if (!audioState.tracks.length) {
      return;
    }

    let cancelled = false;
    const loadDuration = (url) =>
      new Promise((resolve) => {
        const probe = new Audio();
        let completed = false;
        const timeoutId = window.setTimeout(() => {
          if (!completed) {
            completed = true;
            resolve(0);
          }
        }, 9000);

        const finalize = (durationValue) => {
          if (!completed) {
            completed = true;
            window.clearTimeout(timeoutId);
            resolve(durationValue);
          }
        };

        probe.preload = "metadata";
        probe.src = url;
        probe.onloadedmetadata = () => finalize(Number.isFinite(probe.duration) ? probe.duration : 0);
        probe.onerror = () => finalize(0);
      });

    const run = async () => {
      const workerCount = Math.min(3, audioState.tracks.length);
      let pointer = 0;

      const worker = async () => {
        while (!cancelled && pointer < audioState.tracks.length) {
          const index = pointer;
          pointer += 1;
          const duration = await loadDuration(audioState.tracks[index].url);
          if (!cancelled && duration > 0) {
            const normalized = Math.round(duration * 100) / 100;
            setTrackDurations((prev) => {
              if (prev[index] && Math.abs(prev[index] - normalized) < 0.05) {
                return prev;
              }
              return { ...prev, [index]: normalized };
            });
          }
        }
      };

      await Promise.all(Array.from({ length: workerCount }, () => worker()));
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [audioState.tracks]);

  useEffect(() => {
    if (!audioRef.current) {
      return;
    }

    const updateProgress = () => {
      const currentTime = audioRef.current?.currentTime ?? 0;
      const duration = audioRef.current?.duration ?? 0;

      const safeCurrentTime = Number.isFinite(currentTime) ? currentTime : 0;
      const safeDuration = Number.isFinite(duration) ? duration : 0;
      const roundedDuration = Math.round(safeDuration * 100) / 100;

      if (audioState.currentIndex >= 0 && roundedDuration > 0) {
        setTrackDurations((prev) => {
          if (prev[audioState.currentIndex] && Math.abs(prev[audioState.currentIndex] - roundedDuration) < 0.05) {
            return prev;
          }
          return {
            ...prev,
            [audioState.currentIndex]: roundedDuration,
          };
        });
      }

      const globalTimeline = computeGlobalTimeline({
        tracks: audioState.tracks,
        trackDurations,
        currentIndex: audioState.currentIndex,
        currentTime: safeCurrentTime,
      });
      setPlaybackTime(globalTimeline);
    };

    const applyPendingSeek = () => {
      if (pendingSeekRef.current === null || !audioRef.current) {
        return;
      }
      const maxTime = Number.isFinite(audioRef.current.duration) ? Math.max(0, audioRef.current.duration - 0.1) : 0;
      const nextSeek = Math.min(Math.max(0, pendingSeekRef.current), maxTime);
      audioRef.current.currentTime = nextSeek;
      pendingSeekRef.current = null;
    };

    const onLoadedMetadata = () => {
      applyPendingSeek();
      updateProgress();
    };

    audioRef.current.addEventListener("timeupdate", updateProgress);
    audioRef.current.addEventListener("loadedmetadata", onLoadedMetadata);
    audioRef.current.addEventListener("durationchange", updateProgress);

    return () => {
      audioRef.current?.removeEventListener("timeupdate", updateProgress);
      audioRef.current?.removeEventListener("loadedmetadata", onLoadedMetadata);
      audioRef.current?.removeEventListener("durationchange", updateProgress);
    };
  }, [audioState.currentIndex, audioState.tracks, trackDurations]);

  return (
    <div className="islamic-shell min-h-screen bg-[#f4f0e8] text-[#1a202c]">
      <BrowserRouter>
        <Navigation />
        <main className="mx-auto w-full max-w-6xl px-4 pb-32 pt-8 md:px-8 lg:pb-28">
          <AppRoutes onSetQueue={onSetQueue} />
        </main>

        <PersistentAudioPlayer
          audioState={audioState}
          playbackTime={playbackTime}
          onTogglePlay={onTogglePlay}
          onPrevious={onPrevious}
          onNext={onNext}
          onDismiss={onDismiss}
          onSeek={onSeek}
        />
        <audio
          data-testid="global-audio-element"
          onEnded={onNext}
          preload="none"
          ref={audioRef}
        />
      </BrowserRouter>
      <Toaster closeButton richColors position="top-right" toastOptions={{ duration: 2500 }} />
    </div>
  );
}

export default App;

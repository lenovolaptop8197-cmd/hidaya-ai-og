import { useEffect, useMemo, useState } from "react";
import { Play } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { getReciters, getSurahDetails, getSurahs } from "@/lib/api";

export default function QuranPage({ onSetQueue }) {
  const [surahs, setSurahs] = useState([]);
  const [reciters, setReciters] = useState([]);
  const [surahNumber, setSurahNumber] = useState("1");
  const [reciterId, setReciterId] = useState("ar.alafasy");
  const [fontSize, setFontSize] = useState(38);
  const [surahData, setSurahData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadStaticData = async () => {
      try {
        const [surahList, reciterList] = await Promise.all([getSurahs(), getReciters()]);
        setSurahs(surahList || []);
        setReciters(reciterList || []);
      } catch {
        toast.error("Unable to load Quran lists.");
      }
    };
    loadStaticData();
  }, []);

  useEffect(() => {
    const loadSurahData = async () => {
      setLoading(true);
      try {
        const data = await getSurahDetails(surahNumber, reciterId);
        setSurahData(data);
      } catch {
        toast.error("Unable to load selected surah.");
      } finally {
        setLoading(false);
      }
    };
    loadSurahData();
  }, [surahNumber, reciterId]);

  const tracks = useMemo(
    () =>
      (surahData?.ayahs || [])
        .filter((ayah) => ayah.audio_url)
        .map((ayah) => ({
          url: ayah.audio_url,
          label: `Ayah ${ayah.number_in_surah}`,
          numberInSurah: ayah.number_in_surah,
        })),
    [surahData],
  );

  const startPlayback = (ayahNumber = null) => {
    if (!tracks.length) {
      toast.error("Audio stream is unavailable for this reciter/surah.");
      return;
    }
    const index = ayahNumber
      ? Math.max(0, tracks.findIndex((track) => track.numberInSurah === ayahNumber))
      : 0;
    onSetQueue({
      tracks,
      startIndex: index,
      title: `Surah ${surahData?.name_english || ""}`,
      reciter: surahData?.reciter_name || "Selected reciter",
      surahNumber: surahNumber,
      reciterId: reciterId,
    });
    toast.success("Audio started", {
      id: "audio-playback-status",
      duration: 5000,
      closeButton: true,
      action: {
        label: "✕",
        onClick: () => toast.dismiss("audio-playback-status"),
      },
    });
  };

  const goToNextSurah = () => {
    const currentNum = parseInt(surahNumber);
    if (currentNum < 114) {
      setSurahNumber((currentNum + 1).toString());
      toast.success(`Moving to next Surah (${currentNum + 1})`, {
        duration: 2000,
      });
      // Scroll to top of page
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast.info("You've reached the last Surah (An-Nas)");
    }
  };

  const goToPreviousSurah = () => {
    const currentNum = parseInt(surahNumber);
    if (currentNum > 1) {
      setSurahNumber((currentNum - 1).toString());
      toast.success(`Moving to previous Surah (${currentNum - 1})`, {
        duration: 2000,
      });
      // Scroll to top of page
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast.info("You're already at the first Surah (Al-Faatiha)");
    }
  };

  return (
    <section className="space-y-6">
      <Card className="border-[#23B574]/10 bg-white/90" data-testid="quran-controls-card">
        <CardHeader>
          <CardTitle data-testid="quran-page-title" className="text-2xl text-[#1a202c]">
            Digital Mushaf • Reader & Listener
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2" data-testid="surah-select-group">
              <span className="text-sm font-medium text-[#4a5568]">Surah</span>
              <select
                className="h-11 w-full rounded-xl border border-[#23B574]/20 bg-white px-3"
                data-testid="surah-select"
                onChange={(event) => setSurahNumber(event.target.value)}
                value={surahNumber}
              >
                {surahs.map((surah) => (
                  <option key={surah.number} value={surah.number}>
                    {surah.number}. {surah.name_english}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2" data-testid="reciter-select-group">
              <span className="text-sm font-medium text-[#4a5568]">Reciter</span>
              <select
                className="h-11 w-full rounded-xl border border-[#23B574]/20 bg-white px-3"
                data-testid="reciter-select"
                onChange={(event) => setReciterId(event.target.value)}
                value={reciterId}
              >
                {reciters.map((reciter) => (
                  <option key={reciter.id} value={reciter.id}>
                    {reciter.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-3" data-testid="font-size-control-group">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#4a5568]">Arabic font size</span>
              <span data-testid="quran-font-size-value" className="text-sm text-[#23B574]">
                {fontSize}px
              </span>
            </div>
            <Slider
              data-testid="quran-font-size-slider"
              max={52}
              min={28}
              onValueChange={(values) => setFontSize(values[0])}
              value={[fontSize]}
            />
          </div>

          <Button
            className="rounded-full bg-[#23B574] px-6 text-white hover:bg-[#1d9560]"
            data-testid="play-surah-button"
            onClick={() => startPlayback()}
            type="button"
          >
            <Play className="me-2 h-4 w-4" /> Play Surah
          </Button>
        </CardContent>
      </Card>

      <Card className="border-[#23B574]/10 bg-white" data-testid="quran-reading-card">
        <CardHeader>
          <CardTitle data-testid="quran-reading-title" className="text-xl text-[#1a202c]">
            {loading ? "Loading..." : `${surahData?.name_english || ""} • ${surahData?.name_arabic || ""}`}
          </CardTitle>
          <p data-testid="quran-reciter-label" className="text-sm text-[#4a5568]">
            Reciter: {surahData?.reciter_name || "..."}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {(surahData?.ayahs || []).map((ayah) => (
            <article
              className="rounded-2xl border border-[#23B574]/10 bg-[#fcfbf8] p-4"
              data-testid={`ayah-card-${ayah.number_in_surah}`}
              key={ayah.number_in_surah}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <p data-testid={`ayah-number-${ayah.number_in_surah}`} className="rounded-full bg-[#23B574] px-2 py-1 text-xs text-white">
                  Ayah {ayah.number_in_surah}
                </p>
                <Button
                  className="h-9 rounded-full border border-[#23B574]/30 bg-transparent px-3 text-[#23B574] hover:bg-[#23B574]/10"
                  data-testid={`ayah-play-button-${ayah.number_in_surah}`}
                  onClick={() => startPlayback(ayah.number_in_surah)}
                  type="button"
                  variant="ghost"
                >
                  <Play className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p
                className="font-arabic mb-3 leading-[2.2] text-[#1a202c]"
                data-testid={`ayah-arabic-text-${ayah.number_in_surah}`}
                dir="rtl"
                style={{ fontSize: `${fontSize}px` }}
              >
                {ayah.text_arabic}
              </p>
              <p data-testid={`ayah-english-text-${ayah.number_in_surah}`} className="text-sm leading-7 text-[#4a5568]">
                {ayah.text_english}
              </p>
            </article>
          ))}

          {/* Navigation buttons at the end of Surah */}
          {surahData?.ayahs && surahData.ayahs.length > 0 && (
            <div className="pt-6 border-t border-[#23B574]/10">
              <div className="flex items-center justify-between gap-4">
                <Button
                  onClick={goToPreviousSurah}
                  disabled={parseInt(surahNumber) === 1}
                  className="flex-1 rounded-full border-2 border-[#23B574]/20 bg-white text-[#23B574] hover:bg-[#23B574]/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="previous-surah-button"
                  type="button"
                  variant="outline"
                >
                  ← Previous Surah
                </Button>
                
                <div className="text-center">
                  <p className="text-sm font-semibold text-[#23B574]">
                    Surah {surahNumber} of 114
                  </p>
                  <p className="text-xs text-[#4a5568]">
                    {surahData?.name_english}
                  </p>
                </div>

                <Button
                  onClick={goToNextSurah}
                  disabled={parseInt(surahNumber) === 114}
                  className="flex-1 rounded-full bg-[#23B574] text-white hover:bg-[#1d9560] disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="next-surah-button"
                  type="button"
                >
                  Next Surah →
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

import { useState, useMemo } from "react";
import { Search, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// 99 Names of Allah (Asma-ul-Husna)
const NAMES_OF_ALLAH = [
  { number: 1, arabic: "ٱلْرَّحْمَـانُ", transliteration: "Ar-Rahman", meaning: "The Most Merciful" },
  { number: 2, arabic: "ٱلْرَّحِيْمُ", transliteration: "Ar-Raheem", meaning: "The Bestower of Mercy" },
  { number: 3, arabic: "ٱلْمَلِكُ", transliteration: "Al-Malik", meaning: "The King" },
  { number: 4, arabic: "ٱلْقُدُّوسُ", transliteration: "Al-Quddus", meaning: "The Most Sacred" },
  { number: 5, arabic: "ٱلْسَّلَامُ", transliteration: "As-Salam", meaning: "The Perfection and Giver of Peace" },
  { number: 6, arabic: "ٱلْمُؤْمِنُ", transliteration: "Al-Mu'min", meaning: "The One Who gives Emaan and Security" },
  { number: 7, arabic: "ٱلْمُهَيْمِنُ", transliteration: "Al-Muhaymin", meaning: "The Guardian" },
  { number: 8, arabic: "ٱلْعَزِيزُ", transliteration: "Al-Aziz", meaning: "The Almighty" },
  { number: 9, arabic: "ٱلْجَبَّارُ", transliteration: "Al-Jabbar", meaning: "The Compeller" },
  { number: 10, arabic: "ٱلْمُتَكَبِّرُ", transliteration: "Al-Mutakabbir", meaning: "The Supreme" },
  { number: 11, arabic: "ٱلْخَالِقُ", transliteration: "Al-Khaliq", meaning: "The Creator" },
  { number: 12, arabic: "ٱلْبَارِئُ", transliteration: "Al-Bari", meaning: "The Evolver" },
  { number: 13, arabic: "ٱلْمُصَوِّرُ", transliteration: "Al-Musawwir", meaning: "The Fashioner" },
  { number: 14, arabic: "ٱلْغَفَّارُ", transliteration: "Al-Ghaffar", meaning: "The Oft-Forgiving" },
  { number: 15, arabic: "ٱلْقَهَّارُ", transliteration: "Al-Qahhar", meaning: "The Subduer" },
  { number: 16, arabic: "ٱلْوَهَّابُ", transliteration: "Al-Wahhab", meaning: "The Bestower" },
  { number: 17, arabic: "ٱلْرَّزَّاقُ", transliteration: "Ar-Razzaq", meaning: "The Provider" },
  { number: 18, arabic: "ٱلْفَتَّاحُ", transliteration: "Al-Fattah", meaning: "The Opener" },
  { number: 19, arabic: "ٱلْعَلِيمُ", transliteration: "Al-Aleem", meaning: "The All-Knowing" },
  { number: 20, arabic: "ٱلْقَابِضُ", transliteration: "Al-Qabid", meaning: "The Withholder" },
  { number: 21, arabic: "ٱلْبَاسِطُ", transliteration: "Al-Basit", meaning: "The Extender" },
  { number: 22, arabic: "ٱلْخَافِضُ", transliteration: "Al-Khafid", meaning: "The Reducer" },
  { number: 23, arabic: "ٱلْرَّافِعُ", transliteration: "Ar-Rafi", meaning: "The Exalter" },
  { number: 24, arabic: "ٱلْمُعِزُّ", transliteration: "Al-Mu'izz", meaning: "The Honorer" },
  { number: 25, arabic: "ٱلْمُذِلُّ", transliteration: "Al-Mudhill", meaning: "The Humiliator" },
  { number: 26, arabic: "ٱلْسَّمِيعُ", transliteration: "As-Sami", meaning: "The All-Hearing" },
  { number: 27, arabic: "ٱلْبَصِيرُ", transliteration: "Al-Basir", meaning: "The All-Seeing" },
  { number: 28, arabic: "ٱلْحَكَمُ", transliteration: "Al-Hakam", meaning: "The Judge" },
  { number: 29, arabic: "ٱلْعَدْلُ", transliteration: "Al-Adl", meaning: "The Just" },
  { number: 30, arabic: "ٱلْلَّطِيفُ", transliteration: "Al-Latif", meaning: "The Subtle One" },
  { number: 31, arabic: "ٱلْخَبِيرُ", transliteration: "Al-Khabir", meaning: "The Aware" },
  { number: 32, arabic: "ٱلْحَلِيمُ", transliteration: "Al-Halim", meaning: "The Forbearing" },
  { number: 33, arabic: "ٱلْعَظِيمُ", transliteration: "Al-Azeem", meaning: "The Magnificent" },
  { number: 34, arabic: "ٱلْغَفُورُ", transliteration: "Al-Ghafoor", meaning: "The Great Forgiver" },
  { number: 35, arabic: "ٱلْشَّكُورُ", transliteration: "Ash-Shakur", meaning: "The Appreciative" },
  { number: 36, arabic: "ٱلْعَلِيُّ", transliteration: "Al-Aliyy", meaning: "The Most High" },
  { number: 37, arabic: "ٱلْكَبِيرُ", transliteration: "Al-Kabir", meaning: "The Most Great" },
  { number: 38, arabic: "ٱلْحَفِيظُ", transliteration: "Al-Hafiz", meaning: "The Preserver" },
  { number: 39, arabic: "ٱلْمُقِيتُ", transliteration: "Al-Muqit", meaning: "The Sustainer" },
  { number: 40, arabic: "ٱلْحَسِيبُ", transliteration: "Al-Hasib", meaning: "The Reckoner" },
  { number: 41, arabic: "ٱلْجَلِيلُ", transliteration: "Al-Jalil", meaning: "The Majestic" },
  { number: 42, arabic: "ٱلْكَرِيمُ", transliteration: "Al-Karim", meaning: "The Generous" },
  { number: 43, arabic: "ٱلْرَّقِيبُ", transliteration: "Ar-Raqib", meaning: "The Watchful" },
  { number: 44, arabic: "ٱلْمُجِيبُ", transliteration: "Al-Mujib", meaning: "The Responsive" },
  { number: 45, arabic: "ٱلْوَاسِعُ", transliteration: "Al-Wasi", meaning: "The All-Encompassing" },
  { number: 46, arabic: "ٱلْحَكِيمُ", transliteration: "Al-Hakim", meaning: "The All-Wise" },
  { number: 47, arabic: "ٱلْوَدُودُ", transliteration: "Al-Wadud", meaning: "The Loving One" },
  { number: 48, arabic: "ٱلْمَجِيدُ", transliteration: "Al-Majid", meaning: "The Glorious" },
  { number: 49, arabic: "ٱلْبَاعِثُ", transliteration: "Al-Ba'ith", meaning: "The Resurrector" },
  { number: 50, arabic: "ٱلْشَّهِيدُ", transliteration: "Ash-Shahid", meaning: "The Witness" },
  { number: 51, arabic: "ٱلْحَقُّ", transliteration: "Al-Haqq", meaning: "The Truth" },
  { number: 52, arabic: "ٱلْوَكِيلُ", transliteration: "Al-Wakil", meaning: "The Trustee" },
  { number: 53, arabic: "ٱلْقَوِيُّ", transliteration: "Al-Qawiyy", meaning: "The Strong" },
  { number: 54, arabic: "ٱلْمَتِينُ", transliteration: "Al-Matin", meaning: "The Firm" },
  { number: 55, arabic: "ٱلْوَلِيُّ", transliteration: "Al-Waliyy", meaning: "The Protecting Associate" },
  { number: 56, arabic: "ٱلْحَمِيدُ", transliteration: "Al-Hamid", meaning: "The Praiseworthy" },
  { number: 57, arabic: "ٱلْمُحْصِيُ", transliteration: "Al-Muhsi", meaning: "The All-Enumerating" },
  { number: 58, arabic: "ٱلْمُبْدِئُ", transliteration: "Al-Mubdi", meaning: "The Originator" },
  { number: 59, arabic: "ٱلْمُعِيدُ", transliteration: "Al-Mu'id", meaning: "The Restorer" },
  { number: 60, arabic: "ٱلْمُحْيِي", transliteration: "Al-Muhyi", meaning: "The Giver of Life" },
  { number: 61, arabic: "ٱلْمُمِيتُ", transliteration: "Al-Mumit", meaning: "The Bringer of Death" },
  { number: 62, arabic: "ٱلْحَيُّ", transliteration: "Al-Hayy", meaning: "The Ever-Living" },
  { number: 63, arabic: "ٱلْقَيُّومُ", transliteration: "Al-Qayyum", meaning: "The Self-Sustaining" },
  { number: 64, arabic: "ٱلْوَاجِدُ", transliteration: "Al-Wajid", meaning: "The Perceiver" },
  { number: 65, arabic: "ٱلْمَاجِدُ", transliteration: "Al-Majid", meaning: "The Illustrious" },
  { number: 66, arabic: "ٱلْوَاحِدُ", transliteration: "Al-Wahid", meaning: "The One" },
  { number: 67, arabic: "ٱلْأَحَد", transliteration: "Al-Ahad", meaning: "The Unique" },
  { number: 68, arabic: "ٱلْصَّمَدُ", transliteration: "As-Samad", meaning: "The Eternal Refuge" },
  { number: 69, arabic: "ٱلْقَادِرُ", transliteration: "Al-Qadir", meaning: "The Capable" },
  { number: 70, arabic: "ٱلْمُقْتَدِرُ", transliteration: "Al-Muqtadir", meaning: "The Powerful" },
  { number: 71, arabic: "ٱلْمُقَدِّمُ", transliteration: "Al-Muqaddim", meaning: "The Expediter" },
  { number: 72, arabic: "ٱلْمُؤَخِّرُ", transliteration: "Al-Mu'akhkhir", meaning: "The Delayer" },
  { number: 73, arabic: "ٱلْأَوَّلُ", transliteration: "Al-Awwal", meaning: "The First" },
  { number: 74, arabic: "ٱلْآخِرُ", transliteration: "Al-Akhir", meaning: "The Last" },
  { number: 75, arabic: "ٱلْظَّاهِرُ", transliteration: "Az-Zahir", meaning: "The Manifest" },
  { number: 76, arabic: "ٱلْبَاطِنُ", transliteration: "Al-Batin", meaning: "The Hidden" },
  { number: 77, arabic: "ٱلْوَالِي", transliteration: "Al-Wali", meaning: "The Governor" },
  { number: 78, arabic: "ٱلْمُتَعَالِي", transliteration: "Al-Muta'ali", meaning: "The Exalted" },
  { number: 79, arabic: "ٱلْبَرُّ", transliteration: "Al-Barr", meaning: "The Source of Goodness" },
  { number: 80, arabic: "ٱلْتَّوَّابُ", transliteration: "At-Tawwab", meaning: "The Acceptor of Repentance" },
  { number: 81, arabic: "ٱلْمُنْتَقِمُ", transliteration: "Al-Muntaqim", meaning: "The Avenger" },
  { number: 82, arabic: "ٱلْعَفُوُّ", transliteration: "Al-Afuww", meaning: "The Pardoner" },
  { number: 83, arabic: "ٱلْرَّؤُفُ", transliteration: "Ar-Ra'uf", meaning: "The Most Kind" },
  { number: 84, arabic: "ٱلْمَالِكُ ٱلْمُلْكُ", transliteration: "Malik-ul-Mulk", meaning: "Master of the Kingdom" },
  { number: 85, arabic: "ٱلْذُو ٱلْجَلَالِ وَٱلْإِكْرَامُ", transliteration: "Dhul-Jalali wal-Ikram", meaning: "Owner of Majesty and Honor" },
  { number: 86, arabic: "ٱلْمُقْسِطُ", transliteration: "Al-Muqsit", meaning: "The Equitable" },
  { number: 87, arabic: "ٱلْجَامِعُ", transliteration: "Al-Jami", meaning: "The Gatherer" },
  { number: 88, arabic: "ٱلْغَنيُّ", transliteration: "Al-Ghani", meaning: "The Self-Sufficient" },
  { number: 89, arabic: "ٱلْمُغْنِيُ", transliteration: "Al-Mughni", meaning: "The Enricher" },
  { number: 90, arabic: "ٱلْمَانِعُ", transliteration: "Al-Mani", meaning: "The Preventer" },
  { number: 91, arabic: "ٱلْضَّارُ", transliteration: "Ad-Darr", meaning: "The Distresser" },
  { number: 92, arabic: "ٱلْنَّافِعُ", transliteration: "An-Nafi", meaning: "The Benefactor" },
  { number: 93, arabic: "ٱلْنُّورُ", transliteration: "An-Nur", meaning: "The Light" },
  { number: 94, arabic: "ٱلْهَادِي", transliteration: "Al-Hadi", meaning: "The Guide" },
  { number: 95, arabic: "ٱلْبَدِيعُ", transliteration: "Al-Badi", meaning: "The Incomparable Originator" },
  { number: 96, arabic: "ٱلْبَاقِي", transliteration: "Al-Baqi", meaning: "The Everlasting" },
  { number: 97, arabic: "ٱلْوَارِثُ", transliteration: "Al-Warith", meaning: "The Inheritor" },
  { number: 98, arabic: "ٱلْرَّشِيدُ", transliteration: "Ar-Rashid", meaning: "The Guide to the Right Path" },
  { number: 99, arabic: "ٱلْصَّبُورُ", transliteration: "As-Sabur", meaning: "The Most Patient" },
];

export default function NamesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNames = useMemo(() => {
    if (!searchQuery.trim()) return NAMES_OF_ALLAH;
    
    const query = searchQuery.toLowerCase();
    return NAMES_OF_ALLAH.filter(
      (name) =>
        name.transliteration.toLowerCase().includes(query) ||
        name.meaning.toLowerCase().includes(query) ||
        name.arabic.includes(searchQuery)
    );
  }, [searchQuery]);

  return (
    <section className="space-y-6" data-testid="names-page">
      <Card className="border-[#23B574]/10 bg-white/90">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-[#1a202c]">
            <Sparkles className="h-6 w-6 text-[#23B574]" />
            99 Names of Allah
          </CardTitle>
          <p className="mt-2 text-sm text-[#4a5568]">
            Asma-ul-Husna - The Most Beautiful Names
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#4a5568]" />
            <Input
              type="text"
              placeholder="Search by name or meaning..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-full border-[#23B574]/20 bg-[#f9f7f2] focus:border-[#23B574] focus:ring-[#23B574]"
              data-testid="names-search-input"
            />
          </div>

          {/* Results Count */}
          <div className="text-center text-sm text-[#4a5568]">
            Showing {filteredNames.length} of 99 names
          </div>

          {/* Names Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="names-grid">
            {filteredNames.map((name) => (
              <div
                key={name.number}
                className="group relative overflow-hidden rounded-xl border border-[#23B574]/10 bg-gradient-to-br from-white to-[#f9f7f2] p-5 shadow-sm transition-all hover:shadow-md hover:scale-105"
                data-testid={`name-card-${name.number}`}
              >
                {/* Number Badge */}
                <div className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#23B574]/10 text-xs font-bold text-[#23B574]">
                  {name.number}
                </div>

                {/* Arabic Name */}
                <div className="mb-3 text-center">
                  <p className="text-3xl font-bold text-[#1a202c]" style={{ fontFamily: 'serif' }}>
                    {name.arabic}
                  </p>
                </div>

                {/* Transliteration */}
                <div className="mb-2 text-center">
                  <p className="text-lg font-semibold text-[#23B574]">
                    {name.transliteration}
                  </p>
                </div>

                {/* Meaning */}
                <div className="text-center">
                  <p className="text-sm text-[#4a5568] italic">
                    {name.meaning}
                  </p>
                </div>

                {/* Hover Effect Border */}
                <div className="absolute inset-0 rounded-xl border-2 border-[#23B574] opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            ))}
          </div>

          {/* No Results Message */}
          {filteredNames.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-[#4a5568]">No names found matching "{searchQuery}"</p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-3 text-sm text-[#23B574] hover:underline"
              >
                Clear search
              </button>
            </div>
          )}

          {/* Info Card */}
          <div className="rounded-xl bg-[#f4f0e8] p-4">
            <p className="text-center text-sm text-[#4a5568]">
              💡 <strong>Hadith:</strong> "Allah has ninety-nine names, one hundred less one. 
              Whoever memorizes them will enter Paradise." - Sahih Bukhari
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

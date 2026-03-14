import { BookOpen, BookText, Bot, Calendar, HandHeart, Landmark, MoonStar, Target, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

const cards = [
  {
    title: "Hidaya Chat",
    description: "Ask Islamic questions with source-backed guidance.",
    icon: Bot,
    path: "/companion",
    className: "md:col-span-6 lg:col-span-4",
    testId: "dashboard-card-companion",
  },
  {
    title: "Mushaf",
    description: "Read and listen with persistent playback controls.",
    icon: BookOpen,
    path: "/mushaf",
    className: "md:col-span-6 lg:col-span-4",
    testId: "dashboard-card-mushaf",
  },
  {
    title: "Prayer Times",
    description: "Location-based schedule with Asr method and Qibla panel.",
    icon: MoonStar,
    path: "/prayer",
    className: "md:col-span-6 lg:col-span-4",
    testId: "dashboard-card-prayer",
  },
  {
    title: "Tasbih Counter",
    description: "Digital dhikr counter with haptic feedback and goal tracking.",
    icon: Target,
    path: "/tasbih",
    className: "md:col-span-6 lg:col-span-4",
    testId: "dashboard-card-tasbih",
  },
  {
    title: "99 Names of Allah",
    description: "Explore Asma-ul-Husna with Arabic, transliteration, and meanings.",
    icon: Sparkles,
    path: "/names",
    className: "md:col-span-6 lg:col-span-4",
    testId: "dashboard-card-names",
  },
  {
    title: "Zakat",
    description: "Advanced calculator with purity conversion and nisab modes.",
    icon: Landmark,
    path: "/zakat",
    className: "md:col-span-6 lg:col-span-4",
    testId: "dashboard-card-zakat",
  },
  {
    title: "Hajj & Umrah Guide",
    description: "Interactive ritual planner with detailed phases and checklist tracking.",
    icon: HandHeart,
    path: "/hajj-umrah",
    className: "md:col-span-6 lg:col-span-4",
    testId: "dashboard-card-hajj-umrah",
  },
  {
    title: "Dua Book",
    description: "Authentic daily supplications with Arabic, translation, and audio.",
    icon: BookText,
    path: "/dua",
    className: "md:col-span-6 lg:col-span-4",
    testId: "dashboard-card-dua-book",
  },
  {
    title: "Islamic Calendar",
    description: "Hijri calendar with Gregorian conversion and date tracking.",
    icon: Calendar,
    path: "/islamic-calendar",
    className: "md:col-span-6 lg:col-span-4",
    testId: "dashboard-card-islamic-calendar",
  },
];

export default function DashboardPage() {
  const [hijriDate, setHijriDate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch current Hijri date
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();

    fetch(`https://api.aladhan.com/v1/gToH/${dd}-${mm}-${yyyy}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.code === 200 && data.data?.hijri) {
          setHijriDate(data.data.hijri);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch Hijri date:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <section className="space-y-8" data-testid="dashboard-page">
      <div
        className="rounded-3xl border border-[#23B574]/20 bg-cover bg-center p-8 text-white"
        data-testid="dashboard-hero"
        style={{
          backgroundImage:
            "linear-gradient(110deg, rgba(35,181,116,0.9), rgba(29,149,96,0.82)), url('https://images.unsplash.com/photo-1761639935129-4e2ebf652a4c?q=80&w=2000&auto=format&fit=crop')",
        }}
      >
        <div className="mb-6 flex justify-center">
          <img 
            src="/hidaya-logo.png" 
            alt="Hidaya AI" 
            className="h-32 w-auto drop-shadow-2xl"
            data-testid="dashboard-hero-logo"
          />
        </div>
        <p data-testid="dashboard-hero-badge" className="mb-3 inline-flex rounded-full bg-white/20 px-3 py-1 text-xs">
          Hidaya AI • Professional Edition
        </p>
        <h1 data-testid="dashboard-hero-title" className="text-4xl font-semibold md:text-5xl">
          Your complete spiritual operating dashboard.
        </h1>
        {!loading && hijriDate && (
          <div className="mt-4 flex items-center gap-2 text-white/95" data-testid="hijri-date-display">
            <Calendar className="h-5 w-5" />
            <p className="text-lg font-medium">
              {hijriDate.day} {hijriDate.month.en} {hijriDate.year} AH
              <span className="mx-2 text-white/60">•</span>
              <span className="text-base">{hijriDate.day} {hijriDate.month.ar} {hijriDate.year} هـ</span>
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-12" data-testid="dashboard-grid">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              className={`group rounded-2xl border border-[#23B574]/15 bg-white p-6 shadow-sm transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-[#23B574]/40 hover:shadow-xl ${card.className}`}
              data-testid={card.testId}
              key={card.title}
              to={card.path}
            >
              <div className="mb-4 inline-flex rounded-xl bg-[#f4f0e8] p-3 text-[#23B574]">
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-[#1a202c]" data-testid={`${card.testId}-title`}>
                {card.title}
              </h2>
              <p className="text-sm text-[#4a5568]" data-testid={`${card.testId}-description`}>
                {card.description}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

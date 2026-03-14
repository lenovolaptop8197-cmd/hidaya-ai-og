import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const HIJRI_MONTHS = [
  { en: "Muharram", ar: "محرم" },
  { en: "Safar", ar: "صفر" },
  { en: "Rabi' al-Awwal", ar: "ربيع الأول" },
  { en: "Rabi' al-Thani", ar: "ربيع الثاني" },
  { en: "Jumada al-Awwal", ar: "جمادى الأولى" },
  { en: "Jumada al-Thani", ar: "جمادى الثانية" },
  { en: "Rajab", ar: "رجب" },
  { en: "Sha'ban", ar: "شعبان" },
  { en: "Ramadan", ar: "رمضان" },
  { en: "Shawwal", ar: "شوال" },
  { en: "Dhu al-Qi'dah", ar: "ذو القعدة" },
  { en: "Dhu al-Hijjah", ar: "ذو الحجة" },
];

// Helper function to provide descriptions for Islamic important dates
const getHolidayDescription = (holidayName) => {
  const descriptions = {
    "1st Day of Ramadan": "The blessed month of fasting begins. Muslims abstain from food and drink from dawn to sunset, focusing on prayer, Quran recitation, and spiritual growth.",
    "Ramadan": "The ninth month of the Islamic calendar, a time of fasting, prayer, reflection, and community. The Quran was first revealed during this month.",
    "Lailat al-Qadr": "The Night of Power, believed to be when the Quran was first revealed. It is better than a thousand months and falls in the last 10 nights of Ramadan.",
    "Eid al-Fitr": "Festival of Breaking the Fast. Celebrated at the end of Ramadan with prayers, feasting, charity, and gathering with family and friends.",
    "Eid al-Adha": "Festival of Sacrifice. Commemorates Prophet Ibrahim's willingness to sacrifice his son. Muslims perform Hajj and sacrifice animals, distributing meat to the needy.",
    "Day of Arafah": "The most important day of Hajj pilgrimage. Muslims on Hajj gather at Mount Arafat for prayer and reflection. Fasting on this day (for non-pilgrims) expiates sins of two years.",
    "Hajj": "The annual Islamic pilgrimage to Mecca, one of the Five Pillars of Islam. Every able Muslim must perform it at least once in their lifetime.",
    "Mawlid al-Nabi": "The birthday of Prophet Muhammad (peace be upon him). Many Muslims celebrate with gatherings, recitation of poetry, and acts of charity.",
    "Islamic New Year": "The first day of Muharram marks the beginning of the Islamic lunar calendar year, commemorating the Hijra (migration) of Prophet Muhammad from Mecca to Medina.",
    "Day of Ashura": "The 10th of Muharram. Sunnis fast on this day as Prophet Muhammad did, commemorating various events including Prophet Musa's (Moses) escape from Pharaoh.",
    "Isra and Mi'raj": "The Night Journey and Ascension of Prophet Muhammad (peace be upon him) from Mecca to Jerusalem and then to the heavens.",
    "Shab-e-Barat": "The Night of Forgiveness (15th Sha'ban). Many Muslims spend this night in prayer, asking for forgiveness and blessings.",
  };

  // Check for partial matches (case-insensitive)
  const normalizedName = holidayName.toLowerCase();
  for (const [key, description] of Object.entries(descriptions)) {
    if (normalizedName.includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedName)) {
      return description;
    }
  }

  return "An important date in the Islamic calendar. Hover over the date for more information.";
};


export default function IslamicCalendarPage() {
  const [currentHijriMonth, setCurrentHijriMonth] = useState(null);
  const [currentHijriYear, setCurrentHijriYear] = useState(null);
  const [calendarData, setCalendarData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize with current Hijri date
  useEffect(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();

    fetch(`https://api.aladhan.com/v1/gToH/${dd}-${mm}-${yyyy}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.code === 200 && data.data?.hijri) {
          setCurrentHijriMonth(parseInt(data.data.hijri.month.number));
          setCurrentHijriYear(parseInt(data.data.hijri.year));
        }
      })
      .catch((err) => {
        console.error("Failed to fetch current Hijri date:", err);
        // Default fallback
        setCurrentHijriMonth(9); // Ramadan
        setCurrentHijriYear(1446);
      });
  }, []);

  // Fetch calendar data when month/year changes
  useEffect(() => {
    if (!currentHijriMonth || !currentHijriYear) return;

    setLoading(true);
    setError(null);

    fetch(`https://api.aladhan.com/v1/hToGCalendar/${currentHijriMonth}/${currentHijriYear}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.code === 200 && data.data) {
          setCalendarData(data.data);
        } else {
          throw new Error("Invalid response from calendar API");
        }
      })
      .catch((err) => {
        console.error("Failed to fetch calendar:", err);
        setError("Unable to load calendar. Please try again later.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [currentHijriMonth, currentHijriYear]);

  const handlePreviousMonth = () => {
    if (currentHijriMonth === 1) {
      setCurrentHijriMonth(12);
      setCurrentHijriYear(currentHijriYear - 1);
    } else {
      setCurrentHijriMonth(currentHijriMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentHijriMonth === 12) {
      setCurrentHijriMonth(1);
      setCurrentHijriYear(currentHijriYear + 1);
    } else {
      setCurrentHijriMonth(currentHijriMonth + 1);
    }
  };

  // Helper function to parse DD-MM-YYYY format from Aladhan API
  const parseApiDate = (dateString) => {
    const [day, month, year] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const isToday = (gregorianDate) => {
    const today = new Date();
    const date = parseApiDate(gregorianDate);
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Group calendar data by weeks
  const getCalendarWeeks = () => {
    if (!calendarData.length) return [];

    const weeks = [];
    let currentWeek = [];

    // Get first day of month to determine starting position
    const firstDayOfMonth = parseApiDate(calendarData[0].gregorian.date);
    const firstDayWeekday = firstDayOfMonth.getDay(); // 0 = Sunday, 6 = Saturday

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDayWeekday; i++) {
      currentWeek.push(null);
    }

    // Add all days of the month
    calendarData.forEach((day) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    // Add remaining cells to complete last week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  };

  const weeks = getCalendarWeeks();
  const currentMonthName = currentHijriMonth ? HIJRI_MONTHS[currentHijriMonth - 1] : null;

  return (
    <section className="space-y-6" data-testid="islamic-calendar-page">
      {/* Header */}
      <div className="rounded-2xl border border-[#23B574]/20 bg-gradient-to-br from-[#23B574]/10 to-[#1d9560]/5 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="rounded-xl bg-[#23B574] p-2.5 text-white">
            <CalendarIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-[#1a202c]">Islamic Calendar</h1>
            <p className="text-sm text-[#4a5568]">Hijri Calendar • Gregorian Conversion</p>
          </div>
        </div>
      </div>

      {/* Calendar Card */}
      <Card className="border-[#23B574]/15">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-[#1a202c]">
                {currentMonthName ? (
                  <>
                    <span className="font-semibold">{currentMonthName.en}</span>
                    <span className="text-[#23B574] mx-2">•</span>
                    <span className="text-xl">{currentMonthName.ar}</span>
                  </>
                ) : (
                  "Loading..."
                )}
              </CardTitle>
              <CardDescription className="text-base mt-1">
                {currentHijriYear ? `${currentHijriYear} AH (Hijri Year)` : ""}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handlePreviousMonth}
                variant="outline"
                size="icon"
                className="rounded-full border-[#23B574]/30 text-[#23B574] hover:bg-[#23B574]/10"
                disabled={loading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleNextMonth}
                variant="outline"
                size="icon"
                className="rounded-full border-[#23B574]/30 text-[#23B574] hover:bg-[#23B574]/10"
                disabled={loading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#23B574]" />
            </div>
          ) : error ? (
            <div className="rounded-lg bg-red-50 p-4 text-center text-red-600">
              {error}
            </div>
          ) : (
            <>
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-semibold text-[#4a5568] py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="space-y-2">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="grid grid-cols-7 gap-2">
                    {week.map((day, dayIndex) => {
                      if (!day) {
                        return (
                          <div
                            key={`empty-${dayIndex}`}
                            className="aspect-square rounded-lg"
                          />
                        );
                      }

                      const today = isToday(day.gregorian.date);
                      const hijriDay = day.hijri.day;
                      const gregorianDay = parseApiDate(day.gregorian.date).getDate();
                      const holidays = day.hijri.holidays || [];
                      const hasHoliday = holidays.length > 0;

                      return (
                        <div
                          key={day.gregorian.date}
                          className={`aspect-square rounded-lg border p-2 transition-all hover:shadow-md relative group ${
                            today
                              ? "border-[#23B574] bg-[#23B574] text-white shadow-lg"
                              : hasHoliday
                              ? "border-amber-400 bg-amber-50 hover:border-amber-500"
                              : "border-[#23B574]/15 bg-white hover:border-[#23B574]/40"
                          }`}
                        >
                          {hasHoliday && (
                            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-amber-400 border-2 border-white shadow-sm" 
                                 title={holidays.join(", ")} />
                          )}
                          <div className="flex h-full flex-col justify-between">
                            <div
                              className={`text-xl font-bold ${
                                today ? "text-white" : hasHoliday ? "text-amber-700" : "text-[#23B574]"
                              }`}
                            >
                              {hijriDay}
                            </div>
                            <div
                              className={`text-xs ${
                                today ? "text-white/90" : hasHoliday ? "text-amber-600" : "text-[#4a5568]"
                              }`}
                            >
                              {gregorianDay}
                            </div>
                          </div>
                          {/* Hover tooltip for holidays */}
                          {hasHoliday && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                              <div className="bg-amber-500 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                                {holidays.map((holiday, idx) => (
                                  <div key={idx} className="font-medium">{holiday}</div>
                                ))}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-amber-500" />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-[#4a5568]">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded border-2 border-[#23B574] bg-[#23B574]" />
                  <span>Today</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded border-2 border-amber-400 bg-amber-50 relative">
                    <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-400 border border-white" />
                  </div>
                  <span>Important Date</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-center">
                    <span className="text-base font-semibold text-[#23B574]">15</span>
                    <span className="text-xs text-[#4a5568]">12</span>
                  </div>
                  <span>= Hijri / Gregorian</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Important Dates This Month */}
      {!loading && !error && calendarData.length > 0 && (() => {
        const importantDates = calendarData.filter(day => day.hijri.holidays && day.hijri.holidays.length > 0);
        if (importantDates.length === 0) return null;
        
        return (
          <Card className="border-amber-400/30 bg-gradient-to-br from-amber-50 to-white">
            <CardHeader>
              <CardTitle className="text-lg text-[#1a202c] flex items-center gap-2">
                <span className="text-amber-500">★</span>
                Important Dates This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {importantDates.map((day, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-white border border-amber-200">
                    <div className="flex-shrink-0 text-center">
                      <div className="text-2xl font-bold text-amber-600">{day.hijri.day}</div>
                      <div className="text-xs text-[#4a5568]">{currentMonthName?.en}</div>
                    </div>
                    <div className="flex-1">
                      {day.hijri.holidays.map((holiday, hIdx) => (
                        <div key={hIdx}>
                          <p className="font-semibold text-[#1a202c]">{holiday}</p>
                          <p className="text-sm text-[#4a5568] mt-1">
                            {getHolidayDescription(holiday)}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="flex-shrink-0 text-xs text-[#4a5568]">
                      {new Date(parseApiDate(day.gregorian.date)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Info Card */}
      <Card className="border-[#23B574]/15 bg-gradient-to-br from-[#f4f0e8] to-white">
        <CardHeader>
          <CardTitle className="text-lg text-[#1a202c]">About the Hijri Calendar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-[#4a5568]">
          <p>
            The Islamic calendar (Hijri calendar) is a lunar calendar consisting of 12 months in a year of 354 or 355 days.
          </p>
          <p>
            It is used to determine the proper days of Islamic holidays and rituals, such as the annual period of fasting and the proper time for the Hajj pilgrimage.
          </p>
          <p className="text-[#23B574] font-medium">
            The calendar began in 622 CE, the year of the Prophet Muhammad's (ﷺ) migration (Hijra) from Mecca to Medina.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

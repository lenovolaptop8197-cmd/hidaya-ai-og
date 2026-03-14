import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import duasCollection from "@/data/duas";

export default function DuaBookPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = useMemo(() => ["All", ...new Set(duasCollection.map((item) => item.category))], []);
  const filteredDuas = useMemo(() => {
    const byCategory = activeCategory === "All" ? duasCollection : duasCollection.filter((item) => item.category === activeCategory);
    const normalizedSearch = searchQuery.trim().toLowerCase();

    if (!normalizedSearch) {
      return byCategory;
    }

    return byCategory.filter((item) =>
      [item.title, item.translation, item.arabic, item.category, item.transliteration].some((field) =>
        field?.toLowerCase().includes(normalizedSearch),
      ),
    );
  }, [activeCategory, searchQuery]);

  return (
    <section className="space-y-6" data-testid="dua-book-page">
      <Card className="border-[#23B574]/10 bg-white/90" data-testid="dua-book-header-card">
        <CardHeader>
          <CardTitle className="text-2xl text-[#1a202c]" data-testid="dua-book-title">
            Dua Book
          </CardTitle>
          <p className="text-sm text-[#4a5568]" data-testid="dua-book-description">
            {duasCollection.length}+ authentic supplications from Hisnul Muslim with Arabic text, transliteration, translation, and hadith references.
          </p>
        </CardHeader>
        <CardContent>
          <div className="mb-4 space-y-2" data-testid="dua-search-input-group">
            <p className="text-sm text-[#4a5568]" data-testid="dua-search-label">
              Search Duas
            </p>
            <Input
              className="h-11 border-[#23B574]/20"
              data-testid="dua-search-input"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by title, Arabic text, transliteration, translation, or category"
              value={searchQuery}
            />
          </div>

          <div className="flex flex-wrap gap-2" data-testid="dua-category-filter">
            {categories.map((category) => (
              <button
                className={`rounded-full px-4 py-2 text-sm ${
                  activeCategory === category ? "bg-[#23B574] text-white" : "bg-[#f4f0e8] text-[#23B574]"
                }`}
                data-testid={`dua-category-${category.toLowerCase().replace(/\s+/g, "-")}`}
                key={category}
                onClick={() => setActiveCategory(category)}
                type="button"
              >
                {category}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4" data-testid="dua-list">
        {filteredDuas.length === 0 && (
          <Card className="border-[#23B574]/10 bg-white" data-testid="dua-empty-state">
            <CardContent className="p-6">
              <p className="text-sm text-[#4a5568]" data-testid="dua-empty-state-text">
                No duas matched your search. Try a different keyword.
              </p>
            </CardContent>
          </Card>
        )}

        {filteredDuas.map((dua) => (
          <Card className="border-[#23B574]/10 bg-white" data-testid={`dua-item-${dua.id}`} key={dua.id}>
            <CardContent className="space-y-3 p-6">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-[#23B574] font-semibold" data-testid={`dua-category-label-${dua.id}`}>
                  {dua.category}
                </p>
                {dua.reference && (
                  <p className="text-xs text-[#4a5568]" data-testid={`dua-reference-${dua.id}`}>
                    📖 {dua.reference}
                  </p>
                )}
              </div>

              <h2 className="text-lg font-semibold text-[#1a202c]" data-testid={`dua-title-${dua.id}`}>
                {dua.title}
              </h2>
              
              <p className="font-arabic text-3xl leading-[2] text-[#1a202c]" data-testid={`dua-arabic-${dua.id}`} dir="rtl">
                {dua.arabic}
              </p>
              
              {dua.transliteration && (
                <p className="text-sm italic text-[#23B574]/80" data-testid={`dua-transliteration-${dua.id}`}>
                  {dua.transliteration}
                </p>
              )}
              
              <p className="text-sm leading-7 text-[#4a5568]" data-testid={`dua-translation-${dua.id}`}>
                {dua.translation}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

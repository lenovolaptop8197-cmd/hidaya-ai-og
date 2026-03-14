import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import hajjSteps from "@/data/hajj.json";
import umrahSteps from "@/data/umrah.json";

const guideContent = {
  umrah: umrahSteps,
  hajj: hajjSteps,
};

export default function HajjUmrahPage() {
  const [activeGuide, setActiveGuide] = useState("umrah");
  const activeSteps = useMemo(() => guideContent[activeGuide], [activeGuide]);

  return (
    <section className="space-y-6" data-testid="hajj-umrah-page">
      <Card className="border-[#23B574]/10 bg-white/90" data-testid="hajj-umrah-summary-card">
        <CardHeader>
          <CardTitle className="text-2xl text-[#1a202c]" data-testid="hajj-umrah-title">
            Hajj & Umrah Detailed Ritual Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[#4a5568]" data-testid="hajj-umrah-description">
            Switch between dedicated Umrah and Hajj guides with complete step-by-step ritual details.
          </p>
          <div className="flex flex-wrap gap-2" data-testid="hajj-umrah-tabs">
            <button
              className={`rounded-full px-4 py-2 text-sm ${activeGuide === "umrah" ? "bg-[#23B574] text-white" : "bg-[#f4f0e8] text-[#23B574]"}`}
              data-testid="umrah-guide-tab"
              onClick={() => setActiveGuide("umrah")}
              type="button"
            >
              Umrah Guide
            </button>
            <button
              className={`rounded-full px-4 py-2 text-sm ${activeGuide === "hajj" ? "bg-[#23B574] text-white" : "bg-[#f4f0e8] text-[#23B574]"}`}
              data-testid="hajj-guide-tab"
              onClick={() => setActiveGuide("hajj")}
              type="button"
            >
              Hajj Guide
            </button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#23B574]/10 bg-[#fcfbf8]" data-testid="hajj-umrah-important-note-card">
        <CardContent className="p-4">
          <p className="text-sm leading-7 text-[#4a5568]" data-testid="hajj-umrah-important-note-text">
            Important: This is an educational guide to help organize your worship steps. For personal rulings,
            health-related exceptions, and your Hajj package logistics, confirm details with a qualified scholar and
            your official group guide.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4" data-testid="ritual-steps-list">
        {activeSteps.map((step) => (
          <Card
            className="border-[#23B574]/10 bg-white"
            data-testid={`${activeGuide}-step-card-${step.step}`}
            key={`${activeGuide}-${step.step}`}
          >
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#23B574] text-sm font-semibold text-white"
                  data-testid={`${activeGuide}-step-badge-${step.step}`}
                >
                  {step.step}
                </span>
                <div className="space-y-1">
                  {step.phase && (
                    <p
                      className="text-xs font-semibold uppercase tracking-wide text-[#23B574]"
                      data-testid={`${activeGuide}-step-phase-${step.step}`}
                    >
                      {step.phase}
                    </p>
                  )}
                  <h3
                    className="text-lg font-semibold text-[#1a202c]"
                    data-testid={`${activeGuide}-step-title-${step.step}`}
                  >
                    Step {step.step}: {step.title}
                  </h3>
                </div>
              </div>

              <p className="text-sm leading-7 text-[#1a202c]" data-testid={`${activeGuide}-step-instruction-${step.step}`}>
                {step.instruction}
              </p>

              <div className="rounded-xl bg-[#f9f7f2] p-3" data-testid={`${activeGuide}-step-recitation-${step.step}`}>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#23B574]">What to recite</p>
                <p className="text-sm text-[#4a5568]">{step.recite}</p>
              </div>

              <p className="text-sm leading-7 text-[#4a5568]" data-testid={`${activeGuide}-step-details-${step.step}`}>
                {step.details}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

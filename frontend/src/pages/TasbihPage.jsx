import { useMemo, useState } from "react";
import { RotateCcw, Target } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TasbihPage() {
  const [count, setCount] = useState(0);
  const [goal, setGoal] = useState(33);
  const [isUnlimited, setIsUnlimited] = useState(false);

  const progress = useMemo(() => {
    if (isUnlimited) return 0;
    return Math.min(100, Math.round((count / goal) * 100));
  }, [count, goal, isUnlimited]);

  const vibrate = () => {
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  const increment = () => {
    setCount((prev) => prev + 1);
    vibrate();
    
    // Show celebration when goal is reached
    if (!isUnlimited && count + 1 === goal) {
      toast.success(`🎉 Alhamdulillah! You've completed ${goal} Dhikr`, {
        duration: 3000,
      });
      vibrate();
      setTimeout(() => vibrate(), 200);
    }
  };

  const reset = () => {
    setCount(0);
    vibrate();
    toast.info("Counter reset");
  };

  const setTarget = (value) => {
    if (value === "unlimited") {
      setIsUnlimited(true);
      setGoal(0);
      toast.info("Unlimited mode activated");
    } else {
      setIsUnlimited(false);
      setGoal(value);
      toast.info(`Target set to ${value}`);
    }
  };

  return (
    <section className="space-y-6" data-testid="tasbih-page">
      <Card className="border-[#23B574]/10 bg-white/90">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-[#1a202c]">
            <Target className="h-6 w-6 text-[#23B574]" />
            Digital Tasbih Counter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Large Central Tap Button */}
          <div className="flex justify-center">
            <button
              onClick={increment}
              data-testid="tasbih-tap-button"
              className="group relative flex h-72 w-72 items-center justify-center rounded-full border-8 border-[#23B574]/20 bg-gradient-to-br from-[#23B574] to-[#1d9560] shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 active:shadow-xl"
            >
              {/* Ripple effect container */}
              <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 transition-opacity duration-200 group-active:opacity-100" />
              
              {/* Count display */}
              <div className="relative z-10 flex flex-col items-center">
                <p className="text-8xl font-bold text-white drop-shadow-lg" data-testid="tasbih-count-display">
                  {count}
                </p>
                <p className="mt-2 text-sm font-medium uppercase tracking-wider text-white/90">
                  Tap to Count
                </p>
              </div>
              
              {/* Progress ring (only show when not unlimited) */}
              {!isUnlimited && (
                <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="46"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.2)"
                    strokeWidth="2"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="46"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.8)"
                    strokeWidth="2"
                    strokeDasharray={`${2 * Math.PI * 46}`}
                    strokeDashoffset={`${2 * Math.PI * 46 * (1 - progress / 100)}`}
                    className="transition-all duration-300"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Goal/Target Display */}
          <div className="rounded-2xl bg-[#f9f7f2] p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-[#4a5568]">
              {isUnlimited ? "Unlimited Mode" : "Target"}
            </p>
            <p className="mt-1 text-2xl font-bold text-[#23B574]" data-testid="tasbih-goal-display">
              {isUnlimited ? "∞" : `${goal} Dhikr`}
            </p>
            {!isUnlimited && (
              <div className="mt-3">
                <div className="h-2 overflow-hidden rounded-full bg-[#23B574]/15">
                  <div
                    className="h-full rounded-full bg-[#23B574] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                    data-testid="tasbih-progress-bar"
                  />
                </div>
                <p className="mt-1 text-sm text-[#4a5568]" data-testid="tasbih-progress-text">
                  {progress}% Complete
                </p>
              </div>
            )}
          </div>

          {/* Target Selector */}
          <div>
            <label className="mb-3 block text-sm font-medium text-[#4a5568]">
              Select Target
            </label>
            <div className="flex flex-wrap gap-2" data-testid="tasbih-target-buttons">
              {[33, 99].map((value) => (
                <Button
                  key={value}
                  onClick={() => setTarget(value)}
                  data-testid={`target-${value}-button`}
                  className={`flex-1 rounded-full transition-all ${
                    !isUnlimited && goal === value
                      ? "bg-[#23B574] text-white hover:bg-[#1d9560]"
                      : "border border-[#23B574]/20 bg-white text-[#23B574] hover:bg-[#23B574]/10"
                  }`}
                  type="button"
                >
                  {value}
                </Button>
              ))}
              <Button
                onClick={() => setTarget("unlimited")}
                data-testid="target-unlimited-button"
                className={`flex-1 rounded-full transition-all ${
                  isUnlimited
                    ? "bg-[#23B574] text-white hover:bg-[#1d9560]"
                    : "border border-[#23B574]/20 bg-white text-[#23B574] hover:bg-[#23B574]/10"
                }`}
                type="button"
              >
                Unlimited
              </Button>
            </div>
          </div>

          {/* Reset Button */}
          <Button
            onClick={reset}
            data-testid="tasbih-reset-button"
            className="w-full rounded-full border-2 border-[#23B574]/20 bg-transparent py-6 text-[#23B574] transition-all hover:bg-[#23B574]/10"
            type="button"
            variant="outline"
          >
            <RotateCcw className="mr-2 h-5 w-5" />
            Reset Counter
          </Button>

          {/* Info Card */}
          <div className="rounded-xl bg-[#f4f0e8] p-4">
            <p className="text-center text-sm text-[#4a5568]">
              💡 <strong>Tip:</strong> Use this digital tasbih to count your dhikr. 
              Common counts include 33 (Subhan Allah, Alhamdulillah, Allahu Akbar after Salah) or 99 (Names of Allah).
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Compass, Navigation } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getQiblaDirection } from "@/lib/api";

export default function QiblaPage() {
  const [coordinates, setCoordinates] = useState(null);
  const [qiblaDirection, setQiblaDirection] = useState(null);
  const [heading, setHeading] = useState(0);
  const [compassEnabled, setCompassEnabled] = useState(false);

  const requestLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => toast.error("Location access is required for Qibla direction."),
      { enableHighAccuracy: true },
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  useEffect(() => {
    if (!coordinates) return;
    const loadQibla = async () => {
      try {
        const data = await getQiblaDirection({
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        });
        setQiblaDirection(data.qibla_direction);
      } catch {
        toast.error("Unable to load Qibla direction.");
      }
    };
    loadQibla();
  }, [coordinates]);

  const enableCompass = async () => {
    try {
      if (
        typeof window.DeviceOrientationEvent !== "undefined" &&
        typeof window.DeviceOrientationEvent.requestPermission === "function"
      ) {
        const permission = await window.DeviceOrientationEvent.requestPermission();
        if (permission !== "granted") {
          toast.error("Compass permission denied.");
          return;
        }
      }
      setCompassEnabled(true);
      toast.success("Compass enabled.");
    } catch {
      toast.error("Compass could not be enabled on this device.");
    }
  };

  useEffect(() => {
    if (!compassEnabled) return;
    const onOrientation = (event) => {
      let angle = 0;
      if (typeof event.webkitCompassHeading === "number") {
        // iOS: The most accurate heading
        angle = event.webkitCompassHeading;
      } else if (typeof event.alpha === "number") {
        // Android: Needs to be inverted
        angle = 360 - event.alpha;
      }
      setHeading(angle);
    };
    window.addEventListener("deviceorientation", onOrientation, true);
    return () => window.removeEventListener("deviceorientation", onOrientation, true);
  }, [compassEnabled]);

  const kaabaRotation = useMemo(() => {
    if (qiblaDirection === null) return 0;
    return qiblaDirection - heading;
  }, [qiblaDirection, heading]);

  return (
    <section className="space-y-6">
      <Card className="border-[#23B574]/10 bg-white/90" data-testid="qibla-card">
        <CardHeader>
          <CardTitle data-testid="qibla-title" className="text-2xl text-[#1a202c]">
            Qibla Compass
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-2xl bg-[#f9f7f2] p-4 text-sm text-[#4a5568]" data-testid="qibla-coordinates">
            {coordinates
              ? `Location: ${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`
              : "Waiting for location..."}
          </div>

          <div className="flex justify-center" data-testid="qibla-compass-visual">
            <div className="relative flex h-80 w-80 items-center justify-center rounded-full border-8 border-[#23B574]/20 bg-gradient-to-br from-[#f4f0e8] to-[#e8e4da]">
              {/* Compass background markings */}
              <Compass className="absolute h-60 w-60 text-[#23B574]/10" />
              
              {/* Cardinal direction markers */}
              <div className="absolute top-2 text-sm font-bold text-[#23B574]">N</div>
              <div className="absolute right-2 text-sm font-bold text-[#4a5568]">E</div>
              <div className="absolute bottom-2 text-sm font-bold text-[#4a5568]">S</div>
              <div className="absolute left-2 text-sm font-bold text-[#4a5568]">W</div>
              
              {/* Straight arrow pointing up (North) */}
              <div className="absolute flex h-64 items-start justify-center pointer-events-none">
                <div className="flex flex-col items-center">
                  <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-b-[20px] border-l-transparent border-r-transparent border-b-[#23B574]" />
                  <div className="w-1 h-24 bg-gradient-to-b from-[#23B574] to-[#1d9560]" />
                </div>
              </div>
              
              {/* Kaaba icon rotating around the ring edge */}
              <div
                className="absolute flex h-72 items-start justify-center transition-transform duration-500 ease-out"
                style={{ transform: `rotate(${kaabaRotation}deg)` }}
              >
                <div className="flex flex-col items-center -mt-1">
                  {/* Kaaba icon */}
                  <div className="bg-[#2c2c2c] border-2 border-[#c9a84c] rounded-sm p-1.5 shadow-lg">
                    <div className="w-6 h-6 bg-gradient-to-br from-[#1a1a1a] to-[#2c2c2c] rounded-sm flex items-center justify-center">
                      <div className="text-[#c9a84c] text-xs font-bold">🕋</div>
                    </div>
                  </div>
                  <div className="mt-1 bg-[#c9a84c] text-[#1a1a1a] px-2 py-0.5 rounded-full text-xs font-semibold shadow-md">
                    Kaaba
                  </div>
                </div>
              </div>
              
              {/* Center point */}
              <div className="z-10 h-3 w-3 rounded-full bg-[#23B574] border-2 border-white shadow-lg" data-testid="qibla-center-point" />
            </div>
          </div>

          <div className="grid gap-3 text-sm md:grid-cols-2">
            <p data-testid="qibla-bearing-value" className="rounded-xl bg-[#fcfbf8] p-3 text-[#1a202c]">
              Qibla Bearing: <strong>{qiblaDirection?.toFixed(2) || "-"}°</strong>
            </p>
            <p data-testid="device-heading-value" className="rounded-xl bg-[#fcfbf8] p-3 text-[#1a202c]">
              Device Heading: <strong>{heading.toFixed(2)}°</strong>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              className="rounded-full bg-[#23B574] text-white hover:bg-[#1d9560]"
              data-testid="enable-compass-button"
              onClick={enableCompass}
              type="button"
            >
              Enable Compass
            </Button>
            <Button
              className="rounded-full border border-[#23B574]/20 bg-transparent text-[#23B574] hover:bg-[#23B574]/10"
              data-testid="refresh-qibla-location-button"
              onClick={requestLocation}
              type="button"
              variant="ghost"
            >
              Refresh Location
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

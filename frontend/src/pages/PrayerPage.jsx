import { useEffect, useMemo, useRef, useState } from "react";
import { Compass, MapPin, Navigation, RefreshCw, Loader2, AlertCircle, Search } from "lucide-react";
import { toast } from "sonner";
import geomagnetism from "geomagnetism";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const prayerOrder = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

// Calculation Methods from AlAdhan API (2026)
const CALCULATION_METHODS = [
  { id: 1, name: "University of Islamic Sciences, Karachi", region: "India/Pakistan" },
  { id: 2, name: "Islamic Society of North America (ISNA)", region: "North America" },
  { id: 3, name: "Muslim World League", region: "Global" },
  { id: 4, name: "Umm Al-Qura University, Makkah", region: "Saudi Arabia" },
  { id: 13, name: "Diyanet İşleri Başkanlığı", region: "Turkey" },
];

const toCountdown = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = String(Math.floor(total / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};

const parsePrayerTime = (timeValue) => {
  const [hours, minutes] = timeValue.split(":").map((part) => Number(part));
  const result = new Date();
  result.setHours(hours || 0, minutes || 0, 0, 0);
  return result;
};

const normalizeAngle = (value) => ((value % 360) + 360) % 360;

const shortestAngleDifference = (target, current) => {
  const delta = normalizeAngle(target - current);
  return delta > 180 ? delta - 360 : delta;
};

// Calculate bearing to Kaaba (21.4225°N, 39.8262°E) from given coordinates
const calculateBearingToKaaba = (fromLat, fromLon) => {
  const KAABA_LAT = 21.4225;
  const KAABA_LON = 39.8262;
  
  const lat1 = (fromLat * Math.PI) / 180;
  const lat2 = (KAABA_LAT * Math.PI) / 180;
  const dLon = ((KAABA_LON - fromLon) * Math.PI) / 180;
  
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const bearing = Math.atan2(y, x);
  
  return normalizeAngle((bearing * 180) / Math.PI);
};

export default function PrayerPage() {
  const [coordinates, setCoordinates] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null); // null = not asked, 'granted', 'denied'
  const [locationMode, setLocationMode] = useState(() => {
    return localStorage.getItem("prayer-location-mode") || "auto"; // 'auto' or 'manual'
  });
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [calculationMethod, setCalculationMethod] = useState(() => {
    return localStorage.getItem("prayer-calculation-method") || "1"; // Default: Karachi
  });
  const [asrMethod, setAsrMethod] = useState(() => {
    return localStorage.getItem("prayer-asr-method") || "standard"; // Hanafi or Standard
  });
  const [hanafiSchool, setHanafiSchool] = useState(() => {
    return localStorage.getItem("prayer-hanafi-school") === "true"; // true = Hanafi (school=1), false = Standard (school=0)
  });
  const [timeFormat, setTimeFormat] = useState(() => {
    return localStorage.getItem("prayer-time-format") || "12";
  });
  const [prayerData, setPrayerData] = useState(null);
  const [cityName, setCityName] = useState(null);
  const [countdown, setCountdown] = useState("--:--:--");
  const [nextPrayer, setNextPrayer] = useState("-");
  const [loading, setLoading] = useState(false);
  const [qiblaDirection, setQiblaDirection] = useState(0);
  const [heading, setHeading] = useState(0);
  const [compassEnabled, setCompassEnabled] = useState(false);
  const [magneticDeclination, setMagneticDeclination] = useState(0);
  const [headingJitter, setHeadingJitter] = useState(0);
  const headingSamplesRef = useRef([]);
  const lastHeadingRef = useRef(null);

  // Format time based on user preference
  const formatTime = (timeString) => {
    if (!timeString) return timeString;
    
    if (timeFormat === "24") {
      return timeString;
    }
    
    const [hours, minutes] = timeString.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
  };

  const toggleTimeFormat = (is24Hour) => {
    const format = is24Hour ? "24" : "12";
    setTimeFormat(format);
    localStorage.setItem("prayer-time-format", format);
  };

  const changeCalculationMethod = (methodId) => {
    setCalculationMethod(methodId);
    localStorage.setItem("prayer-calculation-method", methodId);
    
    // Refetch prayer times with new method if coordinates exist
    if (coordinates) {
      fetchPrayerTimesFromAPI(coordinates.latitude, coordinates.longitude, methodId, hanafiSchool ? 1 : 0);
    }
  };

  const toggleHanafiSchool = (enabled) => {
    setHanafiSchool(enabled);
    localStorage.setItem("prayer-hanafi-school", enabled.toString());
    
    // Refetch prayer times with new school if coordinates exist
    if (coordinates) {
      fetchPrayerTimesFromAPI(coordinates.latitude, coordinates.longitude, calculationMethod, enabled ? 1 : 0);
    }
  };

  // Fetch prayer times from AlAdhan API
  const fetchPrayerTimesFromAPI = async (lat, lng, method, school) => {
    setLoading(true);
    try {
      // Fetch prayer times
      const response = await fetch(
        `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=${method}&school=${school}`
      );
      const data = await response.json();
      
      if (data.code === 200) {
        const timings = data.data.timings;
        
        // Set prayer data
        setPrayerData({
          Fajr: timings.Fajr,
          Dhuhr: timings.Dhuhr,
          Asr: timings.Asr,
          Maghrib: timings.Maghrib,
          Isha: timings.Isha,
        });
        
        // Get precise city name using reverse geocoding
        try {
          const geoResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'HidayaIslamicApp/1.0'
              }
            }
          );
          const geoData = await geoResponse.json();
          
          // Extract city name (try different fields in order of preference)
          const cityName = geoData.address?.city || 
                          geoData.address?.town || 
                          geoData.address?.village || 
                          geoData.address?.county ||
                          geoData.address?.state ||
                          "Your Location";
          
          setCityName(cityName);
          toast.success(`Prayer times loaded for ${cityName}`);
        } catch (geoError) {
          console.error("Reverse geocoding error:", geoError);
          // Fallback to coordinates display if reverse geocoding fails
          setCityName(`${lat.toFixed(2)}°, ${lng.toFixed(2)}°`);
          toast.success("Prayer times loaded");
        }
      } else {
        throw new Error("Failed to fetch prayer times");
      }
    } catch (error) {
      console.error("Prayer times API error:", error);
      toast.error("Could not load prayer times. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Request location permission
  const requestLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        
        setCoordinates(coords);
        setLocationPermission("granted");
        setLocationMode("auto");
        localStorage.setItem("prayer-location-mode", "auto");
        
        // Calculate Qibla direction
        const qibla = calculateBearingToKaaba(coords.latitude, coords.longitude);
        setQiblaDirection(qibla);
        
        // Calculate magnetic declination
        const info = geomagnetism.model().point([coords.latitude, coords.longitude]);
        setMagneticDeclination(info.decl);
        
        // Fetch prayer times with selected method and school
        fetchPrayerTimesFromAPI(coords.latitude, coords.longitude, calculationMethod, hanafiSchool ? 1 : 0);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocationPermission("denied");
        setLoading(false);
        
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Location permission denied. Please enable location access or use manual input.");
        } else {
          toast.error("Could not get your location. Please try again or use manual input.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Manual location update
  const updateManualLocation = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    
    // Validate coordinates
    if (isNaN(lat) || isNaN(lng)) {
      toast.error("Please enter valid coordinates");
      return;
    }
    
    if (lat < -90 || lat > 90) {
      toast.error("Latitude must be between -90 and 90");
      return;
    }
    
    if (lng < -180 || lng > 180) {
      toast.error("Longitude must be between -180 and 180");
      return;
    }
    
    const coords = {
      latitude: lat,
      longitude: lng,
    };
    
    setCoordinates(coords);
    setLocationMode("manual");
    setLocationPermission("granted"); // Mark as granted for manual mode
    localStorage.setItem("prayer-location-mode", "manual");
    localStorage.setItem("prayer-manual-lat", lat.toString());
    localStorage.setItem("prayer-manual-lng", lng.toString());
    
    // Calculate Qibla direction
    const qibla = calculateBearingToKaaba(coords.latitude, coords.longitude);
    setQiblaDirection(qibla);
    
    // Calculate magnetic declination
    const info = geomagnetism.model().point([coords.latitude, coords.longitude]);
    setMagneticDeclination(info.decl);
    
    // Fetch prayer times
    fetchPrayerTimesFromAPI(coords.latitude, coords.longitude, calculationMethod, hanafiSchool ? 1 : 0);
  };

  // Switch between auto and manual modes
  const switchToAutoLocation = () => {
    setLocationMode("auto");
    localStorage.setItem("prayer-location-mode", "auto");
    requestLocation();
  };

  const switchToManualLocation = () => {
    setLocationMode("manual");
    localStorage.setItem("prayer-location-mode", "manual");
    
    // Load saved manual coordinates if available
    const savedLat = localStorage.getItem("prayer-manual-lat");
    const savedLng = localStorage.getItem("prayer-manual-lng");
    if (savedLat && savedLng) {
      setManualLat(savedLat);
      setManualLng(savedLng);
    }
  };

  // Auto-request location on mount (only if in auto mode)
  useEffect(() => {
    if (locationMode === "auto") {
      requestLocation();
    } else if (locationMode === "manual") {
      // Load saved manual coordinates
      const savedLat = localStorage.getItem("prayer-manual-lat");
      const savedLng = localStorage.getItem("prayer-manual-lng");
      if (savedLat && savedLng) {
        setManualLat(savedLat);
        setManualLng(savedLng);
        // Auto-load prayer times for saved manual location
        updateManualLocation();
      }
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!prayerData) return;

    const interval = setInterval(() => {
      const now = new Date();
      let nextPrayerName = null;
      let nextPrayerTime = null;
      let minDiff = Infinity;

      for (const prayer of prayerOrder) {
        const prayerTime = parsePrayerTime(prayerData[prayer]);
        const diff = prayerTime - now;

        if (diff > 0 && diff < minDiff) {
          minDiff = diff;
          nextPrayerName = prayer;
          nextPrayerTime = prayerTime;
        }
      }

      // If no prayer today, show next Fajr
      if (!nextPrayerName) {
        const fajrTime = parsePrayerTime(prayerData.Fajr);
        const tomorrow = new Date(fajrTime);
        tomorrow.setDate(tomorrow.getDate() + 1);
        minDiff = tomorrow - now;
        nextPrayerName = "Fajr";
      }

      setNextPrayer(nextPrayerName);
      setCountdown(toCountdown(minDiff));
    }, 1000);

    return () => clearInterval(interval);
  }, [prayerData]);

  // Compass functionality
  const enableCompass = async () => {
    if (typeof DeviceOrientationEvent === "undefined") {
      toast.error("Device orientation not supported");
      return;
    }

    try {
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission !== "granted") {
          toast.error("Compass permission denied");
          return;
        }
      }

      window.addEventListener("deviceorientation", handleOrientation, true);
      setCompassEnabled(true);
      toast.success("Compass enabled");
    } catch (error) {
      console.error("Compass error:", error);
      toast.error("Could not enable compass");
    }
  };

  const disableCompass = () => {
    window.removeEventListener("deviceorientation", handleOrientation, true);
    setCompassEnabled(false);
    setHeading(0);
    setHeadingJitter(0);
    headingSamplesRef.current = [];
    lastHeadingRef.current = null;
  };

  const handleOrientation = (event) => {
    if (!event.alpha) return;

    let deviceHeading = 360 - event.alpha;
    let trueHeading = normalizeAngle(deviceHeading + magneticDeclination);

    // Smooth heading using exponential moving average
    if (lastHeadingRef.current !== null) {
      const diff = shortestAngleDifference(trueHeading, lastHeadingRef.current);
      trueHeading = normalizeAngle(lastHeadingRef.current + diff * 0.3);
    }

    lastHeadingRef.current = trueHeading;

    // Calculate jitter
    headingSamplesRef.current.push(trueHeading);
    if (headingSamplesRef.current.length > 10) {
      headingSamplesRef.current.shift();
    }

    if (headingSamplesRef.current.length >= 5) {
      const avg = headingSamplesRef.current.reduce((a, b) => a + b, 0) / headingSamplesRef.current.length;
      const variance = headingSamplesRef.current.reduce((sum, val) => {
        const diff = shortestAngleDifference(val, avg);
        return sum + diff * diff;
      }, 0) / headingSamplesRef.current.length;
      setHeadingJitter(Math.sqrt(variance));
    }

    setHeading(trueHeading);
  };

  const angleToQibla = useMemo(() => {
    if (!compassEnabled) return 0;
    return shortestAngleDifference(qiblaDirection, heading);
  }, [compassEnabled, qiblaDirection, heading]);

  const qiblaAccuracy = useMemo(() => {
    const absAngle = Math.abs(angleToQibla);
    if (absAngle < 5) return "Excellent";
    if (absAngle < 15) return "Good";
    if (absAngle < 30) return "Fair";
    return "Adjust";
  }, [angleToQibla]);

  // Loading skeleton
  if (loading) {
    return (
      <section className="space-y-6">
        <Card className="border-[#23B574]/10 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-[#23B574]" />
              Loading Prayer Times...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-gradient-to-r from-gray-200 via-[#50C878]/20 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  // No location permission state
  if (locationPermission === "denied" || (!coordinates && !loading)) {
    return (
      <section className="space-y-6">
        <Card className="border-amber-500/30 bg-amber-50/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-amber-600 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-amber-900 mb-2">Location Access Required</h3>
                <p className="text-sm text-amber-800 mb-4">
                  Please allow location access to see your local prayer timings, or enter coordinates manually below.
                </p>
                <Button 
                  onClick={requestLocation}
                  className="bg-[#23B574] hover:bg-[#1d9560] text-white"
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Grant Location Access
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manual Location Input */}
        <Card className="border-[#23B574]/10 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Manual Location Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-[#4a5568]">
              Enter coordinates to see prayer times for any location worldwide.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="manual-lat" className="text-sm text-[#4a5568] mb-2 block">
                  Latitude (-90 to 90)
                </Label>
                <Input
                  id="manual-lat"
                  type="number"
                  step="0.0001"
                  min="-90"
                  max="90"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  placeholder="e.g., 40.7128"
                  className="border-[#23B574]/20"
                />
              </div>
              <div>
                <Label htmlFor="manual-lng" className="text-sm text-[#4a5568] mb-2 block">
                  Longitude (-180 to 180)
                </Label>
                <Input
                  id="manual-lng"
                  type="number"
                  step="0.0001"
                  min="-180"
                  max="180"
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                  placeholder="e.g., -74.0060"
                  className="border-[#23B574]/20"
                />
              </div>
            </div>
            <Button 
              onClick={updateManualLocation}
              disabled={!manualLat || !manualLng}
              className="w-full bg-[#23B574] hover:bg-[#1d9560] text-white"
            >
              <Search className="mr-2 h-4 w-4" />
              Load Prayer Times
            </Button>
            
            {/* Quick location examples */}
            <div className="mt-4 p-3 bg-[#f4f0e8] rounded-lg">
              <p className="text-xs font-semibold text-[#1a202c] mb-2">Quick Examples:</p>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <button onClick={() => { setManualLat("40.7128"); setManualLng("-74.0060"); }} className="text-left text-[#23B574] hover:underline">
                  📍 New York: 40.7128, -74.0060
                </button>
                <button onClick={() => { setManualLat("51.5074"); setManualLng("-0.1278"); }} className="text-left text-[#23B574] hover:underline">
                  📍 London: 51.5074, -0.1278
                </button>
                <button onClick={() => { setManualLat("21.4225"); setManualLng("39.8262"); }} className="text-left text-[#23B574] hover:underline">
                  📍 Mecca: 21.4225, 39.8262
                </button>
                <button onClick={() => { setManualLat("-33.8688"); setManualLng("151.2093"); }} className="text-left text-[#23B574] hover:underline">
                  📍 Sydney: -33.8688, 151.2093
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#23B574]/10 bg-white">
          <CardHeader>
            <CardTitle>Prayer Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-[#4a5568] mb-2 block">Calculation Method</label>
              <select
                value={calculationMethod}
                onChange={(e) => changeCalculationMethod(e.target.value)}
                className="w-full h-11 rounded-lg border border-[#23B574]/20 px-3 text-sm"
              >
                {CALCULATION_METHODS.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.name} ({method.region})
                  </option>
                ))}
              </select>
              <p className="text-xs text-[#4a5568] mt-2">
                Select your preferred calculation method. This will be used once location is granted.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-[#1a202c]">Hanafi School</span>
                <p className="text-xs text-[#4a5568] mt-1">Affects Asr prayer calculation</p>
              </div>
              <Switch
                checked={hanafiSchool}
                onCheckedChange={toggleHanafiSchool}
              />
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  // Main prayer times display
  return (
    <section className="space-y-6" data-testid="prayer-page">
      {/* Location Mode Switcher */}
      <Card className="border-[#23B574]/10 bg-gradient-to-r from-[#23B574]/5 to-[#1d9560]/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-[#23B574]" />
              <div>
                <p className="text-sm font-semibold text-[#1a202c]">Location Mode</p>
                <p className="text-xs text-[#4a5568]">
                  {locationMode === "auto" ? "Using device location" : "Using manual coordinates"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={locationMode === "auto" ? "default" : "outline"}
                size="sm"
                onClick={switchToAutoLocation}
                className={locationMode === "auto" ? "bg-[#23B574] hover:bg-[#1d9560]" : ""}
              >
                <Navigation className="mr-1 h-3 w-3" />
                Auto
              </Button>
              <Button
                variant={locationMode === "manual" ? "default" : "outline"}
                size="sm"
                onClick={switchToManualLocation}
                className={locationMode === "manual" ? "bg-[#23B574] hover:bg-[#1d9560]" : ""}
              >
                <Search className="mr-1 h-3 w-3" />
                Manual
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Location Input (shown when in manual mode) */}
      {locationMode === "manual" && (
        <Card className="border-[#23B574]/10 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Enter Coordinates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="manual-lat-main" className="text-sm text-[#4a5568] mb-2 block">
                  Latitude
                </Label>
                <Input
                  id="manual-lat-main"
                  type="number"
                  step="0.0001"
                  min="-90"
                  max="90"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  placeholder="e.g., 40.7128"
                  className="border-[#23B574]/20"
                />
              </div>
              <div>
                <Label htmlFor="manual-lng-main" className="text-sm text-[#4a5568] mb-2 block">
                  Longitude
                </Label>
                <Input
                  id="manual-lng-main"
                  type="number"
                  step="0.0001"
                  min="-180"
                  max="180"
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                  placeholder="e.g., -74.0060"
                  className="border-[#23B574]/20"
                />
              </div>
            </div>
            <Button 
              onClick={updateManualLocation}
              disabled={!manualLat || !manualLng}
              className="w-full bg-[#23B574] hover:bg-[#1d9560] text-white"
            >
              <Search className="mr-2 h-4 w-4" />
              Update Prayer Times
            </Button>
            
            {/* Quick location examples */}
            <div className="p-3 bg-[#f4f0e8] rounded-lg">
              <p className="text-xs font-semibold text-[#1a202c] mb-2">Quick Examples:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button onClick={() => { setManualLat("40.7128"); setManualLng("-74.0060"); }} className="text-left text-[#23B574] hover:underline">
                  📍 New York
                </button>
                <button onClick={() => { setManualLat("51.5074"); setManualLng("-0.1278"); }} className="text-left text-[#23B574] hover:underline">
                  📍 London
                </button>
                <button onClick={() => { setManualLat("21.4225"); setManualLng("39.8262"); }} className="text-left text-[#23B574] hover:underline">
                  📍 Mecca
                </button>
                <button onClick={() => { setManualLat("-33.8688"); setManualLng("151.2093"); }} className="text-left text-[#23B574] hover:underline">
                  📍 Sydney
                </button>
                <button onClick={() => { setManualLat("25.2048"); setManualLng("55.2708"); }} className="text-left text-[#23B574] hover:underline">
                  📍 Dubai
                </button>
                <button onClick={() => { setManualLat("35.6762"); setManualLng("139.6503"); }} className="text-left text-[#23B574] hover:underline">
                  📍 Tokyo
                </button>
              </div>
            </div>
            
            {/* Display current coordinates */}
            {coordinates && (
              <div className="text-xs text-[#4a5568] text-center">
                Current: {coordinates.latitude.toFixed(4)}°, {coordinates.longitude.toFixed(4)}°
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Location & Method Settings */}
      <Card className="border-[#23B574]/10 bg-white/90">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#23B574]" />
              {cityName || "Loading location..."}
            </CardTitle>
            {locationMode === "auto" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={requestLocation}
                className="text-[#23B574]"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-[#4a5568] mb-2 block">Calculation Method</label>
            <select
              value={calculationMethod}
              onChange={(e) => changeCalculationMethod(e.target.value)}
              className="w-full h-11 rounded-lg border border-[#23B574]/20 px-3 text-sm"
            >
              {CALCULATION_METHODS.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name} ({method.region})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-[#1a202c]">Hanafi School</span>
              <p className="text-xs text-[#4a5568] mt-1">Affects Asr prayer calculation</p>
            </div>
            <Switch
              checked={hanafiSchool}
              onCheckedChange={toggleHanafiSchool}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-[#4a5568]">24-Hour Format</span>
            <Switch
              checked={timeFormat === "24"}
              onCheckedChange={toggleTimeFormat}
            />
          </div>
        </CardContent>
      </Card>

      {/* Next Prayer Countdown */}
      {prayerData && (
        <Card className="border-[#23B574]/15 bg-gradient-to-br from-[#23B574] to-[#1d9560] text-white">
          <CardContent className="p-6">
            <p className="text-sm opacity-90 mb-1">Next Prayer</p>
            <h2 className="text-3xl font-bold mb-2">{nextPrayer}</h2>
            <p className="text-4xl font-mono tracking-wider">{countdown}</p>
          </CardContent>
        </Card>
      )}

      {/* Prayer Times List */}
      {prayerData && (
        <Card className="border-[#23B574]/10 bg-white">
          <CardHeader>
            <CardTitle>Today's Prayer Times</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {prayerOrder.map((prayer) => (
              <div
                key={prayer}
                className={`flex items-center justify-between rounded-xl p-4 ${
                  prayer === nextPrayer ? "bg-[#23B574]/10 border border-[#23B574]/20" : "bg-[#f4f0e8]"
                }`}
              >
                <span className={`font-semibold ${prayer === nextPrayer ? "text-[#23B574]" : "text-[#1a202c]"}`}>
                  {prayer}
                </span>
                <span className={`text-lg font-mono ${prayer === nextPrayer ? "text-[#23B574]" : "text-[#4a5568]"}`}>
                  {formatTime(prayerData[prayer])}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Qibla Compass */}
      {coordinates && (
        <Card className="border-[#23B574]/10 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-[#23B574]" />
                Qibla Direction
              </span>
              <Button
                onClick={compassEnabled ? disableCompass : enableCompass}
                variant={compassEnabled ? "destructive" : "default"}
                size="sm"
                className={compassEnabled ? "" : "bg-[#23B574] hover:bg-[#1d9560]"}
              >
                {compassEnabled ? "Disable" : "Enable"} Compass
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              {/* Compass container */}
              <div className="relative flex h-80 w-80 items-center justify-center rounded-full border-8 border-[#23B574]/20 bg-gradient-to-br from-[#f4f0e8] to-[#e8e4da] shadow-lg">
                {/* Compass background */}
                <Compass className="absolute h-60 w-60 text-[#23B574]/10" />
                
                {/* Cardinal direction markers that rotate with compass */}
                <div
                  className="absolute inset-0 transition-transform duration-300 ease-out"
                  style={{
                    transform: compassEnabled ? `rotate(${-heading}deg)` : "rotate(0deg)",
                  }}
                >
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 text-sm font-bold text-[#23B574]">N</div>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#4a5568]">E</div>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-sm font-bold text-[#4a5568]">S</div>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#4a5568]">W</div>
                </div>
                
                {/* Straight arrow pointing up (fixed) */}
                <div className="absolute flex h-64 items-start justify-center pointer-events-none z-10">
                  <div className="flex flex-col items-center">
                    {/* Arrow head */}
                    <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-b-[24px] border-l-transparent border-r-transparent border-b-[#23B574]" />
                    {/* Arrow shaft */}
                    <div className="w-1.5 h-20 bg-gradient-to-b from-[#23B574] to-[#1d9560] shadow-md" />
                  </div>
                </div>
                
                {/* Kaaba icon rotating around the ring edge */}
                <div
                  className="absolute flex h-72 items-start justify-center transition-transform duration-500 ease-out z-20"
                  style={{ 
                    transform: compassEnabled 
                      ? `rotate(${qiblaDirection - heading}deg)` 
                      : `rotate(${qiblaDirection}deg)` 
                  }}
                >
                  <div className="flex flex-col items-center -mt-2">
                    {/* Kaaba icon */}
                    <div className="bg-[#2c2c2c] border-2 border-[#c9a84c] rounded-sm p-1.5 shadow-xl">
                      <div className="w-7 h-7 bg-gradient-to-br from-[#1a1a1a] to-[#2c2c2c] rounded-sm flex items-center justify-center">
                        <div className="text-[#c9a84c] text-lg">🕋</div>
                      </div>
                    </div>
                    {/* Kaaba label */}
                    <div className="mt-1.5 bg-[#c9a84c] text-[#1a1a1a] px-2.5 py-1 rounded-full text-xs font-bold shadow-lg">
                      Kaaba
                    </div>
                  </div>
                </div>
                
                {/* Center point */}
                <div className="z-30 h-4 w-4 rounded-full bg-[#23B574] border-2 border-white shadow-lg" />
              </div>

              {/* Compass info */}
              {compassEnabled && (
                <div className="mt-6 grid grid-cols-2 gap-4 w-full max-w-md">
                  <div className="bg-[#f9f7f2] rounded-xl p-3 text-center">
                    <p className="text-xs text-[#4a5568] mb-1">Qibla Direction</p>
                    <p className="text-lg font-bold text-[#23B574]">{qiblaDirection.toFixed(1)}°</p>
                  </div>
                  <div className="bg-[#f9f7f2] rounded-xl p-3 text-center">
                    <p className="text-xs text-[#4a5568] mb-1">Accuracy</p>
                    <p className={`text-lg font-bold ${qiblaAccuracy === "Excellent" ? "text-[#23B574]" : "text-amber-600"}`}>
                      {qiblaAccuracy}
                    </p>
                  </div>
                </div>
              )}
              
              {compassEnabled && headingJitter > 10 && (
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-amber-800">
                    ⚠️ High interference detected. Move away from electronics for better accuracy.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}

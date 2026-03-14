import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getProfile, updateProfile } from "@/lib/api";

const DEVICE_STORAGE_KEY = "hidaya-device-id";

const getDeviceId = () => {
  const existing = localStorage.getItem(DEVICE_STORAGE_KEY);
  if (existing) return existing;
  const generated = `device-${crypto.randomUUID?.() || Date.now()}`;
  localStorage.setItem(DEVICE_STORAGE_KEY, generated);
  return generated;
};

export default function ProfilePage() {
  const [deviceId] = useState(getDeviceId);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await getProfile(deviceId);
        setName(profile.name || "");
        setCity(profile.city || "");
      } catch {
        toast.error("Could not load profile.");
      }
    };
    loadProfile();
  }, [deviceId]);

  const onSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ name, city, device_id: deviceId });
      toast.success("Profile saved.");
    } catch {
      toast.error("Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <Card className="border-[#23B574]/10 bg-white/90" data-testid="profile-card">
        <CardHeader>
          <CardTitle data-testid="profile-title" className="text-2xl text-[#1a202c]">
            Neutral Profile
          </CardTitle>
          <p data-testid="profile-description" className="text-sm text-[#4a5568]">
            Profile contains only your name and city.
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" data-testid="profile-form" onSubmit={onSave}>
            <label className="space-y-2" data-testid="profile-name-group">
              <span className="text-sm text-[#4a5568]">Name</span>
              <Input
                data-testid="profile-name-input"
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                value={name}
              />
            </label>
            <label className="space-y-2" data-testid="profile-city-group">
              <span className="text-sm text-[#4a5568]">City</span>
              <Input
                data-testid="profile-city-input"
                onChange={(event) => setCity(event.target.value)}
                placeholder="Your city"
                value={city}
              />
            </label>

            <div className="rounded-xl bg-[#f9f7f2] p-3 text-xs text-[#4a5568]" data-testid="profile-device-id-display">
              Device ID: {deviceId}
            </div>

            <Button
              className="rounded-full bg-[#23B574] px-6 text-white hover:bg-[#1d9560]"
              data-testid="profile-save-button"
              disabled={saving}
              type="submit"
            >
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

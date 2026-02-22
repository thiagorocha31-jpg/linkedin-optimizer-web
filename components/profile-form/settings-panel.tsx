"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { LinkedInProfile } from "@/lib/types";

interface SettingsPanelProps {
  profile: LinkedInProfile;
  onChange: (updates: Partial<LinkedInProfile>) => void;
}

export function SettingsPanel({ profile, onChange }: SettingsPanelProps) {
  return (
    <div className="space-y-6">
      {/* Toggle settings */}
      <div className="grid gap-4 sm:grid-cols-2">
        <ToggleRow
          id="photo"
          label="Profile photo"
          description="Professional headshot"
          checked={profile.has_profile_photo}
          onChange={(v) => onChange({ has_profile_photo: v })}
        />
        <ToggleRow
          id="banner"
          label="Banner image"
          description="Custom banner"
          checked={profile.has_banner}
          onChange={(v) => onChange({ has_banner: v })}
        />
        <ToggleRow
          id="url"
          label="Custom URL"
          description="linkedin.com/in/yourname"
          checked={profile.has_custom_url}
          onChange={(v) => onChange({ has_custom_url: v })}
        />
        <ToggleRow
          id="verified"
          label="Verified (Blue Check)"
          description="Identity verification"
          checked={profile.has_verification}
          onChange={(v) => onChange({ has_verification: v })}
        />
        <ToggleRow
          id="otw"
          label="Open to Work (visible)"
          description="Public badge"
          checked={profile.open_to_work}
          onChange={(v) => onChange({ open_to_work: v })}
        />
        <ToggleRow
          id="otw-private"
          label="Open to Work (private)"
          description="Recruiters only"
          checked={profile.open_to_work_private}
          onChange={(v) => onChange({ open_to_work_private: v })}
        />
      </div>

      {/* Numeric settings */}
      <div className="grid gap-6 sm:grid-cols-2">
        <SliderRow
          label="Posts per month"
          value={profile.posts_per_month}
          max={10}
          step={0.5}
          onChange={(v) => onChange({ posts_per_month: v })}
        />
        <SliderRow
          label="Comments per week"
          value={profile.comments_per_week}
          max={10}
          step={0.5}
          onChange={(v) => onChange({ comments_per_week: v })}
        />
        <SliderRow
          label="Featured items"
          value={profile.featured_items}
          max={10}
          step={1}
          onChange={(v) => onChange({ featured_items: v })}
        />
        <SliderRow
          label="Recommendations"
          value={profile.recommendations_count}
          max={20}
          step={1}
          onChange={(v) => onChange({ recommendations_count: v })}
        />
        <div className="sm:col-span-2">
          <label className="text-sm font-medium">
            Connections: {profile.connections_count}
          </label>
          <Slider
            value={[profile.connections_count]}
            onValueChange={([v]) => onChange({ connections_count: v })}
            min={0}
            max={1000}
            step={10}
            className="mt-2"
          />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>0</span>
            <span>500+</span>
            <span>1000</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div>
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function SliderRow({
  label,
  value,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium">
        {label}: {value}
      </label>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={0}
        max={max}
        step={step}
        className="mt-2"
      />
    </div>
  );
}

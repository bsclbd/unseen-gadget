"use client";

import { useRef } from "react";
import { Sliders, Layout, Upload, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { Banner } from "../page";

interface BannerFormCardProps {
  editingBanner: Banner | null;
  placement: "slider" | "side";
  setPlacement: (p: "slider" | "side") => void;
  title: string;
  setTitle: (val: string) => void;
  subtitle: string;
  setSubtitle: (val: string) => void;
  cta: string;
  setCta: (val: string) => void;
  href: string;
  setHref: (val: string) => void;
  status: "Active" | "Draft";
  setStatus: (val: "Active" | "Draft") => void;
  image: string;
  setImage: (val: string) => void;
  urlInput: string;
  setUrlInput: (val: string) => void;
  uploading: boolean;
  saving: boolean;
  onFileUpload: (files: FileList | null) => void;
  onApplyUrl: () => void;
  onSave: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function BannerFormCard({
  editingBanner,
  placement,
  setPlacement,
  title,
  setTitle,
  subtitle,
  setSubtitle,
  cta,
  setCta,
  href,
  setHref,
  status,
  setStatus,
  image,
  setImage,
  urlInput,
  setUrlInput,
  uploading,
  saving,
  onFileUpload,
  onApplyUrl,
  onSave,
  onCancel,
}: BannerFormCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Card className="border-primary/30 shadow-md">
      <CardHeader className="border-b bg-gray-50/50">
        <CardTitle className="flex items-center gap-2">
          {placement === "slider" ? (
            <Sliders className="h-5 w-5 text-primary" />
          ) : (
            <Layout className="h-5 w-5 text-primary" />
          )}
          {editingBanner
            ? `Edit ${placement === "slider" ? "Slider" : "Side"} Banner`
            : `Add New ${placement === "slider" ? "Slider" : "Side"} Banner`}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form className="space-y-5" onSubmit={onSave}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Banner Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Apple Shopping Event"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Subtitle (Optional)</label>
              <Input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Up to 20% off all devices"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Section Placement *</label>
              <Select
                value={placement}
                onChange={(e) => setPlacement(e.target.value as "slider" | "side")}
                options={[
                  { value: "slider", label: "Main Hero Slider (Left Carousel)" },
                  { value: "side", label: "Side Banner (Right 2 Small Cards)" },
                ]}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Button CTA Text (Optional)</label>
              <Input
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                placeholder="Leave blank for no button (e.g. Shop Now)"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Target Link URL</label>
              <Input
                value={href}
                onChange={(e) => setHref(e.target.value)}
                placeholder="e.g. /brand/apple or /products"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Status</label>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as "Active" | "Draft")}
                options={[
                  { value: "Active", label: "Active (Visible on Homepage)" },
                  { value: "Draft", label: "Draft (Hidden)" },
                ]}
              />
            </div>
          </div>

          {/* Banner Image Upload Section */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700">Banner Image *</label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={(e) => onFileUpload(e.target.files)}
              style={{ display: "none" }}
            />

            {image ? (
              <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-2">
                <div className="relative h-52 w-full overflow-hidden rounded-lg bg-gray-900 sm:h-64">
                  <img
                    src={image}
                    alt="Banner preview"
                    className="h-full w-full object-cover"
                  />
                  {cta && (
                    <div className="absolute bottom-4 left-4 z-10">
                      <span className="rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-white shadow-md">
                        {cta} →
                      </span>
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="absolute right-3 top-3 bg-white/90 text-red-600 shadow hover:bg-white"
                    onClick={() => {
                      setImage("");
                      setUrlInput("");
                    }}
                  >
                    <X className="mr-1 h-3.5 w-3.5" /> Remove Image
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/60 p-8 text-center transition-colors hover:border-primary hover:bg-primary/5"
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2 text-primary">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <p className="text-sm font-medium">Uploading image to server...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <div className="rounded-full bg-white p-3 shadow-sm">
                        <Upload className="h-6 w-6 text-primary" />
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        Click to select an image from your device
                      </p>
                      <p className="text-xs text-gray-500">
                        {placement === "slider"
                          ? "Recommended: 1200×500 or 1920×800 for Slider"
                          : "Recommended: 600×300 for Side Cards"}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="Or paste direct image URL (https://...)"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onApplyUrl}
                    disabled={!urlInput.trim()}
                  >
                    Apply URL
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={saving || uploading}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingBanner ? "Save Changes" : "Create Banner"}
            </Button>
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

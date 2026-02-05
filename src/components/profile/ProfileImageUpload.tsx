import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Upload, Loader2, ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileImageUploadProps {
  userId: string;
  currentUrl: string | null;
  onUploadComplete: (url: string) => void;
  type: "avatar" | "banner";
  name?: string;
}

export function ProfileImageUpload({
  userId,
  currentUrl,
  onUploadComplete,
  type,
  name = "",
}: ProfileImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB for avatar, 10MB for banner)
    const maxSize = type === "avatar" ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`Image must be less than ${type === "avatar" ? "5MB" : "10MB"}`);
      return;
    }

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Upload to Supabase Storage
    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${userId}/${type}-${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("profile-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) throw error;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("profile-images")
        .getPublicUrl(data.path);

      onUploadComplete(publicUrlData.publicUrl);
      toast.success(`${type === "avatar" ? "Profile photo" : "Banner"} updated!`);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload image");
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const displayUrl = previewUrl || currentUrl;
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (type === "avatar") {
    return (
      <div className="relative group">
        <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
          <AvatarImage src={displayUrl || undefined} alt={name} />
          <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
            {initials || "W"}
          </AvatarFallback>
        </Avatar>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded-full",
            "bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity",
            "cursor-pointer"
          )}
        >
          {isUploading ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <Camera className="w-6 h-6 text-white" />
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    );
  }

  // Banner upload
  return (
    <div className="relative group">
      <div
        className={cn(
          "w-full h-48 rounded-xl overflow-hidden border-2 border-dashed border-muted-foreground/30",
          "flex items-center justify-center bg-muted/50 transition-colors",
          "hover:border-primary/50 hover:bg-muted"
        )}
        style={
          displayUrl
            ? {
                backgroundImage: `url(${displayUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        {!displayUrl && (
          <div className="text-center text-muted-foreground">
            <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Click to upload a banner image</p>
            <p className="text-xs opacity-70">Recommended: 1920×480px</p>
          </div>
        )}
        {displayUrl && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="text-center text-white">
              <Camera className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-medium">Change Banner</p>
            </div>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="absolute inset-0 cursor-pointer"
      >
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}

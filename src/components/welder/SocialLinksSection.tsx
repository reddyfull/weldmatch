import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, Linkedin, Instagram } from "lucide-react";

interface SocialLinksSectionProps {
  websiteUrl: string;
  linkedinUrl: string;
  instagramUrl: string;
  onWebsiteChange: (value: string) => void;
  onLinkedinChange: (value: string) => void;
  onInstagramChange: (value: string) => void;
}

export function SocialLinksSection({
  websiteUrl,
  linkedinUrl,
  instagramUrl,
  onWebsiteChange,
  onLinkedinChange,
  onInstagramChange,
}: SocialLinksSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-accent" />
          <CardTitle>Social & Web Presence</CardTitle>
        </div>
        <CardDescription>Add links to your personal website and social profiles</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="website">Personal Website</Label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="website"
              type="url"
              placeholder="https://yourwebsite.com"
              className="pl-10"
              value={websiteUrl}
              onChange={(e) => onWebsiteChange(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="linkedin">LinkedIn Profile</Label>
          <div className="relative">
            <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="linkedin"
              type="url"
              placeholder="https://linkedin.com/in/yourprofile"
              className="pl-10"
              value={linkedinUrl}
              onChange={(e) => onLinkedinChange(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="instagram">Instagram Profile</Label>
          <div className="relative">
            <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="instagram"
              type="url"
              placeholder="https://instagram.com/yourhandle"
              className="pl-10"
              value={instagramUrl}
              onChange={(e) => onInstagramChange(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

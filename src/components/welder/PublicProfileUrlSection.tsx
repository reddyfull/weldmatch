import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Link2, Check, X, Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PublicProfileUrlSectionProps {
  currentUsername: string | null;
  onUsernameChange: (username: string) => void;
  hasChanges: boolean;
}

export function PublicProfileUrlSection({
  currentUsername,
  onUsernameChange,
  hasChanges,
}: PublicProfileUrlSectionProps) {
  const [username, setUsername] = useState(currentUsername || "");
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUsername(currentUsername || "");
  }, [currentUsername]);

  const validateUsername = (value: string): string | null => {
    if (!value) return null;
    if (value.length < 3) return "Username must be at least 3 characters";
    if (value.length > 30) return "Username must be less than 30 characters";
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) return "Only letters, numbers, hyphens, and underscores allowed";
    
    const reserved = ["admin", "api", "www", "app", "login", "signup", "register", "welder", "employer", "dashboard", "profile", "settings"];
    if (reserved.includes(value.toLowerCase())) return "This username is reserved";
    
    return null;
  };

  const checkAvailability = async (value: string) => {
    const validationError = validateUsername(value);
    if (validationError) {
      setError(validationError);
      setIsAvailable(null);
      return;
    }

    // If it's the same as current username, it's available
    if (value.toLowerCase() === currentUsername?.toLowerCase()) {
      setIsAvailable(true);
      setError(null);
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc("check_username_available", {
        p_username: value,
      });

      if (rpcError) throw rpcError;

      const result = data as { available: boolean; message?: string };
      setIsAvailable(result.available);
      if (!result.available) {
        setError(result.message || "Username is not available");
      }
    } catch (err) {
      console.error("Error checking username:", err);
      setError("Failed to check availability");
      setIsAvailable(null);
    } finally {
      setIsChecking(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    setUsername(sanitized);
    setIsAvailable(null);
    setError(null);
    onUsernameChange(sanitized);
  };

  const handleBlur = () => {
    if (username) {
      checkAvailability(username);
    }
  };

  const profileUrl = username ? `weldmatch.app/w/${username}` : "weldmatch.app/w/your-username";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-accent" />
          <CardTitle>Public Profile URL</CardTitle>
        </div>
        <CardDescription>
          Choose a unique username for your public profile that employers can visit
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                weldmatch.app/w/
              </span>
              <Input
                id="username"
                placeholder="your-username"
                className="pl-[130px]"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                onBlur={handleBlur}
              />
              {isChecking && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
              {!isChecking && isAvailable === true && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-success" />
              )}
              {!isChecking && isAvailable === false && (
                <X className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => checkAvailability(username)}
              disabled={!username || isChecking}
            >
              Check
            </Button>
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          {isAvailable && !error && (
            <p className="text-sm text-success">Username is available!</p>
          )}
        </div>

        {currentUsername && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Your public profile:</p>
            <a
              href={`https://weldmatch.app/w/${currentUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline flex items-center gap-1"
            >
              weldmatch.app/w/{currentUsername}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Only lowercase letters, numbers, hyphens, and underscores are allowed. 
          Changes will be saved when you click "Save Changes".
        </p>
      </CardContent>
    </Card>
  );
}

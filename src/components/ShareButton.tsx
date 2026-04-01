import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
  className?: string;
}

export default function ShareButton({ title, text, url, variant = "outline", size = "sm", className }: ShareButtonProps) {
  const handleShare = async () => {
    const shareUrl = url || window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
      } catch (err: any) {
        if (err.name !== "AbortError") {
          toast.error("Failed to share");
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${text}\n${shareUrl}`);
        toast.success("Copied to clipboard!");
      } catch {
        toast.error("Unable to share");
      }
    }
  };

  return (
    <Button variant={variant} size={size} onClick={handleShare} className={className}>
      <Share2 className="w-4 h-4 mr-1.5" />
      Share
    </Button>
  );
}

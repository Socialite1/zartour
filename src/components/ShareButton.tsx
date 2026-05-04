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

async function copyToClipboard(content: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(content);
      return true;
    }
  } catch {
    // fall through to legacy
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = content;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export default function ShareButton({ title, text, url, variant = "outline", size = "sm", className }: ShareButtonProps) {
  const handleShare = async () => {
    const shareUrl = url || window.location.href;
    const fullText = `${text}\n${shareUrl}`;

    // Try native share, but always fall back to clipboard if it fails
    // (iframes/previews/desktop browsers often block navigator.share)
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url: shareUrl });
        return;
      } catch (err: any) {
        if (err?.name === "AbortError") return; // user cancelled
        // otherwise fall through to clipboard
      }
    }

    const copied = await copyToClipboard(fullText);
    if (copied) {
      toast.success("Link copied to clipboard! Paste anywhere to share.");
    } else {
      // Last-resort: open WhatsApp share intent
      const wa = `https://wa.me/?text=${encodeURIComponent(fullText)}`;
      window.open(wa, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Button variant={variant} size={size} onClick={handleShare} className={className}>
      <Share2 className="w-4 h-4 mr-1.5" />
      Share
    </Button>
  );
}

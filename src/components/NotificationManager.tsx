import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

// Schedules friendly local notifications reminding the user to check their
// profile and explore/scan locations. Uses the Web Notifications API; falls
// back silently if unsupported or denied.
const STORAGE_KEY = "zartour_last_reminder";
const REMINDER_INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours
const PROMPT_KEY = "zartour_notif_prompted";

const MESSAGES = [
  { title: "Zartour 🌍", body: "New places await! Open the app and scan a location to earn points." },
  { title: "Don't lose your streak 🔥", body: "Check in today to claim your daily 3-point bonus." },
  { title: "Climb the leaderboard 🏆", body: "Visit your profile to see your rank and badges." },
  { title: "Explore Ga-Mphahlele 🗺️", body: "A new adventure is one scan away. Get out and discover!" },
];

function pickMessage() {
  return MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
}

function send() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  const m = pickMessage();
  try {
    new Notification(m.title, { body: m.body, icon: "/placeholder.svg", tag: "zartour-reminder" });
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
  } catch {
    // ignore
  }
}

export default function NotificationManager() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;

    // Ask once, gently, after a small delay so it doesn't block first paint
    const askTimer = window.setTimeout(() => {
      if (Notification.permission === "default" && !localStorage.getItem(PROMPT_KEY)) {
        localStorage.setItem(PROMPT_KEY, "1");
        Notification.requestPermission().catch(() => {});
      }
    }, 4000);

    // Send a reminder if enough time has elapsed since the last one
    const maybeNotify = () => {
      const last = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
      if (Date.now() - last >= REMINDER_INTERVAL_MS) send();
    };

    const initialTimer = window.setTimeout(maybeNotify, 30 * 1000);
    const interval = window.setInterval(maybeNotify, 60 * 60 * 1000); // hourly check

    return () => {
      clearTimeout(askTimer);
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [user]);

  return null;
}

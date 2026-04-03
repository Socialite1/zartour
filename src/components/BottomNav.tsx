import { NavLink } from "react-router-dom";
import { Home, QrCode, Trophy, User, Search } from "lucide-react";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/explore", icon: Search, label: "Explore" },
  { to: "/checkin", icon: QrCode, label: "Check In" },
  { to: "/leaderboard", icon: Trophy, label: "Ranks" },
  { to: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border">
      <div className="flex items-center justify-around py-2 px-2 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all text-xs font-medium ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? "bg-primary/10" : ""}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

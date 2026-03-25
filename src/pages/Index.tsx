import { Navigate } from "react-router-dom";

// Index redirects to Dashboard (handled by App.tsx routing)
export default function Index() {
  return <Navigate to="/" replace />;
}

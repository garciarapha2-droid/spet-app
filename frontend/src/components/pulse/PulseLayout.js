import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import GlobalNavbar from "../shared/GlobalNavbar";

export function PulseLayout({ children }) {
  const location = useLocation();

  return (
    <div className="pulse-scope min-h-screen bg-background text-foreground">
      <GlobalNavbar />
      <main className="relative z-10">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-7xl px-6 py-8"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}

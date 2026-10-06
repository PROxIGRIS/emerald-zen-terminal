import { useState } from "react";
import { Activity, AtSign, ChevronRight, CircleHelp, History, Moon, MoreHorizontal, Search, Slash, Sun, Terminal, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileTerminalDockProps {
  darkTheme: boolean;
  namespace: "/" | "@" | undefined;
  onNamespace: (namespace: "/" | "@") => void;
  onTerminal: () => void;
  onCommand: (command: string) => void;
  onTheme: () => void;
  onReference: () => void;
}

export function MobileTerminalDock({ darkTheme, namespace, onNamespace, onTerminal, onCommand, onTheme, onReference }: MobileTerminalDockProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const selectCommand = (command: string) => {
    setMoreOpen(false);
    onCommand(command);
  };

  return (
    <div className="terminal-dock-region">
      {moreOpen && (
        <section className="terminal-dock-more" aria-label="More terminal options">
          <div className="terminal-dock-more-heading">
            <strong>Terminal options</strong>
            <Button variant="ghost" size="icon" onClick={() => setMoreOpen(false)} aria-label="Close terminal options"><X /></Button>
          </div>
          <div className="terminal-dock-more-grid">
            <Button variant="ghost" onClick={() => selectCommand("/status")}><Activity />Status<ChevronRight /></Button>
            <Button variant="ghost" onClick={() => selectCommand("/doctor --deep")}><Search />Diagnostics<ChevronRight /></Button>
            <Button variant="ghost" onClick={() => selectCommand("/logs --deep")}><History />Logs<ChevronRight /></Button>
            <Button variant="ghost" onClick={() => { setMoreOpen(false); onReference(); }}><CircleHelp />Reference<ChevronRight /></Button>
            <Button variant="ghost" onClick={onTheme}>{darkTheme ? <Sun /> : <Moon />}{darkTheme ? "Light mode" : "Dark mode"}<ChevronRight /></Button>
          </div>
        </section>
      )}
      <nav className="terminal-mobile-dock" aria-label="Terminal navigation">
        <Button variant="ghost" className={`terminal-dock-item terminal-dock-home ${!namespace && !moreOpen ? "is-active" : ""}`} aria-label="Terminal" aria-pressed={!namespace && !moreOpen} onClick={() => { setMoreOpen(false); onTerminal(); }}><Terminal /><span>Terminal</span></Button>
        <Button variant="ghost" className={`terminal-dock-item ${namespace === "/" && !moreOpen ? "is-active" : ""}`} aria-label="Browse CLI commands" title="CLI commands" aria-pressed={namespace === "/" && !moreOpen} onClick={() => { setMoreOpen(false); onNamespace("/"); }}><Slash /></Button>
        <Button variant="ghost" className={`terminal-dock-item ${namespace === "@" && !moreOpen ? "is-active" : ""}`} aria-label="Browse admin actions" title="Admin actions" aria-pressed={namespace === "@" && !moreOpen} onClick={() => { setMoreOpen(false); onNamespace("@"); }}><AtSign /></Button>
        <Button variant="ghost" className={`terminal-dock-item ${moreOpen ? "is-active" : ""}`} aria-label="More navigation" aria-expanded={moreOpen} onClick={() => setMoreOpen((open) => !open)}><MoreHorizontal /></Button>
      </nav>
    </div>
  );
}
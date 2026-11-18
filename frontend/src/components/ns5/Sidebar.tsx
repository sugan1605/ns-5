import { MessageSquare, Plus, Radar } from "lucide-react";

import { Button } from "@/components/ui/button";
import { shipDate } from "@/lib/ns5/format";
import type { Session } from "@/lib/ns5/types";
import { cn } from "@/lib/utils";

import { NorthStarMark } from "./NorthStarMark";
import { NS5Avatar } from "./NS5Robot";

interface SidebarProps {
  sessions: Session[];
  activeId: string;
  onNewSession: () => void;
  onSelect: (id: string) => void;
}

export function Sidebar({ sessions, activeId, onNewSession, onSelect }: SidebarProps) {
  return (
    <div className="flex h-full flex-col gap-5 p-4">
      {/* Branding */}
      <div className="flex items-center gap-3 px-1">
        <NorthStarMark className="h-9 w-9 shrink-0" />
        <div className="min-w-0">
          <div className="text-sm font-semibold tracking-[0.22em] text-soft">NORTH STAR 5</div>
          <div className="label-tech !tracking-[0.12em] !normal-case">
            Personal Companion System
          </div>
        </div>
      </div>

      {/* System online */}
      <div className="flex items-center justify-between rounded-md inset-well px-3 py-2">
        <span className="label-tech">System</span>
        <span className="flex items-center gap-2 text-xs text-signal">
          <span className="h-2 w-2 rounded-full bg-signal glow-signal ns-blink-dot" />
          ONLINE
        </span>
      </div>

      {/* Unit ID */}
      <div className="metal-panel metal-edge flex items-center gap-3 rounded-lg p-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md inset-well">
          <NS5Avatar className="h-11 w-11" />
        </div>
        <div className="min-w-0 space-y-0.5">
          <div className="text-sm font-semibold text-soft">Unit NS-5</div>
          <div className="label-tech">Serial NS5-0427</div>
          <div className="text-[0.7rem] text-amber">Mood: cheerful</div>
        </div>
      </div>

      <Button variant="command" className="w-full justify-center" onClick={onNewSession}>
        <Plus /> New Session
      </Button>

      {/* Navigation */}
      <nav aria-label="Ship navigation" className="space-y-1">
        <div className="label-tech px-1 pb-1">Navigation</div>
        <a
          href="/"
          aria-current="page"
          className="flex items-center gap-2.5 rounded-md border border-amber/25 bg-amber/10 px-3 py-2 text-sm text-soft"
        >
          <Radar className="h-4 w-4 text-amber" />
          Command Center
        </a>
      </nav>

      {/* Recent conversations */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="label-tech px-1 pb-2">Recent conversations</div>
        <ul className="scrollbar-thin -mx-1 flex-1 space-y-1 overflow-y-auto px-1">
          {sessions.map((s) => {
            const active = s.id === activeId;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onSelect(s.id)}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "group flex w-full items-start gap-2.5 rounded-md px-3 py-2 text-left transition-colors",
                    active ? "bg-panel text-soft" : "text-silver hover:bg-panel/60 hover:text-soft",
                  )}
                >
                  <MessageSquare
                    className={cn(
                      "mt-0.5 h-3.5 w-3.5 shrink-0",
                      active ? "text-amber" : "text-muted-foreground",
                    )}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-xs">{s.title}</span>
                    <span className="block text-[0.65rem] tracking-wider text-muted-foreground">
                      {shipDate(s.updatedAt)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 border-t border-border px-1 pt-3">
        <NorthStarMark className="h-4 w-4" />
        <span className="label-tech">North Star · Est. 2026</span>
      </div>
    </div>
  );
}

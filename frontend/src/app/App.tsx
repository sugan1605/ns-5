import { Menu } from "lucide-react";
import { useCallback, useState } from "react";

import { NorthStarMark } from "@/components/ns5/NorthStarMark";
import { Sidebar } from "@/components/ns5/Sidebar";
import { Terminal } from "@/components/ns5/Terminal";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCompanion } from "@/hooks/use-companion";
import { world } from "@/ns5/runtime";
import { CabinView } from "@/ns5/scene/CabinView";


export default function App() {
  const { sessions, active, activeId, busy, phase, newSession, selectSession, send } =
    useCompanion();
  const [menuOpen, setMenuOpen] = useState(false);

  const setIsTyping = useCallback((typing: boolean) => {
    world.chatFocus = typing;
  }, []);

  const handleSend = useCallback(
    (text: string) => {
      world.chatFocus = false;
      void send(text);
    },
    [send],
  );

  const sidebarProps = {
    sessions,
    activeId,
    onNewSession: () => {
      newSession();
      setIsTyping(false);
      setMenuOpen(false);
    },
    onSelect: (id: string) => {
      selectSession(id);
      setIsTyping(false);
      setMenuOpen(false);
    },
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar xl:block">
        <Sidebar {...sidebarProps} />
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <div className="flex items-center justify-between border-b border-border bg-sidebar px-3 py-2 xl:hidden">
          <div className="flex items-center gap-2">
            <NorthStarMark className="h-6 w-6" />
            <span className="text-xs font-semibold tracking-[0.22em] text-soft">NORTH STAR 5</span>
            <span
              className="ml-1 h-1.5 w-1.5 rounded-full bg-signal glow-signal ns-blink-dot"
              aria-label="System online"
            />
          </div>
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="console" size="icon" aria-label="Open ship menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[85vw] max-w-xs border-sidebar-border bg-sidebar p-0"
            >
              <SheetTitle className="sr-only">Ship navigation</SheetTitle>
              <Sidebar {...sidebarProps} />
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 lg:flex-row">
          <div className="h-[44vh] min-h-56 shrink-0 lg:h-auto lg:flex-1">
            <CabinView />
          </div>
          <div className="min-h-0 flex-1 lg:w-[360px] lg:flex-none 2xl:w-[420px]">
            <Terminal
              session={active}
              isReplying={busy}
              phase={phase}
              onSend={handleSend}
              onTypingChange={setIsTyping}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

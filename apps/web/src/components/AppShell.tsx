import { AnimatePresence, motion } from 'motion/react';
import type { GraphResponse } from '../api/types';
import { LeftRail } from '../features/controls/LeftRail';
import { TopBar } from '../features/controls/TopBar';
import { GraphCanvas } from '../features/graph/GraphCanvas';
import { CommandPalette } from '../features/palette/CommandPalette';
import { useAppStore } from '../store/useAppStore';
import { RightDock } from './RightDock';

export function AppShell({ graph }: { graph: GraphResponse }) {
  const dockOpen = useAppStore((s) => s.dockOpen);

  return (
    <div className="flex h-full flex-col">
      <TopBar meta={graph.meta} />
      <div className="flex min-h-0 flex-1">
        <LeftRail meta={graph.meta} />
        <main className="relative min-w-0 flex-1 bg-canvas">
          <GraphCanvas graph={graph} />
        </main>
        <AnimatePresence>
          {dockOpen && (
            <motion.aside
              key="dock"
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 40, opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
              className="shrink-0 overflow-hidden border-l border-border"
            >
              <RightDock />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
      <CommandPalette graph={graph} />
    </div>
  );
}

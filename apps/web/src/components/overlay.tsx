'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

/**
 * Renders children straight into <body>, outside the page.
 *
 * Dialogs, drawers and pop-up menus must not live inside the page: page and card animations,
 * transforms and blur effects turn the page into its own layer, which would trap the dialog under
 * the sticky header (its close button could not be clicked) or clip it inside a card.
 */
export function Portal({ children }: { children: React.ReactNode }) {
  // False while the server renders and during hydration, true in the browser right away after that,
  // so a dialog opened by a click appears in the same frame.
  const inBrowser = useSyncExternalStore(noSubscribe, () => true, () => false);
  return inBrowser ? createPortal(children, document.body) : null;
}

const noSubscribe = () => () => undefined;

let openCount = 0;

/**
 * Behaviour shared by every dialog and drawer while it is open:
 * Escape closes it, the page behind does not scroll, and focus returns to where it was on close.
 * `onClose` may change on every render; the latest one is always used.
 */
export function useOverlay(open: boolean, onClose: () => void, options: { lockScroll?: boolean } = {}) {
  const close = useRef(onClose);
  close.current = onClose;
  const lockScroll = options.lockScroll ?? true;

  useEffect(() => {
    if (!open) return;
    const returnTo = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close.current();
      }
    };
    window.addEventListener('keydown', onKey);
    if (lockScroll) {
      openCount += 1;
      document.documentElement.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', onKey);
      if (lockScroll) {
        openCount = Math.max(0, openCount - 1);
        if (openCount === 0) document.documentElement.style.overflow = '';
      }
      // Give focus back to the button that opened the dialog (if it is still on the page).
      if (returnTo && document.contains(returnTo)) returnTo.focus({ preventScroll: true });
    };
  }, [open, lockScroll]);
}

/** Calls `onOutside` for a pointer press outside every given element (for pop-up menus). */
export function useOutsidePress(refs: { current: HTMLElement | null }[], active: boolean, onOutside: () => void) {
  const cb = useRef(onOutside);
  cb.current = onOutside;
  useEffect(() => {
    if (!active) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (refs.some((r) => r.current?.contains(target))) return;
      cb.current();
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}

/**
 * Position for a menu that opens under a button and renders in a Portal. It follows the button
 * while the page scrolls or resizes, and closes once the button has scrolled out of sight.
 */
export function useAnchoredMenu(
  open: boolean,
  anchor: { current: HTMLElement | null },
  onClose: () => void,
  menuHeight = 180,
): { top: number; right: number } | null {
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const cb = useRef(onClose);
  cb.current = onClose;
  useEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    let frame = 0;
    const place = () => {
      frame = 0;
      const r = anchor.current?.getBoundingClientRect();
      if (!r) return;
      if (r.bottom < 0 || r.top > window.innerHeight) return cb.current();
      // Open upwards when there is no room below.
      const below = r.bottom + 6;
      const top = below + menuHeight > window.innerHeight && r.top - menuHeight - 6 > 0 ? r.top - menuHeight - 6 : below;
      setPos({ top, right: Math.max(8, window.innerWidth - r.right) });
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(place);
    };
    place();
    window.addEventListener('scroll', schedule, { passive: true, capture: true });
    window.addEventListener('resize', schedule);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule, { capture: true });
      window.removeEventListener('resize', schedule);
    };
  }, [open, anchor, menuHeight]);
  return pos;
}

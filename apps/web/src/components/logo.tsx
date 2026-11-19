'use client';
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from 'react';

/** Light-theme files, tried in order. The last one always exists (it ships with the storefront update). */
const LIGHT_SOURCES = ['/brand/logo-transparent.png', '/brand/logo.png', '/brand/logo-dark.png'];

/**
 * The Bossඕනේ LK logo. Shows the light-background file normally and the dark-background
 * version (light swoosh) in dark mode. Files: public/brand/ (see docs/brand.md).
 * If the light file is missing, it falls back instead of showing a broken image.
 */
export function Logo({ className = 'h-12 w-auto', priority = false }: { className?: string; priority?: boolean }) {
  const [source, setSource] = useState(0);
  const lightRef = useRef<HTMLImageElement>(null);
  const tryNext = () => setSource((i) => Math.min(i + 1, LIGHT_SOURCES.length - 1));

  // The image can fail before React is ready to hear about it, so check once after mounting.
  useEffect(() => {
    const img = lightRef.current;
    if (img && img.complete && img.naturalWidth === 0 && source < LIGHT_SOURCES.length - 1) tryNext();
  }, [source]);

  const common = { alt: 'Bossඕනේ LK', width: 417, height: 249, decoding: 'async' as const, fetchPriority: priority ? ('high' as const) : undefined };
  return (
    <>
      <img ref={lightRef} src={LIGHT_SOURCES[source]} onError={tryNext} {...common} className={`${className} dark:hidden`} />
      <img src="/brand/logo-dark.png" {...common} aria-hidden className={`${className} hidden dark:block`} />
    </>
  );
}

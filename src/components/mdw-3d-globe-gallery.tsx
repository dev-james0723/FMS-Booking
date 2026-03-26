"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { initMdwGlobe } from "@/lib/mdw-globe/init-globe";

const globeVars: CSSProperties & Record<string, string> = {
  "--min-height": "550px",
  "--image-width": "10",
  "--image-height": "10",
  "--image-repeat": "1",
  "--auto-rotate": "true",
  "--auto-rotate-speed": "4",
  "--sphere-radius": "3.9",
  "--image-scale": "1.65",
  "--logo-size": "1.9",
};

export function Mdw3dGlobeGallery() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return initMdwGlobe(el);
  }, []);

  return <div ref={ref} className="mdw-3d-globe-gallery" style={globeVars} />;
}

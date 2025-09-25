"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export function useScrollDetection() {
  const [isHoveringSidebar, setIsHoveringSidebar] = useState(false);
  const [isHoveringMain, setIsHoveringMain] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = useCallback((isSidebar: boolean) => {
    if (isSidebar) {
      setIsHoveringSidebar(true);
      setIsHoveringMain(false);
    } else {
      setIsHoveringMain(true);
      setIsHoveringSidebar(false);
    }
  }, []);

  const handleMouseLeave = useCallback((isSidebar: boolean) => {
    if (isSidebar) {
      setIsHoveringSidebar(false);
    } else {
      setIsHoveringMain(false);
    }
  }, []);

  const handleWheel = useCallback((e: WheelEvent, isSidebar: boolean) => {
    // Prevent scroll propagation to parent elements
    e.stopPropagation();
  }, []);

  useEffect(() => {
    const sidebarElement = sidebarRef.current;
    const mainElement = mainRef.current;

    if (sidebarElement) {
      const sidebarMouseEnter = () => handleMouseEnter(true);
      const sidebarMouseLeave = () => handleMouseLeave(true);
      const sidebarWheel = (e: WheelEvent) => handleWheel(e, true);

      sidebarElement.addEventListener("mouseenter", sidebarMouseEnter);
      sidebarElement.addEventListener("mouseleave", sidebarMouseLeave);
      sidebarElement.addEventListener("wheel", sidebarWheel, { passive: false });

      return () => {
        sidebarElement.removeEventListener("mouseenter", sidebarMouseEnter);
        sidebarElement.removeEventListener("mouseleave", sidebarMouseLeave);
        sidebarElement.removeEventListener("wheel", sidebarWheel);
      };
    }

    if (mainElement) {
      const mainMouseEnter = () => handleMouseEnter(false);
      const mainMouseLeave = () => handleMouseLeave(false);
      const mainWheel = (e: WheelEvent) => handleWheel(e, false);

      mainElement.addEventListener("mouseenter", mainMouseEnter);
      mainElement.addEventListener("mouseleave", mainMouseLeave);
      mainElement.addEventListener("wheel", mainWheel, { passive: false });

      return () => {
        mainElement.removeEventListener("mouseenter", mainMouseEnter);
        mainElement.removeEventListener("mouseleave", mainMouseLeave);
        mainElement.removeEventListener("wheel", mainWheel);
      };
    }
  }, [handleMouseEnter, handleMouseLeave, handleWheel]);

  return {
    sidebarRef,
    mainRef,
    isHoveringSidebar,
    isHoveringMain,
  };
}

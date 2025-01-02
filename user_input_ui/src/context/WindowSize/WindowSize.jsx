import React, { createContext, useState, useEffect } from "react";

export const WindowSizeContext = createContext();

export function WindowSizeProvider({ children }) {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <WindowSizeContext.Provider value={windowSize}>
      {children}
    </WindowSizeContext.Provider>
  );
}

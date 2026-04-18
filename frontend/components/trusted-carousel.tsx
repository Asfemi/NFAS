"use client";

import { useEffect, useState } from "react";

export function TrustedCarousel() {
  const [displayedText, setDisplayedText] = useState("");
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const texts = [
    "Trusted by Nigerian farmers",
    "Trusted by Nigerian communities"
  ];

  useEffect(() => {
    const currentText = texts[currentTextIndex];
    const typingSpeed = isDeleting ? 30 : 75;
    const pauseDuration = 2000;

    let timeout: NodeJS.Timeout;

    if (!isDeleting && displayedText === currentText) {
      // Pause after typing complete
      timeout = setTimeout(() => setIsDeleting(true), pauseDuration);
    } else if (isDeleting && displayedText === "") {
      // Move to next text
      setIsDeleting(false);
      setCurrentTextIndex((prev) => (prev + 1) % texts.length);
    } else {
      // Type or delete
      timeout = setTimeout(() => {
        setDisplayedText((prev) =>
          isDeleting
            ? prev.slice(0, -1)
            : currentText.slice(0, prev.length + 1)
        );
      }, typingSpeed);
    }

    return () => clearTimeout(timeout);
  }, [displayedText, currentTextIndex, isDeleting, texts]);

  return (
    <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-800">
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
      <span className="whitespace-nowrap">
        {displayedText}
        <span className="animate-pulse">|</span>
      </span>
    </div>
  );
}

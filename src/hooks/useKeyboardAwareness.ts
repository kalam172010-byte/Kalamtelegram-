import { useState, useEffect } from 'react';

/**
 * Hook to detect virtual keyboard state on mobile devices,
 * automatically hide interfering floating navigation bars,
 * and smoothly scroll focused inputs into clear view without being hidden.
 */
export function useKeyboardAwareness() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    // 1. Listen for focus and blur on all input elements
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      if (isInput) {
        setIsInputFocused(true);

        // Smoothly scroll the focused element into comfortable center view
        // Execute after a slight delay to allow the mobile virtual keyboard transition to complete
        setTimeout(() => {
          try {
            target.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'nearest'
            });
          } catch {
            // Fallback for older browsers
            target.scrollIntoView(false);
          }
        }, 180);

        // Secondary check in case of slower keyboard slide-up animation
        setTimeout(() => {
          try {
            target.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'nearest'
            });
          } catch {
            // ignore
          }
        }, 380);
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      if (isInput) {
        // Small delay to prevent flickering when moving from one input to another
        setTimeout(() => {
          const activeElement = document.activeElement;
          const stillFocused =
            activeElement &&
            (activeElement.tagName === 'INPUT' ||
              activeElement.tagName === 'TEXTAREA' ||
              activeElement.tagName === 'SELECT' ||
              (activeElement as HTMLElement).isContentEditable);

          if (!stillFocused) {
            setIsInputFocused(false);
          }
        }, 100);
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    // 2. Listen to visualViewport resize (Standard modern API for mobile keyboard detection)
    const viewport = window.visualViewport;
    const initialHeight = window.innerHeight;

    const handleViewportResize = () => {
      if (viewport) {
        // If the visual viewport height drops significantly (> 120px), a virtual keyboard is visible
        const heightDifference = initialHeight - viewport.height;
        const isVirtualKeyboardOpen = heightDifference > 120;
        setIsKeyboardVisible(isVirtualKeyboardOpen);
      }
    };

    if (viewport) {
      viewport.addEventListener('resize', handleViewportResize);
      viewport.addEventListener('scroll', handleViewportResize);
    }

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      if (viewport) {
        viewport.removeEventListener('resize', handleViewportResize);
        viewport.removeEventListener('scroll', handleViewportResize);
      }
    };
  }, []);

  return {
    isKeyboardVisible: isKeyboardVisible || isInputFocused,
    isInputFocused
  };
}

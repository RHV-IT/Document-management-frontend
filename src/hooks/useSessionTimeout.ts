import { useEffect, useRef } from 'react';

export function useSessionTimeout(timeoutMinutes = 30) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Action to take when time runs out
    const handleLogout = () => {
      sessionStorage.removeItem('rhv_session');
      localStorage.removeItem('rhv_session'); 
      window.location.href = '/login'; // Safely forces the browser to the login page
    };

    // Start the countdown
    const startTimer = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const ms = timeoutMinutes * 60 * 1000;
      timeoutRef.current = setTimeout(handleLogout, ms);
    };

    // Cancel the countdown
    const stopTimer = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    // Event Listeners
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        startTimer(); 
      } else {
        stopTimer();  
      }
    };

    const handleMouseLeave = () => startTimer(); 
    const handleMouseEnter = () => stopTimer();  

    // Attach listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [timeoutMinutes]);
}
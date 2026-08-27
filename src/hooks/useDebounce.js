import { useState, useEffect } from "react";

/**
 * Debounce a value by the given delay.
 *
 * Returns the debounced value that updates only after `delay` ms of
 * inactivity. Cleans up the timer on unmount.
 *
 * @param {*} value - The value to debounce.
 * @param {number} [delay=350] - Debounce delay in milliseconds.
 * @returns {*} The debounced value.
 */
export default function useDebounce(value, delay = 350) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

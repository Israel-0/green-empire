import { useState, useEffect } from 'react';
import { formatTime } from '../../utils/formatting';

interface TimerProps {
  remainingMinutes: number;
  onComplete?: () => void;
}

export default function Timer({ remainingMinutes, onComplete }: TimerProps) {
  const [time, setTime] = useState(remainingMinutes);

  useEffect(() => {
    setTime(remainingMinutes);
  }, [remainingMinutes]);

  useEffect(() => {
    if (time <= 0) {
      onComplete?.();
      return;
    }

    const interval = setInterval(() => {
      setTime((prev) => {
        const next = prev - 1 / 60;
        return next < 0 ? 0 : next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [time, onComplete]);

  if (time <= 0) {
    return <span className="text-grow-green font-bold animate-pulse">¡Listo!</span>;
  }

  return <span className="text-grow-amber font-mono">{formatTime(time)}</span>;
}

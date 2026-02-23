'use client';

import { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

interface CountdownProps {
  endsAt: Date | string;
  onComplete?: () => void;
}

export function Countdown({ endsAt, onComplete }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const endDate = typeof endsAt === 'string' ? new Date(endsAt) : endsAt;
      const now = new Date();
      const difference = endDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
        });
        onComplete?.();
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isExpired: false,
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endsAt, onComplete]);

  if (timeLeft.isExpired) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
        <Calendar className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-red-500 mb-2">Challenge Ended</h3>
        <p className="text-provn-muted">This challenge has concluded. Check the winners!</p>
      </div>
    );
  }

  const timeUnits = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ];

  return (
    <div className="bg-gradient-to-br from-provn-surface/90 to-provn-surface-2/90 border border-provn-accent/30 rounded-xl p-6">
      <div className="flex items-center justify-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-provn-accent" />
        <h3 className="text-lg font-bold text-provn-text">Time Remaining</h3>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {timeUnits.map((unit, index) => (
          <motion.div
            key={unit.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="text-center"
          >
            <div className="bg-provn-surface-2 border border-provn-border rounded-lg p-3 mb-2">
              <motion.div
                key={unit.value}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-provn-accent to-purple-600"
              >
                {String(unit.value).padStart(2, '0')}
              </motion.div>
            </div>
            <div className="text-xs text-provn-muted font-medium uppercase tracking-wider">
              {unit.label}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";

interface CountdownTimerProps {
  endDate?: Date;
  className?: string;
}

export default function CountdownTimer({ endDate, className = "" }: CountdownTimerProps) {
  // Default to 24 hours from now if no end date provided
  const defaultEndDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const targetDate = endDate || defaultEndDate;
  
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className={`bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6 border-2 border-red-200 shadow-lg ${className}`}>
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-red-800 mb-2">🔥 العرض ينتهي خلال</h3>
        <p className="text-sm text-red-600">لا تفوت هذه الفرصة الذهبية!</p>
      </div>
      
      <div className="grid grid-cols-4 gap-3 text-center">
        <div className="bg-white rounded-xl p-3 shadow-md border border-red-200">
          <div className="text-2xl md:text-3xl font-black text-red-600">
            {formatNumber(timeLeft.days)}
          </div>
          <div className="text-xs font-medium text-red-800">يوم</div>
        </div>
        
        <div className="bg-white rounded-xl p-3 shadow-md border border-red-200">
          <div className="text-2xl md:text-3xl font-black text-red-600">
            {formatNumber(timeLeft.hours)}
          </div>
          <div className="text-xs font-medium text-red-800">ساعة</div>
        </div>
        
        <div className="bg-white rounded-xl p-3 shadow-md border border-red-200">
          <div className="text-2xl md:text-3xl font-black text-red-600">
            {formatNumber(timeLeft.minutes)}
          </div>
          <div className="text-xs font-medium text-red-800">دقيقة</div>
        </div>
        
        <div className="bg-white rounded-xl p-3 shadow-md border border-red-200">
          <div className="text-2xl md:text-3xl font-black text-red-600 animate-pulse">
            {formatNumber(timeLeft.seconds)}
          </div>
          <div className="text-xs font-medium text-red-800">ثانية</div>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-sm text-red-700 font-medium animate-bounce">
          ⚡ احجز الآن قبل انتهاء العرض!
        </p>
      </div>
    </div>
  );
}

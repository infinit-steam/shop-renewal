"use client";

import { useState, useEffect } from "react";

export default function CountdownBanner({ variant = "sidebar" }: { variant?: "sidebar" | "cart" }) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [isAfterDeadline, setIsAfterDeadline] = useState(false);
  const [isWeekend, setIsWeekend] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const kstNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
      const day = kstNow.getDay(); // 0: 일, 6: 토
      const hour = kstNow.getHours();
      const minute = kstNow.getMinutes();
      const second = kstNow.getSeconds();

      const isWeekendDay = day === 0 || day === 6;
      setIsWeekend(isWeekendDay);

      // 평일이고 16시 이전
      if (!isWeekendDay && hour < 16) {
        setIsAfterDeadline(false);
        const deadline = new Date(kstNow);
        deadline.setHours(16, 0, 0, 0);
        const diff = deadline.getTime() - kstNow.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds });
      } else {
        // 평일 16시 이후 또는 주말
        setIsAfterDeadline(true);
        setTimeLeft(null);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  if (variant === "sidebar") {
    if (isWeekend || isAfterDeadline) {
      return (
        <div className="border-t border-slate-100 pt-1.5 text-center">
          <span className="text-slate-500">택배 마감 </span>
          <span className="font-bold text-red-600">평일 오후 4시</span>
          <p className="text-[10px] text-slate-400 mt-1">
            📦 현재 주문 시 다음 영업일(평일)에 순차 출고됩니다
          </p>
        </div>
      );
    }

    return (
      <div className="border-t border-slate-100 pt-1.5 text-center">
        <span className="text-slate-500">택배 마감 </span>
        <span className="font-bold text-red-600">평일 오후 4시</span>
        <p className="text-xs font-bold text-red-600 mt-1.5 flex items-center justify-center gap-1">
          <svg className="w-3 h-3 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" strokeWidth="2"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 2"/>
          </svg>
          🚚 오늘 당일 발송 마감까지 {timeLeft?.hours.toString().padStart(2, "0")}시간 {timeLeft?.minutes.toString().padStart(2, "0")}분 {timeLeft?.seconds.toString().padStart(2, "0")}초 남음
        </p>
      </div>
    );
  }

  // Cart variant
  if (isWeekend || isAfterDeadline) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium text-amber-800">📦 현재 주문 시 다음 영업일(평일)에 순차 출고됩니다</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" strokeWidth="2"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 2"/>
          </svg>
          <span className="text-sm font-medium text-blue-800">
            🚚 오늘 당일 발송 마감까지 <strong className="font-mono">{timeLeft?.hours.toString().padStart(2, "0")}:{timeLeft?.minutes.toString().padStart(2, "0")}:{timeLeft?.seconds.toString().padStart(2, "0")}</strong> 남음
          </span>
        </div>
        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded font-mono">
          평일 16:00 마감
        </span>
      </div>
    </div>
  );
}
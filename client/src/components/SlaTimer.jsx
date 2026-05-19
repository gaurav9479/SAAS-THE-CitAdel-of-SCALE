import { useEffect, useState } from "react";

export default function SlaTimer({ createdAt, priority, status }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [colorClass, setColorClass] = useState("text-gray-500 bg-gray-100");

  useEffect(() => {
    if (status === "RESOLVED") {
      setTimeLeft("RESOLVED");
      setColorClass("text-green-700 bg-green-50 border border-green-200");
      return;
    }

    const createdTime = new Date(createdAt).getTime();
    
    // SLA thresholds based on priority: High 24h, Medium 48h, Low 72h
    let limitHours = 72;
    if (priority === "HIGH") limitHours = 24;
    else if (priority === "MEDIUM") limitHours = 48;

    const limitTimeMs = limitHours * 60 * 60 * 1000;
    const slaDeadline = createdTime + limitTimeMs;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = slaDeadline - now;

      if (diff <= 0) {
        setTimeLeft("BREACHED");
        setColorClass("text-red-700 bg-red-50 border border-red-200 animate-pulse font-bold");
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / (60 * 60 * 1000));
        const mins = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
        const secs = Math.floor((diff % (60 * 1000)) / 1000);

        setTimeLeft(`${hours}h ${mins}m ${secs}s`);

        if (hours < 4) {
          setColorClass("text-amber-700 bg-amber-50 border border-amber-200 font-semibold animate-pulse");
        } else {
          setColorClass("text-emerald-700 bg-emerald-50 border border-emerald-200");
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt, priority, status]);

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-mono font-medium ${colorClass}`}>
      {timeLeft}
    </span>
  );
}

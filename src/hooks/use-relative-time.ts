import { useState, useEffect } from "react";
import { relativeTime } from "@/lib/utils";

export function useRelativeTime(dateStr: string | null | undefined): string {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!dateStr) return;
    setText(relativeTime(dateStr));
    const interval = setInterval(() => {
      setText(relativeTime(dateStr));
    }, 30000);
    return () => clearInterval(interval);
  }, [dateStr]);

  return text;
}

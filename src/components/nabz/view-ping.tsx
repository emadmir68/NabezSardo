"use client";

import { useEffect } from "react";

/** یک بار در هر نشست، بازدید را ثبت می‌کند */
export function ViewPing({ id }: { id: string }) {
  useEffect(() => {
    try {
      const key = "nz-viewed";
      const seen: Record<string, number> = JSON.parse(sessionStorage.getItem(key) || "{}");
      const now = Date.now();
      if (seen[id] && now - seen[id] < 12 * 3600 * 1000) return;
      seen[id] = now;
      sessionStorage.setItem(key, JSON.stringify(seen));
      fetch("/api/view", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      }).catch(() => {});
    } catch {
      /* noop */
    }
  }, [id]);
  return null;
}

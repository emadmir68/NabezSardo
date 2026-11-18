"use client";

import { Link2, Printer } from "lucide-react";

export function ShareRow({ title }: { title: string }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      const el = document.getElementById("nz-share-copy");
      if (el) {
        el.textContent = "کپی شد ✓";
        setTimeout(() => (el.textContent = "کپی لینک"), 1600);
      }
    } catch {
      /* noop */
    }
  }
  return (
    <span className="inline-flex items-center gap-2">
      <button type="button" className="nz-btn-ghost inline-flex h-9 items-center gap-2 rounded-full px-4 text-[0.78rem]" onClick={copy} title="کپی لینک">
        <Link2 className="h-4 w-4" aria-hidden />
        <span id="nz-share-copy">کپی لینک</span>
      </button>
      <button
        type="button"
        className="nz-btn-ghost inline-flex h-9 items-center gap-2 rounded-full px-4 text-[0.78rem]"
        onClick={() => window.print()}
        title="چاپ"
      >
        <Printer className="h-4 w-4" aria-hidden />
        چاپ
      </button>
      <noscript>{title}</noscript>
    </span>
  );
}

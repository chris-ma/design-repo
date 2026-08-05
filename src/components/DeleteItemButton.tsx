"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteItemButton({ id }: { id: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this reference? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      router.push("/");
      router.refresh();
    } catch {
      alert("Could not delete this item. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="shrink-0 rounded-full border border-line-strong px-3 py-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-ink-faint transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
    >
      {deleting ? "Deleting…" : "Delete"}
    </button>
  );
}

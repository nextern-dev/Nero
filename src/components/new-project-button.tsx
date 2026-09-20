"use client";

import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui";
import { useUI } from "@/store/ui";

export function NewProjectButton({
  label,
  variant = "primary",
}: {
  label?: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const { setNewProjectOpen } = useUI();
  return (
    <Button variant={variant} onClick={() => setNewProjectOpen(true)}>
      {label ?? (
        <>
          <Plus className="h-4 w-4" /> New project
        </>
      )}
    </Button>
  );
}

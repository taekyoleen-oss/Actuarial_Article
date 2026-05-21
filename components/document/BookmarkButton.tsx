"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleBookmark } from "@/lib/actions/member";

interface BookmarkButtonProps {
  readonly documentId: string;
  readonly initialBookmarked: boolean;
}

export function BookmarkButton({ documentId, initialBookmarked }: BookmarkButtonProps) {
  const [optimistic, setOptimistic] = useState(initialBookmarked);
  const [pending, startTransition] = useTransition();

  function onSubmit() {
    setOptimistic((b) => !b);
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("document_id", documentId);
        await toggleBookmark(fd);
        toast.success(optimistic ? "책갈피 해제됨" : "책갈피 추가됨");
      } catch (err) {
        setOptimistic((b) => !b); // revert
        toast.error((err as Error).message);
      }
    });
  }

  return (
    <Button
      type="button"
      variant={optimistic ? "accent" : "outline"}
      size="sm"
      disabled={pending}
      onClick={onSubmit}
      aria-pressed={optimistic}
    >
      {optimistic ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
      <span>{optimistic ? "책갈피됨" : "책갈피"}</span>
    </Button>
  );
}

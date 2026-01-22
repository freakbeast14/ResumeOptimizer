"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, Github, Leaf } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

type HistoryRow = {
  id: number;
  jobDescription: string;
  status: string;
  outputUrl?: string | null;
  overleafUrl?: string | null;
  createdAt: Date;
};

type HistoryTableProps = {
  rows: HistoryRow[];
};

export function HistoryTable({ rows }: HistoryTableProps) {
  const { push } = useToast();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerText, setViewerText] = useState("");
  const portalRoot = useMemo(
    () => (typeof document !== "undefined" ? document.body : null),
    []
  );

  return (
    <Card className="border-[#2a2f55] bg-[#111325]/80">
      <CardHeader>
        <CardTitle>Generation history</CardTitle>
        <CardDescription>
          Review recent resume outputs and open links from here.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.id}
            className="flex flex-col gap-2 rounded-2xl border border-[#2a2f55] bg-[#0f1228] px-4 py-3 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <div className="text-sm font-semibold text-slate-100">
                {row.jobDescription.slice(0, 60)}...
              </div>
              <div className="text-xs text-slate-400">
                {new Date(row.createdAt).toLocaleString()}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {row.status != "ready" && (
                <Badge variant={row.status === "ready" ? "success" : "warning"}>
                  {row.status}
                </Badge> 
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setViewerText(row.jobDescription);
                  setViewerOpen(true);
                }}
                aria-label="View job description"
                title="View job description"
              >
                <Eye className="h-4 w-4" />
              </Button>
              {row.outputUrl && (
                <a
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 bg-transparent text-neutral-200 hover:bg-violet-500/20 h-9 px-3 text-sm"
                  href={row.outputUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() =>
                    push({ title: "Opening GitHub file...", variant: "success" })
                  }
                >
                  <Github className="h-4 w-4" />
                </a>
              )}
              {row.overleafUrl && (
                <a
                  className="inline-flex text-teal-600 cursor-pointer items-center justify-center gap-2 rounded-full font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 bg-transparent text-neutral-200 hover:bg-violet-500/20 h-9 px-3 text-sm"
                  href={row.overleafUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() =>
                    push({ title: "Opening Overleaf link...", variant: "success" })
                  }
                >
                  <Leaf className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="text-sm text-slate-400">No runs yet.</p>
        )}
      </CardContent>
      {viewerOpen && portalRoot
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setViewerOpen(false)}
              />
              <div className="relative w-[min(92vw,64rem)] rounded-2xl border border-[#2a2f55] bg-[#0f1228] p-6 shadow-xl">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-semibold text-slate-100">
                    Job description
                  </h2>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setViewerOpen(false)}
                  >
                    Close
                  </Button>
                </div>
                <div className="mt-4 max-h-[65vh] overflow-y-auto rounded-xl border border-[#2a2f55] bg-[#0b0f24] p-4 text-sm text-slate-200">
                  <p className="whitespace-pre-wrap">{viewerText}</p>
                </div>
              </div>
            </div>,
            portalRoot
          )
        : null}
    </Card>
  );
}

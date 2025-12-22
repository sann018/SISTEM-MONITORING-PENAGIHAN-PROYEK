import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold transition-all duration-200",
  {
    variants: {
      variant: {
        // Status Selesai - HIJAU
        completed: "bg-green-100 text-green-800 border border-green-300 shadow-sm hover:bg-green-200",
        success: "bg-green-100 text-green-800 border border-green-300 shadow-sm hover:bg-green-200",
        "sudah-ct": "bg-green-100 text-green-800 border border-green-300 shadow-sm hover:bg-green-200",
        "sudah-ut": "bg-green-100 text-green-800 border border-green-300 shadow-sm hover:bg-green-200",
        "sudah-lurus": "bg-green-100 text-green-800 border border-green-300 shadow-sm hover:bg-green-200",
        "otw-reg": "bg-green-100 text-green-800 border border-green-300 shadow-sm hover:bg-green-200",
        "sudah-rekon": "bg-green-100 text-green-800 border border-green-300 shadow-sm hover:bg-green-200",
        "sudah-rekap": "bg-green-100 text-green-800 border border-green-300 shadow-sm hover:bg-green-200",

        // Status Proses - KUNING/ORANGE
        "in-progress": "bg-amber-100 text-amber-800 border border-amber-300 shadow-sm hover:bg-amber-200",
        warning: "bg-amber-100 text-amber-800 border border-amber-300 shadow-sm hover:bg-amber-200",
        processing: "bg-amber-100 text-amber-800 border border-amber-300 shadow-sm hover:bg-amber-200",
        "proses-periv": "bg-amber-100 text-amber-800 border border-amber-300 shadow-sm hover:bg-amber-200",
        "sekuler-ttd": "bg-amber-100 text-amber-800 border border-amber-300 shadow-sm hover:bg-amber-200",
        "scan-dokumen": "bg-amber-100 text-amber-800 border border-amber-300 shadow-sm hover:bg-amber-200",

        // Status Pending/Belum - MERAH/PINK
        pending: "bg-red-100 text-red-800 border border-red-300 shadow-sm hover:bg-red-200",
        default: "bg-red-100 text-red-800 border border-red-300 shadow-sm hover:bg-red-200",
        "belum-ct": "bg-red-100 text-red-800 border border-red-300 shadow-sm hover:bg-red-200",
        "belum-ut": "bg-red-100 text-red-800 border border-red-300 shadow-sm hover:bg-red-200",
        "belum-lurus": "bg-red-100 text-red-800 border border-red-300 shadow-sm hover:bg-red-200",
        "belum-rekon": "bg-red-100 text-red-800 border border-red-300 shadow-sm hover:bg-red-200",
        "belum-rekap": "bg-red-100 text-red-800 border border-red-300 shadow-sm hover:bg-red-200",
        "antri-periv": "bg-red-100 text-red-800 border border-red-300 shadow-sm hover:bg-red-200",
        "revisi-mitra": "bg-red-100 text-red-800 border border-red-300 shadow-sm hover:bg-red-200",

        // Status Tertunda/Delayed - MERAH GELAP
        delayed: "bg-rose-100 text-rose-800 border border-rose-300 shadow-sm hover:bg-rose-200",
        danger: "bg-rose-100 text-rose-800 border border-rose-300 shadow-sm hover:bg-rose-200",

        // Status On Hold - UNGU
        "on-hold": "bg-purple-100 text-purple-800 border border-purple-300 shadow-sm hover:bg-purple-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

const getStatusVariant = (status: string): string => {
  if (!status) return "default";
  
  const statusLower = status.toLowerCase().trim();  // ← Normalize input

  // =====================================
  // STATUS SELESAI / COMPLETED - HIJAU ✅
  // =====================================
  if (statusLower === "sudah ct") return "sudah-ct";
  if (statusLower === "sudah ut") return "sudah-ut";
  if (statusLower === "sudah lurus") return "sudah-lurus";
  if (statusLower === "sudah rekon") return "sudah-rekon";
  if (statusLower === "sudah rekap") return "sudah-rekap";
  if (statusLower === "otw reg") return "otw-reg";

  // =====================================
  // STATUS PROSES - KUNING/ORANGE ⏳
  // =====================================
  if (statusLower === "proses periv") return "proses-periv";
  if (statusLower === "sekuler ttd") return "sekuler-ttd";
  if (statusLower === "scan dokumen mitra") return "scan-dokumen";

  // =====================================
  // STATUS PENDING / BELUM - MERAH/PINK ❌
  // =====================================
  if (statusLower === "belum ct") return "belum-ct";
  if (statusLower === "belum ut") return "belum-ut";
  if (statusLower === "belum lurus") return "belum-lurus";
  if (statusLower === "belum rekon") return "belum-rekon";
  if (statusLower === "belum rekap") return "belum-rekap";
  if (statusLower === "antri periv") return "antri-periv";
  if (statusLower === "revisi mitra") return "revisi-mitra";

  return "default";
};

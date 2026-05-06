"use client";

import { useRef, useState } from "react";
import { motion, useAnimation, useMotionValue, PanInfo } from "framer-motion";
import { fmt } from "@/lib/utils";

interface SwipeableItemProps {
  id: string;
  name: string;
  amount: number;
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
}

export function SwipeableItem({ id, name, amount, onDelete, onEdit }: SwipeableItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const dragX = useMotionValue(0);
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = async (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const threshold = -80;
    if (info.offset.x < threshold) {
      setIsDeleting(true);
      await controls.start({ x: -window.innerWidth, transition: { duration: 0.2 } });
      onDelete(id);
    } else {
      controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } });
    }
  };

  if (isDeleting) return null;

  return (
    <div className="relative w-full overflow-hidden border-b border-[#ebebeb] bg-[#ff385c]">
      {/* Background Delete Action */}
      <div className="absolute inset-y-0 right-0 w-[100px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-[3px] text-white font-[Inter,-apple-system,system-ui,sans-serif]">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 5h14M8 5V3h4v2M6 5l1 11h6l1-11" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[10px] font-semibold">Excluir</span>
        </div>
      </div>

      {/* Foreground Content */}
      <motion.div
        ref={containerRef}
        style={{ x: dragX }}
        drag="x"
        dragDirectionLock
        onDragEnd={handleDragEnd}
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.1}
        animate={controls}
        onClick={() => onEdit?.(id)}
        className="relative bg-[#ffffff] flex items-center justify-between px-4 py-[14px] w-full cursor-pointer hover:bg-[#f7f7f7] transition-colors"
      >
        <div className="flex-1 min-w-0 pr-4">
          <span className="text-[16px] font-[600] text-[#222222] truncate block">
            {name}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[14px] font-[400] tabular-nums text-[#222222]">
            {fmt(amount)}
          </span>
          {/* Arrow is revealed in prototype, but framer-motion handles x dynamically, we skip the left arrow for simplicity or just keep it clean */}
        </div>
      </motion.div>
    </div>
  );
}

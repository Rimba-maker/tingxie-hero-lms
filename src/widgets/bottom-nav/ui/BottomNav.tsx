"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Award, BookOpen, History, House } from "lucide-react";

import { cn } from "@/shared/lib/utils";

const ITEMS = [
  { href: "/", label: "Dashboard", icon: House },
  { href: "/syllabus", label: "Syllabus", icon: BookOpen },
  { href: "/history", label: "History", icon: History },
  { href: "/premium", label: "Premium", icon: Award },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 flex justify-around border-t bg-card py-2">
      {ITEMS.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1 text-xs",
              isActive ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="size-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

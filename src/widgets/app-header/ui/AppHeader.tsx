import { Bell, ChevronDown } from "lucide-react";

import type { Viewer } from "@/widgets/app-header/model/types";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";

type AppHeaderProps = {
  viewer: Viewer;
};

// Shared by Dashboard, Syllabus, and History — matches
// docs/reference/mockups/screen1-dashboard.png and screen2-syllabus.png,
// both of which repeat this exact header.
export function AppHeader({ viewer }: AppHeaderProps) {
  const { studentName, parentName, moeLevel } = viewer;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Avatar className="size-9">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {parentName.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm text-muted-foreground">Welcome back,</p>
          <p className="font-semibold">{parentName}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 rounded-full bg-card px-3 py-1 text-xs font-medium ring-1 ring-foreground/10">
          {studentName} — {moeLevel}
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </span>
        <Bell className="size-5 text-foreground" />
      </div>
    </div>
  );
}

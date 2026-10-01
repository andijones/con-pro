"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  BarChart3,
  CalendarRange,
  ChevronRight,
  FileText,
  Home,
  Inbox,
  LifeBuoy,
  LogOut,
  MessageSquare,
  Palette,
  ScrollText,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { conversations, currentUser, decisions, foiRequests } from "@/lib/data";
import { daysUntil } from "@/lib/dates";
import { PersonAvatar } from "./primitives";

const thisWeek = decisions.filter((d) => daysUntil(d.due) <= 7).length;
const openFoi = foiRequests.filter((f) => f.status !== "Sent").length;

export const nav = [
  { href: "/", label: "Home", icon: Home, badge: thisWeek, badgeLabel: "due this week" },
  { href: "/contracts", label: "Contracts", icon: FileText },
  { href: "/timeline", label: "Timeline", icon: CalendarRange },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/foi", label: "FOI requests", icon: Inbox, badge: openFoi, badgeLabel: "open" },
  { href: "/audit", label: "Audit", icon: ScrollText },
];

export function AppSidebar() {
  const path = usePathname();
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 justify-center px-3 group-data-[collapsible=icon]:px-2">
        <Link href="/" className="flex items-center" aria-label="Contravo home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/contravo-logo.svg" alt="Contravo" className="h-6 w-auto group-data-[collapsible=icon]:hidden" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/contravo-mark.svg" alt="" className="hidden size-6 group-data-[collapsible=icon]:block" />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <nav aria-label="Main">
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.label}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.badge ? (
                    <SidebarMenuBadge className="tnum">
                      {item.badge}
                      <span className="sr-only"> {item.badgeLabel}</span>
                    </SidebarMenuBadge>
                  ) : null}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        </nav>

        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarMenu>
            <Collapsible asChild defaultOpen={false} className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className="text-xs text-sidebar-foreground/70">
                    <span>Recent conversations</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {conversations.map((c) => (
                      <SidebarMenuSubItem key={c.id}>
                        <SidebarMenuSubButton asChild>
                          <Link href={`/chat?q=${encodeURIComponent(c.q)}`}>
                            <span className="truncate">{c.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Help and support">
              <a href="mailto:hello@contravo.ai?subject=Help%20with%20Contravo">
                <LifeBuoy />
                <span>Help and support</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={path.startsWith("/design-system")} tooltip="Design system">
              <Link href="/design-system">
                <Palette />
                <span>Design system</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none">
              <PersonAvatar id={currentUser.id} className="size-8" decorative />
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="truncate text-sm font-medium">{currentUser.name}</span>
                <span className="truncate text-xs text-muted-foreground">{currentUser.role}</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Sign out" onClick={() => toast("Signed out (concept only)")}>
              <LogOut />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

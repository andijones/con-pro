"use client";

/**
 * App sidebar ("Workbench"): dense, keyboard-first, and a live working set.
 * Decision record: docs/decisions/sidebar.md
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  CalendarRange,
  ChevronRight,
  CircleAlert,
  ChevronsUpDown,
  FileText,
  Home,
  Inbox,
  LifeBuoy,
  LogOut,
  Menu,
  MessageSquare,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  Settings,
  SquarePen,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { contracts, conversations, currentUser, decisions, foiRequests } from "@/lib/data";
import { daysUntil } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PersonAvatar } from "./primitives";
import { signOut } from "@/app/auth-actions";

const thisWeek = decisions.filter((d) => daysUntil(d.due) <= 7).length;
const openFoi = foiRequests.filter((f) => f.status !== "Sent").length;

const nav = [
  { href: "/", label: "Home", icon: Home, key: "H", count: thisWeek, countLabel: "due this week" },
  { href: "/contracts", label: "Contracts", icon: FileText, key: "C" },
  { href: "/timeline", label: "Timeline", icon: CalendarRange, key: "T" },
  { href: "/foi", label: "FOI requests", icon: Inbox, key: "F", count: openFoi, countLabel: "open" },
  { href: "/reports", label: "Reports", icon: BarChart3, key: "R" },
  { href: "/audit", label: "Audit", icon: ScrollText, key: "A" },
];

const NEW_CHAT = { href: "/chat", key: "N" };

/** Urgent only: contracts with a decision due within a week (or overdue), soonest first. The rest wait on Contracts and Home. */
const URGENT_DAYS = 7;
const needsYou = Array.from(new Set([...decisions].sort((a, b) => a.due.localeCompare(b.due)).map((d) => d.contractId)))
  .map((id) => {
    const due = decisions.filter((d) => d.contractId === id).sort((a, b) => a.due.localeCompare(b.due))[0].due;
    return { c: contracts.find((x) => x.id === id)!, days: daysUntil(due) };
  })
  .filter((n) => n.days <= URGENT_DAYS);

export function AppSidebar() {
  const path = usePathname();
  const router = useRouter();
  const isActive = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`));
  const armed = useRef<number | null>(null);
  const [showKeys, setShowKeys] = useState(false);

  // G then a letter jumps to a section; pressing G reveals every hint for a second
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toUpperCase();
      if (armed.current && Date.now() - armed.current < 1000) {
        const hit = k === NEW_CHAT.key ? NEW_CHAT : nav.find((n) => n.key === k);
        armed.current = null;
        setShowKeys(false);
        if (hit) {
          e.preventDefault();
          router.push(hit.href);
        }
      } else if (k === "G") {
        armed.current = Date.now();
        setShowKeys(true);
        setTimeout(() => {
          if (armed.current && Date.now() - armed.current >= 1000) {
            armed.current = null;
            setShowKeys(false);
          }
        }, 1050);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <Sidebar collapsible="icon" className="group-data-[side=left]:border-r-0 md:*:data-[slot=sidebar-inner]:bg-transparent">
      <SidebarHeader className="h-16 justify-center px-3 py-0 group-data-[collapsible=icon]:px-2">
        <SidebarTop />
      </SidebarHeader>

      <div className="px-3 pb-6 group-data-[collapsible=icon]:px-2">
        <div className="ai-glow rounded-lg group-data-[collapsible=icon]:w-fit">
          <Button
            asChild
            variant="outline"
            className="h-9 w-full justify-start gap-2 bg-background hover:bg-[color-mix(in_oklab,var(--muted)_60%,var(--background))] pr-2 pl-[7px] group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
          >
            <Link href={NEW_CHAT.href} aria-keyshortcuts="g n">
              <SquarePen className="text-muted-foreground" />
              <span className="flex-1 group-data-[collapsible=icon]:sr-only">New chat</span>
            </Link>
          </Button>
        </div>
      </div>

      <SidebarContent className="gap-7 px-1">
        <nav aria-label="Main">
          <SidebarGroup className="py-0">
            <SidebarMenu className="gap-0.5">
              {nav.map((n) => (
                <SidebarMenuItem key={n.href}>
                  <SidebarMenuButton asChild isActive={isActive(n.href)} tooltip={`${n.label} (G then ${n.key})`} className="h-9 text-[13px]">
                    <Link href={n.href} aria-keyshortcuts={`g ${n.key.toLowerCase()}`} aria-current={path === n.href ? "page" : undefined}>
                      <n.icon />
                      <span className="flex-1">{n.label}</span>
                      {showKeys ? (
                        <Keys k={n.key} />
                      ) : n.count ? (
                        <Count>
                          {n.count}
                          <span className="sr-only"> {n.countLabel}</span>
                        </Count>
                      ) : null}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </nav>

        {/* Needs you and Chats start folded, to keep the sidebar calm; the red count says when to look */}
        {needsYou.length > 0 && (
        <Collapsible asChild>
        <SidebarGroup className="py-0 group-data-[collapsible=icon]:hidden">
          <FoldLabel>
            <CircleAlert aria-hidden className="size-3.5" />
            Needs you
            <Badge variant="critical" className="tnum h-4.5 px-1.5 text-[11px] tracking-normal normal-case">
              {needsYou.length}
              <span className="sr-only"> urgent {needsYou.length === 1 ? "contract" : "contracts"}</span>
            </Badge>
          </FoldLabel>
          <CollapsibleContent>
          <SidebarMenu className="gap-0.5">
            {needsYou.map(({ c, days }) => (
              <SidebarMenuItem key={c.id}>
                <SidebarMenuButton asChild isActive={path === `/contracts/${c.id}`} className="h-9 text-[13px]">
                  <Link href={`/contracts/${c.id}`} title={c.title} aria-current={path === `/contracts/${c.id}` ? "page" : undefined}>
                    <span className="grid size-4 shrink-0 place-items-center" aria-hidden>
                      <span className="size-1.5 rounded-full bg-critical" />
                    </span>
                    <span className="flex-1 truncate">{c.title}</span>
                    <span className="tnum shrink-0 text-[11px] font-medium text-critical">
                      {days}d<span className="sr-only"> to the next deadline</span>
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          </CollapsibleContent>
        </SidebarGroup>
        </Collapsible>
        )}

        <Collapsible asChild>
        <SidebarGroup className="py-0 group-data-[collapsible=icon]:hidden">
          <FoldLabel>
            <MessageSquare aria-hidden className="size-3.5" />
            Recent chats
          </FoldLabel>
          <SidebarGroupAction asChild title="View all chats">
            <Link
              href="/chat"
              className="hit-area-y top-0.5! aspect-auto! h-6 w-auto! px-1.5 text-[11px] font-medium whitespace-nowrap text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </SidebarGroupAction>
          <CollapsibleContent>
          <SidebarMenu className="gap-0.5">
            {conversations.map((c) => (
              <SidebarMenuItem key={c.id}>
                <SidebarMenuButton asChild className="h-9 pl-8 text-[13px] text-muted-foreground hover:text-foreground">
                  <Link href={`/chat?q=${encodeURIComponent(c.q)}`} title={c.title}>
                    <span className="truncate">{c.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          </CollapsibleContent>
        </SidebarGroup>
        </Collapsible>
      </SidebarContent>

      <SidebarFooter className="mx-3 border-t border-sidebar-border px-0 py-3 group-data-[collapsible=icon]:mx-2">
        <UserMenu />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

/** Everything about the person in one place: profile, settings, help (WCAG 3.2.6: same place on every page), sign out. */
function UserMenu() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" tooltip={currentUser.name} className="h-10 data-[state=open]:bg-sidebar-hover">
              <PersonAvatar id={currentUser.id} className="size-7" decorative />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{currentUser.name}</span>
              <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" aria-hidden />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-(--radix-dropdown-menu-trigger-width) min-w-60">
            <DropdownMenuLabel className="flex items-center gap-2.5 py-2 font-normal">
              <PersonAvatar id={currentUser.id} className="size-8" decorative />
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-sm font-medium text-foreground">{currentUser.name}</span>
                <span className="block truncate text-xs text-muted-foreground">priya.shah@northgate.nhs.uk</span>
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => toast("Profile (concept only)")}>
                <UserRound /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => toast("Notification settings (concept only)")}>
                <Settings /> Notifications and settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <a href="mailto:hello@contravo.ai?subject=Help%20with%20Contravo">
                  <LifeBuoy /> Help and support
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/design-system">
                  <Palette /> Design system
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => signOut()}>
              <LogOut /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

/* Shared measurements, so every row lines up */

/** A section label that folds its section: the whole label is the button, with a chevron that turns when open */
function FoldLabel({ children }: { children: React.ReactNode }) {
  return (
    <SidebarGroupLabel asChild className="mb-1 h-7 px-2 text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
      <CollapsibleTrigger className="group/fold w-full gap-2 text-left transition-colors duration-(--duration-fast) hover:text-foreground [&>svg]:size-3.5">
        <span className="flex items-center gap-2">{children}</span>
        <ChevronRight aria-hidden className="transition-transform duration-(--duration-fast) ease-(--ease-out) group-data-[state=open]/fold:rotate-90" />
      </CollapsibleTrigger>
    </SidebarGroupLabel>
  );
}

function Count({ children }: { children: React.ReactNode }) {
  return (
    <span className="tnum min-w-5 shrink-0 rounded-md bg-sidebar-hover px-1 text-center text-[11px] font-medium text-sidebar-foreground group-hover/menu-button:bg-card group-data-[active=true]/menu-button:bg-card group-data-[collapsible=icon]:hidden">
      {children}
    </span>
  );
}

function Keys({ k }: { k: string }) {
  return (
    <kbd aria-hidden className="flex shrink-0 gap-0.5 font-sans text-[10px] text-muted-foreground group-data-[collapsible=icon]:hidden">
      <span className="grid h-4 min-w-4 place-items-center rounded border bg-background px-1">G</span>
      <span className="grid h-4 min-w-4 place-items-center rounded border bg-background px-1">{k}</span>
    </kbd>
  );
}

/** Logo plus the collapse control. Collapsed, the mark itself is the expand button. */
function SidebarTop() {
  const { state, toggleSidebar: toggle, isMobile } = useSidebar();
  // The button you pressed is replaced by its opposite, so carry focus across (WCAG 2.4.3)
  const control = useRef<HTMLButtonElement>(null);
  const moveFocus = useRef(false);
  useEffect(() => {
    if (moveFocus.current) control.current?.focus();
    moveFocus.current = false;
  }, [state]);
  const toggleSidebar = () => {
    moveFocus.current = true;
    toggle();
  };
  if (state === "collapsed" && !isMobile)
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            ref={control}
            type="button"
            onClick={toggleSidebar}
            aria-label="Expand sidebar"
            aria-keyshortcuts="Meta+B Control+B"
            className="group/expand relative grid size-8 place-items-center rounded-md transition-colors duration-(--duration-fast) hover:bg-sidebar-hover"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/contravo-mark.svg"
              alt=""
              width={22}
              height={22}
              className="size-[22px] transition-opacity duration-(--duration-fast) group-hover/expand:opacity-0 group-focus-visible/expand:opacity-0"
            />
            <PanelLeftOpen
              className="absolute size-4 text-sidebar-foreground opacity-0 transition-opacity duration-(--duration-fast) group-hover/expand:opacity-100 group-focus-visible/expand:opacity-100"
              aria-hidden
            />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Expand sidebar · ⌘B</TooltipContent>
      </Tooltip>
    );
  return (
    <div className="flex items-center justify-between gap-2">
      <Link href="/" className="flex h-8 items-center rounded-md px-2" aria-label="Contravo home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/contravo-logo.svg" alt="Contravo" width={92} height={18} className="h-[18px] w-auto" />
      </Link>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            ref={control}
            variant="ghost"
            size="icon-sm"
            onClick={toggleSidebar}
            aria-label={isMobile ? "Close menu" : "Collapse sidebar"}
            aria-keyshortcuts={isMobile ? undefined : "Meta+B Control+B"}
            className="text-muted-foreground hover:text-foreground"
          >
            <PanelLeftClose />
          </Button>
        </TooltipTrigger>
        {!isMobile && <TooltipContent side="right">Collapse sidebar · ⌘B</TooltipContent>}
      </Tooltip>
    </div>
  );
}

/** Phones only: the sidebar is off-canvas there, so it needs a way in */
export function MobileBar() {
  const { toggleSidebar } = useSidebar();
  return (
    <div className="sticky top-0 z-(--z-header) flex h-[calc(3rem+env(safe-area-inset-top))] items-center gap-1 border-b bg-background/90 px-2 pt-[env(safe-area-inset-top)] backdrop-blur-sm md:hidden">
      <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label="Open menu">
        <Menu />
      </Button>
      <Link href="/" className="flex h-8 items-center rounded-md px-1" aria-label="Contravo home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/contravo-logo.svg" alt="Contravo" width={102} height={20} className="h-5 w-auto" />
      </Link>
    </div>
  );
}

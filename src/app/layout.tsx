import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import { Bell } from "lucide-react";
import { AppSidebar } from "@/components/contravo/app-sidebar";
import { AskBar } from "@/components/contravo/ask-bar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { organisation } from "@/lib/data";
import { cookies } from "next/headers";
import { TokenOverrides } from "@/components/contravo/theme";
import { AskDrawer } from "@/components/contravo/ask-drawer";
import { tokenScript } from "@/components/contravo/token-script";
import "./globals.css";

// Font family is referenced by name in globals.css (@theme inline --font-sans)
const instrument = Instrument_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-instrument" });

export const metadata: Metadata = {
  title: { default: "Contravo", template: "%s · Contravo" },
  description: "Every agreement. Clearer decisions.",
  icons: { icon: "/contravo-mark.svg" },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Render the sidebar in its saved state on first paint (no open-then-collapse flash)
  const sidebarOpen = (await cookies()).get("sidebar_state")?.value !== "false";
  return (
    <html lang="en-GB" className={instrument.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: tokenScript }} />
      </head>
      <body className="min-h-dvh">
        {/* WCAG 2.4.1 Bypass blocks */}
        <a
          href="#main"
          className="fixed top-3 left-3 z-(--z-skip) -translate-y-[200%] rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-md transition-transform focus:translate-y-0"
        >
          Skip to main content
        </a>
        <TokenOverrides />
        <TooltipProvider>
          <SidebarProvider defaultOpen={sidebarOpen}>
            <AppSidebar />
            <SidebarInset className="min-w-0">
              <header role="banner" className="sticky top-0 z-(--z-header) flex h-14 shrink-0 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur-sm">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="h-6!" />
                <div className="hidden min-w-0 leading-tight sm:block">
                  <p className="text-[11px] text-muted-foreground">Organisation</p>
                  <p className="truncate text-sm font-medium">{organisation.short}</p>
                </div>
                <div className="mx-auto flex w-full max-w-xl justify-center">
                  <AskBar />
                </div>
                <Button variant="ghost" size="icon" aria-label="Notifications: 2 new" className="relative shrink-0">
                  <Bell />
                  <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary ring-2 ring-background" />
                </Button>
              </header>
              <main id="main" tabIndex={-1} className="flex-1 px-4 pt-8 pb-16 outline-none md:px-8">{children}</main>
            </SidebarInset>
          </SidebarProvider>
          <AskDrawer />
          <Toaster position="bottom-right" closeButton />
        </TooltipProvider>
      </body>
    </html>
  );
}

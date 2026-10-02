import { cookies } from "next/headers";
import { AppSidebar, MobileBar } from "@/components/contravo/app-sidebar";
import { AskDrawer } from "@/components/contravo/ask-drawer";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

/** The signed-in app shell: sidebar, page, Ask drawer. No top header; phones get a slim bar to open the sidebar. */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  // Render the sidebar in its saved state on first paint (no open-then-collapse flash)
  const sidebarOpen = (await cookies()).get("sidebar_state")?.value !== "false";
  return (
    <>
      {/* WCAG 2.4.1 Bypass blocks */}
      <a
        href="#main"
        className="fixed top-3 left-3 z-(--z-skip) -translate-y-[200%] rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-menu transition-transform focus:translate-y-0"
      >
        Skip to main content
      </a>
      <SidebarProvider defaultOpen={sidebarOpen} className="bg-sidebar">
        <AppSidebar />
        {/* Desktop: the page sits on a rounded white panel inset from the Frost frame. The panel clips; the inner
            layer scrolls, so the scrollbar stays inside the rounded corners. */}
        <SidebarInset className="min-w-0 md:my-2 md:mr-2 md:h-[calc(100svh-1rem)] md:overflow-hidden md:rounded-xl md:shadow-card">
          <div className="flex min-h-0 flex-1 flex-col md:overflow-y-auto md:scroll-pt-24 md:[scrollbar-gutter:stable]">
            <MobileBar />
            <main id="main" tabIndex={-1} className="@container flex-1 px-(--page-gutter) pt-(--page-gutter) pb-16 outline-none md:[--page-gutter:2.5rem]">
              {/* One content width for every page (--page-max), so titles and content never jump between pages */}
              <div className="mx-auto w-full max-w-(--page-max)">{children}</div>
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
      <AskDrawer />
    </>
  );
}

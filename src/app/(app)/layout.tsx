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
      <SidebarProvider defaultOpen={sidebarOpen}>
        <AppSidebar />
        <SidebarInset className="min-w-0">
          <MobileBar />
          <main id="main" tabIndex={-1} className="flex-1 px-4 pt-8 pb-16 outline-none md:px-8">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
      <AskDrawer />
    </>
  );
}

import type { Metadata, Viewport } from "next";
import { Instrument_Sans } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { TokenOverrides } from "@/components/contravo/theme";
import { tokenScript } from "@/components/contravo/token-script";
import "./globals.css";

// Font family is referenced by name in globals.css (@theme inline --font-sans)
const instrument = Instrument_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-instrument" });

// Edge to edge on notched phones; the phone bar, Ask drawer and sign-in footer pad for the safe areas
export const viewport: Viewport = { viewportFit: "cover", themeColor: "#ffffff" };

export const metadata: Metadata = {
  title: { default: "Contravo", template: "%s · Contravo" },
  description: "Every agreement. Clearer decisions.",
  icons: { icon: "/contravo-mark.svg" },
};

/** Shared by every page: fonts, tokens, tooltips and toasts. The app shell lives in (app)/layout.tsx. */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className={instrument.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: tokenScript }} />
      </head>
      <body className="min-h-dvh">
        <TokenOverrides />
        <TooltipProvider>
          {children}
          <Toaster position="bottom-right" closeButton />
        </TooltipProvider>
      </body>
    </html>
  );
}

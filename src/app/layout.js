import { Analytics } from "@vercel/analytics/next";
import { Bricolage_Grotesque, Geist_Mono, Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { rootMetadata } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  axes: ["opsz", "wdth"],
  variable: "--font-bricolage",
  subsets: ["latin"],
});

// Pages set a short title ("Roadmap") through pageMetadata; the template adds the app's name
export const metadata = rootMetadata;

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} ${bricolage.variable} h-full antialiased`}
    >
      {/* One screen tall so the month grid fits between header and footer; overflows (and scrolls) only on very short windows */}
      <body className="flex h-dvh flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}

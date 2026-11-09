import type { Metadata, Viewport } from "next";
import { Black_Han_Sans, IBM_Plex_Sans_KR } from "next/font/google";
import "./globals.css";

// Korean glyphs load by unicode-range on demand, so skip the latin-only preload.
const hanSans = Black_Han_Sans({
  variable: "--font-hansans",
  weight: "400",
  subsets: ["latin"],
  preload: false,
});

const plex = IBM_Plex_Sans_KR({
  variable: "--font-plex",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  title: "ScamShield",
  description: "받은 메시지를 올리면 사기인지, 왜 그런지, 지금 무엇을 하면 되는지 알려줘요.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f3f6f5",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${hanSans.variable} ${plex.variable} antialiased`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}

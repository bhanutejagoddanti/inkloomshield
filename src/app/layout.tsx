import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Inkloom Shield // Intelligent Brand-Governance & Remediation Firewall",
  description:
    "Active pre-publication firewall checking content drafts against approved brand guidelines and product fact sheets with grounded citations, intent-preserving tone sliders, and macro ambiguity detection.",
  keywords: [
    "Brand Governance",
    "AI Firewall",
    "Fact Checking",
    "Tone Slider",
    "Compliance",
    "Remediation",
    "Next.js 14",
    "Gemini API"
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-slate-100 min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}

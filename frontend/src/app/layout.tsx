import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Anvesha AI | The Sutra of Information",
  description:
    "Experience sovereign Indian LLMs designed for professional insight, deep reasoning, and cultural precision. Priority access to .gov.in sources and verified citations.",
  keywords: ["Anvesha AI", "Indian search engine", "sovereign LLM", "gov.in citations", "Indian intelligence"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} antialiased font-[family-name:var(--font-inter)]`}>
        {children}
      </body>
    </html>
  );
}

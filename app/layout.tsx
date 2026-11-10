import type { Metadata } from "next";
import "./globals.css";
import "@/styles/shell.css";
import "@/styles/chat.css";
import "@/styles/responsive.css";
import "@/styles/provider.css";

export const metadata: Metadata = {
  title: "Homie — your home service assistant",
  description: "Find, compare, and book trusted home services through a simple conversation.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

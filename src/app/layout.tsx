import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OurSkinOurFuture — Skin Diagnostic & Projection",
  description:
    "A skin diagnostic that shows what your skin looks like months from now if you act on the recommendation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}
        className="antialiased"
      >
        {children}
      </body>
    </html>
  );
}

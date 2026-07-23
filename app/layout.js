import "./globals.css";

export const metadata = {
  title: "OurSkinOurFuture — Predictive Clinical Skin Suite",
  description:
    "Multi-concern AI skin diagnosis, treatment simulation, and agentic clinical coaching — powered by YouCam Skin AI.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

import "./globals.css";

export const metadata = {
  title: "OurSkinOurFuture — See Where Your Skin Is Headed",
  description:
    "Upload a photo for an AI skin condition analysis, ingredient recommendations, and a projection of what consistent care could look like — powered by YouCam.",
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

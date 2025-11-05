export const metadata = {
  title: 'Web Proxy',
  description: 'A web proxy built with Next.js',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
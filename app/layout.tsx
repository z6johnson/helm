import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Helm — AI Strategy Intake',
  description: 'AI strategy intake dashboard for UC San Diego',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Albert+Sans:wght@300;400;500;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

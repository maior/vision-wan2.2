import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Wan2.2 Data Dashboard',
  description: 'Data quality and preprocessing dashboard for Wan2.2',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

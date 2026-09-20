import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FilmForge',
  description: 'Internal film production management system',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang='en'>
      <body>{children}</body>
    </html>
  )
}

import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'midpoint'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
      <footer className="footer footer-center p-4 bg-base-300 text-base-content">
        <aside>
          <p>Made with ❤️ by Kyle Thornton</p>
        </aside>
      </footer>
    </html>
  )
}

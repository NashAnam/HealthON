import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import DisableInspect from '@/components/DisableInspect'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HealthOn - Complete Healthcare Platform',
  description: 'Connect patients, doctors, and labs seamlessly for better healthcare',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'HealthOn'
  },
  manifest: '/manifest.json'
}

export function generateViewport() {
  return {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
    themeColor: '#4F46E5'
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 antialiased`}>
        <DisableInspect />
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  )
}

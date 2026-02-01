import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import DisableInspect from '@/components/DisableInspect'
import SWRegistration from '@/components/SWRegistration'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HealthOn | Your Complete Digital Healthcare Companion',
  description: 'Manage your health journey with HealthOn. Book doctors, track vitals, schedule lab tests, and access prescriptions - all in one seamless app.',
  keywords: [
    'healthcare app', 'digital health', 'telemedicine', 'online doctor appointment',
    'health tracking', 'vitals monitoring', 'lab tests online', 'medical records',
    'prescription management', 'doctor booking', 'health assessment', 'wellness app',
    'patient portal', 'healthcare platform', 'medical app', 'health monitoring'
  ],
  authors: [{ name: 'HealthOn Team' }],
  creator: 'HealthOn',
  publisher: 'HealthOn',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://healthon.app',
    siteName: 'HealthOn',
    title: 'HealthOn | Your Complete Digital Healthcare Companion',
    description: 'Manage your health journey with HealthOn. Book doctors, track vitals, schedule lab tests, and access prescriptions.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'HealthOn - Digital Healthcare Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HealthOn | Your Complete Digital Healthcare Companion',
    description: 'Manage your health journey with HealthOn. Book doctors, track vitals, schedule lab tests, and access prescriptions.',
    images: ['/og-image.png'],
    creator: '@healthon',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'HealthOn',
    startupImage: '/logo.png'
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
    other: [
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '192x192',
        url: '/icon-192x192.png',
      },
    ],
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: 'https://healthon.app',
  },
}

export function generateViewport() {
  return {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
    themeColor: '#ffffff'
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 antialiased`}>
        <SWRegistration />
        <DisableInspect />
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  )
}

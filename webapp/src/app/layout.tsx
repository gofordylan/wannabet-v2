import type { Metadata } from 'next'
import { Quicksand } from 'next/font/google'

import { BottomNav } from '@/components/bottom-nav'
import { ThemeProvider } from '@/components/theme-provider'
import { WagmiProvider } from '@/components/wagmi-provider'

import './globals.css'

const quicksand = Quicksand({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://app.heywannabet.com'),
  title: 'WannaBet - Peer-to-Peer Betting on Base',
  description:
    'Create and accept trustless USDC bets with friends, settled on Base.',
  icons: {
    icon: '/img/logo-icon.png',
    apple: '/img/logo-icon.png',
  },
  openGraph: {
    title: 'WannaBet - Peer-to-Peer Betting on Base',
    description:
      'Create and accept trustless USDC bets with friends, settled on Base.',
    url: 'https://app.heywannabet.com',
    images: ['/img/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WannaBet - Peer-to-Peer Betting on Base',
    description:
      'Create and accept trustless USDC bets with friends, settled on Base.',
    images: ['/img/og.png'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${quicksand.className} antialiased`}>
        <ThemeProvider defaultTheme="light" storageKey="wannabet-theme">
          <WagmiProvider>
            {children}
            <BottomNav />
          </WagmiProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

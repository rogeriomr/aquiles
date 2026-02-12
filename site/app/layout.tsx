import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Aquiles — Bitcoin On-Chain Intelligence',
  description: 'Your Achilles\' Heel, Solved. Bitcoin on-chain intelligence tells you when to buy and when to sell. Every cycle. No emotions.',
  keywords: ['bitcoin', 'on-chain', 'trading', 'MVRV', 'cycle', 'accumulate', 'distribute'],
  openGraph: {
    title: 'Aquiles — Bitcoin On-Chain Intelligence',
    description: 'Proven across every Bitcoin cycle. 14 indicators, 4 cycles, 11+ years of data.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased bg-slate-950 text-slate-200 min-h-screen">
        {children}
      </body>
    </html>
  )
}

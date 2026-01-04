import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata = {
  title: '605b.ai — Credit Repair, Legally',
  description: 'AI-powered credit repair with statute-driven workflows.',
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}

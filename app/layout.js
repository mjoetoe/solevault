import './globals.css'

export const metadata = {
  title: 'SoleVault — Sneaker Portfolio',
  description: 'Track your sneaker collection with live market prices',
}

export default function RootLayout({ children }) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  )
}

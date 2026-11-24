import type { Metadata } from 'next'
import React from 'react'

import '@/styles/global.css'

export const metadata: Metadata = {
  title: 'ARC display',
  robots: { index: false, follow: false },
}

export default function DisplayLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-CA" data-theme="light">
      <body>{children}</body>
    </html>
  )
}

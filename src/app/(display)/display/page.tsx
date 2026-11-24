import { connection } from 'next/server'

import { SlideFrame } from '@/display/SlideFrame'

// Build plan step 0: a static "At a glance." frame. Content and the slide loop come in step 1.
export default async function DisplayPage() {
  // Render per request so the footer time is current.
  await connection()

  return (
    <SlideFrame
      title="At a glance."
      slideIndex={0}
      slideCount={5}
      nextTitle="Active grants"
      now={new Date()}
    />
  )
}

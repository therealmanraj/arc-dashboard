import Image from 'next/image'
import React from 'react'

import arcLogo from '../../design/logos/arc-logo.svg'
import { formatDisplayDateTime } from '@/lib/format'
import styles from './SlideFrame.module.css'

type SlideFrameProps = {
  /** Slide title, sentence case with a period, e.g. "At a glance." */
  title: string
  /** Zero-based position of this slide in the loop. */
  slideIndex: number
  slideCount: number
  /** Title of the slide that follows, shown in the footer. */
  nextTitle: string
  /** Time shown in the footer. */
  now: Date
  /** Share of the slide's time elapsed, 0 to 1. */
  progress?: number
  children?: React.ReactNode
}

/** The frame every TV slide shares: colour stripe, header, progress bar and footer. */
export function SlideFrame({
  title,
  slideIndex,
  slideCount,
  nextTitle,
  now,
  progress = 0,
  children,
}: SlideFrameProps) {
  const progressPercent = Math.min(Math.max(progress, 0), 1) * 100

  return (
    <div className={styles.frame}>
      <div className={styles.stripe} aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className={styles.body}>
        <header className="arc-slide-header">
          <Image
            className="arc-slide-header__logo"
            src={arcLogo}
            alt="ARC, Applied Research Centre at Langara College"
            priority
          />
          <div className="arc-slide-header__right">
            <h1 className="arc-slide-header__title">{title}</h1>
            <div className="arc-pager" aria-hidden="true">
              {Array.from({ length: slideCount }, (_, i) => (
                <span key={i} className={i === slideIndex ? 'is-current' : undefined} />
              ))}
            </div>
          </div>
        </header>

        <div className={styles.content}>{children}</div>
      </div>

      <div className="arc-progress" aria-hidden="true">
        <span style={{ width: `${progressPercent}%` }} />
      </div>
      <footer className={`tv-label ${styles.footer}`}>
        <div>{formatDisplayDateTime(now)}</div>
        <div>Next: {nextTitle}</div>
      </footer>
    </div>
  )
}

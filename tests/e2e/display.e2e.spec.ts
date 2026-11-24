import { expect, test } from '@playwright/test'

test.use({ viewport: { width: 1920, height: 1080 } })

test('display shows the "At a glance." slide frame', async ({ page }) => {
  await page.goto('/display')

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('At a glance.')
  await expect(
    page.getByRole('img', { name: 'ARC, Applied Research Centre at Langara College' }),
  ).toBeVisible()
  await expect(page.locator('.arc-pager span')).toHaveCount(5)
  await expect(page.locator('.arc-pager span.is-current')).toHaveCount(1)
  await expect(page.locator('footer')).toContainText('Next: Active grants')

  // The frame fills the TV exactly: no scrolling at 1920x1080.
  const size = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
  }))
  expect(size).toEqual({ width: 1920, height: 1080 })
})

import { expect, test } from '@playwright/test'

async function useDockerBackend(page: import('@playwright/test').Page) {
  await page.route('http://localhost:3000/**', async route => {
    const response = await route.fetch({ url: route.request().url().replace('http://localhost:3000', 'http://backend:3000') })
    await route.fulfill({ response })
  })
}

test('public user can browse published courses', async ({ page }) => {
  await useDockerBackend(page)
  await page.goto('/courses')
  await expect(page.getByRole('heading', { name: /Khóa học/i }).first()).toBeVisible()
  await expect(page.getByText('ExpressJS REST API từ cơ bản')).toBeVisible()
})

test('admin can sign in and open management areas', async ({ page }) => {
  await useDockerBackend(page)
  await page.goto('/login')
  await page.getByLabel('Email').fill('admin@lms.test')
  await page.getByLabel('Mật khẩu').fill('Password123')
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await expect(page).toHaveURL(/\/admin$/)
  await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible()
  await page.goto('/admin/users')
  await expect(page.getByText('blocked@lms.test')).toBeVisible()
  await page.goto('/admin/courses')
  await expect(page.getByText('ExpressJS REST API từ cơ bản')).toBeVisible()
  await page.goto('/admin/reviews')
  await expect(page.getByRole('heading', { name: 'Kiểm duyệt đánh giá' })).toBeVisible()
  await page.goto('/admin/comments')
  await expect(page.getByRole('heading', { name: 'Kiểm duyệt bình luận' })).toBeVisible()
})

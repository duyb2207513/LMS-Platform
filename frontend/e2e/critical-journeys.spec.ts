import { expect, test, type Page } from '@playwright/test'

async function useDockerBackend(page: Page) {
  await page.route('http://localhost:3000/**', async route => {
    const response = await route.fetch({
      url: route.request().url().replace('http://localhost:3000', 'http://backend:3000'),
    })
    await route.fulfill({ response })
  })
}

async function login(page: Page, email: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Mật khẩu').fill('Password123')
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
}

test.beforeEach(async ({ page }) => {
  await useDockerBackend(page)
})

test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'wait' })
})

test('người dùng public xem được danh sách và chi tiết khóa học', async ({ page }) => {
  await page.goto('/courses')
  await expect(page.getByRole('heading', { name: /Khóa học/i }).first()).toBeVisible()
  await expect(page.getByText('PostgreSQL và thiết kế Database').first()).toBeVisible()
  await page.goto('/courses/postgresql-thiet-ke-database')
  await expect(page.getByRole('heading', { name: 'PostgreSQL và thiết kế Database' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Đăng nhập để mua khóa học' })).toBeVisible()
})

test('học viên thấy khóa đã đăng ký, nội dung học, đơn hàng và chứng chỉ', async ({ page }) => {
  await login(page, 'student@lms.test')
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByText('Khóa học đã đăng ký')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Tiếp tục học' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Xem tất cả →' })).toBeVisible()

  await page.goto('/my-courses')
  await expect(page.getByRole('heading', { name: 'Khóa học của tôi' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Bắt đầu học|Tiếp tục học/ }).first()).toBeVisible()

  await page.goto('/courses/postgresql-thiet-ke-database')
  await expect(page.getByText('Đã đăng ký')).toBeVisible()
  await page.getByRole('button', { name: /Bắt đầu học|Tiếp tục học/ }).click()
  await expect(page).toHaveURL(/\/learn\//)
  await expect(page.getByRole('heading', { name: 'Nền tảng PostgreSQL' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Hoàn thành bài học|Đánh dấu hoàn thành/ })).toBeVisible()

  await page.goto('/orders')
  await expect(page.getByRole('heading', { name: 'Lịch sử đơn hàng' })).toBeVisible()
  await expect(page.getByText('ORD-DEMO-PAID-001')).toBeVisible()

  await page.goto('/certificates')
  await expect(page.getByRole('heading', { name: 'Chứng chỉ của tôi' })).toBeVisible()
  const demoCertificate = page.getByRole('article').filter({ hasText: 'LMS-2026-DEMO0001' })
  await expect(demoCertificate).toBeVisible()
  await demoCertificate.getByRole('link', { name: /Xác minh công khai/ }).click()
  await expect(page.getByText('Chứng chỉ hợp lệ')).toBeVisible()
})

test('instructor mở được course builder', async ({ page }) => {
  await login(page, 'instructor@lms.test')
  await expect(page).toHaveURL(/\/instructor\/courses$/)
  await page.getByRole('button', { name: 'Nội dung' }).first().click()
  await expect(page.getByRole('heading', { name: 'Xây dựng nội dung khóa học' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Thêm chương/ })).toBeVisible()
})

test('học viên xem bài tập, điểm và nhận xét Sprint 7', async ({ page }) => {
  await login(page, 'student@lms.test')
  await expect(page).toHaveURL(/\/dashboard$/)
  await page.goto('/my-courses')
  const course = page.getByRole('article').filter({ hasText: 'React Native cho người mới' })
  await course.getByRole('link', { name: 'Bài tập & điểm' }).click()
  await expect(page.getByRole('heading', { name: 'Kết quả học tập' })).toBeVisible()
  await expect(page.getByText('Xây dựng màn hình đăng nhập React Native')).toBeVisible()
  await page.getByText('Xây dựng màn hình đăng nhập React Native').click()
  await expect(page.getByRole('heading', { name: 'Xây dựng màn hình đăng nhập React Native' })).toBeVisible()
  await expect(page.getByText('Nhận xét của giảng viên')).toBeVisible()
})

test('instructor mở danh sách bài nộp và form chấm điểm Sprint 7', async ({ page }) => {
  await login(page, 'instructor@lms.test')
  await expect(page).toHaveURL(/\/instructor\/courses$/)
  const course = page
    .getByText('React Native cho người mới', { exact: true })
    .locator('xpath=ancestor::div[contains(@class,"overflow-hidden")][1]')
  await course.getByRole('link', { name: 'Bài tập' }).click()
  await expect(page.getByRole('heading', { name: 'Bài tập và chấm điểm' })).toBeVisible()
  const assignment = page.getByRole('article').filter({ hasText: 'Xây dựng màn hình đăng nhập React Native' })
  await assignment.getByRole('link', { name: 'Xem & chấm bài' }).click()
  await expect(page.getByRole('heading', { name: 'Xây dựng màn hình đăng nhập React Native' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cập nhật điểm' })).toBeVisible()
})

test('admin mở được dashboard và các khu vực quản trị', async ({ page }) => {
  await login(page, 'admin@lms.test')
  await expect(page).toHaveURL(/\/admin$/)
  await expect(page.getByRole('heading', { name: 'Tổng quan hệ thống' })).toBeVisible()
  for (const path of ['users', 'courses', 'reviews', 'comments']) {
    await page.goto(`/admin/${path}`)
    await expect(page.locator('h1')).toBeVisible()
  }
})

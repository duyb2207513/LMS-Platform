import type { Course } from '@/types'

function formatVnd(amount?: number | null): string {
  if (!amount || amount === 0) return 'Miễn phí'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

function formatLevel(level?: string): string {
  if (level === 'BEGINNER') return 'Cơ bản'
  if (level === 'INTERMEDIATE') return 'Trung cấp'
  if (level === 'ADVANCED') return 'Nâng cao'
  return 'Tất cả trình độ'
}

export function generateAiBotResponse(userText: string, courses: Course[] = []): string {
  const q = userText.toLowerCase().trim()

  // 1. GREETING & INTRO
  if (
    q.includes('chào') ||
    q.includes('hi') ||
    q.includes('hello') ||
    q.includes('bạn là ai') ||
    q.includes('giúp') ||
    q.includes('tro ly')
  ) {
    return `Xin chào, tôi là Trợ lý Học tập AI của LMS Platform.

Tôi có thể hỗ trợ bạn các vấn đề sau:
1. Khám phá và gợi ý khóa học theo chủ đề hoặc trình độ.
2. Hướng dẫn quy chế hoàn tiền trong vòng 24 giờ.
3. Hướng dẫn làm bài tập Quiz và nộp Assignment có giảng viên chấm.
4. Điều kiện nhận và xác thực chứng chỉ hoàn thành khóa học.
5. Giải đáp các thắc mắc kiến thức chuyên môn trong bài học.

Bạn có câu hỏi nào cần được giải đáp không?`
  }

  // 2. LIST ALL COURSES / HOT COURSES
  if (
    q.includes('danh sách khóa') ||
    q.includes('các khóa') ||
    q.includes('có những khóa') ||
    q.includes('xem khóa') ||
    q.includes('gợi ý khóa') ||
    q.includes('khóa học nổi bật') ||
    q.includes('top khóa') ||
    q === 'khóa học'
  ) {
    if (courses.length > 0) {
      const top = courses.slice(0, 5)
      const lines = top.map(
        (c, i) =>
          `${i + 1}. **${c.title}**\n   - Danh mục: ${c.category?.name || 'Khóa học LMS'}\n   - Trình độ: ${formatLevel(c.level)}\n   - Học phí: ${formatVnd(c.price)}`,
      )
      return `Dưới đây là danh sách các khóa học hiện có trên hệ thống:\n\n${lines.join('\n\n')}\n\nBạn có thể tìm kiếm theo chủ đề cụ thể như: "lập trình Web", "Python", "DevOps", "Database" hoặc "miễn phí".`
    }
  }

  // 3. FREE COURSES
  if (q.includes('miễn phí') || q.includes('free') || q.includes('0đ') || q.includes('không tốn tiền')) {
    const freeCourses = courses.filter((c) => !c.price || Number(c.price) === 0)
    if (freeCourses.length > 0) {
      const lines = freeCourses.slice(0, 5).map(
        (c, i) =>
          `${i + 1}. **${c.title}**\n   - Danh mục: ${c.category?.name || 'Tổng hợp'}\n   - Trình độ: ${formatLevel(c.level)}\n   - Học phí: Miễn phí`,
      )
      return `Danh sách các khóa học miễn phí hiện có trên hệ thống:\n\n${lines.join('\n\n')}\n\nBạn có thể nhấn vào trang Khám phá khóa học để đăng ký và bắt đầu học ngay.`
    }
    return `Hiện tại hệ thống đang áp dụng nhiều chương trình ưu đãi học phí. Bạn có thể sử dụng mã Coupon ở bước thanh toán để nhận giảm giá.`
  }

  // 4. PRICING & PAYMENT & COUPONS
  if (
    q.includes('thanh toán') ||
    q.includes('học phí') ||
    q.includes('mua khóa') ||
    q.includes('vnpay') ||
    q.includes('thẻ') ||
    q.includes('mã giảm giá') ||
    q.includes('coupon') ||
    q.includes('voucher') ||
    q.includes('khuyến mãi')
  ) {
    return `Hướng dẫn Thanh toán và áp dụng Mã giảm giá (Coupon):

1. Mua khóa học:
   - Truy cập trang chi tiết khóa học -> Nhấn "Đăng ký ngay" hoặc "Mua ngay".
   - Tại trang thanh toán, chọn cổng VNPay hoặc phương thức Mock Payment thử nghiệm.

2. Áp dụng Coupon:
   - Nhập mã ưu đãi vào ô "Mã giảm giá" tại bước thanh toán và nhấn "Áp dụng".
   - Hệ thống sẽ tự động trừ trực tiếp vào tổng tiền đơn hàng.

3. Xem lại hóa đơn:
   - Toàn bộ giao dịch được lưu tại mục "Lịch sử đơn hàng" trong menu tài khoản.`
  }

  // 5. REFUND POLICY (24H RULE)
  if (
    q.includes('hoàn tiền') ||
    q.includes('refund') ||
    q.includes('trả lại tiền') ||
    q.includes('trả khóa học') ||
    q.includes('lấy lại tiền')
  ) {
    return `Chính sách Hoàn tiền (24-Hour Refund Policy):

1. Điều kiện hoàn tiền:
   - Yêu cầu hoàn tiền phải được gửi trong vòng 24 giờ kể từ thời điểm thanh toán thành công.
   - Tiến độ học của khóa học chưa vượt quá 20% tổng số bài giảng.

2. Quy trình thực hiện:
   - Bước 1: Vào menu tài khoản -> chọn "Lịch sử đơn hàng".
   - Bước 2: Chọn đơn hàng cần hoàn -> nhấn "Yêu cầu hoàn tiền".
   - Bước 3: Điền lý do và gửi yêu cầu.

3. Thời gian xử lý:
   - Quản trị viên sẽ xét duyệt trong vòng 24 đến 48 giờ. Sau khi được duyệt, tiền sẽ được hoàn về phương thức thanh toán ban đầu.`
  }

  // 6. ASSIGNMENTS, QUIZZES & GRADES
  if (
    q.includes('bài tập') ||
    q.includes('assignment') ||
    q.includes('nộp bài') ||
    q.includes('điểm') ||
    q.includes('grade') ||
    q.includes('quiz') ||
    q.includes('trắc nghiệm') ||
    q.includes('qua môn')
  ) {
    return `Quy chế Bài tập, Quiz và Điểm tổng kết:

1. Bài tập trắc nghiệm (Quiz):
   - Nằm trực tiếp trong bài học, có chấm điểm tự động ngay khi hoàn thành.
   - Cần đạt từ điểm chuẩn (Passing Score) trở lên để tính hoàn thành.

2. Bài tập tự luận (Assignment):
   - Học viên có thể nộp nội dung văn bản hoặc đính kèm tối đa 5 file (PDF, DOCX, ZIP...).
   - Giảng viên sẽ chấm điểm và để lại lời nhận xét trực tiếp.
   - Học viên có thể chỉnh sửa bài nộp khi bài đang ở trạng thái chờ chấm điểm.

3. Điểm tổng kết môn học:
   - Được tính theo tỷ trọng cấu hình của từng khóa học (ví dụ: 60% Assignment + 40% Quiz).`
  }

  // 7. CERTIFICATES & VERIFICATION
  if (
    q.includes('chứng chỉ') ||
    q.includes('certificate') ||
    q.includes('bằng') ||
    q.includes('xác thực') ||
    q.includes('mã xác thực')
  ) {
    return `Quy định Cấp và Xác thực Chứng chỉ LMS:

1. Điều kiện nhận chứng chỉ:
   - Hoàn thành 100% các bài học trong khóa học.
   - Điểm tổng kết đạt từ điểm chuẩn (Passing Score) trở lên.

2. Nhận chứng chỉ:
   - Sau khi đủ điều kiện, nút cấp chứng chỉ sẽ xuất hiện tại trang "Khóa học của tôi" hoặc trang "Chứng chỉ".

3. Xác thực trực tuyến:
   - Mỗi chứng chỉ được cấp một mã xác thực (Certificate Code) duy nhất.
   - Bất kỳ ai cũng có thể truy cập trang /verify-certificate nhập mã để tra cứu tính hợp lệ.`
  }

  // 8. SPECIFIC TOPIC / KEYWORD SEARCH MATCH
  if (q.length >= 2) {
    const matched = courses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.category?.name && c.category.name.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q)),
    )

    if (matched.length > 0) {
      const lines = matched.slice(0, 4).map(
        (c) =>
          `- **${c.title}** (${c.category?.name || 'Khóa học LMS'})\n  Trình độ: ${formatLevel(c.level)} | Học phí: ${formatVnd(c.price)}\n  ${c.description ? c.description.slice(0, 100) + '...' : ''}`,
      )
      return `Tìm thấy ${matched.length} khóa học phù hợp với từ khóa "${userText}":\n\n${lines.join('\n\n')}\n\nBạn có thể vào trang Khám phá khóa học để xem thông tin chi tiết.`
    }
  }

  // 9. SMART FALLBACK
  return `Tôi chưa tìm thấy kết quả chính xác cho câu hỏi của bạn.

Bạn có thể tham khảo một số nội dung sau:
- Tìm kiếm khóa học theo chủ đề (Lập trình Web, Python, AI, DevOps, Cơ sở dữ liệu).
- Quy định hoàn tiền trong vòng 24 giờ.
- Hướng dẫn nộp bài tập Assignment và làm Quiz.
- Điều kiện nhận và xác thực chứng chỉ hoàn thành khóa học.`
}

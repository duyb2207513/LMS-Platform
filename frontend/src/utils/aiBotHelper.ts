import type { Course } from '@/types'

function formatVnd(amount?: number | null): string {
  if (!amount || amount === 0) return 'Miễn phí 🎁'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

function formatLevel(level?: string): string {
  if (level === 'BEGINNER') return '🌱 Cơ bản (Cho người mới)'
  if (level === 'INTERMEDIATE') return '🌿 Trung cấp'
  if (level === 'ADVANCED') return '🌳 Nâng cao'
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
    return `👋 **Xin chào! Tôi là Trợ lý AI LMS Platform 🤖**

Tôi có thể hỗ trợ bạn tư vấn thông tin 24/7 về hệ thống:
1. 📚 **Khám phá khóa học**: Tìm kiếm theo chủ đề, cấp độ, miễn phí/có phí
2. 💳 **Thanh toán & Mã giảm giá**: Hướng dẫn mua khóa học, nhập Coupon ưu đãi
3. 🔄 **Chính sách hoàn tiền 24H**: Điều kiện & quy trình gửi yêu cầu hoàn tiền
4. 📝 **Học tập & Bài tập**: Hướng dẫn làm Quiz, nộp Assignment, xem điểm tổng kết
5. 🎓 **Chứng chỉ hoàn thành**: Điều kiện nhận & cách xác thực chứng chỉ online
6. 👨‍🏫 **Góc Giảng viên**: Hướng dẫn tạo khóa học, chấm điểm & rút doanh thu

Bạn cần hỗ trợ về chủ đề nào? Hãy thử gõ *"danh sách khóa học"*, *"hoàn tiền"*, *"mã giảm giá"* hoặc từ khóa bạn quan tâm nhé!`
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
          `${i + 1}. 📖 **${c.title}**\n   • Danh mục: ${c.category?.name || 'Khóa học LMS'}\n   • Trình độ: ${formatLevel(c.level)}\n   • Học phí: **${formatVnd(c.price)}**`,
      )
      return `📚 **Danh sách các khóa học nổi bật hiện có trên LMS Platform:**\n\n${lines.join('\n\n')}\n\n💡 *Mẹo: Bạn có thể tìm khóa học theo chủ đề bằng cách gõ: "lập trình", "python", "web", "thiết kế", "miễn phí"...*`
    }
  }

  // 3. FREE COURSES
  if (q.includes('miễn phí') || q.includes('free') || q.includes('0đ') || q.includes('không tốn tiền')) {
    const freeCourses = courses.filter((c) => !c.price || Number(c.price) === 0)
    if (freeCourses.length > 0) {
      const lines = freeCourses.slice(0, 5).map(
        (c, i) =>
          `${i + 1}. 🎁 **${c.title}**\n   • Danh mục: ${c.category?.name || 'Tổng hợp'}\n   • Trình độ: ${formatLevel(c.level)}`,
      )
      return `🎉 **Các khóa học MIỄN PHÍ hiện có dành cho bạn:**\n\n${lines.join('\n\n')}\n\n👉 Bạn có thể bấm Đăng ký ngay tại trang **Khám phá khóa học** để bắt đầu học hoàn toàn miễn phí!`
    }
    return `🎁 Hiện tại hệ thống đang áp dụng nhiều chương trình ưu đãi học phí hấp dẫn. Bạn có thể sử dụng mã **Coupon** ở bước thanh toán để nhận giảm giá cực tốt!`
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
    return `💳 **Hướng dẫn Thanh toán & Nhập Mã giảm giá (Coupon):**

1. 🛍️ **Cách mua khóa học**:
   • Vào chi tiết khóa học -> Bấm nút **"Đăng ký ngay"** hoặc **"Mua ngay"**.
   • Tại trang Thanh toán, bạn có thể chọn phương thức thanh toán cổng **VNPay** hoặc **Thử nghiệm Mock Payment**.

2. 🏷️ **Sử dụng Mã giảm giá (Coupon)**:
   • Tại ô **"Mã giảm giá"** ở trang thanh toán, nhập mã coupon của bạn -> Bấm **"Áp dụng"**.
   • Hệ thống sẽ tự động giảm trừ trực tiếp vào tổng tiền đơn hàng.

3. 🧾 **Hóa đơn & Lịch sử đơn hàng**:
   • Xem lại toàn bộ đơn hàng đã mua tại trang **Lịch sử đơn hàng** trong Menu tài khoản.`
  }

  // 5. REFUND POLICY (24H RULE)
  if (
    q.includes('hoàn tiền') ||
    q.includes('refund') ||
    q.includes('trả lại tiền') ||
    q.includes('trả khóa học') ||
    q.includes('lấy lại tiền')
  ) {
    return `🔄 **Chính sách & Quy trình Hoàn tiền (24 Hours Refund):**

1. ⏳ **Điều kiện hoàn tiền**:
   • Yêu cầu hoàn tiền phải được gửi trong vòng **24 giờ (1 ngày)** kể từ thời điểm thanh toán thành công.
   • Sau 24 giờ, hệ thống sẽ tự động đóng tính năng hoàn tiền cho đơn hàng đó.

2. 📝 **Các bước gửi yêu cầu**:
   • **Bước 1**: Vào trang **Lịch sử đơn hàng** (Order History).
   • **Bước 2**: Tìm đơn hàng cần hoàn tiền -> Bấm **"Yêu cầu hoàn tiền"**.
   • **Bước 3**: Nhập lý do gửi hoàn tiền -> Bấm **Gửi yêu cầu**.

3. ⏱️ **Xử lý & Nhận lại tiền**:
   • Quản trị viên (Admin) sẽ xét duyệt trong vòng 24h-48h. Khi được duyệt, tiền sẽ được hoàn trả lại về phương thức thanh toán ban đầu.`
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
    return `📝 **Hướng dẫn Bài tập, Quiz & Điểm tổng kết:**

1. ✍️ **Bài tập trắc nghiệm (Quiz)**:
   • Nằm trực tiếp trong danh sách bài học. Có quy định thời gian & số lần làm tối đa.
   • Bạn cần đạt từ điểm đỗ (**Passing Score**) trở lên để tính hoàn thành.

2. 📤 **Bài tập tự luận (Assignment)**:
   • Bạn có thể soạn nội dung chữ hoặc tải file đính kèm (PDF, DOCX, ZIP...).
   • Giảng viên sẽ chấm điểm và để lại lời nhận xét trực tiếp cho bài nộp của bạn.

3. 📊 **Điểm tổng kết khóa học**:
   • Điểm trung bình môn được tính dựa trên tỷ trọng giữa **Bài tập Assignment (vd: 60%)** và **Quiz (vd: 40%)** do Giảng viên thiết lập.
   • Xem chi tiết bảng điểm tại trang học bài ở phần **"Bài tập & Điểm số"**.`
  }

  // 7. CERTIFICATES & VERIFICATION
  if (
    q.includes('chứng chỉ') ||
    q.includes('certificate') ||
    q.includes('bằng') ||
    q.includes('xác thực') ||
    q.includes('mã xác thực')
  ) {
    return `🎓 **Chính sách & Xác thực Chứng chỉ LMS:**

1. 📜 **Điều kiện nhận chứng chỉ**:
   • Hoàn thành **100%** bài học trong khóa học.
   • Điểm tổng kết đạt từ mốc điểm đạt (**Passing Score**) của khóa học trở lên.

2. 📥 **Tải chứng chỉ PDF**:
   • Sau khi đủ điều kiện, nút **"Cấp chứng chỉ"** hoặc **"Tải chứng chỉ"** sẽ xuất hiện tại trang **Khóa học của tôi**.

3. 🔍 **Tra cứu & Xác thực công khai**:
   • Mọi chứng chỉ LMS đều có một **Mã xác thực duy nhất (Verification Code)**.
   • Bất kỳ ai (nhà tuyển dụng, người học) cũng có thể vào trang **Xác thực chứng chỉ** (\`/verify-certificate\`) nhập mã để kiểm tra tính hợp lệ trực tuyến.`
  }

  // 8. REVIEWS & COMMENTS
  if (
    q.includes('đánh giá') ||
    q.includes('review') ||
    q.includes('chấm sao') ||
    q.includes('bình luận') ||
    q.includes('hỏi đáp') ||
    q.includes('thảo luận')
  ) {
    return `💬 **Đánh giá & Thảo luận:**

1. ⭐ **Đánh giá khóa học**:
   • Sau khi tham gia học, bạn có thể chấm điểm 1-5 sao và để lại nhận xét tại trang chi tiết khóa học.

2. ❓ **Thảo luận ở từng bài học**:
   • Ngay dưới video/tài liệu bài học có khu vực Bình luận. Bạn có thể gửi câu hỏi để Giảng viên và các học viên khác cùng trao đổi.`
  }

  // 9. ACCOUNT & PROFILE
  if (
    q.includes('tài khoản') ||
    q.includes('mật khẩu') ||
    q.includes('đổi mật khẩu') ||
    q.includes('quên mật khẩu') ||
    q.includes('avatar') ||
    q.includes('ảnh đại diện')
  ) {
    return `👤 **Quản lý Tài khoản & Bảo mật:**

1. ✏️ **Cập nhật thông tin cá nhân**:
   • Vào **Hồ sơ cá nhân** (Profile) để đổi Họ tên, Số điện thoại và Ảnh đại diện Avatar.

2. 🔑 **Đổi & Khôi phục mật khẩu**:
   • Đổi mật khẩu trong mục cài đặt tài khoản.
   • Nếu quên mật khẩu, bấm **"Quên mật khẩu?"** ở màn hình Đăng nhập để nhận link khôi phục qua Email.`
  }

  // 10. INSTRUCTOR FEATURES
  if (
    q.includes('giảng viên') ||
    q.includes('tạo khóa học') ||
    q.includes('rút tiền') ||
    q.includes('payout') ||
    q.includes('doanh thu') ||
    q.includes('chấm điểm')
  ) {
    return `👨‍🏫 **Tính năng dành cho Giảng viên (Instructor):**

1. 🛠️ **Công cụ Soạn khóa học (Course Builder)**:
   • Tạo Chương (Section) và Bài học (Video MP4/WebM, Tài liệu PDF/DOCX, Bài viết Text).
   • Tạo Bài tập Assignment & Đề thi Quiz trắc nghiệm.

2. 📈 **Doanh thu & Rút tiền**:
   • Theo dõi tỷ lệ chia sẻ doanh thu tự động từ mỗi đơn hàng.
   • Gửi yêu cầu Rút tiền (Payout) về tài khoản ngân hàng khi số dư khả dụng đạt định mức.

3. 📑 **Chấm bài & Phản hồi**:
   • Quản lý danh sách bài nộp của học viên, nhập điểm và ghi lời nhận xét chi tiết.`
  }

  // 11. SPECIFIC TOPIC / KEYWORD SEARCH MATCH
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
          `📖 **${c.title}**\n   • Danh mục: ${c.category?.name || 'LMS Course'}\n   • Cấp độ: ${formatLevel(c.level)}\n   • Học phí: **${formatVnd(c.price)}**\n   • Mô tả: ${c.description ? c.description.slice(0, 95) + '...' : 'Khóa học chất lượng cao trên hệ thống.'}`,
      )
      return `🔍 **Tìm thấy ${matched.length} khóa học phù hợp với từ khóa "${userText}":**\n\n${lines.join('\n\n')}\n\n👉 Bạn có thể vào trang **Khám phá khóa học** để xem thông tin chi tiết và đăng ký!`
    }
  }

  // 12. SMART FALLBACK
  return `🤖 **Trợ lý AI LMS chưa tìm thấy kết quả chính xác cho câu hỏi của bạn.**

Bạn có thể thử tra cứu theo các chủ đề phổ biến sau:
• 📚 *"Các khóa học lập trình Web / Python / AI"*
• 🎁 *"Khóa học miễn phí"*
• 💳 *"Hướng dẫn thanh toán & nhập Coupon"*
• 🔄 *"Quy định hoàn tiền 24 giờ"*
• 📝 *"Cách nộp bài tập & xem điểm số"*
• 🎓 *"Điều kiện cấp & xác thực chứng chỉ"*

Bạn muốn tìm hiểu thêm thông tin nào?`
}

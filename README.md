# Gửi lời yêu thương

Website riêng tư cho hai người: trả lời câu hỏi theo thứ tự, đọc nhật ký khi cả hai đã trả lời, và lưu kỷ niệm chung. Express + EJS + PostgreSQL (Neon).

## Chạy với Neon

1. Tạo một project PostgreSQL trên [Neon](https://console.neon.tech/) và lấy connection string (nên dùng pooled connection string).
2. Sao chép `.env.example` thành `.env` và điền `DATABASE_URL`, `SESSION_SECRET` (chuỗi ngẫu nhiên từ 32 ký tự), `ADMIN_USERNAME`, `ADMIN_PASSWORD` (từ 12 ký tự). Không đưa `.env` lên Git hoặc chia sẻ connection string.
3. Chạy `npm install`, sau đó `npm run setup` để tạo schema và tài khoản admin ban đầu. Setup có thể chạy lại; nó không đổi mật khẩu tài khoản admin đã tồn tại.
4. Chạy `npm start` và mở `http://localhost:3000`. Admin thêm câu hỏi; người đầu tiên chọn **Tạo phòng mới** khi đăng ký và đặt mã, sau đó gửi mã cho người thứ hai chọn **Tham gia phòng**. Mỗi phòng chỉ có tối đa hai tài khoản.

Trang chủ hiển thị câu hỏi ở trên và hai ô tương ứng với hai thành viên ở dưới. Nội dung câu trả lời được giữ kín cho đến khi cả hai gửi; lúc đó cặp câu trả lời hiển thị cho cả hai trên trang chủ và trong nhật ký. Câu hỏi được xáo trộn ổn định theo từng phòng: tải lại trang không đổi câu hỏi đang chờ; admin chỉ nhập và chỉnh sửa nội dung, không cần chọn thứ tự.

Hai tab trong cùng một trình duyệt dùng chung phiên đăng nhập. Để thử hai tài khoản cùng lúc, hãy dùng hai trình duyệt khác nhau hoặc một cửa sổ ẩn danh.

Trước khi cả hai hoàn thành, bạn xem và sửa được câu trả lời của chính mình; sau đó nội dung được khóa. Mỗi câu trả lời đầu tiên nhận 100 xu cho ví chung của phòng, sửa không nhận thêm. Trong mục **Thú cưng**, hai bạn chọn một bé (chó, mèo, hamster hoặc sóc), mua quần áo bằng xu và cùng thay đồ cho bé.

Sau khi cập nhật phiên bản có thú cưng trên một database đã dùng trước đó, **chạy lại `npm run setup` một lần** để thêm các cột và bảng mới mà không xóa dữ liệu cũ. Các câu trả lời tạo trước khi có tính năng xu không được cộng xu hồi tố.

Trên hosting, đặt cùng các biến môi trường và `NODE_ENV=production`, bật HTTPS. Session được lưu trong PostgreSQL để không mất khi server khởi động lại. Có thể đổi `PORT` khi triển khai.

**Dữ liệu MySQL cũ không tự chuyển sang Neon.** `schema.sql` tạo các bảng mới; nếu đã có dữ liệu MySQL cần xuất và chuyển đổi ID/khóa ngoại trước khi sử dụng database mới. Xóa phòng sẽ xóa tài khoản, câu trả lời và kỷ niệm thuộc phòng; xóa câu hỏi sẽ xóa các câu trả lời của câu hỏi đó.

## Kiểm tra

`npm test` kiểm tra render các trang và escape dữ liệu người dùng. `npm audit` kiểm tra lỗ hổng dependency. Kiểm tra thao tác database thực tế cần một `DATABASE_URL` Neon hợp lệ.

# Gửi lời yêu thương

Website riêng tư cho hai người: cùng trả lời câu hỏi, đọc nhật ký khi cả hai đã trả lời, nuôi thú cưng và lưu kỷ niệm chung. Express + EJS + PostgreSQL (Neon).

## Chạy với Neon

1. Tạo một project PostgreSQL trên [Neon](https://console.neon.tech/) và lấy connection string (nên dùng pooled connection string).
2. Sao chép `.env.example` thành `.env` và điền `DATABASE_URL`, `SESSION_SECRET` (chuỗi ngẫu nhiên từ 32 ký tự), `ADMIN_USERNAME`, `ADMIN_PASSWORD` (từ 12 ký tự). Không đưa `.env` lên Git hoặc chia sẻ connection string.
3. Chạy `npm install`, sau đó `npm run setup` để tạo schema và tài khoản admin ban đầu. Setup có thể chạy lại; nó không đổi mật khẩu tài khoản admin đã tồn tại.
4. Chạy `npm start` và mở `http://localhost:3000`. Admin thêm câu hỏi; người đầu tiên chọn **Tạo phòng mới** khi đăng ký và đặt mã, sau đó gửi mã cho người thứ hai chọn **Tham gia phòng**. Mỗi phòng chỉ có tối đa hai tài khoản.

Trang chủ hiển thị câu hỏi ở trên và hai ô tương ứng với hai thành viên ở dưới. Nội dung câu trả lời được giữ kín cho đến khi cả hai gửi; lúc đó cặp câu trả lời hiển thị cho cả hai trên trang chủ và trong nhật ký. Câu hỏi được xáo trộn ổn định theo từng phòng: tải lại trang không đổi câu hỏi đang chờ; admin chỉ nhập và chỉnh sửa nội dung, không cần chọn thứ tự.

Hai tab trong cùng một trình duyệt dùng chung phiên đăng nhập. Để thử hai tài khoản cùng lúc, hãy dùng hai trình duyệt khác nhau hoặc một cửa sổ ẩn danh.

Nếu iPhone hiện "Phiên đăng nhập đã hết hạn", hãy mở lại `/login` trong Safari và thử lại; ứng dụng sẽ trả về form thay vì trang lỗi trắng. Nếu vẫn lặp lại, kiểm tra Safari có cho phép cookie và tránh mở website trong trình duyệt nhúng của ứng dụng khác. Sau khi cập nhật bản triển khai trên Render, kiểm tra `/install.html` hiển thị hướng dẫn cài đặt (không phải trang đăng nhập) để chắc chắn code mới đã được deploy.

Trước khi cả hai hoàn thành, bạn xem và sửa được câu trả lời của chính mình; sau đó nội dung được khóa. Mỗi câu trả lời đầu tiên nhận 100 xu cho ví chung của phòng, sửa không nhận thêm. Trong mục **Thú cưng**, hai bạn chọn một bé (chó, mèo, hamster hoặc sóc), mua quần áo bằng xu và cùng thay đồ cho bé.

Sau khi cập nhật phiên bản có thú cưng trên một database đã dùng trước đó, **chạy lại `npm run setup` một lần** để thêm các cột và bảng mới mà không xóa dữ liệu cũ. Các câu trả lời tạo trước khi có tính năng xu không được cộng xu hồi tố.

Trên hosting, đặt cùng các biến môi trường và `NODE_ENV=production`, bật HTTPS. Session được lưu trong PostgreSQL để không mất khi server khởi động lại. Có thể đổi `PORT` khi triển khai.

## Cài như ứng dụng (PWA)

Đưa website lên một tên miền công khai **HTTPS** trước khi cài trên điện thoại. `http://localhost:3000` chỉ dùng để thử PWA trên máy đang phát triển, không phải địa chỉ để người khác cài. Mở `https://ten-mien-cua-ban/install.html` trên điện thoại:

- iPhone: mở bằng **Safari**, nhấn **Chia sẻ** → **Thêm vào Màn hình chính** → **Thêm**.
- Android: mở bằng **Chrome**, chọn **Cài đặt ứng dụng** (hoặc menu ⋮ → **Thêm vào màn hình chính**).

PWA không cần App Store/Google Play; người dùng vẫn cần mạng để đăng nhập, trả lời câu hỏi, xem kỷ niệm và mua sắm. Service worker chỉ lưu tài nguyên công khai và trang báo mất mạng, **không lưu HTML chứa câu trả lời, tài khoản hoặc phiên đăng nhập**. `npm run icons` tạo lại icon PNG từ `public/icons/icon.svg` sau khi sửa biểu tượng. Khi cập nhật tài nguyên được lưu offline, tăng `CACHE_NAME` trong `public/sw.js` để thay cache cũ.

**Dữ liệu MySQL cũ không tự chuyển sang Neon.** `schema.sql` tạo các bảng mới; nếu đã có dữ liệu MySQL cần xuất và chuyển đổi ID/khóa ngoại trước khi sử dụng database mới. Xóa phòng sẽ xóa tài khoản, câu trả lời và kỷ niệm thuộc phòng; xóa câu hỏi sẽ xóa các câu trả lời của câu hỏi đó.

## Kiểm tra

`npm test` kiểm tra render các trang và escape dữ liệu người dùng. `npm audit` kiểm tra lỗ hổng dependency. Kiểm tra thao tác database thực tế cần một `DATABASE_URL` Neon hợp lệ.

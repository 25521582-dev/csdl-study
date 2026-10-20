# CSDL Studio

Web ôn tập local cho môn Cơ sở dữ liệu IT004.R11.CTTN. Bao phủ toàn bộ chủ đề đã đăng từ 07/09 đến tuần 19–25/10/2026: nhập môn, mô hình quan hệ, SQL cơ bản, alias/phép tập hợp, truy vấn con, JOIN, aggregation, NULL, cập nhật dữ liệu, đại số quan hệ, chỉ mục và giới thiệu toàn tác.

## Chạy

Yêu cầu Python 3. Sao chép repo và chạy:

```bash
git clone https://github.com/25521582-dev/csdl-study.git
cd csdl-study
./start.sh
```

Mở **http://localhost:8088**. Có thể đổi cổng bằng `./start.sh 8090`. Dừng bằng Ctrl+C trong terminal chạy server.

Ứng dụng dùng HTML/CSS/JavaScript thuần, không cần cài gói. Server chỉ lắng nghe trên loopback. Sau khi tải trang, dữ liệu và tương tác không phụ thuộc dịch vụ bên ngoài.

## Chức năng

- 144 câu hỏi tự biên soạn, 12 câu mỗi chủ đề, bốn lựa chọn và giải thích.
- Luyện tập: phản hồi ngay, đánh dấu câu hỏi, quay lại các câu và tiếp tục phiên đang dở.
- Đề luyện: chọn số câu, thời gian, đổi đáp án trước khi nộp; tự nộp khi hết giờ.
- Đề ngẫu nhiên phân bổ đều các chủ đề trong giới hạn số câu và ngân hàng hiện có.
- Kết quả: số đúng/sai/bỏ trống, phân tích từng chủ đề, xem lời giải và luyện lại câu chưa đúng.
- Danh sách câu cần ôn dựa trên lần trả lời gần nhất. Trả lời đúng sẽ đưa câu ra khỏi danh sách.
- Sổ tay có 12 bài giảng chi tiết (72 mục), 36 bài tự kiểm tra có lời giải và chế độ ôn nhanh.
- Bộ dữ liệu minh họa chung: Student/College/Apply, SQL khởi tạo, ví dụ được giải từng bước kèm bảng kết quả. Mục lục chương/mục, chuyển chương, sao chép mã và liên kết luyện trắc nghiệm.
- Lưu tiến độ, phiên đang dở, lịch sử 50 phiên gần nhất và đánh dấu bằng localStorage. Tiến độ riêng cho từng trình duyệt và origin (host/cổng).

Nguồn chủ đề: https://courses.uit.edu.vn/course/view.php?id=1334, các slide Stanford/Jennifer Widom được liên kết trong khóa học. Câu hỏi là nội dung luyện tập tự biên soạn, không phải ngân hàng đề thi chính thức. Mỗi chủ đề có đường dẫn nguồn trong `dist/data.js`.

## Cấu trúc

- `dist/data.js`: nội dung câu hỏi, chủ đề, ghi chú và nguồn.
- `dist/lectures.js`: bài giảng chi tiết, bộ dữ liệu chung, ví dụ, kết quả và lời giải tự kiểm tra.
- `dist/reader.css`: giao diện đọc bài giảng trên máy tính và điện thoại.
- `dist/app.js`: luyện tập, chấm điểm, đồng hồ và lưu tiến độ.
- `dist/styles.css`: giao diện desktop và điện thoại.
- `dist/index.html`: khung ứng dụng.
- `qa/`: kiểm tra nội dung và các luồng học chính.

## Kiểm tra

`node qa/content-check.cjs` kiểm tra cấu trúc ngân hàng. `python3 qa/sql-check.py` đối chiếu các ví dụ tính toán SQL với SQLite. Kiểm tra trình duyệt dùng Playwright và Chrome hệ thống; xem chú thích đầu `qa/browser-check.cjs`.

`python3 qa/lecture-sql-check.py` chạy từng ví dụ SQL trong bài giảng trên bộ dữ liệu mới và so sánh với bảng kết quả hiển thị. `qa/lecture-browser-check.cjs` kiểm tra trình đọc bài giảng, chuyển chương, ôn nhanh, dữ liệu mẫu, bài tự kiểm tra và giao diện điện thoại. Ví dụ `ANY/ALL`, `EXPLAIN` và toàn tác được ghi ngữ cảnh hệ quản trị trong bài; chúng không thuộc các ví dụ đối chiếu bằng SQLite.

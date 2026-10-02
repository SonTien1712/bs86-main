# Sprint planning — BS86 Backend

Ngày lập: 02/10/2026. Cập nhật: đã triển khai và kiểm chứng phần code S0; thu hồi credential, xử lý giấy tờ CDN và cập nhật môi trường đang chạy còn pending. Xem [S0_IMPLEMENTATION.md](S0_IMPLEMENTATION.md).

**Mục tiêu:** tạo một luồng đặt sân có phân quyền đúng, không chiếm hoặc nhả nhầm slot, ghi nhận đầy đủ khoản thu VNPay, và kiểm soát chi tiền/hoàn tiền qua ledger.

**Giả định lập kế hoạch**

- Một developer; mỗi sprint có 10 ngày làm việc. Ngày bắt đầu do người triển khai chọn.
- Có một bước cầm máu 1–2 ngày trước Sprint 1. Năm sprint chính chiếm 50 ngày làm việc; tổng khung 51–52 ngày làm việc, khoảng 10 tuần cộng bước cầm máu.
- Ước lượng ticket gồm triển khai và kiểm thử của ticket. Tổng effort dự kiến 42–43 ngày; phần còn lại dành cho tích hợp, xử lý lỗi và dự phòng. Đây là ước lượng ban đầu, hiệu chỉnh sau Sprint 1.
- DB trống theo thông tin đã trao đổi. Phải kiểm tra từng môi trường trước khi áp dụng V1; kế hoạch này không cho phép mặc định xóa database có dữ liệu.
- Đề xuất PostgreSQL vì profile Render hiện dùng PostgreSQL. DEV, TEST và môi trường triển khai phải thống nhất engine và phiên bản tương thích. Nếu chọn MySQL, quyết định trước S1-02 và cập nhật toàn bộ môi trường tương ứng.
- Giữ VNPay cho thu tiền. Ledger là nguồn dữ liệu tài chính nội bộ; kết quả gateway và sao kê ngân hàng là căn cứ đối soát tiền thực tế.
- Giữ và sửa FinanceManagementService. Chi tiền owner và hoàn tiền thủ công là phương án ban đầu. API refund VNPay triển khai khi đã xác nhận quyền merchant; không giả định tài khoản sandbox có mọi quyền production.
- Không đưa payOS vào cam kết của năm sprint chính.
- Không mở luồng tiền thật trước khi các tiêu chí nghiệm thu tài chính liên quan đã đạt.

**Quyết định thiết kế dùng chung**

| Hạng mục | Quyết định |
|---|---|
| Tiền | BigDecimal xuyên suốt Booking, payment, ledger và payout/refund. Chốt đơn vị VND, giới hạn số tiền và cách làm tròn; lưu snapshot giá/hoa hồng/chính sách của nghiệp vụ. |
| Slot | Giai đoạn đầu thêm booking_id nullable vào slot và dùng deadline đã lưu của booking. Cấp mới yêu cầu AVAILABLE và không có chủ giữ; xác nhận/nhả yêu cầu đúng booking_id. |
| Trạng thái | Payment đã thu tiền, booking đã cấp sân và refund đã trả tiền là ba trạng thái khác nhau. Booking hết hạn không chứng minh payment chưa thu tiền. |
| Ledger | financial_operation có operation_key duy nhất, không null; ledger_entry duy nhất theo operation_id và line_no. Khóa nghiệp vụ ổn định qua retry. |
| Khóa | Quy định thứ tự khóa nhất quán giữa IPN, cancel, timeout và payout; khóa nhiều slot theo thứ tự xác định. Không giữ khóa DB khi gọi mạng bên ngoài. |
| IPN | Xác thực dữ liệu gateway, khóa payment và booking, kiểm tra reservation ownership, cập nhật DB nguyên tử. Trả giao thức riêng của gateway sau commit. |
| Return URL | Đọc kết quả đã lưu; có trạng thái chờ xác nhận khi return đến trước IPN. |
| Payout | Duyệt yêu cầu chưa phải chi thành công. Tiền được giữ tới khi kết quả chi được xác nhận hoặc thất bại/hủy đã rõ. |
| Refund | Refund request riêng, operation_key ổn định, tổng đã hoàn và đang giữ để hoàn không vượt khoản được hoàn. |
| Actor | Truyền actor rõ ràng; phân biệt USER và SYSTEM, không bắt buộc ledger phải lấy user từ SecurityContext. |
| Bút toán | Không sửa hoặc xóa bút toán đã ghi; sửa sai bằng nghiệp vụ điều chỉnh/đảo có tham chiếu. |
| Chuyển gateway sau này | Cấu hình chọn gateway cho payment mới; xử lý callback/query/refund theo gateway đã lưu trên transaction. |

**Roadmap**

| Sprint | Thời lượng | Effort ticket | Mục tiêu | Điều kiện bắt đầu |
|---|---:|---:|---|---|
| S0 — Cầm máu | 1–2 ngày | 1–2 ngày | Chặn các đường truy cập và cấu hình nguy hiểm đã xác định | Có quyền quản lý secret và môi trường |
| S1 — Nền tảng và xác thực | 10 ngày | 8,5 ngày | Schema có phiên bản, test/CI hoạt động, xác thực và media có ranh giới rõ | S0 đạt tiêu chí cầm máu |
| S2 — Booking và slot | 10 ngày | 8 ngày | Reservation có chủ sở hữu, trạng thái và thời gian nhất quán | Schema, test DB và identity từ S1 |
| S3 — Ledger và VNPay | 10 ngày | 8,5 ngày | Thu tiền, cấp sân, ghi ledger và phát vé được xử lý đầy đủ | Reservation từ S2 |
| S4 — Payout và refund | 10 ngày | 9 ngày | Chi/hoàn tiền có giữ tiền, chứng từ, đối soát và chống trùng | Ledger và payment từ S3 |
| S5 — API, vận hành và nghiệm thu | 10 ngày | 7 ngày | Hoàn thiện API, truy vấn, vận hành và kiểm thử luồng đầy đủ | Luồng nghiệp vụ S1–S4 đã đạt nghiệm thu |

Các phụ thuộc chính: S1 → S2 → S3 → S4. Các việc dọn DTO, log và truy vấn có thể làm sớm khi không ảnh hưởng công việc chính. Trong Sprint 3, FIN-01/02/03 phải hoàn thành trước khi nghiệm thu PAY-01/02/03.

## S0 — Cầm máu

**Mục tiêu:** ngăn khai thác những lỗi đã rõ. Chưa xây đủ luồng upload đăng ký hoặc chi tiền mới trong bước này.

| ID | Công việc | Tiêu chí nghiệm thu |
|---|---|---|
| S0-01 | Thu hồi/đổi các credential bị lộ còn được sử dụng; externalize JWT, DB, Firebase và các dịch vụ liên quan. Đổi cách nạp Firebase để không đóng gói key trong classpath. | Có checklist credential đã thu hồi và nơi cấp giá trị mới, không ghi giá trị secret vào tài liệu. Source và artifact không chứa secret thật; secret cũ không còn được dùng. |
| S0-02 | Giới hạn seed cho môi trường phát triển/test; chặn helper đăng ký nhanh bỏ OTP và endpoint mock payment. | Production không reset mật khẩu/trạng thái bằng seed; helper bỏ OTP và mock payment không dùng được trong production. Chỉ đường xác minh email hợp lệ được đặt emailVerified. |
| S0-03 | Sửa IDOR profile; chặn tài khoản bị khóa tại login và khi xử lý JWT; khóa audit cho admin và giới hạn page size. | Customer A không đọc/sửa profile B; token cũ của user bị khóa bị từ chối; customer không đọc audit; size quá giới hạn bị từ chối hoặc giới hạn theo hợp đồng đã chốt. |
| S0-04 | Đóng upload công khai và chặn truy cập giấy tờ sai phạm vi. Kiểm kê tài liệu đã nằm trên CDN nếu có. | Không thể upload bằng ownerId tùy ý. Có phương án hạn chế truy cập cho giấy tờ đã upload; việc bảo vệ không chỉ dựa vào khóa API trả URL. |
| S0-05 | Đặt clean-disabled=true, clean-on-validation-error=false. Tạm dừng luồng payout cũ, API Order/MoMo và adapter mô phỏng trong môi trường thật. | Không tự clean DB khi validation lỗi; không ghi nhận chi tiền qua luồng cũ chưa có bằng chứng chuyển tiền. Ứng dụng vẫn khởi động được. |
| S0-06 | Quét source/history và artifact, chạy các test bảo mật nhỏ cho những thay đổi trên; ghi baseline build/test. | Không còn secret thật trong code/artifact sẽ phát hành; credential lịch sử đã thu hồi. Test P0 qua. Có ghi nhận test cũ còn lỗi để xử lý ở S1. |

**Gate S0:** chưa chuyển sang việc mở thêm tính năng nếu vẫn còn IDOR profile, tài khoản bị khóa vẫn dùng được, seed production reset tài khoản, hoặc helper bỏ OTP còn công khai. Chưa yêu cầu toàn bộ test cũ xanh ở bước này.

**Tiến độ S0 ngày 02/10/2026**

| ID | Trạng thái thực tế |
|---|---|
| S0-01 | Code/config đã externalize; file Firebase bị loại khỏi resource/JAR. Thu hồi/đổi credential trên tài khoản và môi trường thật: pending. |
| S0-02 | Đã giới hạn seed và mock theo profile, seed phải opt-in; helper bỏ OTP bị chặn. Google route yêu cầu Google provider và email đã xác minh. |
| S0-03 | Đã sửa identity profile, chặn BLOCKED trên login/JWT/WebSocket và giới hạn audit ADMIN/size. |
| S0-04 | Đã đóng upload tổng quát và giới hạn đọc/xóa media cho ADMIN. Kiểm kê/bảo vệ giấy tờ đã nằm trên CDN: pending. |
| S0-05 | Đã đặt Flyway clean an toàn, khóa API payout/withdrawal và route Order/MoMo/mock dự phòng. Smoke test toàn bộ ứng dụng với prod restrictions qua; chưa deploy. |
| S0-06 | 67 test S0 qua; quét source và nội dung ứng dụng trong JAR không có finding. Lịch sử Git còn finding, việc thu hồi chưa được xác nhận. 18 lỗi cũ không đổi. |

Phần code cầm máu đã qua kiểm chứng; **gate môi trường chưa hoàn tất**. Không mở luồng tiền thật hoặc coi URL giấy tờ CDN là đã bảo vệ. Bằng chứng kiểm tra: [S0_VERIFICATION.json](S0_VERIFICATION.json).

## S1 — Nền tảng và xác thực

**Sprint goal:** có thể dựng database mới bằng migration, chạy test độc lập với seed và chặn lỗi phân quyền trước khi phát triển nghiệp vụ tiền.

| ID | Công việc | Phụ thuộc | Nghiệm thu | Ngày |
|---|---|---|---|---:|
| S1-01 | Chốt DB engine/phiên bản; kiểm tra DB trống từng môi trường; thiết kế bootstrap admin có kiểm soát và quyền gọi từng nhóm API. | S0 | Có quyết định DB, xác nhận từng môi trường, role/API matrix và cách tạo admin ban đầu không dựa vào password seed production. | 0,5 |
| S1-02 | Tạo/rà soát V1; ddl-auto=validate, Flyway bật nhất quán, baseline-on-migrate=false. Chuẩn bị BigDecimal, payment metadata, booking_id trên slot, financial_operation/ledger_entry và cấu trúc payout/refund. | S1-01 | DB rỗng dựng được từ migration; FK/unique/not-null/check/index được rà soát; app validate và boot thành công. Engine và tiền trong entity/schema khớp nhau. | 2 |
| S1-03 | Testcontainers theo engine đã chọn; sửa helper token; tạo fixture và mock dịch vụ ngoài; xử lý test đỏ theo nguyên nhân. | S1-02 | Test chạy độc lập với seed, không gọi dịch vụ thanh toán/email/Cloudinary thật. Suite hiện có xanh; mỗi lỗi sửa gắn với nguyên nhân, không đổi expected chỉ để qua test. | 2 |
| S1-04 | CI build/test/secret scan và gate phát hành. | S1-03 | Commit có test đỏ hoặc phát hiện secret không được phát hành. Image có thể không chạy test bên trong build nhưng phải gắn với đúng commit đã qua CI. | 0,5 |
| S1-05 | Sửa JwtFilter prefix, ROLE_/hasRole, identity và ownership; ErrorResponse có mã lỗi ổn định, không lộ message nội bộ. | S0, S1-03 | Test 401/403/IDOR qua; ngoại lệ server không bị đổi thành lỗi JWT. Giao thức IPN sẽ được xử lý riêng ở S3. | 1 |
| S1-06 | Media ownership, loại/kích thước nội dung, delivery bảo vệ giấy tờ, token upload gắn phiên đăng ký; quota và hết hạn token. | S1-05 | Không gắn/xóa media người khác; token không dùng cho phiên/entity khác; giấy tờ không truy cập bằng URL công khai không được phép. Giới hạn MIME kiểm tra nội dung, không chỉ header. | 1,5 |
| S1-07 | Rate limit tối thiểu login/OTP/upload; SecureRandom cho OTP và giới hạn lần thử. Chốt CORS origin. | S1-05 | Có test vượt giới hạn, OTP sai quá số lần bị chặn và reset đúng. Cấu hình phù hợp số instance; không giả định bộ đếm trong RAM là giới hạn toàn hệ thống. | 1 |

**Demo cuối sprint:** DB mới → tạo user/verify OTP → login → truy cập đúng profile → upload giấy tờ đúng phiên. User khóa và truy cập chéo đều bị từ chối.

**Gate S1:** CI và suite hiện có xanh trên môi trường sạch; schema tạo bằng migration; không dùng Hibernate update để bù schema thiếu. V1 đã áp dụng không sửa lại; các thay đổi tiếp theo dùng V2/V3.

## S2 — Booking và slot

**Sprint goal:** chỉ booking đang sở hữu reservation mới được xác nhận hoặc giải phóng slot.

| ID | Công việc | Phụ thuộc | Nghiệm thu | Ngày |
|---|---|---|---|---:|
| S2-01 | Ma trận trạng thái; reservation ownership; CAS/ForUpdate; thứ tự khóa; unique slot và các điều kiện tạo slot không chồng lấn. | S1-02/03 | Cấp mới/confirm/release kiểm tra chủ giữ và trạng thái. Booking nhiều slot thành công toàn bộ hoặc rollback toàn bộ. Kiểm tra court/field/owner có được phép đặt. | 2 |
| S2-02 | Thống nhất quy tắc ở createBooking, createPaymentSession và owner booking; giới hạn đường chuyển trạng thái tùy ý. | S2-01 | Mọi đường tạo booking dùng cùng quy tắc. Người có quyền quản lý cũng không được bỏ qua điều kiện PAID, thời gian hoặc reservation ownership. | 2 |
| S2-03 | Hợp nhất cancel; timeout nguyên tử; Clock/timezone; deadline không được tự gia hạn vô hạn; scheduler không ghi đè BOOKED và không nhả slot sai chủ. | S2-01/02 | Hủy lặp an toàn; hủy booking cũ không nhả slot mới; slot đã BOOKED không bị timeout nhả. Các job/query dùng deadline đã lưu; cron và gateway dùng thời gian nhất quán. | 1,5 |
| S2-04 | Giới hạn booking chờ, số slot/phạm vi thời gian của một booking; tách giữ slot khỏi đánh dấu quá giờ. | S2-02 | Người dùng không giữ toàn bộ lịch bằng request vượt hạn mức; slot đã qua giờ không được coi là một reservation đang chờ thanh toán. | 0,5 |
| S2-05 | Integration test concurrent create, multi-slot rollback, cancel cũ, cancel/timeout/confirm race và thời điểm đổi ngày. | S2-01/02/03 | 20 request đồng thời vào cùng slot chỉ có một booking giữ hợp lệ; không nhả nhầm, không có trạng thái dở dang, thời gian đúng khi server chạy UTC. | 2 |

**Demo cuối sprint:** hai người cùng đặt → một người giữ được slot; booking hết hạn → người khác đặt lại → hủy booking cũ không ảnh hưởng booking mới.

**Gate S2:** test concurrency chạy trên DB thật của Testcontainers. Confirm-payment trong test dùng command nội bộ/fixture, không thêm endpoint thanh toán giả vào production; test VNPay đầy đủ thực hiện ở S3.

## S3 — Ledger và VNPay

**Sprint goal:** mỗi khoản thu được ghi nhận đúng một nghiệp vụ; chỉ cấp sân khi reservation còn hợp lệ; khoản thu đến muộn hoặc trùng vẫn được theo dõi và xử lý.

| ID | Công việc | Phụ thuộc | Nghiệm thu | Ngày |
|---|---|---|---|---:|
| S3-01 | Chốt chart of accounts, đơn vị/rounding VND và snapshot giá/hoa hồng. | S1-02, S2 | total = commission + phần owner theo quy tắc đã chốt; amount snapshot không đổi khi cấu hình giá/hoa hồng thay đổi. | 1 |
| S3-02 | financial_operation, bút toán nguyên tử, operation_key ổn định, actor USER/SYSTEM và bút toán điều chỉnh. | S3-01 | Gửi lặp không ghi trùng; lỗi một dòng rollback nghiệp vụ; số dư từng tài khoản đúng; không sửa/xóa bút toán đã chốt. | 1,5 |
| S3-03 | Sửa owner summary/đối soát tài khoản; tiền đang giữ/khả dụng; điều kiện COMPLETED và operation giải phóng tiền chống trùng. | S3-02, S2-01 | Payout không làm tăng doanh thu; booking chưa đủ điều kiện không mở tiền khả dụng; hoàn tất lặp không giải phóng tiền hai lần. | 1 |
| S3-04 | PaymentGateway, VNPay adapter, IPN riêng và Return đọc trạng thái. Kiểm chữ ký, merchant, amount/currency/status; lưu original create date và deadline; khóa payment và booking. | S3-02, S2 | IPN đúng RspCode/Message, chỉ ACK sau commit. Không phát vé/ghi owner revenue hai lần; URL thanh toán dùng deadline đã lưu. Return không cập nhật payment. | 2 |
| S3-05 | Xử lý late/duplicate payment, nhiều attempt, UNKNOWN; query đối soát các giao dịch chưa xác minh kể cả đã hết hạn nội bộ. | S3-04 | Đã thu tiền nhưng mất reservation tạo việc refund/xử lý, không lấy slot mới. Hai attempt cùng thành công không cấp sân hoặc ghi doanh thu owner hai lần. Query không giữ khóa DB trong lúc gọi mạng. | 1,5 |
| S3-06 | Test IPN replay/concurrent, payload sai, rollback khi ledger/ticket lỗi, return trước IPN, timeout race và job đối soát. | S3-01/02/03/04/05 | Kết quả payment/booking/slot/ledger/vé nhất quán; thông báo ngoài DB gửi sau commit; restart/replay không tạo nghiệp vụ trùng. | 1,5 |

**Demo cuối sprint:** giữ sân → VNPay sandbox → IPN → BOOKED + ledger + vé. Gửi lại IPN không thay đổi số dư; IPN thành công đến muộn tạo việc hoàn tiền mà không cấp sân sai.

**Gate S3:** hoàn tất trước khi mở thu tiền thật. Contract test tự động không chuyển tiền thật; cấu hình IPN HTTPS/merchant và một kiểm thử sandbox được ghi nhận riêng. Không để mất các khoản thu chỉ vì payment đã EXPIRED trong hệ thống.

## S4 — Payout và refund

**Sprint goal:** duyệt request chưa ghi nhận đã chi; mọi khoản chi/hoàn có giữ tiền, đích thanh toán cố định, bằng chứng và xử lý kết quả chưa rõ.

| ID | Công việc | Phụ thuộc | Nghiệm thu | Ngày |
|---|---|---|---|---:|
| S4-01 | Payout request/state machine; snapshot tài khoản; giữ tiền; claim người xử lý. REQUESTED → APPROVED → PROCESSING → PAID/FAILED, kèm REJECTED/CANCELLED và kết quả UNKNOWN. | S3-02/03 | Hai admin không cùng nhận xử lý; nhiều request không vượt tiền khả dụng. Tiền vẫn được giữ trong các trạng thái đang xử lý/chưa rõ kết quả. | 2 |
| S4-02 | Xác nhận chi thủ công, bank reference/chứng từ/actor; chống dùng trùng giao dịch ngân hàng trong phạm vi tài khoản nguồn; ledger tại kết quả đã xác nhận. | S4-01 | Duyệt không tạo bút toán đã chi; xác nhận PAID lặp chỉ ghi một lần. Đổi tài khoản owner không đổi snapshot. Mã/amount/đích sai bị từ chối hoặc đưa vào xử lý sai lệch. | 1,5 |
| S4-03 | Chính sách hủy/hoàn; refund_request có snapshot, stable operation key; chặn hoàn vượt tiền còn được hoàn và nhiều yêu cầu đồng thời. | S3-02/05 | Hủy booking không tự đồng nghĩa tiền đã trả. Tổng refund thành công và tiền đã giữ cho refund chờ không vượt giới hạn đã chốt. | 2 |
| S4-04 | Queue hoàn thủ công và đối soát UNKNOWN; ranh giới RefundPort để bổ sung VNPay API khi quyền merchant đã được xác nhận. | S4-03 | Có đường xử lý khoản thu đến muộn/trùng từ S3. Chưa rõ kết quả không được gửi chi lại để kiểm tra. API refund thực tế, nếu chưa được cấp quyền, là backlog mở rộng. | 1,5 |
| S4-05 | Xóa đầy đủ luồng WithdrawalService/MerchantWallet/MockPayoutAdapter và module Order/MoMo đã cô lập; chuyển hợp đồng API tiêu thụ sang luồng chính. | S4-01/02, S1 | Không thiếu bean khi khởi động; không còn API tiền cũ hoạt động. Dependency dùng chung được giữ hoặc đổi đồng bộ; migration bổ sung loại cấu trúc không dùng nếu cần. | 1 |
| S4-06 | Test duyệt/claim/confirm đồng thời, lặp bank reference, refund concurrent, UNKNOWN và thay đổi snapshot. | S4-01/02/03/04/05 | Không chi/hoàn trùng trong hệ thống, không giải phóng tiền sớm; kiểm tra số dư từng tài khoản và số nghiệp vụ chính xác. | 1 |

**Demo cuối sprint:** owner yêu cầu chi → admin duyệt → claim → ghi nhận chứng từ → PAID; cùng mã xác nhận gửi lần nữa không ghi thêm. Refund xử lý riêng và có thể đối soát kết quả chưa rõ.

**Gate S4:** trước khi mở payout/refund thật, có người chịu trách nhiệm chuyển tiền, cách xác minh sao kê và quy tắc xử lý UNKNOWN. Test DB không được trình bày như bằng chứng hai người không chuyển khoản ngoài hệ thống hai lần.

## S5 — API, vận hành và nghiệm thu

**Sprint goal:** các luồng đã hoàn thành có thể vận hành, truy vết và kiểm thử từ đầu tới cuối.

| ID | Công việc | Phụ thuộc | Nghiệm thu | Ngày |
|---|---|---|---|---:|
| S5-01 | DTO, validation và hợp đồng API; phân trang bảng tăng trưởng; dọn AuthService/SecurityUtils sau khi xác định nhánh đang dùng; sửa audit snapshot trước/sau và loại dữ liệu nhạy cảm. | S1–S4 | Không trả entity/secret ngoài ý muốn; validation và mã lỗi ổn định; audit ghi dữ liệu trước/sau thực tế. IPN vẫn giữ giao thức riêng. | 1,5 |
| S5-02 | Sửa N+1 và index theo màn hình/query thực tế; batch/keyset cho job có tập dữ liệu tăng trưởng. | S1–S4 | Có dữ liệu thử đủ lớn và kiểm tra số query cho admin/owner; không quét toàn lịch sử để xử lý một batch hiện tại. | 1 |
| S5-03 | Khóa scheduler nếu chạy nhiều instance; kiểm tra rate limit theo mô hình triển khai; quyết định broker ngoài theo nhu cầu nhiều instance. | S2–S4 | Cấu hình số instance được ghi rõ. Nếu nhiều instance: có kiểm thử job chạy trùng và nghiệp vụ vẫn idempotent. Nếu một instance: không coi đây là bảo đảm cho nhiều instance. | 1,5 |
| S5-04 | Log có cấu trúc, trace/correlation, metrics và cảnh báo payment/refund/payout chưa rõ kết quả hoặc quá hạn. | S3–S4 | Không log token, key, URL thanh toán đầy đủ hoặc giấy tờ. Có dashboard/metric tối thiểu và thử một cảnh báo có người nhận xử lý. | 1 |
| S5-05 | E2E tài khoản → booking → payment → vé/check-in → hoàn tất → payout/refund; thử deploy môi trường sạch bằng migration và restart/retry. | S1–S5-04 | Luồng chính và đường lỗi trọng yếu qua; check-in tuân thủ vai trò đã chốt; bootstrap không reset dữ liệu/auth. Giao dịch mẫu và kết quả đối soát được lưu. | 1,5 |
| S5-06 | Runbook tạo admin, secret rotation, replay/query an toàn, xử lý UNKNOWN/refund, release và kế hoạch quay lui tương thích schema. | S5-05 | Người triển khai làm theo tài liệu để dựng mới và xử lý một giao dịch chưa rõ kết quả; danh sách lỗi còn mở và giới hạn vận hành được ghi nhận. | 0,5 |

**Gate S5:** CI xanh; tiêu chí S0–S4 đạt; không còn lỗi P0/P1 chưa xử lý trong luồng tiền/phân quyền; không dùng mock trong môi trường thật; có cách đối soát và người chịu trách nhiệm. Nếu dịch vụ ngoài chưa cấp quyền thì giữ tính năng tương ứng đóng và ghi rõ giới hạn phát hành.

## Cách vận hành sprint

**Ưu tiên**

- P0: đường truy cập trái phép, secret còn được dùng bị lộ, mất/ghi trùng tiền, nhả nhầm slot đã được booking khác giữ.
- P1: công việc bắt buộc để đạt sprint goal và release gate.
- P2: cải tiến hoặc mở rộng không chặn luồng chính. Không lấy P2 trước khi công việc P0/P1 đang làm hoàn tất.

**Definition of Ready cho từng ticket**

Có phạm vi, phụ thuộc đã sẵn sàng, rule nghiệp vụ/role được chốt và kịch bản kiểm thử. Những ticket cần quyền nhà cung cấp có thông tin cấu hình hoặc mock/contract rõ ràng; không dùng kết quả giả để coi tích hợp thật đã hoàn thành.

**Definition of Done cho từng ticket**

Code và migration được review; test cần thiết qua trên engine đích; CI xanh; không lộ secret; tiêu chí nghiệm thu đạt và có bằng chứng demo/query/test; API liên quan được cập nhật. Việc dùng gateway sandbox/production được ghi rõ trong kết quả kiểm thử.

**Nhịp làm việc**

| Thời điểm | Việc thực hiện |
|---|---|
| Đầu sprint | Chọn ticket theo phụ thuộc và sức chứa; xác nhận sprint goal. Không đưa quá 9 ngày ticket vào sprint 10 ngày. |
| Mỗi ngày | Ghi Done / Doing / Blocked; kiểm tra phần nào cần thông tin hoặc quyền bên ngoài. WIP: một ticket chính. |
| Giữa sprint | Kiểm tra tích hợp và khối lượng còn lại. Bỏ P2 trước khi giảm tiêu chí nghiệp vụ. |
| Cuối sprint | Demo từng kịch bản nghiệm thu, kiểm tra gate, cập nhật estimate và rủi ro cho sprint tiếp theo. |
| Khi ticket kéo dài | Tách theo kết quả có thể review. Giữ tiêu chí an toàn/nghiệp vụ; chuyển phần chưa xong sang sprint tiếp theo. |
| Khi bị chặn bởi nhà cung cấp | Tiếp tục phần domain, mock, contract và test độc lập; ghi trạng thái tích hợp thật là blocked, chưa done. |

**Mẫu ghi nhận bằng chứng cho ticket**

ID: …  
Trạng thái: TODO / DOING / BLOCKED / REVIEW / DONE  
Thay đổi hoặc commit: …  
Test/kịch bản đã chạy: …  
Kết quả demo/đối soát: …  
Phụ thuộc hoặc lỗi còn mở: …

## Việc bắt đầu ngay

1. Tạo bảng theo dõi với các ID trong tài liệu; đưa S0-01 tới S0-06 vào nhóm đang triển khai.
2. Kiểm kê credential và quyền quản lý; thực hiện thu hồi/đổi trước khi coi việc xóa key khỏi source là hoàn tất.
3. Ghi baseline build/test và đóng các API P0 nêu trong S0.
4. Xác nhận trạng thái database từng môi trường, engine đích và cách bootstrap admin cho S1-01.
5. Chốt các rule trước S2/S3: ai được check-in, ai/điều kiện nào hoàn tất booking, thời điểm owner được rút và chính sách refund. Các rule này cần được lưu cùng quyết định thiết kế.
6. Kết thúc S0 bằng các test truy cập chéo và tài khoản bị khóa, rồi mới bắt đầu S1.

## Backlog ngoài cam kết chính

| ID | Hạng mục | Khi nào làm |
|---|---|---|
| EXT-01 | VNPay refund tự động | Quyền merchant/query/refund đã được xác nhận; giữ operation key và xử lý UNKNOWN của S4. |
| EXT-02 | PayOS thu tiền | Sau S3 và khi có nhu cầu kinh doanh; registry chọn provider theo payment đã lưu, không chỉ cấu hình mặc định. |
| EXT-03 | PayOS payout tự động | Sau S4; có quyền kênh chi, funding/quy trình đối soát, idempotency header và API truy vấn trạng thái. |
| EXT-04 | Broker WebSocket ngoài | Khi cần nhiều instance và tính năng real-time giữa instance; không là điều kiện bắt buộc của bản một instance. |
| EXT-05 | Reservation history riêng | Khi cần lịch sử giữ slot đầy đủ vượt khả năng audit/booking hiện tại. |

PayOS hiện không có sandbox riêng; phần tích hợp thật phải có tài khoản và kế hoạch kiểm thử phù hợp, không ghi “sandbox đã qua” cho một mock. Không gỡ xử lý VNPay cũ khi còn payment/refund cần đối soát.

**Nguồn và vị trí cần chú ý**

- [Cấu hình Render dùng PostgreSQL](<D:/FPt/CapStone Project up to march 2027/bs86-main/bs86-main/BS86_BE/backend/src/main/resources/application-render.properties:7>).
- [Return URL hiện gọi callback thay đổi dữ liệu](<D:/FPt/CapStone Project up to march 2027/bs86-main/bs86-main/BS86_BE/backend/src/main/java/com/example/backend/presentation/controller/PaymentController.java:65>).
- [VNPay đang hardcode hạn thanh toán 15 phút](<D:/FPt/CapStone Project up to march 2027/bs86-main/bs86-main/BS86_BE/backend/src/main/java/com/example/backend/infrastructure/external/VnpayGateway.java:94>).
- [Controller còn phụ thuộc WithdrawalService và MerchantWalletService](<D:/FPt/CapStone Project up to march 2027/bs86-main/bs86-main/BS86_BE/backend/src/main/java/com/example/backend/presentation/controller/WithdrawalController.java:25>).
- [Luồng duyệt payout hiện tại](<D:/FPt/CapStone Project up to march 2027/bs86-main/bs86-main/BS86_BE/backend/src/main/java/com/example/backend/core/service/FinanceManagementService.java:270>).
- [IPN VNPay](https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html).
- [Query và refund VNPay](https://sandbox.vnpayment.vn/apis/docs/truy-van-hoan-tien/querydr%26refund.html).
- [Môi trường test payOS](https://payos.vn/docs/moi-truong-test/).
- [API payOS](https://payos.vn/docs/api/).

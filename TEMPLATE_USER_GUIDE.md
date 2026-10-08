# Hướng dẫn viết Template Word

Tài liệu hướng dẫn cách tạo file template Word (`.docx`) có chứa cú pháp để hệ thống tự động điền dữ liệu khi render. Không cần biết lập trình.

> Người dùng dự kiến: Nhân viên nghiệp vụ, soạn thảo biểu mẫu — viết template hợp đồng / báo cáo / phiếu in.

---

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [Cú pháp chèn dữ liệu — `{{...}}`](#2-cú-pháp-chèn-dữ-liệu)
3. [Bộ lọc giá trị — `| filter`](#3-bộ-lọc-giá-trị)
4. [Hàm xử lý chuỗi](#4-hàm-xử-lý-chuỗi)
5. [Hàm xử lý mảng](#5-hàm-xử-lý-mảng)
6. [Câu điều kiện — `<<IF>>`](#6-câu-điều-kiện)
7. [Vòng lặp — `<<EACH>>`](#7-vòng-lặp)
7A. [Cây đệ quy — `<<TREE>>`](#7a-cây-đệ-quy-tree)
8. [Xuống dòng, xoá dòng và xoá cột](#8-xuống-dòng-xoá-dòng-và-xoá-cột)
9. [Chèn ảnh — `{{image: ...}}`](#9-chèn-ảnh)
10. [Chèn PDF — `{{pdf: ...}}`](#10-chèn-pdf)
11. [Chèn nội dung HTML — `{{html: ...}}`](#11-chèn-nội-dung-html)
11A. [Bảng cột động — `{{table: ...}}`](#11a-bảng-cột-động-table)
12. [Đính kèm file Word khác — `{{include: ...}}`](#12-đính-kèm-file-word-khác)
13. [Tái sử dụng template con — `{{template: ...}}`](#13-tái-sử-dụng-template-con)
14. [Chèn mã QR — `{{qr: ...}}`](#14-chèn-mã-qr)
15. [Khung ký số — `{{sign: ...}}`](#15-khung-ký-số)
15A. [Khối so sánh — `<<SECTION: id>>`](#15a-khối-so-sánh-section)
16. [Tham chiếu tài nguyên — đường dẫn `<src>`](#16-tham-chiếu-tài-nguyên)
17. [Quy ước viết template](#17-quy-ước-viết-template)
18. [Lỗi thường gặp và cách khắc phục](#18-lỗi-thường-gặp)
19. [Bộ template mẫu](#19-bộ-template-mẫu)

---

## 1. Tổng quan

### Template là gì

Template là file Word `.docx` bình thường — có thể chứa text, bảng, hình ảnh, header, footer, mọi định dạng Word — KÈM theo các **đoạn mã đặc biệt** để hệ thống thay thế bằng dữ liệu thật khi render.

### Dữ liệu vào / kết quả ra

- **Đầu vào:**
  - File template `.docx`
  - Dữ liệu JSON
  - (Tuỳ chọn) file đính kèm: ảnh, PDF, file Word con, v.v.
- **Đầu ra:** File `.docx` hoặc `.pdf` đã điền đầy đủ dữ liệu

### Các loại mã trong template

| Loại | Cú pháp | Mục đích |
|---|---|---|
| Chèn dữ liệu | `{{path.to.field}}` | Hiển thị giá trị từ JSON |
| Điều kiện | `<<IF: condition>>...<</IF>>` (khuyến nghị) hoặc `...<<END>>` (legacy) | Hiển thị có điều kiện |
| Vòng lặp | `<<EACH: array>>...<</EACH>>` (khuyến nghị) hoặc `...<<END>>` (legacy) | Lặp lại nội dung theo mảng |
| Cây đệ quy | `<<TREE: array>>...<</TREE>>` (hoặc `...<<END>>`) | Lặp cây nhiều cấp (điều khoản Điều → Khoản → Điểm) |
| Khối so sánh | `<<SECTION: id>>...<</SECTION>>` (khuyến nghị) hoặc `...<<ENDSECTION>>` (legacy) | Đánh dấu vùng cho diff/VBBS |
| Chèn ảnh / PDF / HTML / file con | `{{image: ...}}` v.v. | Chèn tài nguyên đính kèm |
| Bảng cột động | `{{table: @path; ...}}` | Pivot mảng JSON thành bảng số cột tự sinh theo dữ liệu |
| Khung ký số | `{{sign: ...}}` | Khai báo vùng ký |
| Mã QR | `{{qr: ...}}` | Chèn QR code |

> **Cú pháp đóng v2 (khuyến nghị)** — Engine hỗ trợ 2 cú pháp đóng cho IF/EACH/SECTION:
> - **v2 tường minh**: `<</IF>>`, `<</EACH>>`, `<</SECTION>>` — mỗi opener có close riêng theo loại. Walker phân biệt được close nào đóng cái gì → **lồng IF-trong-IF, IF-chứa-EACH hoạt động chính xác**, validator báo lỗi rõ ràng khi thiếu close.
> - **legacy đơn**: `<<END>>` đóng marker IF/EACH mở gần nhất (top stack, bất kể loại). `<<ENDSECTION>>` đóng SECTION. Vẫn hoạt động cho template cũ.
>
> Có thể trộn cả 2 cú pháp trong cùng template. Template mới nên dùng v2 — nhất là khi có lồng nhau.

### Quy tắc cốt lõi

1. **Phân biệt chữ HOA/thường** trong tên field: `{{customer.name}}` ≠ `{{Customer.Name}}` (nhưng có fallback case-insensitive nếu không tìm thấy).
2. **Thiếu dữ liệu KHÔNG báo lỗi** — vị trí marker sẽ để trống. Hệ thống vẫn render thành công.
3. **Marker trong cùng dòng** với text khác: dùng được cho `{{field}}`, `{{image:}}`, `{{qr:}}`, `<<IF>>` inline.
4. **Marker trên dòng riêng**: bắt buộc cho `{{pdf:}}`, `{{html:}}`, `{{table:}}`, `{{include:}}`, `{{template:}}`, `{{sign:}}`, và `<<EACH>>`/`<<IF>>`/`<<TREE>>` dạng block.

---

## 2. Cú pháp chèn dữ liệu

### 2.1 Field cơ bản

```text
Tên khách hàng: {{customer.name}}
CIF: {{customer.cif}}
Số tài khoản: {{account.number}}
```

- Dùng dấu `.` để truy cập field con của object JSON.
- Dùng `[index]` để truy cập phần tử mảng theo số thứ tự (bắt đầu từ 0).

**Ví dụ JSON:**
```json
{
  "customer": { "name": "Nguyễn Văn A", "cif": "0123456789" },
  "products": [
    { "name": "Sản phẩm A", "price": 100000 },
    { "name": "Sản phẩm B", "price": 200000 }
  ]
}
```

**Truy cập mảng:**
```text
Sản phẩm đầu tiên: {{products[0].name}}     → "Sản phẩm A"
Giá sản phẩm thứ hai: {{products[1].price}}  → "200000"
```

### 2.2 Field thiếu giá trị

Nếu field không có trong JSON, hệ thống sẽ **để trống** tại vị trí đó. Không báo lỗi.

```text
Email: {{customer.email}}
```
- Nếu JSON không có `customer.email` → in ra `Email: `

### 2.3 Chỉ số `@index` trong vòng lặp

Trong vòng `<<EACH>>`, dùng `{{@index}}` để lấy số thứ tự (bắt đầu từ 1):

```text
<<EACH: products>>
{{@index}}. {{name}} — giá {{price}}đ
<</EACH>>
```

**Kết quả:**
```text
1. Sản phẩm A — giá 100000đ
2. Sản phẩm B — giá 200000đ
```

---

## 3. Bộ lọc giá trị

Bộ lọc viết sau dấu `|`: `{{field | filter}}`. Có thể **xâu chuỗi nhiều bộ lọc**: `{{field | trim | upper}}` (áp lần lượt từ trái sang phải), và xâu sau hàm: `{{mask(card,4) | upper}}`.

Có **2 nhóm bộ lọc**, khác nhau ở thời điểm áp dụng:

| Nhóm | Khi nào áp dụng | Gồm |
|---|---|---|
| **Bộ lọc mặc định** | **Chỉ khi field rỗng/thiếu** (có giá trị thì bỏ qua) | giá trị mặc định `"..."`, `leader`, `leader(N)` |
| **Bộ lọc định dạng** | **Luôn áp dụng** (kể cả khi có giá trị) | `upper`, `lower`, `capitalize`, `trim`, `number`, `number(N)`, `currency`, `vnd`, `currency(MÃ)`, `date`, `date("format")` |

### 3.1 Bộ lọc mặc định (chỉ khi rỗng)

**Giá trị mặc định** — đặt trong nháy kép `"..."` hoặc nháy đơn `'...'`:

```text
Họ tên: {{name | "Chưa có"}}
Fax:    {{fax | '-'}}
```

- `name = "Nguyễn Văn A"` → `Họ tên: Nguyễn Văn A`
- `name = ""` hoặc thiếu → `Họ tên: Chưa có`

**Đường gạch chấm (leader)** — để chỗ trống ký/điền tay:

```text
Họ và tên: {{name | leader}}        → 20 dấu chấm khi name rỗng
Địa chỉ:  {{address | leader(40)}}  → 40 dấu chấm khi address rỗng
```

- `leader` không tham số = 20 dấu chấm. `leader(N)` = N dấu chấm.
- Nếu field có giá trị thì in giá trị thật, không in dấu chấm.

### 3.2 Bộ lọc định dạng (luôn áp dụng)

| Bộ lọc | Mục đích | Ví dụ (giá trị → kết quả) |
|---|---|---|
| `upper` | In HOA | `{{name \| upper}}` → `NGUYỄN VĂN A` |
| `lower` | in thường | `{{code \| lower}}` → `abc123` |
| `capitalize` | Viết hoa chữ cái đầu mỗi từ | `{{title \| capitalize}}` → `Nguyễn Văn A` |
| `trim` | Xoá khoảng trắng 2 đầu | `{{note \| trim}}` |
| `number` | Định dạng số kiểu Việt (phân nhóm `.`) | `{{qty \| number}}` → `1234567` ra `1.234.567` |
| `number(N)` | Số với N chữ số thập phân (làm tròn) | `{{rate \| number(2)}}` → `1234567.5` ra `1.234.567,50` |
| `currency` / `vnd` | Tiền tệ VND (0 chữ số thập phân, kèm mã) | `{{amount \| currency}}` → `1234567` ra `1.234.567 VND` |
| `currency(MÃ)` | Tiền tệ ngoại tệ (2 chữ số thập phân) | `{{amount \| currency(USD)}}` → `1.234.567,00 USD` |
| `words` | **Đọc số tiền bằng chữ** (VND) | `{{amount \| words}}` → `123000000` ra `Một trăm hai mươi ba triệu đồng` |
| `words(MÃ)` | Đọc bằng chữ theo ngoại tệ | `{{amount \| words(USD)}}` → `1234.56` ra `Một nghìn hai trăm ba mươi tư đô la Mỹ năm mươi sáu xu` |
| `words(field)` | Mã tiền tệ **lấy từ data** khi không biết trước | `{{amount \| words(ccy)}}` với `ccy="USD"` ra `... đô la Mỹ ...` — xem §3.3 |
| `date` | Ngày kiểu `dd/MM/yyyy` (mặc định) | `{{createdAt \| date}}` → `15/05/2026` |
| `date("format")` | Ngày theo định dạng tuỳ chọn | `{{createdAt \| date("yyyy-MM-dd")}}` → `2026-05-15` |

> **Lưu ý:** `upper`, `lower`, `trim`, `date` tồn tại **cả dạng bộ lọc** (`{{name | upper}}`) **lẫn dạng hàm** (`{{upper(name)}}`) — kết quả giống nhau, chọn dạng nào tuỳ thói quen.
>
> Bộ lọc `date`/`number`/`currency`/`words` nhận giá trị rỗng → trả về rỗng (không lỗi) — nên `{{amount | words | leader(30)}}` ra dòng chấm khi thiếu số, `{{amount | words | "Không áp dụng"}}` ra literal. `date` tự nhận diện các định dạng ISO (`2026-05-15`, `2026-05-15T10:00:00Z`, ...) và một số định dạng phổ biến.

### 3.3 Đọc số tiền bằng chữ — `words`

Dùng cho dòng "*Bằng chữ: …*" trên hợp đồng, uỷ nhiệm chi, giấy đề nghị. Chữ cái đầu luôn được viết hoa sẵn.

```text
Số tiền: {{amount | currency}}
Bằng chữ: {{amount | words}}
```
> Số tiền: 123.000.000 VND
> Bằng chữ: Một trăm hai mươi ba triệu đồng

**Khi biết trước loại tiền** — viết thẳng mã:

```text
{{amount | words(USD)}}    → Một nghìn hai trăm ba mươi tư đô la Mỹ năm mươi sáu xu
{{amount | words(JPY)}}    → Năm nghìn yên Nhật
```

**Khi KHÔNG biết trước loại tiền** — trỏ vào field chứa mã, engine đọc lúc render:

```text
{{amount | words(currencyCode)}}
```

| Data gửi lên | Kết quả |
|---|---|
| `{"amount": 1234.56, "currencyCode": "USD"}` | Một nghìn hai trăm ba mươi tư đô la Mỹ năm mươi sáu xu |
| `{"amount": 5000, "currencyCode": "JPY"}` | Năm nghìn yên Nhật |
| `{"amount": 100, "currencyCode": ""}` | Một trăm **đồng** (rỗng → về VND) |
| `{"amount": 100}` (thiếu hẳn field) | ⚠️ Một trăm **CURRENCYCODE** — xem lưu ý bên dưới |

> ⚠️ Tham số của `words` vừa nhận **mã tiền tệ** vừa nhận **tên field**. Engine tìm field trước; **không thấy field nào tên như vậy thì coi đó là mã tiền tệ**. Nên nếu field bị thiếu hẳn trong data, tên field sẽ bị đọc thành đơn vị tiền. Cách tránh: luôn gửi field (kể cả để rỗng), hoặc bọc trong `<<IF: currencyCode>>`.
>
> Muốn ép hiểu là mã tiền tệ kể cả khi trùng tên field: thêm nháy — `{{amount | words("USD")}}`.

**Các loại tiền có sẵn**

| Mã | Đọc thành | Phần lẻ |
|---|---|---|
| `VND` (mặc định) | đồng | không đọc, làm tròn về đồng |
| `USD` | đô la Mỹ | xu |
| `EUR` | euro | xu |
| `GBP` | bảng Anh | xu |
| `JPY` | yên Nhật | không đọc |
| `CNY` | nhân dân tệ | không đọc |

Mã ngoài danh sách vẫn chạy: giữ nguyên mã làm đơn vị (`{{a | words(SGD)}}` → `… SGD …`), phần lẻ đọc là `xu`. Cần đọc đúng tên thì báo để thêm vào bảng.

**Kết hợp với bộ lọc khác**

```text
{{amount | words | upper}}                → MỘT TRĂM HAI MƯƠI BA TRIỆU ĐỒNG
{{amount | words | leader(30)}}           → dòng chấm khi thiếu số tiền
{{amount | words | "Không áp dụng"}}      → chữ thay thế khi thiếu số tiền
<<IF: amount>>Bằng chữ: {{amount | words}}<<ENDIF>>   → ẩn cả dòng khi thiếu
```

> Luôn đặt `words` **trước** `leader` hoặc chữ mặc định. Viết ngược (`{{amount | leader(30) | words}}`) sẽ ra dòng chấm vô nghĩa.

**Vài điều cần biết**

- `0` đọc là `Không đồng`; số âm đọc là `Âm một triệu … đồng`.
- Với VND, phần thập phân bị **làm tròn** về đồng: `1234.56` → `Một nghìn hai trăm ba mươi lăm đồng`.
- Số lớn tuỳ ý: `1.234.567.890.123` → `Một nghìn hai trăm ba mươi tư tỷ năm trăm sáu mươi bảy triệu tám trăm chín mươi nghìn một trăm hai mươi ba đồng`.
- Cách đọc theo chuẩn chứng từ: `21` → *hai mươi mốt*, `24` → *hai mươi **tư***, `25` → *hai mươi lăm*, `1.000.005` → *một triệu không trăm lẻ năm*.
- ⚠️ Gửi số tiền dưới dạng **số** trong JSON (`"amount": 123000000`). Gửi chuỗi đã format sẵn kiểu Việt (`"123.000"`) sẽ bị hiểu thành `123`.

---

## 4. Hàm xử lý chuỗi

Gọi như hàm: `{{tênHàm(field, tham_số)}}`. Tham số chuỗi đặt trong dấu nháy kép.

| Hàm | Mục đích | Ví dụ |
|---|---|---|
| `upper(field)` | In hoa toàn bộ | `{{upper(name)}}` → `NGUYỄN VĂN A` |
| `lower(field)` | In thường toàn bộ | `{{lower(code)}}` → `abc123` |
| `mask(field, N)` | Che N ký tự đầu bằng `*` | `{{mask(card, 4)}}` → `********7890` (giữ 4 ký tự cuối) |
| `date(field, "format")` | Định dạng ngày tháng | `{{date(createdAt, "dd/MM/yyyy")}}` → `15/05/2026` |
| `substring(field, start, len)` | Cắt chuỗi | `{{substring(name, 0, 5)}}` → 5 ký tự đầu |
| `left(field, N)` | Lấy N ký tự đầu | `{{left(code, 3)}}` → `ABC` |
| `right(field, N)` | Lấy N ký tự cuối | `{{right(phone, 4)}}` → `4321` |
| `trim(field)` | Xoá khoảng trắng 2 đầu | `{{trim(name)}}` |
| `trimStart(field)` | Xoá khoảng trắng đầu | `{{trimStart(name)}}` |
| `trimEnd(field)` | Xoá khoảng trắng cuối | `{{trimEnd(name)}}` |
| `replace(field, "a", "b")` | Thay thế ký tự `a` thành `b` (hỗ trợ escape `\n`, `\t`…) | `{{replace(text, ",", ";")}}`, `{{replace(note, "\n", "<<ENTER>>- ")}}` |
| `contains(field, "x")` | Trả `true`/`false` | `{{contains(tags, "VIP")}}` |
| `split(field, "sep", N)` | Cắt chuỗi theo separator, lấy phần tử thứ N (0-based) | `{{split(tags, ",", 1)}}` |
| `charAt(field, N)` | Lấy ký tự ở vị trí N | `{{charAt(name, 0)}}` |

### Ngày giờ hiện tại — `now()`

Lấy thời điểm **lúc render**, không cần dữ liệu JSON. Giờ Việt Nam.

| Viết | Kết quả |
|---|---|
| `{{now()}}` | `29/08/2026` (mặc định ngày/tháng/năm) |
| `{{now(dd)}}` | `29` — chỉ ngày |
| `{{now(MM)}}` | `08` — chỉ tháng |
| `{{now(yyyy)}}` | `2026` — chỉ năm |
| `{{now(HH:mm)}}` | `14:52` — giờ phút |
| `{{now(dd/MM/yyyy HH:mm:ss)}}` | `29/08/2026 14:52:07` |

**Ví dụ** — dòng ngày tháng cuối văn bản:

```text
Hà Nội, ngày {{now(dd)}} tháng {{now(MM)}} năm {{now(yyyy)}}
```

- **Phải có cặp ngoặc `()`** — viết `{{now}}` trần thì hệ thống hiểu là **field dữ liệu tên `now`**.
- Định dạng sai (vd. `{{now(QQQ)}}`) → in ra rỗng, không làm hỏng file.

### Lưu ý quan trọng

- **Định dạng ngày** chuẩn Java: `dd/MM/yyyy`, `HH:mm:ss`, `yyyy-MM-dd`, v.v.
- **`mask(card, 4)`**: giữ lại 4 ký tự cuối, che các ký tự trước.
- **KHÔNG lồng hàm trong hàm** — tham số đầu của hàm phải là **đường dẫn field**, không phải một hàm khác. SAI: `{{upper(trim(name))}}`.
- Cần kết hợp 2 thao tác → **xâu bộ lọc sau hàm**: `{{trim(name) | upper}}` (đúng), hoặc dùng dạng bộ lọc thuần `{{name | trim | upper}}`.
- Tham số chuỗi (separator, định dạng, chuỗi tìm/thay) phải đặt trong **nháy kép**: `{{split(tags, ",", 1)}}`, `{{replace(text, ",", ";")}}`.
- **Ký tự đặc biệt trong chuỗi có nháy** (không gõ trực tiếp vào marker được): viết theo kiểu escape — `\n` xuống dòng, `\r` về đầu dòng, `\t` tab, `\\` dấu gạch chéo ngược, `\"` `\'` dấu nháy. Escape khác (`\d`, `\s`… của biểu thức chính quy) **giữ nguyên**.

#### Xử lý dữ liệu nhiều dòng (textarea) — mẫu hay dùng

| Viết | Kết quả |
|---|---|
| `{{replace(ghi_chu, "\n", "\n- ")}}` | Mỗi dòng thành một **đoạn** riêng, thêm tiền tố `- ` |
| `{{replace(ghi_chu, "\n", "<<ENTER>>- ")}}` | Các dòng nằm trong **cùng một đoạn**, ngắt dòng mềm (Shift+Enter), thêm tiền tố `- ` |
| `{{replace(ghi_chu, "\n", " / ")}}` | Gộp về một dòng, ngăn nhau bằng ` / ` |

> Chữ đứng **sau** `<<ENTER>>` được giữ nguyên: `"<<ENTER>> ABC- "` cho ra ngắt dòng rồi tới ` ABC- `.

---

## 5. Hàm xử lý mảng

| Hàm | Mục đích | Ví dụ |
|---|---|---|
| `length(array)` | Đếm số phần tử | `{{length(products)}}` → `3` |
| `count(array)` | Như `length` | `{{count(items)}}` |
| `isEmpty(array)` | `true` nếu mảng rỗng | `{{isEmpty(items)}}` |
| `hasItems(array)` | `true` nếu mảng có ≥1 phần tử | `{{hasItems(products)}}` |
| `first(array.field)` | Lấy field của phần tử đầu | `{{first(products.name)}}` → `Sản phẩm A` |
| `last(array.field)` | Lấy field của phần tử cuối | `{{last(products.name)}}` → `Sản phẩm C` |
| `join(array, field, "sep")` | Ghép field của tất cả phần tử bằng separator | `{{join(products, name, ", ")}}` → `Sản phẩm A, Sản phẩm B, Sản phẩm C` |

---

## 6. Câu điều kiện

### 6.1 Cú pháp cơ bản

```text
<<IF: điều_kiện>>
Nội dung khi điều kiện đúng
<<ELSE>>
Nội dung khi điều kiện sai
<</IF>>
```

- `<<ELSE>>` là tuỳ chọn (có thể bỏ).
- **Mỗi `<<IF: ...>>` cần 1 close**: dùng `<</IF>>` (khuyến nghị) hoặc `<<END>>` (legacy, đóng marker mở gần nhất).
- Engine accept lẫn 2 cú pháp trong cùng template. Template mới nên dùng `<</IF>>` để walker depth-tracking chính xác, nhất là khi lồng nhau.

### 6.2 IF cùng dòng (inline)

Khi cần ẩn/hiện chỉ một đoạn ngắn trong dòng:

```text
Loại giao dịch: <<IF: type=cash>>Tiền mặt<<ELSE>>Chuyển khoản<</IF>>
```

### 6.3 IF dạng block (nhiều dòng)

Khi cần ẩn/hiện cả đoạn văn:

```text
<<IF: hasGuarantor>>
Thông tin người bảo lãnh:
- Họ tên: {{guarantor.name}}
- CCCD: {{guarantor.cccd}}
<</IF>>
```

#### IF block bao quanh cả một bảng (đã hỗ trợ)

Đặt `<<IF: cond>>` ở 1 paragraph **trước** bảng và `<</IF>>` ở paragraph **sau** bảng → cả bảng (và các paragraph xen giữa) được giữ/xoá đúng theo điều kiện. Engine duyệt **cả paragraph lẫn table** theo đúng thứ tự tài liệu:

```text
<<IF: showSchedule>>
Lịch trả nợ dự kiến:
┌──────┬──────────┬──────────┐
│ Kỳ   │ Ngày     │ Số tiền  │
├──────┼──────────┼──────────┤
│ ...  │ ...      │ ...      │
└──────┴──────────┴──────────┘
<</IF>>
```

- `cond=true` → giữ paragraph + bảng, đúng thứ tự.
- `cond=false` → xoá **cả** paragraph **và** bảng (không còn rò rỉ dữ liệu bảng như bản cũ).

> Khuyến nghị dùng close tường minh `<</IF>>` cho IF bọc bảng. Vẫn có thể ẩn/hiện ở mức từng **dòng** trong bảng bằng `<<IF: cond>><<ELSE>>{{deleteRow}}<</IF>>` (pattern ngân hàng, [section 7.2](#72-lặp-theo-dòng-trong-bảng)) hoặc `<<EACH: arr|deleteRows:N>>` với mảng 0/1 phần tử.

### 6.4 Các loại điều kiện

**1. Kiểm tra "có giá trị" (truthy):**
```text
<<IF: customer.name>>Đã có tên<<END>>
```
Đúng khi `name` có giá trị, không rỗng, không phải `"false"` hoặc `"0"`.

**2. So sánh bằng:**
```text
<<IF: type=cash>>...<<END>>
<<IF: status=ACTIVE>>...<<END>>
```

**3. So sánh khác:**
```text
<<IF: type!=cash>>Không phải tiền mặt<<END>>
```

**4. So sánh số:**
```text
<<IF: amount>1000000>>Số tiền lớn<<END>>
<<IF: balance>=500000>>...<<END>>
<<IF: age<18>>Người dưới tuổi vị thành niên<<END>>
<<IF: score<=50>>Trượt<<END>>
```

**5. Kết hợp AND / OR:**
```text
<<IF: amount>1000000 AND type=cash>>...<<END>>
<<IF: status=ACTIVE OR status=PENDING>>...<<END>>
```

> Lưu ý: `AND` và `OR` viết HOA, có khoảng trắng 2 bên. `AND` ưu tiên cao hơn `OR` — `A AND B OR C AND D` hiểu là `(A AND B) OR (C AND D)`.

**6. Dùng hàm mảng/chuỗi trong điều kiện:** có thể đặt **hàm** ở vế trái (xem [mục 4](#4-hàm-xử-lý-chuỗi), [mục 5](#5-hàm-xử-lý-mảng)):
```text
<<IF: hasItems(products)>>Có sản phẩm<<END>>
<<IF: isEmpty(guarantors)>>Không có người bảo lãnh<<END>>
<<IF: length(items)>0>>...<<END>>
<<IF: contains(tags, "VIP")=true>>Khách VIP<<END>>
```

> Hàm trả về `"true"`/`"false"` (như `hasItems`, `isEmpty`, `contains`) dùng được trực tiếp làm điều kiện truthy. Hàm trả số (`length`, `count`) so sánh được với `>`, `>=`, ...

### 6.5 IF lồng IF

Đây là sweet-spot của cú pháp v2 — close tường minh giúp walker phân biệt chính xác:

```text
<<IF: isVip>>
Khách VIP
<<IF: balance>10000000>>
Khách VIP cao cấp
<</IF>>
<</IF>>
```

> Với cú pháp legacy `<<END>>` đôi, walker không depth-tracking và dừng ở `<<END>>` đầu tiên — `<<IF>>` lồng `<<IF>>` hoặc `<<IF>>` chứa `<<EACH>>...<<END>>` có thể render sai. Dùng `<</IF>>` để chắc chắn.

### 6.6 Lưu ý quan trọng

- **KHÔNG đặt `{{...}}` trong điều kiện**, ví dụ SAI: `<<IF: {{type}}=cash>>`. Đúng: `<<IF: type=cash>>`.
- **KHÔNG dùng bộ lọc `|`** trong điều kiện (vd. SAI: `<<IF: name|upper=ADMIN>>`).
- **Hàm mảng/chuỗi DÙNG ĐƯỢC** trong điều kiện (xem 6.4 mục 6) — đây là điểm mới so với bản hướng dẫn trước.
- So sánh **giá trị** phân biệt HOA/thường: JSON `"YES"` không khớp `<<IF: x=yes>>`.

---

## 7. Vòng lặp

### 7.1 Lặp theo đoạn văn

```text
<<EACH: products>>
- Sản phẩm: {{name}} — Giá: {{price}}đ
<</EACH>>
```

Mỗi phần tử trong mảng `products` tạo ra 1 đoạn `- Sản phẩm: ...`.

> Có thể dùng `<<END>>` thay cho `<</EACH>>` (legacy, vẫn hoạt động). Khuyến nghị `<</EACH>>` cho template mới.

### 7.2 Lặp theo dòng trong bảng

Đặt marker `<<EACH: ...>>` trên dòng đầu của bảng (dòng template), `<</EACH>>` (hoặc `<<END>>`) ở cuối dòng đó. Mỗi phần tử trong mảng → 1 dòng mới.

| STT | Sản phẩm | Giá |
|---|---|---|
| `<<EACH: items>>{{@index}}` | `{{name}}` | `{{price}}<</EACH>>` |

### 7.3 Vòng lặp lồng nhau

```text
<<EACH: groups>>
Nhóm {{@index}}: {{groupName}}
<<EACH: members>>
  - {{@index}}. {{name}} ({{role}})
<</EACH>>
<</EACH>>
```

**Lưu ý:** Bên trong vòng lặp con, `{{@index}}` chỉ thứ tự trong vòng lặp gần nhất.

> Ví dụ trên lặp **văn bản**. Để mỗi phần tử sinh ra **một bảng có khung
> riêng**, xem mục 7.3b.

### 7.3b Vòng lặp bao quanh cả một bảng (nhiều bảng cùng cấu trúc)

Đặt `<<EACH: ...>>` ở 1 paragraph TRƯỚC bảng và `<</EACH>>` ở paragraph SAU
bảng → mỗi phần tử trong mảng sinh ra **một bản sao của cả bảng** (giữ nguyên
khung/định dạng). Kết hợp `<<EACH: ...>>` mức **dòng** bên trong bảng để lấp
các dòng dữ liệu — đây chính là **EACH (bảng) lồng EACH (dòng)**.

```text
<<EACH: financialIndicators>>
{{formName}}                       ← tiêu đề mỗi bảng
┌────┬──────────┬──────┬───────┬───────┬───────┐
│ TT │ Chỉ tiêu │ Kỳ T │ Kỳ T1 │ Kỳ T2 │ Kỳ T3 │   ← dòng header (tĩnh)
│ <<EACH: data>>{{@index}} │ {{indicatorName}} │ {{period1Value}} │ {{period2Value}} │ {{period3Value}} │ {{period4Value}} │   ← dòng template
└────┴──────────┴──────┴───────┴───────┴───────┘
<</EACH>>
```

Dữ liệu:
```json
{ "financialIndicators": [
    { "formName": "Bảng cân đối kế toán",
      "data": [
        { "indicatorName": "Tổng tài sản", "period1Value": "12,000", "period2Value": "13,500", "period3Value": "15,200", "period4Value": "16,800" },
        { "indicatorName": "Vốn chủ sở hữu", "period1Value": "5,000", "period2Value": "5,600", "period3Value": "6,100", "period4Value": "6,800" }
      ] },
    { "formName": "Báo cáo kết quả kinh doanh", "data": [ ... ] }
] }
```

→ Mỗi `formName` ra 1 bảng riêng; mỗi phần tử `data` là 1 dòng; cột `TT` dùng
`{{@index}}` (đếm từ 1).

**Lưu ý / giới hạn:**
- Vòng lặp ngoài (bao quanh bảng) **phải có close tường minh** `<</EACH>>`
  (hoặc `<<END>>`).
- `<<EACH: data>>` mức dòng đặt ở **ô đầu** của dòng template, KHÔNG cần
  `<<END>>` riêng (dòng chính là đơn vị lặp).
- IF mức ô / dòng trong bảng lặp dùng `<<IF: c>>...<</IF>>` **cùng dòng**
  (inline) hoặc IF mức dòng. IF dạng **block nhiều paragraph** viết trong ô của
  bảng do vòng lặp điều khiển được đánh giá theo **từng phần tử** (xem mục 7.6).
- Inline `<<IF>>...<<ELSE>>...<</IF>>` tự đóng trong **1 ô** của dòng lặp được
  đánh giá **theo từng phần tử** (chọn đúng nhánh mỗi dòng, KHÔNG xoá cả dòng
  chỉ vì điều kiện sai) — trừ khi dùng `{{deleteRow}}` (mục 8.2), vốn vẫn là
  cách CHỦ Ý xoá cả dòng theo điều kiện.

### 7.2b Lặp một NHÓM dòng (`<<EACH>>` mở và đóng ở hai dòng khác nhau)

Một phần tử cần **nhiều dòng** (dòng dữ liệu + dòng ghi chú): mở
`<<EACH: mảng>>` ở ô đầu **dòng thứ nhất** và đóng `<</EACH>>` ở ô cuối **dòng
cuối** của nhóm. Cả nhóm được nhân bản theo từng phần tử, giữ nguyên thứ tự.

| `<<EACH: khoan>>{{ten}}` | `{{sotien}}` |
|---|---|
| Ghi chú: `{{ghichu}}` | `<</EACH>>` |

- Mảng rỗng → **cả nhóm** biến mất (kèm `deleteRows:N` nếu cần xoá thêm).
- `{{@index}}` đếm theo **phần tử**, không theo dòng.
- `{{deleteRow}}` bên trong nhóm chỉ xoá **đúng dòng** chứa nó của phần tử đó.
- Đóng `<</EACH>>` ngay trong dòng mở (hoặc không đóng) → đơn vị lặp vẫn là
  MỘT dòng như cũ.

### 7.2c Ẩn/hiện DÒNG (hoặc nhóm dòng) bằng `<<IF>>` trải nhiều ô

Mở `<<IF: điều_kiện>>` ở một ô và đóng `<</IF>>` ở ô khác:

| Phạm vi close | Kết quả khi điều kiện SAI |
|---|---|
| Ô khác **cùng dòng** | Xoá cả dòng đó |
| Ô của **dòng sau** | Xoá từ dòng mở tới dòng đóng (kể cả các dòng ở giữa) |
| Có `<<ELSE>>` ở dòng giữa | Giữ nhóm dòng từ `<<ELSE>>` tới `<</IF>>`, xoá nhóm trước đó |
| Có `<<ELSE>>` **cùng dòng** với mở/đóng | Xoá NỘI DUNG các ô của nhánh không chọn (giữ ô để không lệch lưới cột) |

IF lồng IF theo kiểu này cũng đúng: mỗi cấp được xét riêng. Trong bảng do vòng
lặp điều khiển, điều kiện đánh giá theo **từng phần tử/dòng**.

### 7.3c Bảng lồng trong ô bảng (EACH 2 cấp)

Trường hợp **bảng con nằm bên trong một ô của bảng ngoài**, cả 2 đều lặp theo
mảng (vd. mỗi dòng bảng ngoài chứa một bảng con liệt kê chi tiết): cú pháp này
**đã được hỗ trợ**. Đặt `<<EACH: outer>>` ở dòng template bảng ngoài, và trong
ô chứa bảng con đặt `<<EACH: inner>>` ở dòng template bảng con — engine clone
đúng cả 2 cấp, marker bảng con được giữ nguyên để bung theo từng phần tử.

> Nếu bảng con dùng cột số động (số cột tuỳ dữ liệu) thì cân nhắc marker
> `{{table: ...}}` ([mục 11A](#11a-bảng-cột-động-table)) thay cho EACH lồng.

### 7.4 Xử lý mảng rỗng

Khi mảng có 0 phần tử, hành vi mặc định: **xoá toàn bộ block**, bao gồm cả dòng marker.

**Modifier khi vòng lặp ở dòng bảng:**

| Modifier | Hiệu quả khi mảng rỗng |
|---|---|
| (mặc định) | Xoá dòng template |
| `keepRow` | Giữ 1 dòng trống, kế thừa style |
| `keepRow:N` | Giữ N dòng trống |
| `deleteRows:N` | Xoá dòng template + N dòng kế tiếp |

**Ví dụ:**
```text
<<EACH: guarantors|keepRow:3>>
{{name}} | {{cccd}}<<END>>
```
- Mảng có 5 phần tử → tạo 5 dòng.
- Mảng rỗng → giữ lại 3 dòng trống để ký tay.

### 7.5 Vòng lặp với điều kiện ELSE

Khi muốn hiện thông báo khác khi mảng rỗng (pattern phổ biến trong biểu mẫu ngân hàng):

```text
<<IF: hasItems(items)>><<EACH: items>>
{{name}}
<<END>><<ELSE>>
(Không có dữ liệu)
<<END>>
```

### 7.6 Lưu ý quan trọng

- Mỗi `<<EACH>>` cần đúng 1 `<<END>>` đóng tương ứng.
- KHÔNG đặt marker `{{pdf:}}`, `{{html:}}`, `{{include:}}`, `{{template:}}`, `{{sign:}}` bên trong vòng lặp nếu các marker đó đứng cùng dòng với text khác.
- Marker bên trong vòng lặp tham chiếu field của phần tử hiện tại — KHÔNG cần ghi đường dẫn từ gốc:

```text
<<EACH: products>>
{{name}}      ← tự động hiểu là products[i].name
<<END>>
```

---

## 7A. Cây đệ quy — `<<TREE>>`

Khác với `<<EACH>>` (lặp **một cấp** mảng phẳng), `<<TREE>>` lặp một **cây nhiều cấp** —
mỗi phần tử có thể chứa mảng con `children`, lồng sâu bao nhiêu cấp cũng được. Dùng cho
**điều khoản hợp đồng** (Điều → Khoản → Điểm → tiết) hoặc mục lục phân cấp.

### 7A.1 Cú pháp cơ bản

```text
<<TREE: clauses>>
{{indexTitle}} {{content}}
<</TREE>>
```

- `clauses` — mảng cây gốc trong JSON. Mỗi node có thể có field `children` (mảng node con).
- Khối giữa `<<TREE>>` và `<</TREE>>` (hoặc `<<END>>`) được áp **đệ quy** cho mọi cấp.
- Số/nhãn (`Điều 1`, `1.1`, `a)`) lấy **TỪ DATA** — engine KHÔNG tự sinh số.

Ví dụ data:
```json
{
  "clauses": [
    { "indexTitle": "Điều 1", "content": "Phạm vi áp dụng", "children": [
        { "indexTitle": "1.1", "content": "Bên A...", "children": [] },
        { "indexTitle": "1.2", "content": "Bên B..." }
    ]},
    { "indexTitle": "Điều 2", "content": "Hiệu lực" }
  ]
}
```
→ render lần lượt: `Điều 1 Phạm vi áp dụng`, `1.1 Bên A...`, `1.2 Bên B...`, `Điều 2 Hiệu lực`.

> Field con **bắt buộc tên `children`** (không đổi được). Lá (không có con) để `children` rỗng `[]` hoặc bỏ hẳn.

### 7A.2 Biến đặc biệt trong khối

| Biến | Ý nghĩa |
|---|---|
| `{{@depth}}` | Cấp hiện tại (1-based): cấp gốc = 1, con = 2, … |
| `{{@index}}` | Thứ tự node trong cùng cha (1-based) |

### 7A.3 Thụt lề (tuỳ chọn)

**Mặc định `<<TREE>>` KHÔNG thụt lề** — mọi cấp giữ nguyên lề gốc của đoạn template.
Phù hợp điều khoản đã tự đánh số (`1.2.1`). Muốn thụt lề theo cấp thì thêm tuỳ chọn:

| Tuỳ chọn | Mặc định | Ý nghĩa |
|---|---|---|
| `indent=N` | `0` (không thụt) | Thụt lề trái mỗi cấp, đơn vị **twips** (720 = 0.5 inch). Cấp k thụt thêm `N × (k−1)`. |
| `hanging=N` | `0` | Thụt treo (dòng đầu nhô ra, dòng sau thụt vào) — áp **mọi cấp**. Cho đoạn điều khoản dài. |
| `firstLine=N` | `0` | Thụt dòng đầu — áp **mọi cấp**. |

```text
<<TREE: clauses | indent=720>>          ← thụt 0.5 inch mỗi cấp
<<TREE: clauses | indent=360 | hanging=360>>   ← thụt theo cấp + treo dòng
```

> `hanging` và `firstLine` không dùng đồng thời được — nếu khai cả hai, `hanging` được ưu tiên.

### 7A.3b Tô đậm theo cấp & giới hạn độ sâu (tuỳ chọn)

| Tuỳ chọn | Mặc định | Ý nghĩa |
|---|---|---|
| `maxDepth=N` | `50` (giới hạn cứng) | Chỉ render tới cấp N; cấp sâu hơn (cả nhánh con) bị cắt. |
| `boldLevels=<set>` | (không) | **Tô đậm cả dòng** ở các cấp chỉ định. Chỉ thêm đậm, không bỏ đậm sẵn có. |
| `boldIndexLevels=<set>` | (không) | Chỉ tô đậm **field số/nhãn** (xem `indexField`) ở các cấp chỉ định. |
| `indexField=<tên>` | `no` | Tên field mà `boldIndexLevels` sẽ tô đậm (vd. `indexTitle`, `no`). |

**Cú pháp `<set>` chọn cấp:** `1` (chỉ cấp 1), `1-3` (cấp 1→3), `1,3` (cấp 1 và 3), `2-` (cấp 2 trở xuống). Token sai bị bỏ qua.

```text
<<TREE: clauses | boldLevels=1>>                       ← in đậm toàn bộ cấp 1 (Điều)
<<TREE: clauses | boldIndexLevels=1-2 | indexField=indexTitle>>  ← chỉ đậm số "Điều 1", "1.1"
<<TREE: clauses | maxDepth=3>>                         ← chỉ render 3 cấp đầu
```

### 7A.4 Lưu ý quan trọng

- Mỗi `<<TREE>>` cần đúng 1 `<</TREE>>` (hoặc `<<END>>`) đóng.
- Marker trong khối tham chiếu field của node hiện tại — KHÔNG ghi đường dẫn từ gốc.
- Có thể đặt `<<IF: cond>>...<</IF>>` bên trong khối TREE để lọc/định dạng theo từng node.
- Đặt được `<<TREE>>` cả ở đoạn văn thường lẫn bên trong ô bảng.
- Cây quá sâu (> 50 cấp) sẽ bị dừng để tránh lỗi — thực tế điều khoản không bao giờ đạt mức này.

---

## 8. Xuống dòng, xoá dòng và xoá cột

### 8.1 Xuống dòng trong giá trị

Khi giá trị JSON chứa `<<ENTER>>`, hệ thống chuyển thành line break trong Word.

**JSON:**
```json
{ "note": "Dòng 1<<ENTER>>Dòng 2" }
```

**Template:** `Ghi chú: {{note}}`

**Kết quả:** `Ghi chú: Dòng 1` (xuống dòng) `Dòng 2`

### 8.2 Xoá dòng bảng có điều kiện

`{{deleteRow}}` là từ khoá đặc biệt: nếu nó xuất hiện trong dòng bảng và được "kích hoạt" (vào nhánh IF đúng), **cả dòng bảng** đó sẽ bị xoá.

**Ví dụ:** Xoá dòng nếu trạng thái là "skip":

| Tên | Trạng thái |
|---|---|
| `<<EACH: rows>>{{name}}` | `<<IF: skip=true>>{{deleteRow}}<<ELSE>>Còn<<END>><<END>>` |

Khi `skip=true` → xoá dòng. Khi `false` → hiển thị "Còn".

### 8.3 Xoá cột bảng có điều kiện

`{{deleteCol}}` làm việc tương tự nhưng theo **chiều dọc**: cột chứa nó biến mất ở **mọi dòng**, các cột còn lại tự giãn ra cho kín bảng.

**Ví dụ:** bảng 4 kỳ báo cáo, kỳ 4 không có dữ liệu:

| Chỉ tiêu | `{{ky[0]}}` | `{{ky[1]}}` | `<<IF: ky[2]>>{{ky[2]}}<<ELSE>>{{deleteCol}}<</IF>>` |
|---|---|---|---|
| `<<EACH: dong\|deleteRows:1>>{{ten}}` | `{{v1}}` | `{{v2}}` | `{{v3}}<</EACH>>` |

Khi `ky[2]` rỗng → cột cuối biến mất, bảng còn 3 cột.

**Quy tắc:**

- `{{deleteCol}}` phải **chiếm trọn ô hoặc trọn một dòng trong ô** — không viết chung với chữ khác.
- Đặt ở ô nào cũng được, không bắt buộc dòng tiêu đề.
- Dùng được trong `<<EACH>>`; cột sẽ mất ở cả dòng tiêu đề.
- Bảng có **ô gộp** vẫn chạy đúng: ô gộp nhiều cột thì bị thu hẹp lại thay vì mất.
- Nếu lệnh xoá **hết** cột thì hệ thống bỏ qua, giữ nguyên bảng.

### 8.4 Tự xoá mọi cột trống — `{{deleteEmptyCols}}`

Không muốn viết `<<IF>>` cho từng cột: đặt `{{deleteEmptyCols}}` thành **một dòng riêng** trong ô bất kỳ của bảng. Sau khi điền dữ liệu, **cột nào mọi ô đều trống (kể cả tiêu đề) sẽ bị xoá**.

| Chỉ tiêu<br>`{{deleteEmptyCols}}` | `{{ky[0]}}` | `{{ky[1]}}` | `{{ky[2]}}` |
|---|---|---|---|

⚠️ Chỉ chạy khi bạn khai từ khoá này. Đừng dùng cho bảng có cột **cố ý để trống** (cột "Ghi chú" cho người ký điền tay, ô ký tên) — chúng sẽ bị xoá mất.

---

## 9. Chèn ảnh

```text
{{image: <nguồn> ; w=<rộng> ; h=<cao> ; align=<căn>}}
```

### 9.1 Cú pháp

- **Cùng dòng với text:** OK.
- **Dòng riêng:** OK, ảnh chiếm trọn dòng.
- **Đơn vị kích thước:** `pt`, `cm`, `mm`, `in`, `px`. Ví dụ: `w=120pt`, `w=4cm`, `w=1.5in`.
- **Bỏ `w=` và `h=`:** ảnh sẽ tự co về kích thước phù hợp với lề trang.
- **`align=` (tuỳ chọn):** `left`, `center`, `right`, `justify`. Nếu không khai báo, kế thừa căn lề của dòng chứa marker.

### 9.2 Ví dụ

```text
Chữ ký khách hàng: {{image: $signature ; w=80pt ; h=30pt}}

Logo công ty:
{{image: $logo ; w=4cm}}

{{image: $photo ; w=8cm ; align=center}}
```

### 9.3 Định dạng ảnh hỗ trợ

PNG, JPEG, GIF, BMP, TIFF.

### 9.4 Nguồn ảnh

Xem mục [16. Tham chiếu tài nguyên](#16-tham-chiếu-tài-nguyên).

---

## 10. Chèn PDF

Chèn nội dung file PDF vào tài liệu. **Marker phải đứng RIÊNG trên 1 dòng.**

```text
{{pdf: <nguồn> ; pages=<dải trang> ; w=<rộng> ; h=<cao> ; fit=<kiểu>}}
```

### 10.1 Tham số

| Tham số | Mô tả | Giá trị |
|---|---|---|
| `pages` | Trang nào của PDF cần chèn | `1-3` (trang 1 đến 3), `1,3,5` (chỉ định cụ thể) |
| `w`, `h` | Kích thước hiển thị | `w=200pt`, `h=300pt` |
| `fit` | Cách cắt nội dung | `smart` (mặc định, tự cắt header/footer thừa), `content` (chỉ cắt viền trắng), `page` (giữ nguyên), `raw` (cỡ tự nhiên) |
| `dpi` | Độ phân giải khi chuyển sang ảnh | `dpi=150` (mặc định), `dpi=300` (nét hơn, file lớn hơn) |
| `mode` | Cách chèn | `image` (mặc định — chèn dạng ảnh từng trang); `merge`/`reconstruct`/`native`/`cvp` (giữ chữ chọn được — nâng cao, hỏi team kỹ thuật trước khi dùng) |
| `croptop` / `cropbottom` / `cropleft` / `cropright` | Cắt thêm viền (pixel) khi chèn dạng ảnh | `croptop=20` |

### 10.2 Ví dụ

```text
Đính kèm hợp đồng:
{{pdf: $contract ; pages=1-5}}

{{pdf: $appendix ; pages=1 ; w=400pt ; fit=smart}}
```

### 10.3 Lưu ý quan trọng

- PDF được chèn **không thể chỉnh sửa** — chỉ hiển thị.
- Khi export sang PDF, nội dung sẽ giữ chất lượng cao hơn và có thể chọn được chữ.
- Trang PDF được tự động căn lề theo trang chính.

---

## 11. Chèn nội dung HTML

Chèn nội dung HTML định dạng (bảng, danh sách, text in đậm/nghiêng, màu, v.v.). **Marker phải đứng RIÊNG trên 1 dòng.**

```text
{{html: <nguồn> ; font=<font> ; size=<cỡ> ; align=<căn>}}
```

### 11.1 Tham số

| Tham số | Mô tả |
|---|---|
| `font` | **Ép** font chữ (vd. `font=Arial`) — thắng cả font khai trong HTML |
| `size` | **Ép** cỡ chữ, đơn vị pt (vd. `size=12`) — thắng cả cỡ chữ khai trong HTML |
| `align` | **Ép** căn lề (`left`, `center`, `right`, `justify`) |

**Không khai gì thì kế thừa**: khối HTML tự lấy font, cỡ chữ và căn lề của **dòng chứa marker**, nên hoà vào văn bản xung quanh. Chỉ khi HTML tự khai định dạng riêng thì HTML thắng.

**Khai tham số là ép**: dùng khi HTML dán từ trình soạn thảo (CKEditor…) mang sẵn `font-size` nhỏ xíu, làm đoạn đó lệch hẳn cỡ chữ với phần còn lại. Ép áp cho **mọi cấp** bên trong: tiêu đề, danh sách, ô bảng.

### 11.2 Ví dụ

```text
Điều khoản hợp đồng:
{{html: $terms ; font=Times New Roman ; size=11 ; align=justify}}
```

### 11.3 Lưu ý

- HTML hỗ trợ: text formatting (bold/italic/underline), bảng, danh sách, ảnh, SVG.
- **Mọi marker** (`{{html:}}`, `{{table:}}`, `{{image:}}`, `{{qr:}}`, `{{pdf:}}`) đặt trong **ô bảng** đều bám theo **bề rộng ô** (kể cả HTML khai `width:100%`), không tràn ra ngoài khung; đặt ở đoạn **thụt lề** thì bám phần bề rộng còn lại.
- Ô chọn kiểu radio/checkbox mà trình soạn thảo dựng bằng thẻ `<span>` (`data-radio-checked` / `data-checkbox-checked` / `aria-checked` / `aria-selected` / `aria-pressed`) được vẽ lại thành ◉ / ○ / ☑ / ☐ — nhìn ra ngay lựa chọn nào được chọn.
- Biểu tượng vẽ bằng CSS (icon-font) không có chữ: nếu có `aria-label`/`title` thì lấy nhãn đó làm nội dung, thay vì để ô trống.
- Nội dung trình duyệt KHÔNG hiển thị (`<template>`, `<datalist>`, `<noscript>`…) cũng không lọt vào tài liệu.
- HTML phức tạp với CSS được hệ thống tự xử lý để hiển thị đồng nhất giữa Word và PDF.
- Tham số `engine`: `native` (mặc định — chuyển HTML thành bảng/đoạn Word thật, chữ chọn được) hoặc `altchunk` (nhúng kiểu cũ, để Word tự dựng). Bình thường không cần khai.
- Không khuyến khích dùng JavaScript / iframe / form.

### 11.4 Dùng trong `<<EACH>>`, `<<IF>>` và trong bảng

Áp dụng cho MỌI marker nội dung (`{{html:}}`, `{{image:}}`, `{{pdf:}}`,
`{{table:}}`, `{{include:}}`…), không riêng HTML.

| Cách viết | Kết quả |
|---|---|
| `<<EACH: rows>>` … `{{html: @body}}` … `<</EACH>>` | Mỗi item render nội dung của CHÍNH item đó; đúng thứ tự kể cả khi HTML sinh ra bảng. |
| `<<EACH>>` lồng `<<EACH>>` | `@path` lấy theo item cấp TRONG (che field cấp ngoài, thiếu thì tìm lên cấp ngoài rồi tới gốc). |
| `<<IF: cond>>` … `{{html: @x}}` … `<</IF>>` (khối nhiều dòng) | Điều kiện sai → không render, không nhúng ảnh/quan hệ thừa vào file. |
| `<<IF: cond>>{{html: @x}}<</IF>>` (viết CÙNG một dòng, hay dùng trong ô bảng) | Hoạt động như khối nhiều dòng — điều kiện được xét TRƯỚC khi marker render. |
| Marker trong ô bảng tĩnh | Nội dung vào đúng ô; HTML có `<table>` → bảng lồng trong ô, bám bề rộng ô. |
| Marker trong ô của `<<EACH>>` mức dòng | Render theo từng dòng, `@path` lấy theo item của dòng đó. |
| `<<IF>>` viết trong ô của bảng do vòng lặp điều khiển | Điều kiện xét theo TỪNG item/dòng (trước đây xét theo dữ liệu gốc ⇒ điều kiện theo item luôn sai ⇒ mất nội dung ở mọi dòng). |
| `<<IF>>` mở ở một ô, đóng ở ô/dòng khác | Ẩn/hiện cả dòng (hoặc nhóm dòng) — xem [mục 7.2c](#72c-ẩnhiện-dòng-hoặc-nhóm-dòng-bằng-if-trải-nhiều-ô). |
| `<<EACH>>` bao quanh cả một bảng, trong ô có `<<IF>>` | Như trên — theo item của vòng lặp. |

**Giới hạn còn lại:** marker vẫn phải **đứng riêng trên dòng của nó**. Viết
`Nội dung: {{html: @body}}` (marker trộn với chữ thật) hoặc hai marker trên cùng
một dòng sẽ báo lỗi. Marker `<<IF>>/<<ELSE>>/<</IF>>/<<EACH>>/<</EACH>>` KHÔNG
tính là "chữ thật" — viết chung dòng với marker là hợp lệ.

---

## 11A. Bảng cột động — `{{table:}}`

Khi **số cột của bảng phụ thuộc dữ liệu** (vd. bảng chỉ tiêu theo kỳ/năm — mỗi
khách hàng có số kỳ khác nhau), `<<EACH>>` không tạo được cột động. Marker
`{{table: ...}}` **pivot một mảng JSON** thành bảng có số cột tự sinh theo dữ
liệu, rồi dựng thành bảng Word thật (chữ chọn được, không phải ảnh).

> Nếu số cột **cố định** (biết trước) → dùng `<<EACH>>` mức dòng ([mục 7.2](#72-lặp-theo-dòng-trong-bảng)) đơn giản hơn. `{{table:}}` chỉ cần khi **số cột thay đổi theo dữ liệu**.

**Marker phải đứng RIÊNG trên 1 dòng.**

### 11A.1 Cú pháp

```text
{{table: @<đường_dẫn_mảng>
         [ ; rowLabel=<field> HOẶC leadCols=<Tiêu đề>:<field>|<Tiêu đề>:<field>... ]
         ; group=<field_mảng_con> ; colKey=<field_tên_cột> ; value=<field_giá_trị>
         [ ; firstHeader=<text> ; emptyCell=<text> ; maxCols=<số>
           ; cellAlign=<căn> ; headerAlign=<căn> ; leadAlign=<căn>
           ; width=<css> ; border=<css> ; font=<font> ]}}
```

### 11A.2 Tham số

**Nguồn — bắt buộc `@`:** Nguồn phải là `@đường_dẫn` trỏ tới **một mảng JSON**
(không dùng `$file` đính kèm, không URL). Vd. `@policies`, `@data.rows`.

**Cột đầu (cố định) — tuỳ chọn, chọn 1 trong 2 (bỏ cả hai ⇒ bảng chỉ có cột động):**

| Tham số | Mô tả |
|---|---|
| `rowLabel=<field>` | Một cột đầu duy nhất, lấy từ field `<field>` của mỗi phần tử mảng. Kèm `firstHeader=` để đặt tiêu đề cột. |
| `leadCols=H1:f1\|H2:f2\|...` | Nhiều cột đầu. Mỗi cột là `Tiêu đề:field`, ngăn nhau bằng `\|`. `field` đặc biệt: `@index` (số thứ tự 1,2,3…), `@index0` (0,1,2…). |

> Khai `leadCols` thì `rowLabel`/`firstHeader` bị bỏ qua. Ký tự `|` và `:` là ký tự đặc biệt trong `leadCols` — không dùng trong tên tiêu đề/field.
>
> Không khai cả `leadCols` lẫn `rowLabel` cũng hợp lệ: bảng khi đó chỉ gồm các cột động.

**Cột động (tự sinh) — đều bắt buộc:**

| Tham số | Mô tả |
|---|---|
| `group=<field>` | Field chứa **mảng con** trong mỗi phần tử (mỗi phần tử con = 1 ô của các cột động). |
| `colKey=<field>` | Field trong phần tử con quyết định **tiêu đề cột động**. Các giá trị khác nhau → các cột (theo thứ tự xuất hiện đầu tiên). |
| `value=<field>` | Field trong phần tử con chứa **giá trị ô**. Trùng `colKey` trong cùng dòng → giá trị sau ghi đè. |

**Tuỳ chọn:**

| Tham số | Mặc định | Mô tả |
|---|---|---|
| `firstHeader` | `""` | Tiêu đề cột `rowLabel` (bỏ qua nếu dùng `leadCols`). |
| `emptyCell` | `""` | Hiển thị khi ô (dòng × cột) thiếu dữ liệu. Vd. `emptyCell=-`. |
| `maxCols` | `30` | Giới hạn số cột động; vượt → báo lỗi (chống bảng tràn). |
| `cellAlign` | `center` | Căn lề **mọi ô thân bảng** (kể cả cột đầu): `left`/`center`/`right`/`justify`. |
| `headerAlign` | `center` | Căn lề hàng tiêu đề. |
| `leadAlign` | = `cellAlign` | Căn lề **riêng các cột đầu**, đè `cellAlign`. Vd. `cellAlign=right ; leadAlign=left` cho bảng số liệu có cột nhãn căn trái. |
| `width` | `100%` | Bề rộng bảng (CSS), vd. `width=80%`. |
| `border` | `1px solid #000` | Viền ô (CSS). |
| `font` | (kế thừa đoạn) | Font cả bảng, vd. `font=Times New Roman`. |

### 11A.3 Ví dụ

**Dữ liệu JSON:**
```json
{
  "policies": [
    { "POLICY_NAME": "Doanh thu", "POLICY_YEARS": [
        { "POLICY_YEAR": "2022", "POLICY_VALUE": "16.7" },
        { "POLICY_YEAR": "2023", "POLICY_VALUE": "16.88" }
    ]},
    { "POLICY_NAME": "Chi phí", "POLICY_YEARS": [
        { "POLICY_YEAR": "2023", "POLICY_VALUE": "9.1" }
    ]}
  ]
}
```

**Marker:**
```text
{{table: @policies ; rowLabel=POLICY_NAME ; firstHeader=Chỉ tiêu
         ; group=POLICY_YEARS ; colKey=POLICY_YEAR ; value=POLICY_VALUE ; emptyCell=-}}
```

**Kết quả** (cột `2022`, `2023` tự sinh từ dữ liệu):

| Chỉ tiêu | 2022 | 2023 |
|---|---|---|
| Doanh thu | 16.7 | 16.88 |
| Chi phí | - | 9.1 |

**Có cột STT bằng `leadCols`:**
```text
{{table: @data ; leadCols=STT:@index|Chỉ tiêu:indicatorName
         ; group=periods ; colKey=period ; value=value ; emptyCell=- ; maxCols=50}}
```

### 11A.4 Lưu ý

- Nguồn **phải là mảng** qua `@path`; mảng rỗng / path không có / 0 cột hợp lệ → **xoá marker, không chèn bảng** (giống `<<EACH>>` rỗng, không báo lỗi).
- Ký tự đặc biệt HTML (`&`, `<`, `>`, `"`) trong nhãn/giá trị được **tự escape** an toàn.
- Không hỗ trợ gom nhóm nhiều cấp trong 1 marker — cấu trúc lồng sâu dùng `<<EACH>>` lồng ([mục 7.3c](#73c-bảng-lồng-trong-ô-bảng-each-2-cấp)).

---

## 12. Đính kèm file Word khác

Chèn nguyên một file Word khác vào template hiện tại. **Marker phải đứng RIÊNG trên 1 dòng.**

```text
{{include: <nguồn>}}
```

### 12.1 Ví dụ

```text
Điều khoản và điều kiện vay:
{{include: $terms_attachment}}
```

### 12.2 Lưu ý

- File con phải là `.docx` hợp lệ.
- Lề trang, header/footer của file con sẽ **tự động kế thừa** từ template chính (không bị xoay trang, không có header riêng).
- Format gốc (font, màu, bảng, ảnh) giữ nguyên.

---

## 13. Tái sử dụng template con

Khi cần render template con với một phần dữ liệu JSON riêng. **Marker phải đứng RIÊNG trên 1 dòng.**

```text
{{template: <nguồn> ; data=<đường dẫn JSON>}}
```

### 13.1 Ví dụ

**Template chính:**
```text
Thông tin khách hàng chính:
{{template: $customerTemplate ; data=primaryCustomer}}

Thông tin người đồng vay:
{{template: $customerTemplate ; data=coBorrower}}
```

**Template con `$customerTemplate`:**
```text
Họ tên: {{name}}
CCCD: {{cccd}}
```

**JSON:**
```json
{
  "primaryCustomer": { "name": "Nguyễn Văn A", "cccd": "001..." },
  "coBorrower":      { "name": "Nguyễn Thị B", "cccd": "002..." }
}
```

### 13.2 Lưu ý

- Template con KHÔNG được tham chiếu lại template gốc (sẽ bị từ chối để tránh lặp vô hạn).
- Có thể lồng tối đa 10 cấp.

---

## 14. Chèn mã QR

Tạo QR code và chèn vào template.

```text
{{qr: <dữ liệu hoặc @đường_dẫn_JSON> ; w=<rộng> ; ecc=<mức sửa lỗi> ; size=<px> ; margin=<padding>}}
```

### 14.1 Tham số

| Tham số | Mô tả | Giá trị |
|---|---|---|
| `w`, `h` | Kích thước hiển thị | `w=3cm` |
| `ecc` | Mức độ sửa lỗi | `L` (7%), `M` (15%, mặc định), `Q` (25%), `H` (30% — chống xước/in mờ tốt) |
| `size` | Kích thước pixel của QR | `size=256` |
| `margin` | Padding trắng quanh QR | `margin=2` |
| `fg` | Màu mã (hex) | `fg=#000000` |
| `bg` | Màu nền | `bg=#FFFFFF` hoặc `bg=transparent` |
| `logo` | Logo nhỏ ở giữa QR | `logo=$logo` |
| `logoscale` | Tỷ lệ bề rộng logo / bề rộng QR | `logoscale=0.2` (logo bằng 20% QR) |
| `logopad` | Khoảng trắng quanh logo (pixel QR) | `logopad=4` |
| `align` | Căn lề | `left`/`center`/`right` |

### 14.2 Ví dụ

**Dữ liệu cố định:**
```text
QR cố định: {{qr: HELLO-BIDV-2026 ; w=2cm}}
```

**Dữ liệu từ JSON:**
```text
QR mã giao dịch: {{qr: @transactionId ; w=3cm ; ecc=H}}
QR thanh toán VietQR: {{qr: @vietqr_payload ; w=4cm ; ecc=H}}
```

**QR có logo ở giữa:**
```text
{{qr: @companyUrl ; w=3cm ; ecc=H ; logo=$brandLogo}}
```

### 14.3 Lưu ý

- Dấu `@` ở đầu nghĩa là lấy giá trị từ JSON path.
- Không có `@` → coi là chuỗi literal (text gốc).
- ECC cao (`H`) phù hợp khi QR in nhỏ hoặc dán vào ảnh nền.

---

## 15. Khung ký số

Khai báo "khung ký" trên template; khi xuất ra PDF, hệ thống sẽ trả về toạ độ chính xác của khung (page, x, y, width, height, **xMm, yMm, widthMm, heightMm**) cho hệ thống ký số (HashKit) sử dụng. **Marker phải đứng RIÊNG trên 1 dòng.**

### 15.1 Tổng quan

Có **2 chế độ** chính:

| Chế độ | Khi nào dùng | Output |
|---|---|---|
| **`render=field`** (mặc định) | Để vùng ký TRỐNG cho signing service đặt PAdES sau | Toạ độ rectangle vùng trống |
| **`render=image`** | Render ảnh chữ ký BIDV chuẩn (logo + text) ngay trên PDF cuối | Toạ độ ảnh thật đã vẽ |

Chế độ `render=image` có 2 sub-style:

| Style | Layout | Khi nào dùng |
|---|---|---|
| **`style=bidv`** (mặc định) | Nền BIDV + text 2 cột: nhãn đậm trái, giá trị phải. | Form ngân hàng BIDV chuẩn |
| **`style=classic`** | Viền xanh bo góc + logo trái + tên/chức danh phải | Back-compat user cũ |

Layout `style=bidv` — **dòng nào không truyền dữ liệu thì không vẽ**, kể cả "Ngày ký":

```text
Người ký:          Uông Thị Hải Yến          ← signerName
Vai trò:           Cấp kiểm soát BCTĐTD      ← signerTitle
Ngày ký:           23/07/2026 15:07:07       ← signdate
Tổ chức xác thực:  Viettel Certification…    ← ca
Mã GD:             TX-2026-0001              ← txcode
```

Cỡ chữ tự co lại nếu dòng dài vượt bề ngang cột — không bị cắt cụt ở mép vùng ký.

### 15.2 Cú pháp

```text
{{sign: <fieldName> ; role=<ROLE> ; w=<rộng> ; h=<cao>
        [ ; render=field|image ; style=bidv|classic
        ; bg=<key|$path|url>
        ; signerName=<text|$path> ; signerTitle=<text|$path>
        ; signdate=<text|$path> ; ca=<text|$path> ; txcode=<text|$path>
        ; logo=<src>
        ; order=<int> ; required=<bool> ]}}
```

### 15.3 Tham số

| Tham số | Bắt buộc | Mô tả |
|---|---|---|
| `<fieldName>` (positional) | ✅ | Mã định danh, chỉ `[a-zA-Z0-9_-]`, bắt đầu bằng chữ, max 64. Duy nhất trong cả template. |
| `role` | ✅ | Vai trò người ký, HOA. VD: `CUSTOMER`, `BANK_OFFICER`, `BANK_HSM`, `NOTARY`, `WITNESS`. Dùng để pick default `bg`. |
| `w`, `h` | ✅ | Kích thước. VD: `w=74mm ; h=30mm`. **Min `20×15mm`** (HashKit). Tỷ lệ **tuỳ ý** — nền giữ tỷ lệ và canh giữa nên chỉ thừa lề; khít nhất là đúng tỷ lệ ảnh nền (`BIDV` ≈ 2.46, bundle cũ = 2). |
| `render` | – | `field` (default) hoặc `image`. |
| `align` | – | `left`/`center`/`right`/`justify` — căn vùng ký trong ô/dòng chứa nó. Áp dụng cho **cả 2 chế độ** `render`. Bỏ trống → **kế thừa căn lề của chính dòng `{{sign:}}`** trong template (Ctrl+E/L/R trong Word). |
| `style` | – | `bidv` (default cho `render=image`) hoặc `classic`. |
| `bg` | – | **Chỉ `style=bidv`.** Bundle key (xem 15.4), `$path` JSON, hoặc URL. Bỏ → auto theo `role`. |
| `signerName` | – | **Chỉ `render=image`.** Dòng "Người ký". Literal hoặc `$path.to.field`. |
| `signerTitle` | – | **Chỉ `render=image`.** Dòng "Vai trò". Literal hoặc `$path`. |
| `signdate` | – | **Chỉ `style=bidv`.** Dòng "Ngày ký", pre-formatted (gợi ý `HH:mm:ss dd/MM/yyyy`). Bỏ → **ẩn dòng**, service không tự điền ngày hiện tại. |
| `ca` (alias `caname`) | – | **Chỉ `style=bidv`.** Dòng "Tổ chức xác thực" (vd. `Viettel Certification Authority`). Literal hoặc `$path`. Bỏ → ẩn dòng. |
| `txcode` | – | **Chỉ `style=bidv`.** Dòng "Mã GD" (vd. `TX-2026-0001`). Bỏ → ẩn dòng. |
| `logo` | – | **Chỉ `style=classic`.** Logo: `$asset`, URL, `data:` URL. |
| `order` | – | Thứ tự ký 1..N. Set 1 → phải set TẤT CẢ. |
| `required` | – | `true` (default) / `false`. |

### 15.4 Bundle bg key (style=bidv)

Render-service ship sẵn 9 ảnh nền BIDV trong classpath `sign-bg/`:

| Key | Mô tả | Dùng cho |
|---|---|---|
| `BIDV` | **Mặc định** — logo BIDV mờ toàn khung, không viền | Mọi role, khi không truyền `bg=` |
| `BIDV_HSM` | Logo BIDV đậm + pattern + tick (A4 60×30mm) | Ký tổ chức HSM |
| `BIDV_STAFF` | Logo BIDV nhạt + pattern + tick (A4) | Nhân viên cá nhân BIDV |
| `BORDER_1` | Viền tick lớn, không logo (A4) | Khách hàng generic |
| `BORDER_2` | Viền tick góc, không logo (A4) | Generic khác |
| `BIDV_HSM_A5` / `BIDV_STAFF_A5` / `BORDER_1_A5` / `BORDER_2_A5` | Variant A5 50×25mm | Form A5 |

**Default mapping `role` → `bg`** (khi không truyền `bg=`): **mọi role → `BIDV`**.

Muốn tách nền theo role thì thêm entry vào config `render.sign.role-to-bg` (xem [docs/API.md](API.md)), vd:

```yaml
render:
  sign:
    role-to-bg:
      BANK_HSM: BIDV_HSM
      CUSTOMER: BORDER_1
      "[*]": BIDV          # wildcard fallback — bắt buộc viết dạng "[*]"
```

### 15.5 Ví dụ

**Vùng ký trống (mặc định) — cho signing service đặt PAdES sau:**

```text
Khách hàng:
{{sign: sig_customer ; role=CUSTOMER ; w=180pt ; h=70pt ; order=1}}

Cán bộ ngân hàng:
{{sign: sig_bank ; role=BANK_OFFICER ; w=180pt ; h=70pt ; order=2}}
```

**Vùng ký BIDV-style — render ảnh chữ ký chuẩn:**

```text
Khách hàng:
{{sign: sig_customer ; role=CUSTOMER ; w=60mm ; h=30mm ; render=image
        ; signerName=$customer.name ; signerTitle=$customer.title
        ; signdate=$tx.signedAt ; txcode=$tx.code}}

Ngân hàng (HSM):
{{sign: sig_bank ; role=BANK_HSM ; w=60mm ; h=30mm ; render=image
        ; signerName=$bank.org}}
```

→ `sig_customer` dùng `BORDER_1` (default cho CUSTOMER), `sig_bank` dùng `BIDV_HSM` (default cho BANK_HSM). Ảnh render trực tiếp vào PDF, response header `X-Signature-Metadata.fields[*].background` ghi rõ key đã dùng.

**Override bg explicit:**

```text
{{sign: sig_witness ; role=WITNESS ; w=50mm ; h=25mm ; render=image
        ; bg=BIDV_STAFF_A5 ; signerName=$witness.name}}
```

**Khung ký có điều kiện:**

```text
<<IF: needNotary>>
{{sign: sig_notary ; role=NOTARY ; w=60mm ; h=30mm ; render=image ; required=false
        ; signerName=$notary.name ; signerTitle=Công chứng viên}}
<<END>>
```

**Vùng ký theo danh sách người ký:**

```text
<<EACH: signers>>
{{sign: sig_{{@index}} ; role={{role}} ; w=60mm ; h=30mm ; render=image
        ; signerName={{name}} ; signerTitle={{title}}}}
<<END>>
```

**Classic style (back-compat):**

```text
{{sign: sig_old ; role=CUSTOMER ; w=200pt ; h=80pt ; render=image ; style=classic
        ; logo=$bankLogo ; signerName=$customer.name ; signerTitle=Chủ tài khoản}}
```

### 15.6 Lưu ý quan trọng

- **Min kích thước `20mm × 15mm`** (HashKit constraint). Sai → 400 `POSITION_TOO_SMALL`.
- Style `bidv` **không ép tỷ lệ**. Khuyến nghị `74×30mm` cho nền mặc định `BIDV` (tỷ lệ ~2.46) hoặc `60×30mm` cho bundle cũ — khi đó nền phủ kín vùng ký, không thừa lề.
- Số lượng khung ký tối đa **30/tài liệu**.
- Mỗi `<fieldName>` chỉ được dùng **1 lần** trong cả template.
- KHÔNG dùng khung ký trong header/footer của Word.
- Khi xuất Word (không phải PDF), khung ký hiển thị **chỗ trống đúng kích thước** (mode field) hoặc **ảnh chữ ký đã vẽ** (mode image) — dùng để xem layout trước.
- Sai số kích thước cho phép trong header metadata: `width ±2pt`, `height ±3pt` (do font/layout engine LibreOffice).
- Output PDF có thêm field `xMm`, `yMm`, `widthMm`, `heightMm` trong JSON metadata — tiện consumer dùng trực tiếp với HashKit `Position` (nhận mm).

### 15.7 Troubleshooting — Lỗi thường gặp

#### Bảng error → cause → fix

| Error message | Nguyên nhân thường gặp | Cách khắc phục |
|---|---|---|
| `POSITION_TOO_SMALL: widthMm phải >= 20mm` | DSL truyền `w=10mm` (hoặc tương đương `w=28pt`, `w=1cm`, ...) | Tăng `w` lên ≥ `20mm`. Đơn vị chấp nhận: mm/pt/cm/in/px/emu |
| `POSITION_TOO_SMALL: heightMm phải >= 15mm` | `h` < 15mm | Tăng `h` ≥ 15mm |
| `Marker {{sign:}} fieldName không hợp lệ` | Field name có space, ký tự đặc biệt, bắt đầu bằng số | Pattern `^[a-zA-Z][a-zA-Z0-9_-]{0,63}$`. Vd. `sig_customer_1` (✅) vs `1_sig` (❌) |
| `Marker {{sign:}} role không hợp lệ` | Role không HOA, hoặc có dấu | Pattern `^[A-Z][A-Z0-9_]{0,31}$`. Vd. `CUSTOMER` (✅) vs `customer` (❌) |
| `Marker {{sign:}} cần cả w= và h= explicit` | Thiếu `w=` hoặc `h=` | Bắt buộc cả 2 (khác `{{image}}` auto-fit) |
| `Marker {{sign:}} style= không hợp lệ: '...'` | `style=foo` không phải `bidv`/`classic` | Chỉ chấp nhận 2 giá trị này |
| `Marker {{sign:}} bg= không resolve được` | `bg=NOT_EXIST` không phải bundle key, không phải URL, không phải `$path` JSON | Dùng 1 trong: `BIDV_HSM/STAFF`, `BORDER_1/2` (+ suffix `_A5`), URL, hoặc `$.json.path` |
| `Sign region '...' không extract được toạ độ — placeholder bị LibreOffice drop` | Marker đặt trong text box / SmartArt / shape → LibreOffice không paginate đúng | Đặt marker trên paragraph riêng trong body, không phải shape |
| `Sign region '...' bị tách qua 2 page` | Khối vùng ký cao hơn vùng in của **cả một trang trống** (h= quá lớn, hoặc ô bảng chứa marker dài hơn 1 trang). Trường hợp "marker nằm sát mép trang" đã tự xử lý: engine gắn `w:keepNext`/`w:keepLines` (+ `w:cantSplit` cho row bảng) nên cả khối tự nhảy sang trang mới nguyên vẹn | Giảm `h=`, hoặc tách bớt nội dung trong ô bảng chứa marker |
| `Sign region '...' (render=image) không tìm được ảnh chữ ký` | Ảnh placeholder bị LibreOffice drop hoặc đẩy sang trang khác | Đảm bảo marker trên paragraph riêng + đủ chỗ trong layout |
| `Sign order phải set cho TẤT CẢ markers hoặc KHÔNG marker nào` | Mix `order=1` cho 1 marker, để auto cho marker khác | All-or-nothing: hoặc set explicit cho TẤT CẢ, hoặc bỏ trống TẤT CẢ |
| `Sign fieldName trùng: '...' xuất hiện 2 lần` | Copy-paste marker mà quên đổi fieldName | Mỗi fieldName chỉ dùng 1 lần trong template |
| `Marker {{sign:}} chưa hỗ trợ trong header/footer template` | Đặt marker vào header/footer Word | Đưa marker vào body (phase 1 không support header/footer) |

#### FAQ

**Q: Tại sao output Word (`exportType=word`) KHÔNG có header `X-Signature-Metadata`?**

A: Toạ độ vùng ký được đo bằng `PDFTextStripper` trên PDF cuối (sau Gotenberg convert). Word output không có pipeline này → trả header `X-Signature-Metadata-Skipped: word-output-no-pdf-coords` thay vì coords. DOCX vẫn hiển thị placeholder đúng kích thước để preview layout.

**Q: Tại sao 2 vùng ký trùng `fieldName` bị reject ngay khi parse template?**

A: `fieldName` là khóa duy nhất trong response JSON `fields[]` — caller (HashKit) phân biệt vùng ký theo key này. Trùng → caller không biết apply chữ ký vào vùng nào. Validator reject sớm để tránh runtime ambiguous.

**Q: Tại sao `Ctrl+F "##SIGN:"` trong PDF cuối đôi khi vẫn thấy?**

A: Sentinel đã được redact khỏi content stream nhưng LibreOffice đôi khi split sentinel qua nhiều text-show ops → redact sót. Header response có `X-Signature-Sentinel-Redact-Warnings: <count>` chỉ ra số sentinel còn sót. Visual vẫn invisible (font 0.5pt trắng). Nếu cần strict (banking PAdES): caller có thể reject khi `count > 0` và re-render.

**Q: Sao vùng ký BIDV-style chỉ hiển thị 2-3 dòng thay vì 4?**

A: Mọi dòng đều ẩn nếu trường tương ứng null/blank — **kể cả "Ngày ký"**. Service không tự điền giờ hệ thống vì ngày trên con dấu là thời điểm ký theo nghiệp vụ, không phải thời điểm sinh file. Không truyền trường nào thì ảnh chỉ có nền BIDV. Đây là behavior intentional — không cần "fill rỗng" để giữ đủ dòng.

**Q: Tỷ lệ vùng ký có phải theo ảnh nền không?**

A: Không, và cũng không bị validate. Renderer vẽ ảnh nền kiểu *contain* — giữ nguyên tỷ lệ, canh giữa vùng ký — nên tỷ lệ lệch chỉ làm thừa lề trên/dưới (hoặc trái/phải), logo BIDV không bị bóp méo và không bị cắt. Muốn nền phủ kín thì khai đúng tỷ lệ ảnh nền: `BIDV` = 1010×410 (≈2.46, vd `74×30mm`), các bundle cũ = 2:1 (`60×30mm`).

**Q: Sao chữ tên dài bị clip ở mép vùng ký?**

A: Renderer KHÔNG auto-fit font size, KHÔNG truncate. Match HashKit behavior "draw anyway, may overflow". Template designer phải chọn `w/h` đủ rộng cho data dự kiến. Vd. tên "NGÂN HÀNG TMCP ĐẦU TƯ VÀ PHÁT TRIỂN VIỆT NAM" cần vùng ≥ 80mm width.

**Q: Test local với Gotenberg ra sao?**

A: `docker run --rm -p 3000:3000 gotenberg/gotenberg:8` rồi chạy `./mvnw test -Dtest='SignE2EWithGotenbergTest'`. Test auto skip nếu Gotenberg down (`@Assumptions.assumeTrue` check `localhost:3000/health`).

---

## 15A. Khối so sánh (SECTION)

Cú pháp `<<SECTION: id [| label="..." | muc="..." | khoan="..." | mode="..."]>>` ... `<<ENDSECTION>>` đánh dấu một **khối logic** trong template để hệ thống nhận diện khi so sánh 2 phiên bản hợp đồng đã render và sinh "Văn bản bổ sung" (phụ lục) hoặc VBBS.

> **📘 Tài liệu chi tiết cho tester**: Xem [TEMPLATE_SECTION_GUIDE.md](TEMPLATE_SECTION_GUIDE.md) — hướng dẫn đầy đủ về cú pháp `<<SECTION>>`, quy trình test, 8 test case mẫu (UPDATE / INSERT / DELETE / preserve / lồng IF-EACH / lỗi cú pháp), và checklist trước khi đưa template lên production.

> **Lưu ý**: `<<SECTION>>` dùng close tag riêng `<<ENDSECTION>>` — KHÔNG share `<<END>>` với IF/EACH. Điều này tránh ambiguity hoàn toàn khi SECTION chứa IF/EACH bên trong.

### 15A.1 Khi nào dùng

Khi bạn muốn, ở 1 thời điểm trong tương lai, sinh ra **phụ lục bổ sung** chỉ liệt kê những **khối** đã thay đổi giữa 2 phiên bản hợp đồng (vd. "V_2024" vs "V_2025"). Mỗi khối bạn bọc bằng `<<SECTION: id>>...<<ENDSECTION>>` sẽ được lấy **nguyên cả khối** khi có thay đổi — kể cả khi chỉ 1 field bên trong đổi giá trị.

> Nếu chưa có nhu cầu so sánh — **không cần dùng** marker này. Template không có `<<SECTION>>` vẫn render bình thường.

### 15A.2 Cú pháp

**Dạng đầy đủ (khuyến nghị):**
```text
<<SECTION: lai_suat_co_dinh | label="Lãi suất cố định" | muc="5. Lãi suất, Phí" | khoan="a) Lãi suất cho vay trong hạn">>
Lãi suất áp dụng: {{LS_CODINH}}%/năm.
Áp dụng trong suốt thời hạn vay, không thay đổi.
<<ENDSECTION>>
```

**Dạng rút gọn (chỉ id):**
```text
<<SECTION: lai_suat_co_dinh>>
...
<<ENDSECTION>>
```

| Tham số | Bắt buộc | Mô tả |
|---|---|---|
| `id` | ✓ | Định danh máy của khối. Quy tắc: bắt đầu chữ/`_`, chỉ chứa chữ-số-`_`, không dấu, không khoảng trắng. Mỗi `id` chỉ dùng 1 lần trong toàn template. **Một khi đã dùng thì không đổi** — đổi `id` qua các phiên bản template = mất khả năng align khi so sánh. |
| `label` | (tuỳ chọn) | **Nhãn người-đọc-được** dùng cho phụ lục so sánh (`/compare/docx`). Đặt trong cặp dấu nháy kép. Chấp nhận tiếng Việt có dấu, khoảng trắng. |
| `muc` | (tuỳ chọn) | Tên **mục** trong hợp đồng (vd. `"5. Lãi suất, Phí"`). Dùng cho VBBS để sinh câu *"Sửa đổi, bổ sung khoản {khoan} thuộc mục {muc}"*. |
| `khoan` | (tuỳ chọn) | Tên **khoản** trong mục (vd. `"a) Lãi suất cho vay trong hạn"`). Dùng cho VBBS như trên. |
| `mode` | (tuỳ chọn) | Chế độ xử lý đặc biệt. Hiện hỗ trợ `mode="preserve"` — đánh dấu khối là **context** (mục A "Bên cấp tín dụng", mục B "Bên vay") để mang nguyên sang VBBS qua `{{include: $sec_new_<id>}}`. Vẫn sinh hunk UPDATE nếu content khác giữa V_old/V_new. |

Nếu **không khai báo `label`**, hệ thống sẽ hiển thị `id` trong tiêu đề phụ lục/VBBS.
Nếu **không khai báo `muc`/`khoan`**, câu tiêu đề mục VBBS sẽ rút gọn (dùng `label` làm fallback nếu có).

`<<SECTION: ...>>` và `<<ENDSECTION>>` phải đứng **một dòng riêng** (như `<<EACH>>` block). Các attribute có thể đặt theo bất kỳ thứ tự nào, đều tuỳ chọn.

### 15A.3 Ví dụ

**Template:**
```text
Hợp đồng tín dụng số {{SO_HD}}

<<SECTION: lai_suat | label="Lãi suất cố định">>
Lãi suất áp dụng: {{LS_CODINH}}%/năm
Áp dụng trong suốt thời hạn vay.
<<ENDSECTION>>

<<SECTION: dieu_khoan | label="Điều khoản hợp đồng">>
Điều khoản hợp đồng:
- Bên A có trách nhiệm thanh toán đúng hạn.
- Bên B cung cấp dịch vụ theo cam kết.
<<ENDSECTION>>
```

**Render 2 lần với 2 JSON khác nhau (V_old, V_new):**
- V_old: `{"SO_HD":"001","LS_CODINH":"8.0"}`
- V_new: `{"SO_HD":"001","LS_CODINH":"9.5"}`

**Gọi API so sánh** `POST /api/v1/compare/docx` (multipart `old`, `new`) → nhận file `phu-luc-bo-sung-*.docx` chứa:

```
PHỤ LỤC — CÁC THAY ĐỔI GIỮA 2 PHIÊN BẢN
So sánh: "V_2024" → "V_2025" | 1 mục khác biệt

── Mục 1. THAY ĐỔI — Lãi suất cố định ──
V_2024:
  Lãi suất áp dụng: 8.0%/năm
  Áp dụng trong suốt thời hạn vay.
V_2025:
  Lãi suất áp dụng: 9.5%/năm
  Áp dụng trong suốt thời hạn vay.
```

Lưu ý:
- Tiêu đề mục có **nhãn `Lãi suất cố định`** — người đọc biết ngay đâu là phần thay đổi.
- Cả 2 dòng trong section được đưa vào phụ lục, không chỉ dòng chứa `{{LS_CODINH}}` — đảm bảo ngữ cảnh đầy đủ.
- Các loại tiêu đề: `THAY ĐỔI` (section có ở cả 2 nhưng nội dung khác), `BỔ SUNG MỚI` (chỉ có ở V_new), `ĐÃ LOẠI BỎ` (chỉ có ở V_old).

### 15A.4 Cách viết nhãn (label) tốt

Nhãn nên là **cụm danh từ ngắn** (3-6 từ) mô tả nội dung khối, không cần dấu chấm cuối:

| ✓ Tốt | ✗ Tránh |
|---|---|
| `"Lãi suất cố định"` | `"lai_suat_co_dinh"` (đã có ở id) |
| `"Điều khoản tất toán trước hạn"` | `"Khối điều khoản số 5 trong hợp đồng tín dụng"` (quá dài) |
| `"Hạn mức tín dụng"` | `"Mục 1.2"` (chỉ vị trí, không cho biết nội dung) |
| `"Phí phạt chậm trả"` | `"Phí phạt chậm trả (xem mục 3.4 phụ lục B)"` (chứa thông tin tham chiếu sẽ lệch khi tài liệu đổi) |

### 15A.5 Quy tắc và giới hạn (v1)

- SECTION có thể chứa field `{{...}}`, EACH, IF — nội dung bên trong render bình thường. Vì close tag riêng `<<ENDSECTION>>`, không bao giờ pop nhầm với `<<END>>` của IF/EACH lồng trong.
- SECTION rỗng (giữa `<<SECTION>>` và `<<ENDSECTION>>` không có nội dung) → bỏ qua (không tạo bookmark).
- Marker `<<SECTION>>` và `<<ENDSECTION>>` của nó **bị xoá khỏi output** sau render — không lộ trong file Word.
- SECTION trong header/footer hiện chưa hỗ trợ so sánh (chỉ body chính).
- SECTION trong row template của `<<EACH>>` table không khuyến nghị — bookmark sẽ trùng id giữa các iteration.

### 15A.6 Lưu ý vận hành

- Chỉ thêm `<<SECTION>>` cho những khối thực sự cần theo dõi thay đổi (vd. lãi suất, phí, hạn mức, điều khoản pháp lý chính). **Không nên** bọc cả tài liệu — phụ lục sẽ quá dài và mất ý nghĩa.
- Đổi tên `id` qua các phiên bản template = mất khả năng so sánh khối đó (engine không nhận diện được "đây là cùng khối"). Quy ước: **id một khi đã dùng thì không đổi**. Còn `label`, `muc`, `khoan` thì có thể đổi tự do.

### 15A.7 VBBS — Văn bản Sửa đổi Bổ sung

Endpoint `POST /api/v1/compare/vbbs` sinh **VBBS đầy đủ** (theo Mẫu 05/HĐTD) từ 2 phiên bản HĐ đã render + template VBBS + metadata. Template VBBS có thể dùng các marker đặc biệt sau:

**Marker `<<EACH: hunks>>` — duyệt từng mục sửa đổi**

Mỗi hunk có các field:
- `{{index}}` — số thứ tự (1, 2, 3, ...)
- `{{title}}` — câu sinh tự động: *"Sửa đổi, bổ sung khoản X thuộc mục Y"* (UPDATE), *"Bổ sung khoản X thuộc mục Y"* (INSERT), *"Loại bỏ khoản X thuộc mục Y"* (DELETE)
- `{{muc}}`, `{{khoan}}` — text gốc khai trong template HĐ
- `{{op}}` — `"UPDATE"` / `"INSERT"` / `"DELETE"`
- `{{isUpdate}}` / `{{isInsert}}` / `{{isDelete}}` — boolean cho IF
- `{{include: @oldAsset}}` — chèn nội dung phiên bản CŨ của section đó (chỉ có ở UPDATE/DELETE)
- `{{include: @newAsset}}` — chèn nội dung phiên bản MỚI (chỉ có ở UPDATE/INSERT)

**Marker `{{include: $sec_new_<id>}}` và `{{include: $sec_old_<id>}}` — mang nguyên section sang VBBS**

Khi VBBS cần nhúng **nguyên một khối** từ HĐ (không qua diff), dùng convention sau:
- `{{include: $sec_new_<id>}}` — nhúng nội dung của SECTION `<id>` lấy từ V_new (phiên bản hiện tại).
- `{{include: $sec_old_<id>}}` — nhúng nội dung của SECTION `<id>` lấy từ V_old (phiên bản cũ).

Service tự pre-extract mọi section của V_old/V_new thành asset có tên cố định theo convention này — template chỉ việc tham chiếu, không cần khai trong JSON.

**Ví dụ**: trong template HĐ khai báo:
```text
<<SECTION: thong_tin_khach_hang | label="Thông tin khách hàng" | mode="preserve">>
Khách hàng: {{customer.name}}
CCCD: {{customer.idNo}}
Địa chỉ: {{customer.address}}
<<ENDSECTION>>
```

Trong template VBBS (mục B):
```text
B. BÊN ĐƯỢC CẤP TÍN DỤNG (sau đây gọi là Khách hàng):
{{include: $sec_new_thong_tin_khach_hang}}
```

→ VBBS sẽ chứa nguyên section "Thông tin khách hàng" đã render của V_new, giữ format gốc, không cần khai lại metadata.

**Khuyến nghị**: thêm `mode="preserve"` cho các section "context" (mục A, B, thông tin chung) để chúng được hiểu đúng vai trò (context, không phải hunk pháp lý).

> Lưu ý: hiện tại `mode="preserve"` vẫn sinh hunk UPDATE **nếu V_old/V_new khác nội dung** (vd. SĐT khách hàng đổi) — để bạn không bỏ sót thay đổi quan trọng.

**Cách trigger INSERT / DELETE**

Cú pháp `<<SECTION>>` đặt trong `<<IF: cond>>` để xuất hiện có điều kiện. Khi flag khác nhau giữa V_old và V_new, section sẽ tự động sinh hunk INSERT hoặc DELETE:

```text
<<IF: data.hasGuarantor>>
<<SECTION: nguoi_bao_lanh | muc="Bổ sung điều khoản bảo lãnh" | khoan="Người bảo lãnh">>
Người bảo lãnh: {{data.guarantor.name}}.
CCCD: {{data.guarantor.idNo}}.
Địa chỉ: {{data.guarantor.address}}.
<<ENDSECTION>>
<<END>>
```

- V_old có `hasGuarantor = false` → IF tắt → section không có trong file V_old render.
- V_new có `hasGuarantor = true` → section xuất hiện trong V_new render.
- Khi VBBS compare: section id `nguoi_bao_lanh` chỉ tồn tại ở V_new → **INSERT** → VBBS sinh mục:
  ```
  N. Bổ sung khoản "Người bảo lãnh" thuộc mục "Bổ sung điều khoản bảo lãnh"
     Nội dung bổ sung: <nội dung section>
  ```
- Ngược lại (V_old có, V_new tắt) → **DELETE**:
  ```
  N. Loại bỏ khoản "Người bảo lãnh" thuộc mục "..."
     Nội dung loại bỏ: <nội dung section>
  ```

Trong template VBBS, cú pháp `<<IF: isInsert>>` / `<<IF: isDelete>>` đã có sẵn để bao đoạn `Nội dung bổ sung:` / `Nội dung loại bỏ:`.

---

## 16. Tham chiếu tài nguyên

Các marker `{{image:}}`, `{{pdf:}}`, `{{html:}}`, `{{include:}}`, `{{template:}}` cần khai báo nguồn tài nguyên. Có 4 cách:

### 16.1 Tài nguyên đính kèm (`$tên`)

Khách hàng gửi file kèm khi gọi API. Trong template tham chiếu bằng `$tên`.

```text
{{image: $signature ; w=80pt}}
{{include: $terms}}
```

> Liên hệ team kỹ thuật để biết cách đính kèm file.

### 16.2 Đường dẫn từ JSON (`@`)

Khi đường dẫn nằm trong JSON:

```text
{{image: @customer.signatureUrl ; w=80pt}}
```

JSON:
```json
{ "customer": { "signatureUrl": "https://example.com/sig.png" } }
```

### 16.3 URL trực tiếp

```text
{{image: https://example.com/logo.png ; w=60pt}}
{{include: https://example.com/terms.docx}}
```

### 16.4 Đường dẫn lưu trữ nội bộ

Hệ thống có thể được cấu hình để truy cập file local/object storage. Trong trường hợp này nhân viên kỹ thuật sẽ hướng dẫn cách dùng.

### 16.5 Lưu ý

- Một marker có thể tham chiếu logo, bảng, ảnh từ **bất kỳ** kiểu nguồn nào ở trên.
- File ảnh tối đa 25MB / file.
- URL phải truy cập được công khai (không yêu cầu đăng nhập).

---

## 17. Quy ước viết template

### 17.1 Chính tả marker

Tất cả marker đều **PHÂN BIỆT** chính tả:

| ĐÚNG | SAI |
|---|---|
| `<<IF: ...>>` | `<<if: ...>>` |
| `<<EACH: ...>>` | `<<each: ...>>` |
| `<<END>>` | `<<endif>>`, `<<end>>` |
| `<<ELSE>>` | `<<else>>` |
| `{{field}}` | `{field}`, `{{ field }}` (có space đầu/cuối OK), `{{ field }` |

### 17.2 Marker đứng riêng vs cùng dòng

| Marker | Đứng riêng | Cùng dòng với text |
|---|---|---|
| `{{field}}` | OK | ✅ Khuyến nghị |
| `{{image:}}` | ✅ | ✅ |
| `{{qr:}}` | ✅ | ✅ |
| `{{pdf:}}` | ✅ BẮT BUỘC | ❌ KHÔNG được |
| `{{html:}}` | ✅ BẮT BUỘC | ❌ |
| `{{table:}}` | ✅ BẮT BUỘC | ❌ |
| `{{include:}}` | ✅ BẮT BUỘC | ❌ |
| `{{template:}}` | ✅ BẮT BUỘC | ❌ |
| `{{sign:}}` | ✅ BẮT BUỘC | ❌ |
| `<<IF: cond>>...<<END>>` inline | ❌ | ✅ |
| `<<IF: cond>>` block | ✅ | (dòng riêng) |
| `<<EACH: ...>>` | ✅ thường dùng riêng | OK trong cell bảng |
| `<<TREE: ...>>` block | ✅ | (dòng riêng) |

### 17.3 Quy ước viết điều kiện

```text
SAI:  <<IF: {{type}}=cash>>      ← không bọc {{...}} trong điều kiện
ĐÚNG: <<IF: type=cash>>

SAI:  <<IF: name|upper=ADMIN>>   ← không dùng bộ lọc | trong điều kiện
ĐÚNG: <<IF: upper(name)=ADMIN>>  ← hàm thì DÙNG ĐƯỢC ở vế trái

ĐÚNG: <<IF: hasItems(items)>>    ← hàm trả true/false làm điều kiện trực tiếp
ĐÚNG: <<IF: length(items)>0>>    ← hàm trả số so sánh với >, >=, ...
```

### 17.4 Tránh viết literal marker text trong heading

KHÔNG viết text giống marker thật trong tiêu đề mô tả, vì hệ thống sẽ cố gắng xử lý:

```text
SAI:   "Hướng dẫn dùng {{image: ...}}"   ← bị engine cố parse
ĐÚNG:  "Hướng dẫn dùng image marker"
       hoặc dùng ngoặc đơn: "(image)"
```

### 17.5 Cẩn thận khi copy-paste

Một số editor có thể chuyển dấu `"` thẳng thành `"` cong, hoặc `<` thành `〈`. Marker sẽ KHÔNG hoạt động. Luôn dùng:
- Dấu nháy kép thẳng: `"..."`
- Dấu nhỏ hơn / lớn hơn ASCII: `<`, `>`
- Dấu gạch dưới: `_`

### 17.6 Marker bị Word chia nhỏ

Khi soạn marker dài, Word có thể "ngắt" marker ở giữa do auto-correct hoặc spell-check. Triệu chứng: marker hiện text gốc trong output.

**Cách khắc phục:**
1. Chọn cả marker bằng Ctrl+Shift+Mouse, xoá, gõ lại từ đầu.
2. Hoặc dán **toàn bộ marker** từ trình text editor đơn giản (Notepad).

### 17.7 Giữ định dạng

- Marker thừa hưởng định dạng của text xung quanh (font, cỡ, đậm, màu, ...). Khi soạn, đặt marker với font / cỡ mong muốn cho output.
- Trong vòng lặp bảng, dòng template phải có style đúng — clone sẽ giữ style đó.

### 17.8 Test với dữ liệu mẫu

Trước khi giao cho khách hàng, luôn:
1. Tạo dữ liệu JSON có giá trị + không có giá trị (test nhánh ELSE).
2. Tạo dữ liệu mảng rỗng (test `keepRow`).
3. Test với cả `exportType=word` và `exportType=pdf` để verify QR/sign/PDF.

---

## 18. Lỗi thường gặp

### 18.1 Marker không được thay thế

**Triệu chứng:** `{{customer.name}}` xuất hiện nguyên text trong output.

**Nguyên nhân & khắc phục:**
- Tên field trong JSON khác chính tả → kiểm tra JSON.
- Marker bị Word chia run → xoá và gõ lại marker.
- Dấu `{` không phải ASCII → gõ lại bằng phím chuẩn.

### 18.2 Khoảng trắng / dòng trống thừa

**Triệu chứng:** Sau khi IF false, vẫn còn 1 dòng trống.

**Khắc phục:**
- Đặt `<<IF: ...>>` và `<<END>>` trên **dòng riêng**, không có khoảng trắng đầu dòng.
- Hoặc dùng `{{deleteRow}}` trong bảng để xoá luôn dòng.

### 18.3 Vòng lặp chỉ in 1 lần

**Nguyên nhân:** Mảng JSON không phải mảng thật (có thể là object) hoặc đường dẫn sai.

**Kiểm tra:**
- JSON path: `<<EACH: products>>` cần `products` là array `[...]`.
- Nếu là `products.items[]` thì viết `<<EACH: products.items>>`.

### 18.4 IF cả 2 nhánh đều hiển thị

**Triệu chứng:** Block content của 2 IF mutex đều xuất hiện.

**Nguyên nhân:**
- Điều kiện sai cú pháp → kiểm tra dấu `=`, `AND`, `OR`.
- JSON value không khớp casing → JSON `"YES"` vs điều kiện `=yes` → SAI (case-sensitive cho value).

### 18.5 Bảng có dòng trống dù mảng rỗng

**Nguyên nhân:** Modifier mặc định giữ template row khi mảng rỗng có lúc gây ra dòng dư.

**Khắc phục:** Thêm modifier `|deleteRows:N` để xoá thêm N dòng tiếp:
```text
<<EACH: items|deleteRows:1>>
```

### 18.6 Ảnh / PDF / HTML / bảng động không hiển thị

**Kiểm tra theo thứ tự:**
1. Marker có **đứng riêng** trên dòng riêng không? (PDF/HTML/table/include/template/sign bắt buộc).
2. Nguồn tài nguyên có truy cập được không? (URL test trên browser).
3. File có phải định dạng hỗ trợ không? (PNG/JPEG cho image, .docx cho include).
4. Riêng `{{table:}}`: nguồn phải là `@đường_dẫn` trỏ tới **mảng** thật trong JSON; `group`/`colKey`/`value` phải đúng tên field trong mảng con. Mảng rỗng → bảng tự biến mất (không lỗi).

### 18.7 QR không quét được

**Nguyên nhân thường gặp:**
- QR quá nhỏ → tăng `w=` (tối thiểu 2cm thực tế).
- ECC thấp + in mờ → đổi `ecc=H`.
- Có logo che mất → giảm tỷ lệ logo hoặc bỏ logo.

### 18.8 `{{deleteCol}}` không xoá được cột

**Kiểm tra theo thứ tự:**
1. Từ khoá có **đứng riêng một dòng** trong ô không? Viết chung với chữ khác (vd. `Kỳ 4 {{deleteCol}}`) là **không chạy**.
2. Sau khi `<<IF>>` chọn nhánh, ô đó có còn chữ gì khác không? Phải chỉ còn đúng `{{deleteCol}}`.
3. Các dòng của bảng có **lệch số cột** không? (bảng gộp ô lỗi) — hệ thống bỏ qua để tránh làm vỡ bảng.
4. Có phải bảng chỉ có **1 cột**, hoặc lệnh xoá **hết** cột không? — bỏ qua, giữ nguyên.

### 18.9 Đoạn HTML lệch cỡ chữ / căn lề với phần còn lại

Nội dung dán từ trình soạn thảo web thường mang sẵn `font-size` riêng (vd. 12px ≈ 9pt) nên nhỏ hơn thân văn bản. Khắc phục: ép định dạng ngay ở marker —

```text
{{html: @noiDung ; font=Times New Roman ; size=13 ; align=justify}}
```

### 18.10 Sai số toạ độ khung ký

Khung ký có sai số nhỏ (±2-3pt) do giới hạn của layout engine. Hệ thống ký số nên chấp nhận margin ±5pt khi đặt chữ ký.

---

## 19. Bộ template mẫu

Bộ template + JSON data mẫu để tham khảo, có sẵn trong gói tài liệu:

| File | Mục đích |
|---|---|
| `syntax-coverage.docx` + `.json` | Template thử tất cả cú pháp DSL — không cần file đính kèm |
| `asset-coverage.docx` + `.json` + folder `assets/` | Template thử các marker đính kèm: ảnh, PDF, HTML, file Word con, QR |

Mỗi bộ có thể render thành công ngay; tester có thể dùng làm điểm tham chiếu.

---

## Liên hệ hỗ trợ

| Vấn đề | Liên hệ |
|---|---|
| Template không render đúng dù đã làm theo hướng dẫn | Team kỹ thuật triển khai |
| Tài nguyên (file ảnh / PDF) không tải được | Team vận hành hệ thống |
| Đề xuất bổ sung cú pháp mới | Quản lý sản phẩm |

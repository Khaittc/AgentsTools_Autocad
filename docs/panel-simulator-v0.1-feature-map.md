# Feature Map — Panel Simulator v0.1

> **Document Status:** Approved Architecture Plan for Simulator v0.1  
> **Target:** Browser-based UX/Workflow Simulator (`TTC AutoCAD Simulator`)  
> **Source Reference:** [TTC AutoCAD Architecture & Development Roadmap](./TTC_AutoCAD_Engineering_Tools_Architecture_Roadmap.md)  
> **Implementation Scope:** Module A (Panel Layout Designer) — Slice v0.1  

---

## 1. Mục tiêu của Panel Simulator v0.1 (Objective)

Panel Simulator v0.1 đóng vai trò là **nguyên mẫu tương tác trải nghiệm người dùng (Interactive UX Prototype)** chạy trên trình duyệt web, nhằm:
1. **Kiểm chứng luồng công việc (Workflow Validation):** Thử nghiệm quy trình kỹ sư thao tác bố trí thiết bị trên bảng gá tủ điện trước khi triển khai plugin C# trên AutoCAD 2023 thật.
2. **Định hình giao diện chuẩn AutoCAD (AutoCAD Shell Experience):** Trải nghiệm thực tế với Ribbon, PaletteSet bên cạnh, Command Line và Status Bar.
3. **Mô phỏng cơ chế đặt & gióng hàng (Placement & Alignment):** Thử nghiệm cảm giác kéo thả/chọn từ thư viện, bắt điểm gắn lên thanh DIN rail, vẽ máng dây (Wiring Duct) và các công cụ căn lề (Align/Spacing).
4. **Trực quan hóa vùng không gian an toàn (Clearance Envelope):** Hiển thị trực quan khoảng cách cách điện/tản nhiệt quanh thiết bị.

> [!IMPORTANT]
> Đây là bản giả lập UX/UI trên nền Web (React / TypeScript / Canvas). **Tuyệt đối không** dùng API AutoCAD, không viết C#/.NET, không kết nối EPLAN, và các thuật toán hình học/kỹ thuật được mô phỏng ở mức đủ để kiểm chứng UX.

---

## 2. Bản đồ tính năng (Feature Map Matrix)

```text
PANEL SIMULATOR v0.1
│
├── 1. AutoCAD Shell UI (Khung ứng dụng giả lập CAD)
│   ├── Ribbon Bar (Tab "PANEL" & các nút lệnh cơ bản)
│   ├── PaletteSet (Dockable Panel: Thư viện linh kiện & Vỏ tủ)
│   ├── Command Line Bar (Gõ lệnh tắt & hiển thị prompt hướng dẫn)
│   └── Status Bar (Tọa độ con trỏ X, Y, Snap/Grid toggle, Tỉ lệ zoom)
│
├── 2. Drawing Workspace & Viewport (Không gian vẽ giả lập)
│   ├── Infinite Canvas với lưới tọa độ mm (Grid 10mm / 50mm)
│   ├── Điều hướng chuột chuẩn CAD: Pan (giữ chuột giữa), Zoom (lăn chuột)
│   ├── Mounting Plate Boundary (Hiển thị tấm gá tủ điện đang thao tác)
│   └── Chọn đối tượng (Click chọn, hiển thị bounding box / grip handles)
│
├── 3. Mock Data & Thư viện kỹ thuật (Engineering Libraries)
│   ├── Component Library (Footprint chuẩn: MCCB, MCB, VFD, Contactor, Power Supply, PLC, Terminal)
│   │   └── Dữ liệu: Width, Height, Depth, MountingType, Clearance (Top/Bottom/Left/Right/Front)
│   ├── Cabinet Library (Vỏ tủ mẫu: 600x800x250, 800x1000x300, 800x1200x300)
│   │   └── Dữ liệu: W, H, D, Usable Mounting Plate Size, Door Allowance
│   └── Máng & Rail Catalog (DIN Rail standard 35x7.5mm; Duct: 40x60, 60x80, 80x100mm)
│
├── 4. Bố trí linh kiện & Kết cấu gá (Placement & Layout Mechanics)
│   ├── [TTCPANELPLACE] Chèn linh kiện từ Palette vào Mounting Plate
│   ├── [TTCRAIL] Vẽ thanh DIN Rail (kéo điểm đầu - điểm cuối hoặc nhập chiều dài)
│   ├── [TTCDUCT] Vẽ máng đi dây Wiring Duct theo kích thước catalog
│   ├── Snap to DIN Rail (Tự động hít chân linh kiện loại DIN_RAIL vào thanh rail)
│   └── Di chuyển đối tượng (Drag & drop có bước nhảy lưới/grid)
│
├── 5. Công cụ căn gióng cơ khí (Arrangement Tools)
│   ├── Align Left / Right / Top / Bottom
│   ├── Equal Horizontal / Vertical Spacing
│   └── Align To DIN Rail / Wiring Duct
│
├── 6. Trực quan hóa hình học kỹ thuật (Visual Engineering Feedback)
│   ├── Physical Footprint (Nét liền, màu thiết bị tiêu chuẩn)
│   ├── Clearance Envelope (Vùng đệm mờ/nét đứt non-plot bao quanh thiết bị)
│   └── Toggle hiển thị Clearance Envelope (Bật/tắt nhanh bằng phím hoặc nút)
│
├── 7. QA / Validation cơ bản (Basic QA Rules)
│   ├── Kiểm tra va chạm vật lý thiết bị - thiết bị (DEVICE_DEVICE_COLLISION)
│   ├── Kiểm tra linh kiện vượt biên tấm gá (OUTSIDE_MOUNTING_PLATE)
│   └── Đổi màu cảnh báo (Highlight viền đỏ khi có xung đột)
│
└── 8. Kịch bản mẫu (Predefined Demo Scenarios)
    ├── Scenario S01: Empty Panel (Tấm gá rỗng kích thước 800x1000mm)
    └── Scenario S02: Typical Control Panel (Mẫu bố trí sẵn: VFD, PLC, Contactor, Rails & Ducts)
```

---

## 3. Chi tiết các thành phần trong Slice v0.1

### 3.1. AutoCAD Shell UI
| Thành phần | Chức năng trong v0.1 | Trạng thái | Lệnh tắt tương ứng |
|---|---|:---:|:---:|
| **Ribbon - Panel Tab** | Chứa các Panels: *Components*, *Cabinet*, *DIN Rail*, *Duct*, *Arrange*, *Check* | Hoàn thiện UX | - |
| **Component Palette** | Danh sách linh kiện phân theo Category (Power, Control, Drive, IO), ô tìm kiếm, preview 2D footprint kèm kích thước | Hoàn thiện UX | `TTCPANEL` |
| **Cabinet Selector** | Dropdown / modal chọn kích thước tủ hiện hành để xác định khung tấm gá | Hoàn thiện UX | `TTCCABINET` |
| **Command Line** | Nhận các lệnh gõ từ bàn phím (`TTCPANELPLACE`, `TTCRAIL`, `TTCDUCT`,...), hiển thị dòng nhắc prompt | Hoàn thiện UX | - |
| **Status Bar** | Tọa độ con trỏ (mm), toggle Snap, Grid, Clearances ON/OFF | Hoàn thiện UX | - |

### 3.2. Không gian vẽ (Drawing Canvas & Viewport)
- **Đơn vị bản vẽ:** Mặc định chuẩn xác là **milimét (mm)**.
- **Tương tác chuột chuẩn CAD:**
  - Nhấp chuột giữa + kéo: Pan khung nhìn.
  - Con lăn chuột: Zoom in/out tại vị trí con trỏ.
  - Click chuột trái: Chọn đối tượng hoặc đặt điểm chèn.
  - Phím `Esc`: Hủy lệnh đang thực thi, bỏ chọn đối tượng.
  - Phím `Delete`: Xóa đối tượng đang chọn.
- **Tấm gá lắp (Mounting Plate):** Vẽ hình chữ nhật nền xám đậm thể hiện vùng lắp đặt của tủ điện hiện hành.

### 3.3. Thao tác bố trí (Layout & Placement Mechanics)
- **Đặt linh kiện:** Nhấn "Insert" trong Palette hoặc gõ `TTCPANELPLACE`, rê chuột vào bản vẽ thấy hình mờ footprint kèm viền clearance, click chuột để đặt.
- **Vẽ thanh DIN Rail (`TTCRAIL`):** Click điểm bắt đầu, kéo sang ngang, click điểm kết thúc; hoặc nhập chiều dài cố định.
- **Vẽ máng dây (`TTCDUCT`):** Chọn cỡ máng (ví dụ `40x60`, `60x80`), click vẽ đoạn máng thẳng (ngang hoặc dọc).
- **Cơ chế Hít (Snap to Rail):** Khi di chuyển linh kiện có `MountingType == 'DIN_RAIL'` đến gần thanh DIN Rail, tự động căn gióng theo phương ngang của rail.

### 3.4. Công cụ căn chỉnh (Arrangement Tools)
- Cho phép chọn nhiều đối tượng (Multi-select bằng giữ Shift/Ctrl hoặc click):
  - **Align Top / Bottom / Left / Right:** Gióng hàng các thiết bị theo mép tương ứng.
  - **Equal Spacing H / V:** Chia đều khoảng cách giữa các thiết bị được chọn.

### 3.5. Kiểm tra kỹ thuật cơ bản (Basic QA Checker - Preview)
- Kiểm tra tức thời (Real-time highlight) hoặc qua nút Check:
  - Nếu 2 thiết bị đè lên nhau $\rightarrow$ viền đối tượng đổi sang màu đỏ kèm cảnh báo tooltip.
  - Nếu thiết bị vượt ra ngoài biên tấm gá $\rightarrow$ cảnh báo `OUTSIDE_MOUNTING_PLATE`.

---

## 4. Phân định phạm vi v0.1 vs Các phiên bản tiếp theo

| Hạng mục tính năng | Simulator v0.1 (Hiện tại) | Simulator v0.2 | Simulator v0.3 / Production |
|---|:---:|:---:|:---:|
| **AutoCAD Shell (Ribbon, Palette, Cmd)** | **Mô phỏng đầy đủ** | Bổ sung shortcut & settings | Tích hợp C# AutoCAD UI |
| **Chèn Footprint thiết bị** | **Thư viện Mock JSON** | Tải thêm từ file ngoài | Tải Block DWG thực tế |
| **DIN Rail & Wiring Duct** | **Vẽ đoạn thẳng cơ bản** | Cắt góc, tính độ lấp đầy máng | Bóc tách chiều dài thực |
| **Snap vào DIN Rail** | **Snap cơ bản** | Rải đều trên rail | Khóa theo rail khi di chuyển |
| **Căn lề (Align / Space)** | **Hỗ trợ đầy đủ** | Thêm căn lề nâng cao | Giữ nguyên metadata Block |
| **Clearance Envelope** | **Hiển thị 2D trực quan** | Kiểm tra vi phạm vùng đệm | Non-plot layer trong DWG |
| **Kiểm tra va chạm (QA Check)** | **Va chạm vật lý cơ bản** | Kiểm tra chiều sâu (Depth), Reserved Zone | Toàn bộ 8 quy tắc QA |
| **Đề xuất vỏ tủ (Cabinet Sizing)** | *Chưa đưa vào v0.1* | **Tích hợp thuật toán tính** | Hoàn thiện gợi ý tủ chuẩn |
| **Kịch bản Demo** | **S01 & S02** | S03, S04, S05 | Đọc từ file DWG mẫu |
| **M&E Cable Tray** | *Không làm* | *Không làm* | Theo roadmap Phase 6-12 |

---

## 5. Kịch bản kiểm thử chấp thuận (Acceptance Criteria cho v0.1)

1. **Khởi động ứng dụng:**
   - Người dùng mở trình duyệt thấy giao diện chuẩn AutoCAD: Ribbon bên trên, Palette thư viện bên phải, Command Line bên dưới, Canvas ở trung tâm.
2. **Kịch bản S01 (Empty Panel):**
   - Chọn tủ `800x1000x300` $\rightarrow$ Canvas hiển thị tấm gá kích thước chuẩn (trừ biên an toàn).
   - Chọn vẽ 3 thanh DIN rail ngang và 4 thanh máng dọc $\rightarrow$ Đoạn rail và máng hiển thị chuẩn tỷ lệ mm.
   - Chọn MCCB, VFD, Contactor từ Palette $\rightarrow$ Chèn lên tấm gá, thiết bị DIN rail tự hít vào rail.
3. **Thao tác căn chỉnh:**
   - Chọn hàng Contactor $\rightarrow$ Bấm `Align Top` và `Equal Horizontal Spacing` $\rightarrow$ Các contactor thẳng hàng và cách đều nhau.
4. **Trực quan hóa Clearance:**
   - Bấm nút `Toggle Clearances` trên Status Bar $\rightarrow$ Hiển thị vùng đệm màu xanh/vàng mờ quanh VFD và Contactor.
5. **Kịch bản S02 (Typical Control Panel):**
   - Bấm nút "Load Scenario S02" $\rightarrow$ Canvas tự nạp một bố cục tủ hoàn chỉnh gồm nguồn, PLC, VFD, rơ le, cầu đấu để kỹ sư trải nghiệm đánh giá.

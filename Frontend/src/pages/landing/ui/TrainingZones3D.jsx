import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// ============================================================================
// STRICT NON-OVERLAPPING MASTERPLAN DATA (13.000 m² = 130m x 100m)
// Site Coordinates: X in [-65, +65], Z in [-50, +50]
// ============================================================================
const ZONES_DATA = {
  khuA: {
    id: 'khuA',
    shortTitle: 'KHU A: BƠI LỘI, GYM & FITNESS',
    name: 'Khu A: Bơi Lội, Gym & Fitness',
    nameEn: 'Zone A: Swimming, Gym & Fitness',
    badge: 'Khối nhà 3 tầng • Cánh Tây (Giữa)',
    area: '2.200 m² đất (3 tầng = 6.600 m² sàn)',
    desc: 'Tòa nhà 3 tầng độc lập tại trung tâm Cánh Tây (cách Khu B 12m và cách Khu C 8m bằng sân vườn cảnh quan). Gồm đúng 1 bể bơi 4 mùa 25m, 1 sàn Gym & Fitness và 1 tầng thay đồ & tắm tráng với đầy đủ dụng cụ 3D chi tiết.',
    descEn: '3-story standalone complex in Mid-West wing. Features a 25m four-season indoor heated pool, fitness gym floor, and luxury locker/shower suites.',
    color: '#38bdf8',
    targetPos: { x: -37, y: 6, z: 6 },
    camPos: { x: -2, y: 24, z: 26 },
    markerPos: [-37, 16, 6],
    hasFloors: true,
    floors: [
      {
        level: 1,
        name: 'Tầng 1: Bể bơi 4 mùa 25m trong nhà nước ấm (1 Bể 5 làn)',
        nameEn: 'Floor 1: Heated Swimming Pool 25m (5 Lanes)',
        detail: 'Đúng 1 bể bơi 25m × 12.5m với 4 dây phao chắn sóng hạt tròn đỏ-trắng-xanh, 5 bục xuất phát chuyên nghiệp có tay nắm bơi ngửa, 4 thang inox uốn cong, ghế cao cứu hộ kèm phao cứu sinh và dãy ghế nằm thư giãn.',
        camPos: { x: -12, y: 11, z: 16 },
        targetPos: { x: -37, y: 1.2, z: 6 },
        equipZooms: [
          { label: '🔍 5 Bục xuất phát & Dây phao', camPos: { x: -44, y: 4.2, z: 12 }, targetPos: { x: -50, y: 0.8, z: 5.2 } },
          { label: '🔍 Ghế cứu hộ & Thang inox', camPos: { x: -29, y: 4.5, z: 4 }, targetPos: { x: -37, y: 1.0, z: -1.5 } },
          { label: '🔍 Dãy ghế nghỉ hồ bơi', camPos: { x: -26, y: 4.0, z: 15 }, targetPos: { x: -37, y: 0.6, z: 14.2 } }
        ]
      },
      {
        level: 2,
        name: 'Tầng 2: Phòng tập Gym & Fitness',
        nameEn: 'Floor 2: Fitness & Strength Gym',
        detail: 'Bố trí khoa học vừa vặn: 3 máy chạy bộ có băng tải & màn hình LED; 3 xe đạp thể lực bánh đà inox; 2 khung gánh tạ lắp bánh tạ màu; kệ tạ đơn 2 tầng; giàn kéo cáp đa năng, máy kéo xô, máy đạp đùi 45°, máy chèo thuyền và đường cỏ đẩy tạ Sled.',
        camPos: { x: -12, y: 16, z: 16 },
        targetPos: { x: -37, y: 5.8, z: 6 },
        equipZooms: [
          { label: '🔍 3 Máy chạy bộ & 3 Xe đạp Spin', camPos: { x: -28, y: 7.8, z: 15 }, targetPos: { x: -45, y: 5.5, z: 11.5 } },
          { label: '🔍 2 Khung Squat Rack & Kệ tạ đơn', camPos: { x: -32, y: 8.2, z: 3 }, targetPos: { x: -45, y: 5.8, z: -1.5 } },
          { label: '🔍 Giàn kéo cáp & Máy đạp đùi', camPos: { x: -20, y: 8.2, z: 4 }, targetPos: { x: -29, y: 5.8, z: -1.0 } },
          { label: '🔍 Đường cỏ đẩy Sled & Máy chèo thuyền', camPos: { x: -22, y: 7.8, z: 13 }, targetPos: { x: -34, y: 5.4, z: 8.5 } }
        ]
      },
      {
        level: 3,
        name: 'Tầng 3: Khu thay đồ, Tủ Locker & Tắm tráng nóng lạnh',
        nameEn: 'Floor 3: Locker & Shower Facilities',
        detail: 'Hệ thống tủ Locker chia từng cánh cửa có khe thoáng khí & ổ khóa, ghế băng gỗ thay giày, bàn Lavabo gương soi và 6 buồng tắm kính mờ có vòi sen tắm mưa cùng van gạt nước nóng/lạnh.',
        camPos: { x: -12, y: 21, z: 16 },
        targetPos: { x: -37, y: 10.2, z: 6 },
        equipZooms: [
          { label: '🔍 Dãy tủ Locker & Ghế thay đồ', camPos: { x: -34, y: 13.0, z: 14 }, targetPos: { x: -45, y: 10.2, z: 6 } },
          { label: '🔍 6 Buồng tắm sen nóng lạnh', camPos: { x: -19, y: 13.0, z: 10 }, targetPos: { x: -26, y: 10.5, z: 6 } }
        ]
      }
    ]
  },
  khuB: {
    id: 'khuB',
    shortTitle: 'KHU B: BÓNG RỔ, CẦU LÔNG & BÓNG BÀN',
    name: 'Khu B: Bóng Rổ, Cầu Lông & Bóng Bàn',
    nameEn: 'Zone B: Basketball, Badminton & Table Tennis',
    badge: 'Khối nhà 3 tầng • Cánh Tây Bắc',
    area: '1.800 m² đất (3 tầng = 5.400 m² sàn)',
    desc: 'Nhà thi đấu thể thao trong nhà nằm ở góc Tây Bắc. Tầng 1 là 1 sân bóng rổ FIBA, Tầng 2 là cụm 4 sân cầu lông thảm PVC, Tầng 3 là khu 4 bàn bóng bàn chuẩn ITTF.',
    descEn: 'North-West indoor sports arena. Floor 1 is championship FIBA basketball court, Floor 2 is 4 badminton courts, Floor 3 is 4 ITTF table tennis tables.',
    color: '#f59e0b',
    targetPos: { x: -37, y: 6, z: -30 },
    camPos: { x: -2, y: 25, z: -10 },
    markerPos: [-37, 16, -30],
    hasFloors: true,
    floors: [
      {
        level: 1,
        name: 'Tầng 1: Sân bóng rổ tiêu chuẩn phong trào có mái che (1 Sân)',
        nameEn: 'Floor 1: Championship Basketball Court',
        detail: '2 trụ bóng rổ di động chuyên nghiệp (đối trọng bọc nệm, cần vươn chữ Y, bảng rổ kính cường lực, vành rổ cam & lưới đan phễu), khán đài 3 bậc, bảng điểm điện tử và xe đẩy đựng bóng rổ.',
        camPos: { x: -12, y: 11, z: -18 },
        targetPos: { x: -37, y: 1.5, z: -30 },
        equipZooms: [
          { label: '🔍 Trụ bóng rổ kính cường lực', camPos: { x: -32, y: 4.5, z: -24 }, targetPos: { x: -23.5, y: 2.8, z: -29.2 } },
          { label: '🔍 Khán đài & Xe đựng bóng rổ', camPos: { x: -37, y: 4.5, z: -26 }, targetPos: { x: -37, y: 1.5, z: -38.5 } }
        ]
      },
      {
        level: 2,
        name: 'Tầng 2: Cụm 4 sân cầu lông thảm cao su chống trượt (4 Sân)',
        nameEn: 'Floor 2: 4-Court Badminton Arena',
        detail: 'Đúng 4 sân cầu lông (Sân 1 - 4), mỗi sân có 2 trụ căng lưới bánh xe đối trọng, lưới mắt nhỏ viền băng trắng, ghế trọng tài cao đặt sát cột lưới và ghế nghỉ vận động viên.',
        camPos: { x: -12, y: 16, z: -18 },
        targetPos: { x: -37, y: 5.8, z: -30 },
        equipZooms: [
          { label: '🔍 Cột lưới & Ghế trọng tài', camPos: { x: -28, y: 8.2, z: -22 }, targetPos: { x: -32.8, y: 5.5, z: -30 } },
          { label: '🔍 Toàn cảnh 4 sân cầu lông', camPos: { x: -16, y: 14, z: -20 }, targetPos: { x: -37, y: 5.2, z: -30 } }
        ]
      },
      {
        level: 3,
        name: 'Tầng 3: Khu bóng bàn trong nhà với 4 bàn tập (4 Bàn)',
        nameEn: 'Floor 3: Indoor Table Tennis Club',
        detail: 'Đúng 4 bàn bóng bàn chuẩn ITTF có chân thép gấp gọn gắn bánh xe đỏ, cọc lưới căng giữa bàn, trên mặt bàn có sẵn vợt bóng bàn và bóng trắng, bao quanh bởi vách chắn bóng.',
        camPos: { x: -12, y: 21, z: -18 },
        targetPos: { x: -37, y: 10.5, z: -30 },
        equipZooms: [
          { label: '🔍 Cận cảnh Bàn bóng bàn & Vợt', camPos: { x: -29, y: 11.8, z: -25 }, targetPos: { x: -32.8, y: 10.0, z: -30 } },
          { label: '🔍 4 Ô bàn tập & Vách chắn bóng', camPos: { x: -18, y: 17, z: -20 }, targetPos: { x: -37, y: 10.2, z: -30 } }
        ]
      }
    ]
  },
  khuC: {
    id: 'khuC',
    shortTitle: 'KHU C: VÕ THUẬT, BOXING, YOGA & PILATES',
    name: 'Khu C: Võ Thuật, Boxing, Yoga & Pilates',
    nameEn: 'Zone C: Martial Arts, Boxing, Yoga & Pilates',
    badge: 'Khối nhà 3 tầng • Cánh Tây Nam',
    area: '1.200 m² đất (3 tầng = 3.600 m² sàn)',
    desc: 'Tòa nhà 3 tầng nằm ở góc Tây Nam. Tầng 1 là Võ thuật, đài Boxing & giàn bao cát; Tầng 2 là khu Locker thay đồ học viên; Tầng 3 là studio Yoga & 8 máy Pilates Reformer.',
    descEn: 'South-West wing 3-story complex. Floor 1 is Boxing ring & tatami, Floor 2 is member lockers, Floor 3 is Yoga studio and 8 Pilates Reformers.',
    color: '#f43f5e',
    targetPos: { x: -40, y: 6, z: 35 },
    camPos: { x: -10, y: 22, z: 54 },
    markerPos: [-40, 16, 35],
    hasFloors: true,
    floors: [
      {
        level: 1,
        name: 'Tầng 1: Phòng tập võ thuật & Boxing, thảm và bao cát',
        nameEn: 'Floor 1: Martial Arts & Boxing Arena',
        detail: '1 Sàn đài Boxing Ring chuyên nghiệp (4 trụ góc, đệm góc Đỏ-Xanh-Trắng, 4 tầng dây đài căng, cầu thang bước lên đài), giàn khung thép chữ I treo 8 bao cát da bằng xích 3 chạc, 2 hình nộm Boxing Bob và thảm võ Tatami.',
        camPos: { x: -16, y: 11, z: 46 },
        targetPos: { x: -40, y: 1.5, z: 35 },
        equipZooms: [
          { label: '🔍 Đài Boxing Ring 4 tầng dây', camPos: { x: -41, y: 4.5, z: 42 }, targetPos: { x: -49.5, y: 1.5, z: 35 } },
          { label: '🔍 Giàn treo 8 Bao cát & Hình nộm', camPos: { x: -24, y: 4.2, z: 41 }, targetPos: { x: -31.0, y: 1.6, z: 35 } }
        ]
      },
      {
        level: 2,
        name: 'Tầng 2: Tủ đồ cá nhân và khu thay đồ phục vụ học viên',
        nameEn: 'Floor 2: Member Changing & Locker Area',
        detail: 'Các dãy tủ Locker có khóa an toàn, ghế băng dài ngồi thay đồ, buồng thay đồ riêng tư và bàn gương Lavabo phục vụ học viên Võ thuật, Yoga & Pilates.',
        camPos: { x: -16, y: 16, z: 46 },
        targetPos: { x: -40, y: 5.8, z: 35 },
        equipZooms: [
          { label: '🔍 Khu tủ đồ Locker học viên', camPos: { x: -30, y: 8.5, z: 42 }, targetPos: { x: -40, y: 5.5, z: 35 } }
        ]
      },
      {
        level: 3,
        name: 'Tầng 3: Phòng tập Yoga & Pilates, khu thảm và máy Reformer',
        nameEn: 'Floor 3: Yoga & Pilates Reformer Studio',
        detail: '8 giường tập Pilates Reformer (khung gỗ sồi, nệm trượt, 5 lò xo kháng lực màu, thanh Footbar & dây kéo ròng rọc) + 12 thảm Yoga kèm gối lăn Bolster, gạch tập & bóng cân bằng.',
        camPos: { x: -16, y: 21, z: 46 },
        targetPos: { x: -40, y: 10.5, z: 35 },
        equipZooms: [
          { label: '🔍 8 Máy Pilates Reformer lò xo', camPos: { x: -40, y: 12.2, z: 41 }, targetPos: { x: -47.5, y: 9.8, z: 35 } },
          { label: '🔍 Thảm Yoga, Gối lăn & Bóng tập', camPos: { x: -26, y: 12.2, z: 41 }, targetPos: { x: -33.0, y: 9.8, z: 35 } }
        ]
      }
    ]
  },
  outdoor: {
    id: 'outdoor',
    shortTitle: 'KHU NGOÀI TRỜI: BÓNG ĐÁ & PICKLEBALL',
    name: 'Khu Ngoài Trời: Bóng Đá & Pickleball',
    nameEn: 'Outdoor Complex: Soccer & Pickleball',
    badge: 'Tổ hợp ngoài trời • Cánh Đông',
    area: '5.200 m² mặt sân & hành lang',
    desc: 'Quy hoạch chuẩn xác tại Cánh Đông: Phía Đông Bắc gồm đúng 1 Sân bóng đá 5 người và 1 Sân bóng đá 7 người; phía Đông Nam gồm đúng 4 Sân Pickleball có lưới riêng & vạch bếp.',
    descEn: 'East Wing outdoor athletics. Features 1 5-a-side pitch, 1 7-a-side pitch, and 4 tournament pickleball courts with kitchen zones and 10 LED floodlight towers.',
    color: '#10b981',
    targetPos: { x: 34, y: 1, z: 2 },
    camPos: { x: 34, y: 46, z: 62 },
    markerPos: [34, 6, 2],
    hasFloors: false,
    floors: [
      {
        level: 1,
        name: 'Cụm sân bóng đá cỏ nhân tạo (Đúng 1 Sân 5 và 1 Sân 7)',
        nameEn: 'Synthetic Turf Soccer Fields (Pitches 5 & 7)',
        detail: 'Trang bị khung thành 3D có gọng chữ D và lưới mắt cáo, cột cờ phạt góc, băng ghế huấn luyện viên & cầu thủ dự bị có mái vòm (Team Dugout) và hàng rào lưới chắn bóng.',
        camPos: { x: 34, y: 28, z: 20 },
        targetPos: { x: 34, y: 1, z: -20 },
        equipZooms: [
          { label: '🔍 Khung thành 3D & Cột cờ góc', camPos: { x: 36, y: 5.5, z: 12 }, targetPos: { x: 44, y: 1.5, z: 4 } },
          { label: '🔍 Băng ghế dự bị có mái che', camPos: { x: 20, y: 4.5, z: -12 }, targetPos: { x: 26.8, y: 1.2, z: -18 } }
        ]
      },
      {
        level: 1,
        name: 'Cụm 4 sân Pickleball (Sân P1, P2, P3, P4 có vạch khu vực bếp)',
        nameEn: '4 Tournament Pickleball Courts (P1 - P4)',
        detail: '4 sân Pickleball có cọc lưới bánh xe, lưới căng có dây đai trắng chính giữa, vạch khu vực bếp màu cam đất và bộ bàn ghế nghỉ có dù che nắng dọc biên.',
        camPos: { x: 36, y: 19, z: 46 },
        targetPos: { x: 36, y: 1, z: 24.5 },
        equipZooms: [
          { label: '🔍 Lưới Pickleball & Khu vực bếp', camPos: { x: 25, y: 4.5, z: 32 }, targetPos: { x: 30, y: 0.8, z: 24.5 } },
          { label: '🔍 Ghế nghỉ VĐV & Dù che nắng', camPos: { x: 24, y: 4.5, z: 39 }, targetPos: { x: 30, y: 1.2, z: 34.6 } }
        ]
      },
      {
        level: 1,
        name: 'Dàn 10 trụ đèn pha LED chiếu sáng ban đêm rõ nét',
        nameEn: '10 High-Power Stadium LED Floodlight Towers',
        detail: '10 trụ đèn thép cao 15m có lồng thang leo bảo trì, giá đỡ giàn ngang gắn 6 chóa đèn pha LED công suất lớn hướng xuống mặt sân.',
        camPos: { x: 64, y: 24, z: 36 },
        targetPos: { x: 34, y: 8, z: 10 },
        equipZooms: [
          { label: '🔍 Cận cảnh Giàn 6 chóa đèn LED', camPos: { x: 26, y: 17, z: 22 }, targetPos: { x: 34, y: 15.2, z: 14 } }
        ]
      }
    ]
  },
  lobby: {
    id: 'lobby',
    shortTitle: 'SẢNH LỄ TÂN, CĂN-TIN & TRẠM Y TẾ',
    name: 'Sảnh Lễ Tân, Căn-Tin & Trạm Y Tế',
    nameEn: 'Central Lobby, Café & First Aid',
    badge: 'Quảng trường trung tâm • Cổng Olympic Sports Area',
    area: '1.850 m² (Cổng chào + Quảng trường + Sảnh dịch vụ)',
    desc: 'Tòa sảnh đón tiếp nằm tại Quảng trường trung tâm bên phải trục đại lộ chính (hoàn toàn không chắn đường và tách biệt khỏi khu bãi đỗ xe ô tô). Kết nối trực tiếp với Cổng chào Olympic Sports Area.',
    descEn: 'Central pavilion with welcome arch, smart check-in reception, healthy beverage café, and sports first-aid clinic.',
    color: '#c084fc',
    targetPos: { x: 1.5, y: 2.5, z: 27 },
    camPos: { x: -12, y: 16, z: 54 },
    markerPos: [1.5, 10, 27],
    hasFloors: false,
    floors: [
      {
        level: 1,
        name: 'Cổng Chào "Olympic Sports Area" & Đại Lộ Đón Tiếp',
        nameEn: 'Welcome Arch "Olympic Sports Area" & Grand Avenue',
        detail: 'Cổng chào kiến trúc đặt trên trục đại lộ chính phía Tây Nam, nổi bật với bảng tên "Olympic Sports Area" và Logo khiên tròn của trung tâm.',
        camPos: { x: -13.5, y: 7.5, z: 66 },
        targetPos: { x: -13.5, y: 4.5, z: 49.5 },
        equipZooms: [
          { label: '🔍 Cổng Chào Olympic Sports Area', camPos: { x: -13.5, y: 6.5, z: 64 }, targetPos: { x: -13.5, y: 5.5, z: 49.5 } }
        ]
      },
      {
        level: 1,
        name: 'Quầy Lễ Tân Tiếp Đón & Cổng Kiểm Soát Check-in',
        nameEn: 'Smart Check-in Reception & RFID Turnstiles',
        detail: 'Quầy lễ tân vòng cung ốp gỗ và đá cẩm thạch, trang bị 2 bộ máy tính màn hình kép tra cứu lịch đặt sân và 3 làn cổng xoay kiểm soát thẻ thành viên.',
        camPos: { x: 1.5, y: 5.5, z: 36 },
        targetPos: { x: 1.5, y: 1.2, z: 28.5 },
        equipZooms: [
          { label: '🔍 Quầy Lễ Tân & Máy tính đặt sân', camPos: { x: 1.5, y: 3.8, z: 33.5 }, targetPos: { x: 1.5, y: 1.1, z: 29.2 } }
        ]
      },
      {
        level: 1,
        name: 'Quầy Căn-tin Nước Giải Khát & Phòng Y Tế Sơ Cứu',
        nameEn: 'Nutrition Beverage Café & First Aid Clinic',
        detail: 'Quầy bar căn-tin có tủ mát cánh kính 4 tầng xếp đầy nước khoáng, bàn tròn cafe; cạnh bên là Phòng Y Tế có giường sơ cứu, bình Oxy xanh và tủ thuốc Chữ Thập Đỏ.',
        camPos: { x: -6.5, y: 5.5, z: 33 },
        targetPos: { x: 1.5, y: 1.2, z: 25.5 },
        equipZooms: [
          { label: '🔍 Tủ mát nước khoáng & Quầy Bar', camPos: { x: -1.0, y: 3.4, z: 29.5 }, targetPos: { x: -4.3, y: 1.3, z: 24.5 } },
          { label: '🔍 Giường sơ cứu, Bình Oxy & Tủ thuốc', camPos: { x: 4.3, y: 3.5, z: 29.5 }, targetPos: { x: 7.3, y: 1.2, z: 24.5 } }
        ]
      }
    ]
  },
  parking: {
    id: 'parking',
    shortTitle: 'KHU BÃI ĐỖ XE Ô TÔ TẬP TRUNG (20 CHỖ)',
    name: 'Khu Bãi Đỗ Xe Ô Tô Tập Trung (20 Chỗ)',
    nameEn: 'Central Car Parking (20 bays)',
    badge: '1 Khu Tập Trung Duy Nhất • Phía Đông Nam',
    area: '750 m² (48m × 15.6m • 2 Dãy Đối Diện • 20 Ô Đỗ)',
    desc: 'Toàn bộ ô tô được quy hoạch tập trung trong 1 khu phức hợp khép kín duy nhất ở góc Đông Nam. Bố trí 2 dãy chuồng đỗ đối diện nhau (Dãy Bắc 10 ô & Dãy Nam 10 ô) qua làn đường nội bộ rộng 5.2m ở giữa, có cổng Barrier kiểm soát riêng, 2 mái che Pin Mặt Trời và trạm sạc xe điện EV.',
    descEn: 'Unified vehicle parking in South-East quadrant. 2 opposing rows of 10 stalls, automatic barrier gates, dual solar carports, and 5 fast EV charging stations.',
    color: '#22d3ee',
    targetPos: { x: 38, y: 1.8, z: 44 },
    camPos: { x: 38, y: 20, z: 68 },
    markerPos: [38, 6, 44],
    hasFloors: false,
    floors: [
      {
        level: 1,
        name: 'Dãy Đỗ Ô Tô Phía Bắc & Phía Nam (20 Chuồng Đỗ Tiêu Chuẩn)',
        nameEn: 'North & South Parking Stalls (20 Marked Bays)',
        detail: '20 ô đỗ xe sơn kẻ vạch trắng rõ nét, có cục chặn lùi bánh xe màu vàng, lối xe chạy 2 chiều ở giữa có mũi tên chỉ hướng và 14 xe SUV/Sedan đang đỗ gọn gàng.',
        camPos: { x: 12, y: 11, z: 44 },
        targetPos: { x: 38, y: 1.2, z: 44 },
        equipZooms: [
          { label: '🔍 Toàn cảnh 2 dãy ô tô đối diện', camPos: { x: 10, y: 9.5, z: 44 }, targetPos: { x: 38, y: 1.2, z: 44 } },
          { label: '🔍 Cổng Barrier & Lối Vào Bãi Xe', camPos: { x: 16, y: 6.0, z: 60 }, targetPos: { x: 17.5, y: 1.2, z: 50.5 } }
        ]
      },
      {
        level: 1,
        name: 'Hệ Thống Trạm Sạc Xe Điện (EV Chargers) & Mái Điện Mặt Trời',
        nameEn: 'EV Fast Charging Pillars & Dual Solar Carports',
        detail: '2 hệ mái che Carport lợp kín tấm Pin Năng Lượng Mặt Trời cung cấp điện trực tiếp cho 5 trụ sạc nhanh xe điện có màn hình LED xanh.',
        camPos: { x: 42, y: 8.5, z: 58 },
        targetPos: { x: 42, y: 2.0, z: 48 },
        equipZooms: [
          { label: '🔍 Trụ sạc xe điện EV & Ô tô đang sạc', camPos: { x: 35, y: 3.6, z: 44.5 }, targetPos: { x: 39, y: 1.2, z: 49.5 } },
          { label: '🔍 Mái che Solar Carport Đôi', camPos: { x: 52, y: 9.0, z: 56 }, targetPos: { x: 38, y: 3.5, z: 44 } }
        ]
      }
    ]
  }
};

// Procedural Canvas Texture Generators
function createSoccerTexture(pitchType = '7') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const stripes = pitchType === '7' ? 10 : 8;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#236940' : '#2d7d4c';
    ctx.fillRect(0, (i * 512) / stripes, 512, 512 / stripes);
  }
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.strokeRect(18, 18, 476, 476);
  ctx.beginPath();
  ctx.moveTo(18, 256);
  ctx.lineTo(494, 256);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(256, 256, pitchType === '7' ? 52 : 44, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeRect(156, 18, 200, 70);
  ctx.strokeRect(156, 424, 200, 70);
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

function createPickleballTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(40, 20, 432, 472);
  // Non-volley zone (kitchen) in lime/amber
  ctx.fillStyle = '#ea580c';
  ctx.fillRect(40, 196, 432, 120);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.strokeRect(40, 20, 432, 472);
  ctx.strokeRect(40, 196, 432, 120);
  ctx.beginPath();
  ctx.moveTo(256, 20);
  ctx.lineTo(256, 196);
  ctx.moveTo(256, 316);
  ctx.lineTo(256, 492);
  ctx.stroke();
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

function createBasketballTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#b45309';
  ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = '#d97706';
  for (let i = 0; i < 512; i += 16) {
    if ((i / 16) % 2 === 0) ctx.fillRect(0, i, 512, 8);
  }
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.strokeRect(30, 20, 452, 472);
  ctx.beginPath();
  ctx.moveTo(30, 256);
  ctx.lineTo(482, 256);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(256, 256, 50, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(256, 50, 120, 0, Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(256, 462, 120, Math.PI, Math.PI * 2);
  ctx.stroke();
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

function createPoolTileTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(0, 0, 256, 512);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 4;
  for (let l = 1; l <= 5; l++) {
    const x = (l * 256) / 6;
    ctx.beginPath();
    ctx.setLineDash([12, 12]);
    ctx.moveTo(x, 20);
    ctx.lineTo(x, 492);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x - 8, 40);
    ctx.lineTo(x + 8, 40);
    ctx.moveTo(x - 8, 472);
    ctx.lineTo(x + 8, 472);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

// Procedural HDRI-like Environment Map for Realistic Glass & Water Reflections (PMREMGenerator)
function generateArchVizEnvMap(pmremGenerator, mode = 'day') {
  const envScene = new THREE.Scene();
  const skyGeo = new THREE.SphereGeometry(80, 32, 16);
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 256);

  if (mode === 'day') {
    grad.addColorStop(0.0, '#1d4ed8');
    grad.addColorStop(0.45, '#93c5fd');
    grad.addColorStop(0.52, '#f8fafc');
    grad.addColorStop(1.0, '#334155');
  } else if (mode === 'sunset') {
    grad.addColorStop(0.0, '#1e1b4b');
    grad.addColorStop(0.45, '#ea580c');
    grad.addColorStop(0.52, '#fde047');
    grad.addColorStop(1.0, '#1f2937');
  } else {
    grad.addColorStop(0.0, '#020617');
    grad.addColorStop(0.5, '#0f172a');
    grad.addColorStop(1.0, '#020617');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  const tex = new THREE.CanvasTexture(canvas);
  const skyMat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide });
  envScene.add(new THREE.Mesh(skyGeo, skyMat));
  const envMap = pmremGenerator.fromScene(envScene, 0.04).texture;
  skyGeo.dispose();
  skyMat.dispose();
  tex.dispose();
  return envMap;
}

function createSkyDomeTexture(mode = 'day') {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  if (mode === 'day') {
    grad.addColorStop(0, '#1e3a8a');
    grad.addColorStop(0.5, '#7dd3fc');
    grad.addColorStop(0.65, '#e0f2fe');
    grad.addColorStop(1, '#64748b');
  } else if (mode === 'sunset') {
    grad.addColorStop(0, '#1e1b4b');
    grad.addColorStop(0.45, '#c2410c');
    grad.addColorStop(0.6, '#fb923c');
    grad.addColorStop(1, '#1e293b');
  } else {
    grad.addColorStop(0, '#020617');
    grad.addColorStop(0.6, '#090d16');
    grad.addColorStop(1, '#020617');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);
  return new THREE.CanvasTexture(canvas);
}

export function TrainingZones3D({ isEn = false, onBookingClick }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const pmremGenRef = useRef(null);
  const skyDomeRef = useRef(null);

  const zoneGroupsRef = useRef({});
  const floodlightsRef = useRef([]);
  const dirLightRef = useRef(null);
  const hemiLightRef = useRef(null);
  const ambientLightRef = useRef(null);

  // States
  const [selectedZoneKey, setSelectedZoneKey] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(0);
  const [lightingMode, setLightingMode] = useState('day');
  const [cameraMode, setCameraMode] = useState('flycam');
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [markerPositions, setMarkerPositions] = useState({});

  // Booking Form State
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [bookingTimeSlot, setBookingTimeSlot] = useState('18:00 - 20:00 (Tối - Đèn LED)');
  const [bookingCustomerName, setBookingCustomerName] = useState('');
  const [bookingCustomerPhone, setBookingCustomerPhone] = useState('');
  const [bookingToastMessage, setBookingToastMessage] = useState('');

  // Smooth Camera Animation Target Ref
  const targetCamPosRef = useRef(new THREE.Vector3(0, 78, 102));
  const targetLookAtRef = useRef(new THREE.Vector3(0, 0, 0));
  const isTransitioningRef = useRef(false);

  const animateCameraTo = useCallback((pos, target) => {
    targetCamPosRef.current.set(pos.x ?? pos[0], pos.y ?? pos[1], pos.z ?? pos[2]);
    targetLookAtRef.current.set(target.x ?? target[0], target.y ?? target[1], target.z ?? target[2]);
    isTransitioningRef.current = true;
  }, []);

  const focusZone = useCallback((zoneKey, targetFloor = 0) => {
    const zone = ZONES_DATA[zoneKey];
    if (!zone) return;
    setSelectedZoneKey(zoneKey);
    setSelectedFloor(targetFloor);
    animateCameraTo(zone.camPos, zone.targetPos);
  }, [animateCameraTo]);

  const resetMasterView = useCallback(() => {
    setSelectedZoneKey(null);
    setSelectedFloor(0);
    setCameraMode('flycam');
    animateCameraTo({ x: 0, y: 78, z: 102 }, { x: 0, y: 0, z: 0 });
  }, [animateCameraTo]);

  const setPlan2DView = useCallback(() => {
    setCameraMode('plan2d');
    animateCameraTo({ x: 0, y: 115, z: 0.01 }, { x: 0, y: 0, z: 0 });
  }, [animateCameraTo]);

  const toggleWalkMode = useCallback(() => {
    if (cameraMode === 'walk') {
      setCameraMode('flycam');
      animateCameraTo({ x: 0, y: 78, z: 102 }, { x: 0, y: 0, z: 0 });
    } else {
      setCameraMode('walk');
      animateCameraTo({ x: -13.5, y: 3.2, z: 58 }, { x: -13.5, y: 3, z: 40 });
    }
  }, [cameraMode, animateCameraTo]);

  const applyLightingMode = useCallback((mode) => {
    setLightingMode(mode);
    if (!dirLightRef.current || !hemiLightRef.current || !ambientLightRef.current) return;

    if (skyDomeRef.current) {
      if (skyDomeRef.current.material.map) skyDomeRef.current.material.map.dispose();
      skyDomeRef.current.material.map = createSkyDomeTexture(mode);
      skyDomeRef.current.material.needsUpdate = true;
    }

    if (pmremGenRef.current && sceneRef.current) {
      if (sceneRef.current.environment) sceneRef.current.environment.dispose();
      sceneRef.current.environment = generateArchVizEnvMap(pmremGenRef.current, mode);
    }

    if (mode === 'day') {
      dirLightRef.current.color.setHex(0xfffaed);
      dirLightRef.current.intensity = 1.6;
      dirLightRef.current.position.set(50, 70, 40);
      hemiLightRef.current.color.setHex(0xcce8ff);
      hemiLightRef.current.groundColor.setHex(0x28303e);
      hemiLightRef.current.intensity = 0.9;
      ambientLightRef.current.color.setHex(0x334155);
      ambientLightRef.current.intensity = 0.7;
      if (sceneRef.current) {
        sceneRef.current.background = new THREE.Color(0x8bb8e8);
        sceneRef.current.fog = new THREE.FogExp2(0x8bb8e8, 0.00065);
      }
      floodlightsRef.current.forEach(l => { l.intensity = 0; });
    } else if (mode === 'sunset') {
      dirLightRef.current.color.setHex(0xf97316);
      dirLightRef.current.intensity = 1.8;
      dirLightRef.current.position.set(70, 30, -50);
      hemiLightRef.current.color.setHex(0xfb923c);
      hemiLightRef.current.groundColor.setHex(0x1e1b4b);
      hemiLightRef.current.intensity = 0.8;
      ambientLightRef.current.color.setHex(0x7c2d12);
      ambientLightRef.current.intensity = 0.6;
      if (sceneRef.current) {
        sceneRef.current.background = new THREE.Color(0xc2410c);
        sceneRef.current.fog = new THREE.FogExp2(0xc2410c, 0.00085);
      }
      floodlightsRef.current.forEach(l => { l.intensity = 0.6; });
    } else if (mode === 'night') {
      dirLightRef.current.color.setHex(0x38bdf8);
      dirLightRef.current.intensity = 0.35;
      dirLightRef.current.position.set(20, 60, 20);
      hemiLightRef.current.color.setHex(0x0f172a);
      hemiLightRef.current.groundColor.setHex(0x020617);
      hemiLightRef.current.intensity = 0.4;
      ambientLightRef.current.color.setHex(0x0b1329);
      ambientLightRef.current.intensity = 0.45;
      if (sceneRef.current) {
        sceneRef.current.background = new THREE.Color(0x090d16);
        sceneRef.current.fog = new THREE.FogExp2(0x090d16, 0.0012);
      }
      floodlightsRef.current.forEach(l => { l.intensity = 2.4; });
    }
  }, []);

  // Floor Slicer logic
  useEffect(() => {
    Object.entries(zoneGroupsRef.current).forEach(([zKey, group]) => {
      if (!group || !group.userData.floors) return;
      const { floor1, floor2, floor3, roof } = group.userData.floors;

      if (selectedZoneKey && selectedZoneKey !== zKey) {
        if (floor1) { floor1.position.y = 0; floor1.visible = true; }
        if (floor2) { floor2.position.y = 0; floor2.visible = true; }
        if (floor3) { floor3.position.y = 0; floor3.visible = true; }
        if (roof) { roof.position.y = 0; roof.visible = true; }
        return;
      }

      if (selectedFloor === 0) {
        if (floor1) { floor1.position.y = 0; floor1.visible = true; }
        if (floor2) { floor2.position.y = 0; floor2.visible = true; }
        if (floor3) { floor3.position.y = 0; floor3.visible = true; }
        if (roof) { roof.position.y = 0; roof.visible = true; }
      } else if (selectedFloor === 1) {
        if (floor1) { floor1.position.y = 0; floor1.visible = true; }
        if (floor2) { floor2.position.y = 16; floor2.visible = false; }
        if (floor3) { floor3.position.y = 26; floor3.visible = false; }
        if (roof) { roof.position.y = 36; roof.visible = false; }
      } else if (selectedFloor === 2) {
        if (floor1) { floor1.position.y = 0; floor1.visible = true; }
        if (floor2) { floor2.position.y = 0; floor2.visible = true; }
        if (floor3) { floor3.position.y = 20; floor3.visible = false; }
        if (roof) { roof.position.y = 30; roof.visible = false; }
      } else if (selectedFloor === 3) {
        if (floor1) { floor1.position.y = 0; floor1.visible = true; }
        if (floor2) { floor2.position.y = 0; floor2.visible = true; }
        if (floor3) { floor3.position.y = 0; floor3.visible = true; }
        if (roof) { roof.position.y = 18; roof.visible = false; }
      }
    });
  }, [selectedFloor, selectedZoneKey]);

  // Main Three.js Scene Setup with EXACT Non-overlapping Masterplan Coordinates
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x8bb8e8);
    scene.fog = new THREE.FogExp2(0x8bb8e8, 0.00065);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.5, 850);
    camera.position.set(0, 68, 104);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.minDistance = 4;
    controls.maxDistance = 185;
    controls.target.set(0, 2, 0);
    controlsRef.current = controls;

    // Procedural HDRI-like Environment Map for Realistic Glass & Water Reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    pmremGenRef.current = pmremGenerator;

    const skyDome = new THREE.Mesh(
      new THREE.SphereGeometry(280, 32, 24),
      new THREE.MeshBasicMaterial({ map: createSkyDomeTexture('day'), side: THREE.BackSide, depthWrite: false })
    );
    scene.add(skyDome);
    skyDomeRef.current = skyDome;
    scene.environment = generateArchVizEnvMap(pmremGenerator, 'day');

    const ambientLight = new THREE.AmbientLight(0x334155, 0.7);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const hemiLight = new THREE.HemisphereLight(0xcce8ff, 0x28303e, 0.9);
    hemiLight.position.set(0, 80, 0);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.6);
    dirLight.position.set(50, 70, 40);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 250;
    dirLight.shadow.camera.left = -85;
    dirLight.shadow.camera.right = 85;
    dirLight.shadow.camera.top = 85;
    dirLight.shadow.camera.bottom = -85;
    dirLight.shadow.bias = -0.0004;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    const baseGroup = new THREE.Group();
    scene.add(baseGroup);

    // Site base 130m x 100m (X: -65..+65, Z: -50..+50)
    const siteMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(130, 100),
      new THREE.MeshStandardMaterial({ color: 0x1a1e2b, roughness: 0.88, metalness: 0.08 })
    );
    siteMesh.rotation.x = -Math.PI / 2;
    siteMesh.receiveShadow = true;
    baseGroup.add(siteMesh);

    // Outer buffer terrain
    const outerTerrain = new THREE.Mesh(
      new THREE.PlaneGeometry(340, 280),
      new THREE.MeshStandardMaterial({ color: 0x0c0f18, roughness: 0.95 })
    );
    outerTerrain.rotation.x = -Math.PI / 2;
    outerTerrain.position.y = -0.15;
    outerTerrain.receiveShadow = true;
    baseGroup.add(outerTerrain);

    // Main Internal Boulevard & Interconnecting Walkways
    const walkwayMat = new THREE.MeshStandardMaterial({ color: 0x333b4e, roughness: 0.8 });
    const mainAvenue = new THREE.Mesh(new THREE.PlaneGeometry(12, 96), walkwayMat);
    mainAvenue.rotation.x = -Math.PI / 2;
    mainAvenue.position.set(-13.5, 0.02, 0);
    mainAvenue.receiveShadow = true;
    baseGroup.add(mainAvenue);

    const crossAvenue = new THREE.Mesh(new THREE.PlaneGeometry(110, 6), walkwayMat);
    crossAvenue.rotation.x = -Math.PI / 2;
    crossAvenue.position.set(0, 0.02, 6);
    crossAvenue.receiveShadow = true;
    baseGroup.add(crossAvenue);

    // ─────────────────────────────────────────────────────────────
    // BUILDINGS & ZONES PER EXACT COORDINATES
    // ─────────────────────────────────────────────────────────────
    const zoneGroups = {};

    // Helper for 3-Floor Buildings
    const create3FloorBuilding = (bWidth, bDepth, wallColor, createF1, createF2, createF3) => {
      const bGroup = new THREE.Group();
      const floorHeight = 4.6;
      const concreteMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.65, metalness: 0.1 });
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x94a3b8,
        metalness: 0.15,
        roughness: 0.1,
        transmission: 0.8,
        transparent: true,
        opacity: 0.45
      });
      const columnMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.5 });

      // Floor 1
      const f1Group = new THREE.Group();
      bGroup.add(f1Group);
      const s1 = new THREE.Mesh(new THREE.BoxGeometry(bWidth, 0.3, bDepth), concreteMat);
      s1.position.y = 0.15;
      s1.receiveShadow = true;
      f1Group.add(s1);
      const g1 = new THREE.Mesh(new THREE.BoxGeometry(bWidth - 0.2, floorHeight - 0.4, bDepth - 0.2), glassMat);
      g1.position.y = floorHeight / 2;
      f1Group.add(g1);
      if (createF1) createF1(f1Group, bWidth, bDepth);

      // Floor 2
      const f2Group = new THREE.Group();
      bGroup.add(f2Group);
      const s2 = new THREE.Mesh(new THREE.BoxGeometry(bWidth, 0.4, bDepth), concreteMat);
      s2.position.y = floorHeight;
      s2.receiveShadow = true;
      f2Group.add(s2);
      const g2 = new THREE.Mesh(new THREE.BoxGeometry(bWidth - 0.2, floorHeight - 0.4, bDepth - 0.2), glassMat);
      g2.position.y = floorHeight + floorHeight / 2;
      f2Group.add(g2);
      if (createF2) createF2(f2Group, bWidth, bDepth, floorHeight);

      // Floor 3
      const f3Group = new THREE.Group();
      bGroup.add(f3Group);
      const s3 = new THREE.Mesh(new THREE.BoxGeometry(bWidth, 0.4, bDepth), concreteMat);
      s3.position.y = floorHeight * 2;
      s3.receiveShadow = true;
      f3Group.add(s3);
      const g3 = new THREE.Mesh(new THREE.BoxGeometry(bWidth - 0.2, floorHeight - 0.4, bDepth - 0.2), glassMat);
      g3.position.y = floorHeight * 2 + floorHeight / 2;
      f3Group.add(g3);
      if (createF3) createF3(f3Group, bWidth, bDepth, floorHeight * 2);

      // Roof
      const roofGroup = new THREE.Group();
      bGroup.add(roofGroup);
      const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(bWidth + 0.6, 0.5, bDepth + 0.6), concreteMat);
      roofSlab.position.y = floorHeight * 3 + 0.25;
      roofSlab.castShadow = true;
      roofGroup.add(roofSlab);
      const acUnit = new THREE.Mesh(new THREE.BoxGeometry(3, 1.2, 2), columnMat);
      acUnit.position.set(2, floorHeight * 3 + 1, 0);
      roofGroup.add(acUnit);

      bGroup.userData.floors = { floor1: f1Group, floor2: f2Group, floor3: f3Group, roof: roofGroup };
      return bGroup;
    };

    // --- KHU B (North-West: Center -37, -30 • Size 38x24m) ---
    const bballTex = createBasketballTexture();
    const khuBGroup = create3FloorBuilding(38, 24, 0x475569,
      (f1) => {
        // Floor 1: Basketball Court (28x15)
        const bCourt = new THREE.Mesh(new THREE.PlaneGeometry(32, 20), new THREE.MeshStandardMaterial({ map: bballTex, roughness: 0.5 }));
        bCourt.rotation.x = -Math.PI / 2;
        bCourt.position.set(0, 0.22, 0);
        f1.add(bCourt);
        // Basketball Hoops
        const hoop1 = new THREE.Mesh(new THREE.BoxGeometry(2, 3.2, 0.2), new THREE.MeshStandardMaterial({ color: 0xf97316 }));
        hoop1.position.set(-14, 2, 0);
        f1.add(hoop1);
        const hoop2 = new THREE.Mesh(new THREE.BoxGeometry(2, 3.2, 0.2), new THREE.MeshStandardMaterial({ color: 0xf97316 }));
        hoop2.position.set(14, 2, 0);
        f1.add(hoop2);
      },
      (f2, bw, bd, baseY) => {
        // Floor 2: 4 Badminton Courts
        const badFloor = new THREE.Mesh(new THREE.PlaneGeometry(36, 22), new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 }));
        badFloor.rotation.x = -Math.PI / 2;
        badFloor.position.set(0, baseY + 0.22, 0);
        f2.add(badFloor);
      },
      (f3, bw, bd, baseY) => {
        // Floor 3: 4 ITTF Table Tennis Tables
        const ttMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8 });
        for (let t = -9; t <= 9; t += 6) {
          const table = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.8, 1.5), ttMat);
          table.position.set(t, baseY + 0.6, 0);
          f3.add(table);
        }
      }
    );
    khuBGroup.position.set(-37, 0, -30);
    khuBGroup.userData.id = 'khuB';
    scene.add(khuBGroup);
    zoneGroups.khuB = khuBGroup;

    // --- KHU A (Mid-West: Center -37, +6 • Size 38x24m) ---
    const poolTex = createPoolTileTexture();
    const khuAGroup = create3FloorBuilding(38, 24, 0x1e3a5f,
      (f1) => {
        // Floor 1: 25m Swimming Pool
        const poolWater = new THREE.Mesh(
          new THREE.PlaneGeometry(25, 14),
          new THREE.MeshPhysicalMaterial({ color: 0x06b6d4, transmission: 0.85, roughness: 0.08, transparent: true, opacity: 0.75 })
        );
        poolWater.rotation.x = -Math.PI / 2;
        poolWater.position.set(0, 0.4, 0);
        f1.add(poolWater);

        const poolBed = new THREE.Mesh(new THREE.PlaneGeometry(25, 14), new THREE.MeshStandardMaterial({ map: poolTex }));
        poolBed.rotation.x = -Math.PI / 2;
        poolBed.position.set(0, 0.18, 0);
        f1.add(poolBed);
      },
      (f2, bw, bd, baseY) => {
        // Floor 2: Gym & Treadmills
        const gymFloor = new THREE.Mesh(new THREE.PlaneGeometry(36, 22), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 }));
        gymFloor.rotation.x = -Math.PI / 2;
        gymFloor.position.set(0, baseY + 0.22, 0);
        f2.add(gymFloor);
        for (let i = -10; i <= 10; i += 5) {
          const m = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 1), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
          m.position.set(i, baseY + 0.8, -7);
          f2.add(m);
        }
      },
      (f3, bw, bd, baseY) => {
        // Floor 3: Lockers & Shower Stalls
        for (let l = -8; l <= 8; l += 4) {
          const locker = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 6), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
          locker.position.set(l, baseY + 1.2, 0);
          f3.add(locker);
        }
      }
    );
    khuAGroup.position.set(-37, 0, 6);
    khuAGroup.userData.id = 'khuA';
    scene.add(khuAGroup);
    zoneGroups.khuA = khuAGroup;

    // --- KHU C (South-West: Center -40, +35 • Size 32x18m) ---
    const khuCGroup = create3FloorBuilding(32, 18, 0x4c1d95,
      (f1) => {
        // Floor 1: Boxing Ring & Tatami
        const ring = new THREE.Mesh(new THREE.BoxGeometry(8, 1, 8), new THREE.MeshStandardMaterial({ color: 0xbe123c }));
        ring.position.set(0, 0.5, 0);
        f1.add(ring);
        for (let b = -8; b <= 8; b += 4) {
          const bag = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.8, 8), new THREE.MeshStandardMaterial({ color: 0x111827 }));
          bag.position.set(b, 2.2, -5);
          f1.add(bag);
        }
      },
      (f2, bw, bd, baseY) => {
        // Floor 2: Lockers & Changing
        for (let r = -6; r <= 6; r += 4) {
          const m = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 4), new THREE.MeshStandardMaterial({ color: 0x64748b }));
          m.position.set(r, baseY + 1.2, 0);
          f2.add(m);
        }
      },
      (f3, bw, bd, baseY) => {
        // Floor 3: Yoga & Pilates
        const yogaFloor = new THREE.Mesh(new THREE.PlaneGeometry(30, 16), new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.5 }));
        yogaFloor.rotation.x = -Math.PI / 2;
        yogaFloor.position.set(0, baseY + 0.22, 0);
        f3.add(yogaFloor);
      }
    );
    khuCGroup.position.set(-40, 0, 35);
    khuCGroup.userData.id = 'khuC';
    scene.add(khuCGroup);
    zoneGroups.khuC = khuCGroup;

    // --- CENTRAL LOBBY PAVILION (Center -5, +28 • Size 18x14m) ---
    const lobbyGroup = new THREE.Group();
    lobbyGroup.position.set(-5, 0, 28);
    lobbyGroup.userData = { id: 'lobby' };
    scene.add(lobbyGroup);
    zoneGroups.lobby = lobbyGroup;

    const lobbyBase = new THREE.Mesh(new THREE.BoxGeometry(18, 0.4, 14), new THREE.MeshStandardMaterial({ color: 0x334155 }));
    lobbyBase.position.y = 0.2;
    lobbyGroup.add(lobbyBase);

    const lobbyGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(7, 8, 6.5, 24),
      new THREE.MeshPhysicalMaterial({ color: 0xe2e8f0, roughness: 0.1, transmission: 0.75, transparent: true, opacity: 0.55 })
    );
    lobbyGlass.position.y = 3.65;
    lobbyGroup.add(lobbyGlass);

    const lobbyRoof = new THREE.Mesh(new THREE.CylinderGeometry(9, 7.5, 0.6, 24), new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.6 }));
    lobbyRoof.position.y = 7.2;
    lobbyRoof.castShadow = true;
    lobbyGroup.add(lobbyRoof);

    // Welcome Arch "Olympic Sports Area" at South-West (x: -13.5, z: 49.5)
    const archGroup = new THREE.Group();
    archGroup.position.set(-13.5, 0, 49.5);
    scene.add(archGroup);

    const pLeft = new THREE.Mesh(new THREE.BoxGeometry(1, 7, 1), new THREE.MeshStandardMaterial({ color: 0xd97706 }));
    pLeft.position.set(-6, 3.5, 0);
    archGroup.add(pLeft);
    const pRight = new THREE.Mesh(new THREE.BoxGeometry(1, 7, 1), new THREE.MeshStandardMaterial({ color: 0xd97706 }));
    pRight.position.set(6, 3.5, 0);
    archGroup.add(pRight);
    const beam = new THREE.Mesh(new THREE.BoxGeometry(13.5, 1.4, 1.2), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    beam.position.set(0, 7.2, 0);
    archGroup.add(beam);

    // --- EAST WING: OUTDOOR COMPLEX ---
    const outdoorGroup = new THREE.Group();
    scene.add(outdoorGroup);
    zoneGroups.outdoor = outdoorGroup;

    // 1x Sân Bóng 5 Người: Center (+15, -25), Size 20x34m
    const s5Pitch = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 34),
      new THREE.MeshStandardMaterial({ map: createSoccerTexture('5'), roughness: 0.7 })
    );
    s5Pitch.rotation.x = -Math.PI / 2;
    s5Pitch.position.set(15, 0.05, -25);
    s5Pitch.receiveShadow = true;
    outdoorGroup.add(s5Pitch);

    // 1x Sân Bóng 7 Người: Center (+44, -18), Size 32x48m
    const s7Pitch = new THREE.Mesh(
      new THREE.PlaneGeometry(32, 48),
      new THREE.MeshStandardMaterial({ map: createSoccerTexture('7'), roughness: 0.7 })
    );
    s7Pitch.rotation.x = -Math.PI / 2;
    s7Pitch.position.set(44, 0.05, -18);
    s7Pitch.receiveShadow = true;
    outdoorGroup.add(s7Pitch);

    // 3D Goals
    const goalMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const g1 = new THREE.Mesh(new THREE.BoxGeometry(5, 2.2, 1.2), goalMat);
    g1.position.set(15, 1.1, -41);
    outdoorGroup.add(g1);
    const g2 = new THREE.Mesh(new THREE.BoxGeometry(5, 2.2, 1.2), goalMat);
    g2.position.set(15, 1.1, -9);
    outdoorGroup.add(g2);
    const g3 = new THREE.Mesh(new THREE.BoxGeometry(6.5, 2.4, 1.5), goalMat);
    g3.position.set(44, 1.2, -41);
    outdoorGroup.add(g3);
    const g4 = new THREE.Mesh(new THREE.BoxGeometry(6.5, 2.4, 1.5), goalMat);
    g4.position.set(44, 1.2, 5);
    outdoorGroup.add(g4);

    // 4x Sân Pickleball: Centers X = +16, +28, +40, +52 at Z = +28 (each 10x20m)
    const pbTex = createPickleballTexture();
    const pbMat = new THREE.MeshStandardMaterial({ map: pbTex, roughness: 0.6 });
    [16, 28, 40, 52].forEach(px => {
      const pbMesh = new THREE.Mesh(new THREE.PlaneGeometry(10, 20), pbMat);
      pbMesh.rotation.x = -Math.PI / 2;
      pbMesh.position.set(px, 0.05, 28);
      pbMesh.receiveShadow = true;
      outdoorGroup.add(pbMesh);

      // Pickleball Net
      const net = new THREE.Mesh(new THREE.BoxGeometry(9.8, 0.9, 0.1), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
      net.position.set(px, 0.45, 28);
      outdoorGroup.add(net);
    });

    // 10 Floodlight Towers
    const floodlightSpots = [];
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.3 });
    const lightPositions = [
      [5, -42], [25, -42], [28, -42], [60, -42],
      [5, -8], [25, -8], [28, 6], [60, 6],
      [10, 38], [58, 38]
    ];
    lightPositions.forEach(([lx, lz]) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 15, 8), poleMat);
      pole.position.set(lx, 7.5, lz);
      pole.castShadow = true;
      outdoorGroup.add(pole);

      const head = new THREE.Mesh(new THREE.BoxGeometry(2, 0.8, 1), new THREE.MeshStandardMaterial({ color: 0xe2e8f0 }));
      head.position.set(lx, 15, lz);
      outdoorGroup.add(head);

      const spot = new THREE.SpotLight(0xffffff, 0, 70, Math.PI / 3, 0.5, 1);
      spot.position.set(lx, 15, lz);
      spot.target.position.set(34, 0, 2);
      scene.add(spot);
      scene.add(spot.target);
      floodlightSpots.push(spot);
    });
    floodlightsRef.current = floodlightSpots;

    // --- PARKING LOT (South-East: Center +38, +44 • Size 48x15.6m) ---
    const parkingGroup = new THREE.Group();
    parkingGroup.position.set(38, 0, 44);
    parkingGroup.userData = { id: 'parking' };
    scene.add(parkingGroup);
    zoneGroups.parking = parkingGroup;

    const parkAsphalt = new THREE.Mesh(
      new THREE.PlaneGeometry(48, 15.6),
      new THREE.MeshStandardMaterial({ color: 0x181e29, roughness: 0.9 })
    );
    parkAsphalt.rotation.x = -Math.PI / 2;
    parkAsphalt.position.y = 0.04;
    parkAsphalt.receiveShadow = true;
    parkingGroup.add(parkAsphalt);

    // 2 Solar Carports
    const solarMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.8, roughness: 0.2 });
    const cpNorth = new THREE.Mesh(new THREE.BoxGeometry(46, 0.3, 5), solarMat);
    cpNorth.position.set(0, 3.8, -4.5);
    parkingGroup.add(cpNorth);
    const cpSouth = new THREE.Mesh(new THREE.BoxGeometry(46, 0.3, 5), solarMat);
    cpSouth.position.set(0, 3.8, 4.5);
    parkingGroup.add(cpSouth);

    // 20 parking stalls & 14 parked cars
    const carColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0xffffff, 0x64748b, 0x14b8a6];
    for (let c = 0; c < 20; c++) {
      const col = c % 10;
      const row = Math.floor(c / 10);
      const cx = -21 + col * 4.6;
      const cz = row === 0 ? -4.5 : 4.5;

      const lineMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 4.8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      lineMesh.rotation.x = -Math.PI / 2;
      lineMesh.position.set(cx + 2.2, 0.06, cz);
      parkingGroup.add(lineMesh);

      if ((c * 7) % 10 < 7) {
        const car = new THREE.Mesh(new THREE.BoxGeometry(2, 1.2, 3.8), new THREE.MeshStandardMaterial({ color: carColors[c % carColors.length], roughness: 0.3, metalness: 0.4 }));
        car.position.set(cx, 0.65, cz);
        car.castShadow = true;
        parkingGroup.add(car);
      }
    }

    // Trees along perimeters
    const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
    const treeFoliageMat1 = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
    const treePositions = [
      [-60, -42], [-60, -20], [-60, 0], [-60, 20], [-60, 42],
      [62, -42], [62, -20], [62, 0], [62, 20], [62, 42],
      [-25, -45], [0, -45], [25, -45],
      [-25, 47], [10, 47]
    ];
    treePositions.forEach(([tx, tz]) => {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 3, 6), treeTrunkMat);
      trunk.position.set(tx, 1.5, tz);
      trunk.castShadow = true;
      scene.add(trunk);
      const fol = new THREE.Mesh(new THREE.ConeGeometry(2.4, 5.2, 7), treeFoliageMat1);
      fol.position.set(tx, 5, tz);
      fol.castShadow = true;
      scene.add(fol);
    });

    zoneGroupsRef.current = zoneGroups;

    // Animation loop
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      if (isTransitioningRef.current) {
        camera.position.lerp(targetCamPosRef.current, 0.08);
        controls.target.lerp(targetLookAtRef.current, 0.08);
        if (
          camera.position.distanceTo(targetCamPosRef.current) < 0.15 &&
          controls.target.distanceTo(targetLookAtRef.current) < 0.15
        ) {
          camera.position.copy(targetCamPosRef.current);
          controls.target.copy(targetLookAtRef.current);
          isTransitioningRef.current = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);

      // Project 3D Markers to 2D screen
      const newMarkerPositions = {};
      Object.entries(ZONES_DATA).forEach(([zKey, zData]) => {
        const v = new THREE.Vector3(...zData.markerPos);
        v.project(camera);
        if (v.z < 1) {
          const x = ((v.x + 1) * width) / 2;
          const y = ((-v.y + 1) * height) / 2;
          newMarkerPositions[zKey] = { x, y, visible: true };
        } else {
          newMarkerPositions[zKey] = { visible: false };
        }
      });
      setMarkerPositions(newMarkerPositions);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      if (skyDomeRef.current) {
        if (skyDomeRef.current.material.map) skyDomeRef.current.material.map.dispose();
        skyDomeRef.current.geometry.dispose();
        skyDomeRef.current.material.dispose();
      }
      if (pmremGenRef.current) pmremGenRef.current.dispose();
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  const selectedZone = selectedZoneKey ? ZONES_DATA[selectedZoneKey] : null;

  // Handle Online Court Booking Submission
  const handleBookingSubmit = (e) => {
    e.preventDefault();
    setBookingToastMessage('✅ Đặt lịch thành công! Lễ tân đã ghi nhận mã đặt sân của bạn.');
    setTimeout(() => {
      setIsBookingModalOpen(false);
      setBookingToastMessage('');
      if (onBookingClick && selectedZone) {
        onBookingClick(selectedZone);
      }
    }, 1800);
  };

  return (
    <div className={`relative w-full ${isFullscreen ? 'fixed inset-0 z-50 bg-[#141622] h-screen' : 'h-[680px] md:h-[780px] rounded-3xl overflow-hidden shadow-2xl border border-white/10'}`}>
      {/* 3D Canvas Mounting Point */}
      <div ref={mountRef} className="w-full h-full relative cursor-grab active:cursor-grabbing outline-none" />

      {/* Floating 3D HTML Markers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        {Object.entries(ZONES_DATA).map(([zKey, zData]) => {
          const marker = markerPositions[zKey];
          if (!marker || !marker.visible) return null;
          const isActive = selectedZoneKey === zKey;
          return (
            <div
              key={zKey}
              style={{
                left: `${marker.x}px`,
                top: `${marker.y}px`,
                transform: 'translate(-50%, -100%)'
              }}
              className={`absolute pointer-events-auto cursor-pointer transition-transform duration-200 hover:scale-110 ${isActive ? 'z-30' : 'z-20'}`}
              onClick={() => focusZone(zKey)}
            >
              <div
                style={{
                  background: isActive ? zData.color : 'rgba(15, 23, 42, 0.88)',
                  color: isActive ? '#0f172a' : '#f8fafc',
                  borderColor: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.2)'
                }}
                className="px-3 py-1.5 rounded-full border shadow-xl flex items-center gap-1.5 backdrop-blur-md text-[11px] font-bold whitespace-nowrap"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: zData.color }} />
                <span>{isEn ? zData.nameEn : zData.shortTitle.split(':')[0]}</span>
              </div>
              <div className="w-[2px] h-4 mx-auto" style={{ background: `linear-gradient(to bottom, ${zData.color}, transparent)` }} />
              <div className="w-2 h-2 rounded-full mx-auto -mt-1 shadow-md" style={{ backgroundColor: zData.color }} />
            </div>
          );
        })}
      </div>

      {/* TOP HEADER CONTROLS */}
      <header className="absolute top-3 left-3 right-3 md:top-4 md:left-4 md:right-4 z-20 flex flex-wrap items-center justify-between gap-2.5 pointer-events-none">
        <div className="bg-[#141622]/90 backdrop-blur-md border border-white/15 px-3.5 py-2.5 rounded-2xl pointer-events-auto flex items-center gap-3 shadow-xl">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>explore</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase tracking-wider text-amber-300 font-bold">
                {isEn ? 'Smart Campus Layout' : 'Bố Trí Không Gian Thuận Tiện'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                ArchViz Thực Tế • 13.000 m² (130m × 100m)
              </span>
            </div>
            <h3 className="text-xs md:text-sm font-extrabold text-white tracking-tight leading-tight m-0">
              {isEn ? '3D INTERACTIVE TRAINING ZONES' : 'SƠ ĐỒ 3D CÁC KHU VỰC TẬP LUYỆN'}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap pointer-events-auto">
          {/* Online Court Booking Trigger */}
          <button
            type="button"
            onClick={() => setIsBookingModalOpen(true)}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold border border-amber-300 px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg transition"
            title="Mở form đặt sân online"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>event_available</span>
            <span>{isEn ? 'Book Court' : 'Đặt Sân Online'}</span>
          </button>

          {/* Infographic Modal Trigger */}
          <button
            type="button"
            onClick={() => setIsInfoModalOpen(true)}
            className="bg-[#141622]/90 hover:bg-[#1e2337] border border-white/15 px-3 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 shadow-lg transition"
          >
            <span className="material-symbols-outlined text-amber-300" style={{ fontSize: '18px' }}>grid_view</span>
            <span className="hidden sm:inline">{isEn ? 'Campus Specs' : 'Bảng Sơ Đồ & Tiện Ích'}</span>
          </button>

          {/* 2D Plan View */}
          <button
            type="button"
            onClick={setPlan2DView}
            className={`border px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg transition ${cameraMode === 'plan2d' ? 'bg-emerald-500 text-slate-900 border-emerald-400 font-bold' : 'bg-[#141622]/90 hover:bg-[#1e2337] text-white border-white/15'}`}
          >
            <span className="material-symbols-outlined text-emerald-400" style={{ fontSize: '18px' }}>map</span>
            <span>{isEn ? '2D Plan' : '📐 Mặt Bằng 2D'}</span>
          </button>

          {/* Walk Mode Toggle */}
          <button
            type="button"
            onClick={toggleWalkMode}
            className={`border px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg transition ${cameraMode === 'walk' ? 'bg-sky-500 text-slate-900 border-sky-400 font-bold' : 'bg-[#141622]/90 hover:bg-[#1e2337] text-white border-white/15'}`}
          >
            <span className="material-symbols-outlined text-sky-400" style={{ fontSize: '18px' }}>visibility</span>
            <span>{cameraMode === 'walk' ? (isEn ? 'Walk Mode' : 'Góc Nhìn Thực Tế') : (isEn ? 'Flycam 3D' : 'Flycam 3D')}</span>
          </button>

          {/* Lighting Mode */}
          <div className="bg-[#141622]/90 border border-white/15 p-1 rounded-xl flex items-center gap-1 shadow-lg">
            <button
              type="button"
              onClick={() => applyLightingMode('day')}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition ${lightingMode === 'day' ? 'bg-amber-400 text-slate-900' : 'text-slate-300 hover:bg-white/10'}`}
            >
              ☀️ {isEn ? 'Day' : 'Nắng'}
            </button>
            <button
              type="button"
              onClick={() => applyLightingMode('sunset')}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition ${lightingMode === 'sunset' ? 'bg-orange-500 text-white' : 'text-slate-300 hover:bg-white/10'}`}
            >
              🌅 {isEn ? 'Sunset' : 'Hoàng Hôn'}
            </button>
            <button
              type="button"
              onClick={() => applyLightingMode('night')}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition ${lightingMode === 'night' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-white/10'}`}
            >
              💡 {isEn ? 'Night LED' : 'Đèn Đêm'}
            </button>
          </div>

          {/* Overview */}
          <button
            type="button"
            onClick={resetMasterView}
            className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-3 py-2 rounded-xl text-xs font-bold text-amber-300 flex items-center gap-1 shadow-lg transition"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>center_focus_strong</span>
            <span>{isEn ? 'Overview' : 'Toàn Cảnh'}</span>
          </button>

          {/* Fullscreen */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="bg-[#141622]/90 hover:bg-[#1e2337] border border-white/15 p-2 rounded-xl text-white shadow-lg transition"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
            </span>
          </button>
        </div>
      </header>

      {/* LEFT MASTERPLAN SIDEBAR */}
      <aside className="absolute left-4 top-24 z-20 w-72 hidden xl:flex flex-col gap-3 pointer-events-none">
        <div className="bg-[#141622]/90 backdrop-blur-md border border-white/15 p-4 rounded-2xl pointer-events-auto shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
              {isEn ? 'Masterplan: 9 Clusters' : 'Quy Hoạch Chuẩn 9 Cụm'}
            </span>
            <span className="text-xs font-extrabold text-emerald-400">13.000 m²</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
            {isEn
              ? 'West Wing blocks (A, B, C), Central Lobby and East Outdoor courts are interconnected by wide internal avenues.'
              : 'Các khối nhà A, B, C (Cánh Tây), Sảnh Lễ Tân (Trục Giữa) và Khu Sân Ngoài Trời (Cánh Đông) được tách biệt hoàn toàn bởi đại lộ nội khu.'}
          </p>
          <div className="space-y-1.5 text-xs">
            {Object.entries(ZONES_DATA).map(([zKey, zData]) => (
              <div
                key={zKey}
                onClick={() => focusZone(zKey)}
                className={`p-2 rounded-xl flex justify-between items-center cursor-pointer border transition ${selectedZoneKey === zKey ? 'bg-white/15 border-amber-400 text-white' : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200'}`}
              >
                <span className="font-medium truncate pr-2">{isEn ? zData.nameEn : zData.shortTitle}</span>
                <span className="font-bold shrink-0" style={{ color: zData.color }}>{zData.area.split(' ')[0]} m²</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#141622]/90 backdrop-blur-md border border-white/15 p-3.5 rounded-2xl pointer-events-auto space-y-2 shadow-xl">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
            {isEn ? 'Standard Amenities' : 'Tiện Ích Tiêu Chuẩn'}
          </div>
          <div onClick={() => focusZone('khuA', 3)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-2 cursor-pointer transition">
            <span className="material-symbols-outlined text-emerald-400 text-[18px]">vpn_key</span>
            <span className="text-[11px] text-slate-200 leading-tight">Tủ cất đồ cá nhân có chìa khóa an toàn, thuận tiện sử dụng</span>
          </div>
          <div onClick={() => focusZone('khuA', 3)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-2 cursor-pointer transition">
            <span className="material-symbols-outlined text-emerald-400 text-[18px]">shower</span>
            <span className="text-[11px] text-slate-200 leading-tight">Phòng thay đồ và khu vực tắm tráng nóng lạnh sạch sẽ</span>
          </div>
          <div onClick={() => focusZone('lobby')} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-2 cursor-pointer transition">
            <span className="material-symbols-outlined text-emerald-400 text-[18px]">local_cafe</span>
            <span className="text-[11px] text-slate-200 leading-tight">Quầy căn-tin nước giải khát, nước khoáng phục vụ nhanh</span>
          </div>
          <div onClick={() => focusZone('lobby')} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-2 cursor-pointer transition">
            <span className="material-symbols-outlined text-emerald-400 text-[18px]">medical_services</span>
            <span className="text-[11px] text-slate-200 leading-tight">Tủ thuốc y tế và dụng cụ sơ cứu ban đầu luôn sẵn sàng</span>
          </div>
        </div>
      </aside>

      {/* RIGHT INSPECTOR DRAWER (WITH INTERACTIVE EQUIP ZOOMS) */}
      <aside
        className={`absolute right-3 md:right-4 top-20 bottom-20 z-30 w-[92vw] sm:w-96 bg-[#141622]/95 backdrop-blur-xl border border-white/15 rounded-3xl p-5 flex flex-col justify-between shadow-2xl transition-all duration-300 overflow-hidden ${selectedZone ? 'translate-x-0 opacity-100 pointer-events-auto' : 'translate-x-[120%] opacity-0 pointer-events-none'}`}
      >
        {selectedZone && (
          <>
            <div className="overflow-y-auto pr-1 space-y-4">
              <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {selectedZone.badge}
                  </span>
                  <h4 className="text-base md:text-lg font-extrabold text-white mt-1.5 leading-snug m-0">
                    {isEn ? selectedZone.nameEn : selectedZone.shortTitle}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={resetMasterView}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition shrink-0"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed m-0">
                {isEn ? selectedZone.descEn : selectedZone.desc}
              </p>

              {/* 3D Floor Slicer */}
              {selectedZone.hasFloors && (
                <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">layers</span>
                      {isEn ? '3D Floor Slicer' : 'Bóc Tách Mặt Cắt 3D'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {isEn ? 'Cutaway roof' : 'Mở mái xem bên trong'}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedFloor(0)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition ${selectedFloor === 0 ? 'bg-amber-400 text-slate-950 shadow' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                    >
                      {isEn ? 'All' : 'Cả 3 Tầng'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedFloor(1)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition ${selectedFloor === 1 ? 'bg-amber-400 text-slate-950 shadow' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                    >
                      {isEn ? 'Floor 1' : 'Tầng 1'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedFloor(2)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition ${selectedFloor === 2 ? 'bg-amber-400 text-slate-950 shadow' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                    >
                      {isEn ? 'Floor 2' : 'Tầng 2'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedFloor(3)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition ${selectedFloor === 3 ? 'bg-amber-400 text-slate-950 shadow' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                    >
                      {isEn ? 'Floor 3' : 'Tầng 3'}
                    </button>
                  </div>
                </div>
              )}

              {/* Sub-area floor details and Interactive Equip Zooms */}
              <div className="space-y-2.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  {isEn ? 'Facilities & Equipment Breakdown (Click to Zoom)' : 'Chi Tiết Không Gian & Dụng Cụ (Bấm để Zoom Cận Cảnh)'}
                </div>
                {selectedZone.floors.map((fl, fIdx) => (
                  <div key={fIdx} className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <div className="text-xs font-bold text-white flex items-center justify-between">
                      <span>{isEn ? fl.nameEn || fl.name : fl.name}</span>
                      {selectedZone.hasFloors && (
                        <span className="text-[10px] text-amber-300 font-semibold">Tầng {fl.level}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug m-0">
                      {fl.detail}
                    </p>

                    {/* Interactive Equip Zooms */}
                    {fl.equipZooms?.length > 0 && (
                      <div className="pt-2 border-t border-white/10 flex flex-wrap gap-1.5">
                        {fl.equipZooms.map((zoom, zIdx) => (
                          <button
                            key={zIdx}
                            type="button"
                            onClick={() => animateCameraTo(zoom.camPos, zoom.targetPos)}
                            className="px-2 py-1 rounded-lg bg-white/10 hover:bg-amber-400 hover:text-slate-950 border border-white/15 text-[10.5px] font-bold text-slate-200 transition"
                          >
                            {zoom.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-white/10 mt-3 flex items-center justify-between gap-2">
              <div>
                <span className="text-slate-400 block text-[10px]">{isEn ? 'Total Area:' : 'Quy mô diện tích:'}</span>
                <strong className="text-amber-300 text-xs sm:text-sm font-extrabold">{selectedZone.area.split('(')[0]}</strong>
              </div>
              <button
                type="button"
                onClick={() => setIsBookingModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-xl transition"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>event_available</span>
                <span>{isEn ? 'Book Court Now' : 'Đặt Sân Ngay'}</span>
              </button>
            </div>
          </>
        )}
      </aside>

      {/* BOTTOM QUICK NAVIGATION DOCK */}
      <nav className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-[#141622]/90 backdrop-blur-md border border-white/15 p-1.5 rounded-2xl flex items-center gap-1.5 max-w-[96vw] overflow-x-auto pointer-events-auto shadow-2xl">
        <button
          type="button"
          onClick={resetMasterView}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${!selectedZoneKey ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-slate-200 hover:bg-white/10'}`}
        >
          <span className="material-symbols-outlined text-[16px]">public</span>
          <span>{isEn ? 'Full Campus (13,000m²)' : 'Toàn Cảnh (13.000m²)'}</span>
        </button>
        {Object.entries(ZONES_DATA).map(([zKey, zData]) => {
          const isActive = selectedZoneKey === zKey;
          return (
            <button
              key={zKey}
              type="button"
              onClick={() => focusZone(zKey)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 ${isActive ? 'bg-white/20 text-white border border-amber-400 shadow-md' : 'text-slate-200 hover:bg-white/10'}`}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: zData.color }} />
              <span>{isEn ? zData.nameEn : zData.shortTitle.split(':')[0]}</span>
            </button>
          );
        })}
      </nav>

      {/* MODAL 1: CAMPUS SPECIFICATIONS BOARD */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1e2337] border border-white/20 rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsInfoModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 transition"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5 space-y-4">
                <div>
                  <div className="text-xs font-bold tracking-widest uppercase text-amber-300 mb-1">
                    {isEn ? 'CAMPUS SMART SPATIAL LAYOUT' : 'BỐ TRÍ KHÔNG GIAN THUẬN TIỆN'}
                  </div>
                  <h3 className="text-xl md:text-3xl font-extrabold text-white tracking-tight leading-tight m-0">
                    {isEn ? '3D SPORTS COMPLEX ARCHVIZ' : 'SƠ ĐỒ CÁC KHU VỰC TẬP LUYỆN'}
                  </h3>
                  <p className="text-xs md:text-sm text-slate-300 mt-3 leading-relaxed">
                    9 cụm sân bãi và phòng tập trên diện tích <strong className="text-amber-300">13.000 m²</strong> được quy hoạch gọn gàng, lối đi thông thoáng, biển báo chỉ dẫn rõ ràng. Hệ thống quầy lễ tân tiếp đón chu đáo và hỗ trợ đặt sân nhanh chóng trực tiếp hoặc online.
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <div onClick={() => { setIsInfoModalOpen(false); focusZone('khuA', 3); }} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-3 cursor-pointer transition">
                    <span className="material-symbols-outlined text-emerald-400">vpn_key</span>
                    <span>Tủ cất đồ cá nhân có chìa khóa an toàn, thuận tiện sử dụng</span>
                  </div>
                  <div onClick={() => { setIsInfoModalOpen(false); focusZone('khuA', 3); }} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-3 cursor-pointer transition">
                    <span className="material-symbols-outlined text-emerald-400">shower</span>
                    <span>Phòng thay đồ và khu vực tắm tráng nóng lạnh sạch sẽ</span>
                  </div>
                  <div onClick={() => { setIsInfoModalOpen(false); focusZone('lobby'); }} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-3 cursor-pointer transition">
                    <span className="material-symbols-outlined text-emerald-400">local_cafe</span>
                    <span>Quầy căn-tin nước giải khát, nước khoáng phục vụ nhanh</span>
                  </div>
                  <div onClick={() => { setIsInfoModalOpen(false); focusZone('lobby'); }} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-3 cursor-pointer transition">
                    <span className="material-symbols-outlined text-emerald-400">medical_services</span>
                    <span>Tủ thuốc y tế và dụng cụ sơ cứu ban đầu luôn sẵn sàng</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div onClick={() => { setIsInfoModalOpen(false); focusZone('khuA'); }} className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition space-y-2">
                  <h4 className="text-sm font-extrabold text-white m-0">🏊 KHU A: BƠI LỘI, GYM & FITNESS</h4>
                  <ul className="text-xs text-slate-300 space-y-1 list-none p-0 m-0">
                    <li>• <strong>Tầng 1:</strong> Bể bơi 4 mùa 25m trong nhà nước ấm</li>
                    <li>• <strong>Tầng 2:</strong> Phòng tập Gym & máy kháng lực</li>
                    <li>• <strong>Tầng 3:</strong> Khu thay đồ & tắm tráng nóng lạnh</li>
                  </ul>
                  <div className="pt-2 text-[11px] text-amber-300 font-bold">Bay tới Khu A →</div>
                </div>

                <div onClick={() => { setIsInfoModalOpen(false); focusZone('khuB'); }} className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition space-y-2">
                  <h4 className="text-sm font-extrabold text-white m-0">🏀 KHU B: BÓNG RỔ, CẦU LÔNG & BÓNG BÀN</h4>
                  <ul className="text-xs text-slate-300 space-y-1 list-none p-0 m-0">
                    <li>• <strong>Tầng 1:</strong> Sân bóng rổ tiêu chuẩn phong trào</li>
                    <li>• <strong>Tầng 2:</strong> Cụm 4 sân cầu lông thảm PVC chống trượt</li>
                    <li>• <strong>Tầng 3:</strong> Khu bóng bàn trong nhà 4 bàn tập ITTF</li>
                  </ul>
                  <div className="pt-2 text-[11px] text-amber-300 font-bold">Bay tới Khu B →</div>
                </div>

                <div onClick={() => { setIsInfoModalOpen(false); focusZone('khuC'); }} className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition space-y-2">
                  <h4 className="text-sm font-extrabold text-white m-0">🧘 KHU C: VÕ THUẬT, BOXING & YOGA</h4>
                  <ul className="text-xs text-slate-300 space-y-1 list-none p-0 m-0">
                    <li>• <strong>Tầng 1:</strong> Phòng tập võ & đài Boxing, bao cát</li>
                    <li>• <strong>Tầng 2:</strong> Tủ đồ cá nhân và khu thay đồ học viên</li>
                    <li>• <strong>Tầng 3:</strong> Studio Yoga & 8 máy Pilates Reformer</li>
                  </ul>
                  <div className="pt-2 text-[11px] text-amber-300 font-bold">Bay tới Khu C →</div>
                </div>

                <div onClick={() => { setIsInfoModalOpen(false); focusZone('outdoor'); }} className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition space-y-2">
                  <h4 className="text-sm font-extrabold text-white m-0">🏟️ KHU NGOÀI TRỜI: BÓNG ĐÁ & PICKLEBALL</h4>
                  <ul className="text-xs text-slate-300 space-y-1 list-none p-0 m-0">
                    <li>• Cụm sân bóng đá cỏ nhân tạo (1 sân 5 và 1 sân 7)</li>
                    <li>• Cụm 4 sân Pickleball sơn Acrylic chống trơn</li>
                    <li>• Dàn 10 trụ đèn pha LED 500 Lux ban đêm</li>
                  </ul>
                  <div className="pt-2 text-[11px] text-amber-300 font-bold">Bay tới Sân Ngoài Trời →</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ONLINE COURT BOOKING */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1e2337] border border-amber-300/40 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsBookingModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 transition"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
            </button>

            <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
              {isEn ? 'Online Court Booking' : 'Hệ Thống Đặt Sân Online'}
            </div>
            <h3 className="text-lg font-extrabold text-white mt-1 mb-4">
              {isEn ? 'Court Reservation & Training Schedule' : 'Đặt Sân & Đăng Ký Tập Luyện'}
            </h3>

            <form onSubmit={handleBookingSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isEn ? 'Selected Zone / Court' : 'Khu vực đã chọn'}
                </label>
                <input
                  type="text"
                  readOnly
                  value={selectedZone ? (isEn ? selectedZone.nameEn : selectedZone.name) : (isEn ? 'All-Zone Campus' : 'Toàn khu tổ hợp')}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-amber-300 font-bold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isEn ? 'Booking Date' : 'Ngày tập'}
                  </label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isEn ? 'Time Slot' : 'Khung giờ'}
                  </label>
                  <select
                    value={bookingTimeSlot}
                    onChange={(e) => setBookingTimeSlot(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white outline-none"
                  >
                    <option value="06:00 - 08:00 (Sáng)">06:00 - 08:00 (Sáng)</option>
                    <option value="16:00 - 18:00 (Chiều)">16:00 - 18:00 (Chiều)</option>
                    <option value="18:00 - 20:00 (Tối - Đèn LED)">18:00 - 20:00 (Tối - Đèn LED)</option>
                    <option value="20:00 - 22:00 (Tối - Đèn LED)">20:00 - 22:00 (Tối - Đèn LED)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isEn ? 'Full Name & Phone Number' : 'Họ tên & Số điện thoại'}
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    placeholder={isEn ? 'Your full name...' : 'Nhập họ tên của bạn...'}
                    value={bookingCustomerName}
                    onChange={(e) => setBookingCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white outline-none"
                  />
                  <input
                    type="tel"
                    required
                    placeholder={isEn ? 'Phone number for confirmation...' : 'Nhập SĐT để lễ tân xác nhận...'}
                    value={bookingCustomerPhone}
                    onChange={(e) => setBookingCustomerPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white outline-none"
                  />
                </div>
              </div>

              {bookingToastMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-center">
                  {bookingToastMessage}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold uppercase tracking-wider transition shadow-xl"
              >
                {isEn ? 'Confirm Booking' : 'Xác Nhận Đặt Sân'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

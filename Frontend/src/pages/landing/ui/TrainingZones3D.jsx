import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// ============================================================================
// 1. STRICT NON-OVERLAPPING MASTERPLAN DATA (13.000 m² = 130m x 100m)
//    Site Coordinates: X in [-65, +65], Z in [-50, +50]
// ============================================================================
const ZONES_DATA = {
  khuA: {
    id: 'khuA',
    shortTitle: 'KHU A: BƠI LỘI, GYM & FITNESS',
    shortTitleEn: 'ZONE A: SWIMMING, GYM & FITNESS',
    badge: 'Khối nhà 3 tầng • Cánh Tây (Giữa)',
    badgeEn: '3-Story Complex • Mid-West Wing',
    area: '2.200 m² đất (3 tầng = 6.600 m² sàn)',
    areaEn: '2,200 m² footprint (6,600 m² floor)',
    desc: 'Tòa nhà 3 tầng độc lập tại trung tâm Cánh Tây (cách Khu B 12m và cách Khu C 8m bằng sân vườn cảnh quan). Gồm đúng 1 bể bơi 4 mùa 25m, 1 sàn Gym & Fitness và 1 tầng thay đồ & tắm tráng với đầy đủ dụng cụ 3D chi tiết.',
    descEn: 'Standalone 3-story complex in Mid-West wing. Features 1 25m heated pool, 1 full Gym & Fitness floor, and luxury locker/shower facilities.',
    color: '#38bdf8',
    targetPos: { x: -37, y: 6, z: 6 },
    camPos: { x: -2, y: 24, z: 26 },
    markerPos: [-37, 16.5, 6],
    hasFloors: true,
    floors: [
      {
        level: 1,
        name: 'Tầng 1: Bể bơi 4 mùa 25m trong nhà nước ấm (1 Bể 5 làn)',
        nameEn: 'Floor 1: Heated Swimming Pool 25m (5 Lanes)',
        detail: 'Đúng 1 bể bơi 25m × 12.5m với 4 dây phao chắn sóng hạt tròn đỏ-trắng-xanh, 5 bục xuất phát chuyên nghiệp có tay nắm bơi ngửa, 4 thang inox uốn cong, ghế cao cứu hộ kèm phao cứu sinh và dãy ghế nằm thư giãn.',
        detailEn: '1 25m x 12.5m indoor heated pool with 4 wave-reducing lane lines, 5 professional starting blocks, 4 stainless ladders, lifeguard high chair with lifebuoy, and pool loungers.',
        camPos: { x: -12, y: 11, z: 16 },
        targetPos: { x: -37, y: 1.2, z: 6 },
        equipZooms: [
          { label: '🔍 5 Bục xuất phát & Dây phao', labelEn: '🔍 5 Starting Blocks & Lanes', camPos: { x: -44, y: 4.2, z: 12 }, targetPos: { x: -50, y: 0.8, z: 5.2 } },
          { label: '🔍 Ghế cứu hộ & Thang inox', labelEn: '🔍 Lifeguard Chair & Ladders', camPos: { x: -29, y: 4.5, z: 4 }, targetPos: { x: -37, y: 1.0, z: -1.5 } },
          { label: '🔍 Dãy ghế nghỉ hồ bơi', labelEn: '🔍 Pool Loungers & Tables', camPos: { x: -26, y: 4.0, z: 15 }, targetPos: { x: -37, y: 0.6, z: 14.2 } }
        ]
      },
      {
        level: 2,
        name: 'Tầng 2: Phòng tập Gym & Fitness',
        nameEn: 'Floor 2: Fitness & Strength Gym',
        detail: 'Bố trí khoa học: 3 máy chạy bộ có băng tải & màn hình LED; 3 xe đạp thể lực bánh đà inox; 2 khung gánh tạ lắp bánh tạ màu & ghế đẩy ngực; kệ tạ đơn 2 tầng; giàn kéo cáp đa năng, 2 máy kéo xô, 2 máy đạp đùi 45°, 2 máy chèo thuyền và đường cỏ đẩy tạ Sled.',
        detailEn: 'Equipped with 3 treadmills with LED screens, 3 spin bikes, 2 power squat racks with bumper plates, 2-tier dumbbell rack, cable crossover, 2 lat pulldowns, 2 leg presses, 2 rowers, and sprint turf with prowler sled.',
        camPos: { x: -12, y: 16, z: 16 },
        targetPos: { x: -37, y: 5.8, z: 6 },
        equipZooms: [
          { label: '🔍 3 Máy chạy bộ & 3 Xe đạp Spin', labelEn: '🔍 3 Treadmills & Spin Bikes', camPos: { x: -28, y: 7.8, z: 15 }, targetPos: { x: -45, y: 5.5, z: 11.5 } },
          { label: '🔍 2 Khung Squat Rack & Kệ tạ', labelEn: '🔍 2 Squat Racks & Dumbbells', camPos: { x: -32, y: 8.2, z: 3 }, targetPos: { x: -45, y: 5.8, z: -1.5 } },
          { label: '🔍 Giàn kéo cáp & Máy đạp đùi', labelEn: '🔍 Cable Crossover & Leg Press', camPos: { x: -20, y: 8.2, z: 4 }, targetPos: { x: -29, y: 5.8, z: -1.0 } },
          { label: '🔍 Đường cỏ đẩy Sled & Máy chèo', labelEn: '🔍 Sprint Turf & Rowers', camPos: { x: -22, y: 7.8, z: 13 }, targetPos: { x: -34, y: 5.4, z: 8.5 } }
        ]
      },
      {
        level: 3,
        name: 'Tầng 3: Khu thay đồ, Tủ Locker & Tắm tráng nóng lạnh',
        nameEn: 'Floor 3: Lockers & Hot Showers',
        detail: 'Hệ thống tủ Locker chia từng cánh cửa có khe thoáng khí & ổ khóa, ghế băng gỗ thay giày, bàn Lavabo gương soi và 6 buồng tắm kính mờ có vòi sen tắm mưa cùng van gạt nước nóng/lạnh.',
        detailEn: 'Full locker banks with vents & key locks, changing benches, lavatory mirrors, and 6 frosted glass cubicles with rain showerheads and thermostatic taps.',
        camPos: { x: -12, y: 21, z: 16 },
        targetPos: { x: -37, y: 10.2, z: 6 },
        equipZooms: [
          { label: '🔍 Dãy tủ Locker & Ghế thay đồ', labelEn: '🔍 Locker Banks & Benches', camPos: { x: -34, y: 13.0, z: 14 }, targetPos: { x: -45, y: 10.2, z: 6 } },
          { label: '🔍 6 Buồng tắm sen nóng lạnh', labelEn: '🔍 6 Rain Shower Cubicles', camPos: { x: -19, y: 13.0, z: 10 }, targetPos: { x: -26, y: 10.5, z: 6 } }
        ]
      }
    ]
  },
  khuB: {
    id: 'khuB',
    shortTitle: 'KHU B: BÓNG RỔ, CẦU LÔNG & BÓNG BÀN',
    shortTitleEn: 'ZONE B: BASKETBALL, BADMINTON & TABLE TENNIS',
    badge: 'Khối nhà 3 tầng • Cánh Tây Bắc',
    badgeEn: '3-Story Complex • North-West Wing',
    area: '1.800 m² đất (3 tầng = 5.400 m² sàn)',
    areaEn: '1,800 m² footprint (5,400 m² floor)',
    desc: 'Nhà thi đấu thể thao trong nhà nằm ở góc Tây Bắc. Tầng 1 là 1 sân bóng rổ FIBA, Tầng 2 là cụm 4 sân cầu lông thảm PVC, Tầng 3 là khu 4 bàn bóng bàn chuẩn ITTF.',
    descEn: 'North-West indoor sports arena. Floor 1 has 1 FIBA basketball court, Floor 2 features 4 PVC badminton courts, Floor 3 houses 4 ITTF table tennis tables.',
    color: '#fbbf24',
    targetPos: { x: -37, y: 6, z: -30 },
    camPos: { x: -2, y: 25, z: -10 },
    markerPos: [-37, 16.5, -30],
    hasFloors: true,
    floors: [
      {
        level: 1,
        name: 'Tầng 1: Sân bóng rổ tiêu chuẩn phong trào có mái che (1 Sân)',
        nameEn: 'Floor 1: Championship Basketball Court (1 Court)',
        detail: '2 trụ bóng rổ di động chuyên nghiệp (đối trọng bọc nệm, cần vươn chữ Y, bảng rổ kính cường lực, vành rổ cam & lưới đan phễu), khán đài 3 bậc, bảng điểm điện tử và xe đẩy đựng bóng rổ.',
        detailEn: '2 portable pro basketball hoops with cushioned counterweights, glass backboards, rims with nets, 3-tier spectator bleachers, scoreboards, and ball carts.',
        camPos: { x: -12, y: 11, z: -18 },
        targetPos: { x: -37, y: 1.5, z: -30 },
        equipZooms: [
          { label: '🔍 Trụ bóng rổ kính cường lực', labelEn: '🔍 Tempered Glass Hoops', camPos: { x: -32, y: 4.5, z: -24 }, targetPos: { x: -23.5, y: 2.8, z: -29.2 } },
          { label: '🔍 Khán đài & Xe đựng bóng', labelEn: '🔍 Bleachers & Ball Carts', camPos: { x: -37, y: 4.5, z: -26 }, targetPos: { x: -37, y: 1.5, z: -38.5 } }
        ]
      },
      {
        level: 2,
        name: 'Tầng 2: Cụm 4 sân cầu lông thảm cao su chống trượt (4 Sân)',
        nameEn: 'Floor 2: 4-Court Badminton Arena (4 Courts)',
        detail: 'Đúng 4 sân cầu lông (Sân 1 - 4), mỗi sân có 2 trụ căng lưới bánh xe đối trọng, lưới mắt nhỏ viền băng trắng, ghế trọng tài cao đặt sát cột lưới và ghế nghỉ vận động viên.',
        detailEn: '4 tournament badminton courts, each with wheeled net posts, fine white mesh netting, umpire high chairs, and player benches.',
        camPos: { x: -12, y: 16, z: -18 },
        targetPos: { x: -37, y: 5.8, z: -30 },
        equipZooms: [
          { label: '🔍 Cột lưới & Ghế trọng tài', labelEn: '🔍 Net Posts & Umpire Chairs', camPos: { x: -28, y: 8.2, z: -22 }, targetPos: { x: -32.8, y: 5.5, z: -30 } },
          { label: '🔍 Toàn cảnh 4 sân cầu lông', labelEn: '🔍 Full 4-Court Overview', camPos: { x: -16, y: 14, z: -20 }, targetPos: { x: -37, y: 5.2, z: -30 } }
        ]
      },
      {
        level: 3,
        name: 'Tầng 3: Khu bóng bàn trong nhà với 4 bàn tập (4 Bàn)',
        nameEn: 'Floor 3: 4 ITTF Table Tennis Arenas (4 Tables)',
        detail: 'Đúng 4 bàn bóng bàn chuẩn ITTF có chân thép gấp gọn gắn bánh xe, cọc lưới căng giữa bàn, trên mặt bàn có sẵn vợt bóng bàn (mặt đỏ/đen) và bóng trắng, bao quanh bởi vách chắn bóng.',
        detailEn: '4 ITTF regulation table tennis tables with steel folding legs, center nets, paddles, white balls, and protective ball-stop barriers.',
        camPos: { x: -12, y: 21, z: -18 },
        targetPos: { x: -37, y: 10.5, z: -30 },
        equipZooms: [
          { label: '🔍 Cận cảnh Bàn & Vợt bóng bàn', labelEn: '🔍 Tables & Paddles Close-up', camPos: { x: -29, y: 11.8, z: -25 }, targetPos: { x: -32.8, y: 10.0, z: -30 } },
          { label: '🔍 4 Ô bàn tập & Vách chắn', labelEn: '🔍 4 Table Bays & Barriers', camPos: { x: -18, y: 17, z: -20 }, targetPos: { x: -37, y: 10.2, z: -30 } }
        ]
      }
    ]
  },
  khuC: {
    id: 'khuC',
    shortTitle: 'KHU C: VÕ THUẬT, BOXING, YOGA & PILATES',
    shortTitleEn: 'ZONE C: MARTIAL ARTS, BOXING, YOGA & PILATES',
    badge: 'Khối nhà 3 tầng • Cánh Tây Nam',
    badgeEn: '3-Story Complex • South-West Wing',
    area: '1.200 m² đất (3 tầng = 3.600 m² sàn)',
    areaEn: '1,200 m² footprint (3,600 m² floor)',
    desc: 'Tòa nhà 3 tầng nằm ở góc Tây Nam. Tầng 1 là Võ thuật, đài Boxing & giàn bao cát; Tầng 2 là khu Locker thay đồ học viên; Tầng 3 là studio Yoga & 8 máy Pilates Reformer.',
    descEn: 'South-West 3-story training center. Floor 1 has boxing ring & heavy bag rack; Floor 2 is student lockers & changing suites; Floor 3 is Yoga & 8 Pilates reformers.',
    color: '#f43f5e',
    targetPos: { x: -40, y: 6, z: 35 },
    camPos: { x: -10, y: 22, z: 54 },
    markerPos: [-40, 16.5, 35],
    hasFloors: true,
    floors: [
      {
        level: 1,
        name: 'Tầng 1: Phòng tập võ thuật & Boxing, thảm và bao cát',
        nameEn: 'Floor 1: Boxing Ring, Heavy Bags & Tatami',
        detail: '1 Sàn đài Boxing Ring chuyên nghiệp (4 trụ góc, đệm góc Đỏ-Xanh-Trắng, 4 tầng dây đài căng, cầu thang bước lên đài), giàn khung thép chữ I treo 8 bao cát da bằng xích 3 chạc, 2 hình nộm Boxing Bob và thảm võ Tatami.',
        detailEn: '1 championship boxing ring with 4-tier tension ropes and corner pads, heavy bag steel rig with 8 leather bags, 2 boxing dummies, and high-density tatami matting.',
        camPos: { x: -16, y: 11, z: 46 },
        targetPos: { x: -40, y: 1.5, z: 35 },
        equipZooms: [
          { label: '🔍 Đài Boxing Ring 4 tầng dây', labelEn: '🔍 4-Rope Boxing Ring', camPos: { x: -41, y: 4.5, z: 42 }, targetPos: { x: -49.5, y: 1.5, z: 35 } },
          { label: '🔍 Giàn treo 8 Bao cát & Nộm', labelEn: '🔍 8 Punching Bags & Rig', camPos: { x: -24, y: 4.2, z: 41 }, targetPos: { x: -31.0, y: 1.6, z: 35 } }
        ]
      },
      {
        level: 2,
        name: 'Tầng 2: Tủ đồ cá nhân và khu thay đồ phục vụ học viên',
        nameEn: 'Floor 2: Student Lockers & Changing Area',
        detail: 'Các dãy tủ Locker có khóa an toàn, ghế băng dài ngồi thay đồ, buồng thay đồ riêng tư và bàn gương Lavabo phục vụ học viên Võ thuật, Yoga & Pilates.',
        detailEn: 'Key-coded student lockers, changing benches, private dressing cubicles, and lavatory mirrors.',
        camPos: { x: -16, y: 16, z: 46 },
        targetPos: { x: -40, y: 5.8, z: 35 },
        equipZooms: [
          { label: '🔍 Khu tủ đồ Locker học viên', labelEn: '🔍 Student Locker Banks', camPos: { x: -30, y: 8.5, z: 42 }, targetPos: { x: -40, y: 5.5, z: 35 } }
        ]
      },
      {
        level: 3,
        name: 'Tầng 3: Phòng tập Yoga & Pilates, khu thảm và máy Reformer',
        nameEn: 'Floor 3: Yoga Studio & 8 Pilates Reformers',
        detail: '8 giường tập Pilates Reformer (khung gỗ sồi, nệm trượt, gối tựa vai, 5 lò xo kháng lực màu, thanh Footbar uốn cong & dây kéo ròng rọc) + 12 thảm Yoga kèm gối lăn Bolster, gạch tập & bóng cân bằng Swiss Ball.',
        detailEn: '8 solid-oak Pilates Reformers with color-coded resistance springs, sliding carriages, footbars and straps, plus 12 Yoga mats with bolsters and Swiss stability balls.',
        camPos: { x: -16, y: 21, z: 46 },
        targetPos: { x: -40, y: 10.5, z: 35 },
        equipZooms: [
          { label: '🔍 8 Máy Pilates Reformer lò xo', labelEn: '🔍 8 Pilates Reformers', camPos: { x: -40, y: 12.2, z: 41 }, targetPos: { x: -47.5, y: 9.8, z: 35 } },
          { label: '🔍 Thảm Yoga, Gối lăn & Bóng tập', labelEn: '🔍 Yoga Mats & Swiss Balls', camPos: { x: -26, y: 12.2, z: 41 }, targetPos: { x: -33.0, y: 9.8, z: 35 } }
        ]
      }
    ]
  },
  outdoor: {
    id: 'outdoor',
    shortTitle: 'KHU NGOÀI TRỜI: BÓNG ĐÁ & PICKLEBALL',
    shortTitleEn: 'OUTDOOR COMPLEX: SOCCER & PICKLEBALL',
    badge: 'Tổ hợp ngoài trời • Cánh Đông',
    badgeEn: 'Outdoor Sports Arena • East Wing',
    area: '5.200 m² mặt sân & hành lang',
    areaEn: '5,200 m² pitch & court grounds',
    desc: 'Quy hoạch chuẩn xác tại Cánh Đông: Phía Đông Bắc gồm đúng 1 Sân bóng đá 5 người và 1 Sân bóng đá 7 người; phía Đông Nam gồm đúng 4 Sân Pickleball có lưới riêng & vạch bếp.',
    descEn: 'East Wing outdoor complex: North-East features 1 5-a-side and 1 7-a-side artificial turf pitches; South-East features 4 Pickleball courts with kitchen zones and lighting.',
    color: '#10b981',
    targetPos: { x: 34, y: 1, z: 2 },
    camPos: { x: 34, y: 46, z: 62 },
    markerPos: [36, 8.5, 4],
    hasFloors: false,
    floors: [
      {
        level: 1,
        name: 'Cụm sân bóng đá cỏ nhân tạo (Đúng 1 Sân 5 và 1 Sân 7)',
        nameEn: 'Artificial Turf Soccer Pitches (1 Pitch-5 & 1 Pitch-7)',
        detail: 'Trang bị khung thành 3D có gọng chữ D và lưới mắt cáo, cột cờ phạt góc, băng ghế huấn luyện viên & cầu thủ dự bị có mái vòm (Team Dugout) và hàng rào lưới chắn bóng.',
        detailEn: 'Pro 3D goal frames with mesh netting, corner flags, sheltered dugout benches, and high ball-stop mesh fencing.',
        camPos: { x: 34, y: 28, z: 20 },
        targetPos: { x: 34, y: 1, z: -20 },
        equipZooms: [
          { label: '🔍 Khung thành 3D & Cột cờ góc', labelEn: '🔍 3D Goals & Corner Flags', camPos: { x: 36, y: 5.5, z: 12 }, targetPos: { x: 44, y: 1.5, z: 4 } },
          { label: '🔍 Băng ghế dự bị có mái che', labelEn: '🔍 Sheltered Team Dugouts', camPos: { x: 20, y: 4.5, z: -12 }, targetPos: { x: 26.8, y: 1.2, z: -18 } }
        ]
      },
      {
        level: 1,
        name: 'Cụm 4 sân Pickleball (Sân P1, P2, P3, P4 có vạch khu vực bếp)',
        nameEn: '4 Championship Pickleball Courts (P1 to P4)',
        detail: '4 sân Pickleball có cọc lưới bánh xe, lưới căng có dây đai trắng chính giữa (Center strap), vạch khu vực bếp màu cam đất và bộ bàn ghế nghỉ có dù che nắng dọc biên.',
        detailEn: '4 regulation Pickleball courts with wheeled posts, tensioned nets with center straps, non-volley kitchen zones, rest benches, and patio umbrellas.',
        camPos: { x: 36, y: 19, z: 46 },
        targetPos: { x: 36, y: 1, z: 24.5 },
        equipZooms: [
          { label: '🔍 Lưới Pickleball & Khu vạch bếp', labelEn: '🔍 Pickleball Net & Kitchen', camPos: { x: 25, y: 4.5, z: 32 }, targetPos: { x: 30, y: 0.8, z: 24.5 } },
          { label: '🔍 Ghế nghỉ VĐV & Dù che nắng', labelEn: '🔍 Player Benches & Umbrellas', camPos: { x: 24, y: 4.5, z: 39 }, targetPos: { x: 30, y: 1.2, z: 34.6 } }
        ]
      },
      {
        level: 1,
        name: 'Dàn 10 trụ đèn pha LED chiếu sáng ban đêm rõ nét',
        nameEn: '10 High-Mast LED Floodlight Towers',
        detail: '10 trụ đèn thép cao 15m có lồng thang leo bảo trì, giá đỡ giàn ngang gắn 6 chóa đèn pha LED công suất lớn hướng xuống mặt sân.',
        detailEn: '10 steel high-mast light poles with maintenance ladders, cross-arm trusses and 6 high-output angled LED fixtures.',
        camPos: { x: 64, y: 24, z: 36 },
        targetPos: { x: 34, y: 8, z: 10 },
        equipZooms: [
          { label: '🔍 Cận cảnh Giàn 6 chóa đèn LED', labelEn: '🔍 6-Fixture LED Truss Close-up', camPos: { x: 26, y: 17, z: 22 }, targetPos: { x: 34, y: 15.2, z: 14 } }
        ]
      }
    ]
  },
  lobby: {
    id: 'lobby',
    shortTitle: 'SẢNH LỄ TÂN, CĂN-TIN & TRẠM Y TẾ',
    shortTitleEn: 'RECEPTION LOBBY, CAFÉ & FIRST-AID CLINIC',
    badge: 'Quảng trường trung tâm • Cổng Olympic Sports Area',
    badgeEn: 'Central Plaza • Olympic Sports Area Portal',
    area: '1.850 m² (Cổng chào + Quảng trường + Sảnh dịch vụ)',
    areaEn: '1,850 m² (Portal + Plaza + Service Pavilion)',
    desc: 'Tòa sảnh đón tiếp nằm tại Quảng trường trung tâm bên phải trục đại lộ chính (hoàn toàn không chắn đường và tách biệt khỏi khu bãi đỗ xe ô tô). Kết nối trực tiếp với Cổng chào Olympic Sports Area.',
    descEn: 'Service pavilion located at the central plaza east of Main Boulevard. Connects directly to the Grand Olympic Sports Area Portal.',
    color: '#a855f7',
    targetPos: { x: 1.5, y: 2.5, z: 27 },
    camPos: { x: -12, y: 16, z: 54 },
    markerPos: [1.5, 9.0, 28],
    hasFloors: false,
    floors: [
      {
        level: 1,
        name: 'Cổng Chào "Olympic Sports Area" & Đại Lộ Đón Tiếp',
        nameEn: 'Grand "Olympic Sports Area" Portal & Arrival Avenue',
        detail: 'Cổng chào kiến trúc đặt trên trục đại lộ chính phía Tây Nam, nổi bật với bảng tên "Olympic Sports Area", Logo khiên tròn và cụm 5 Vòng tròn Olympic 3D trên đỉnh.',
        detailEn: 'Iconic portal bridging the main arrival boulevard with high-res signboard, logo crest, and 3D interlocking Olympic rings.',
        camPos: { x: -13.5, y: 7.5, z: 66 },
        targetPos: { x: -13.5, y: 4.5, z: 49.5 },
        equipZooms: [
          { label: '🔍 Cổng Chào Olympic Sports Area', labelEn: '🔍 Grand Olympic Portal', camPos: { x: -13.5, y: 6.5, z: 64 }, targetPos: { x: -13.5, y: 5.5, z: 49.5 } }
        ]
      },
      {
        level: 1,
        name: 'Quầy Lễ Tân Tiếp Đón & Cổng Kiểm Soát Check-in',
        nameEn: 'Reception Counter & Turnstile Gates',
        detail: 'Quầy lễ tân vòng cung ốp gỗ và đá cẩm thạch, trang bị 2 bộ máy tính màn hình kép tra cứu lịch đặt sân và 3 làn cổng xoay kiểm soát thẻ thành viên (Turnstile).',
        detailEn: 'Curved wood/marble reception desk with 2 dual-monitor booking terminals and 3 member check-in turnstile barriers.',
        camPos: { x: 1.5, y: 5.5, z: 36 },
        targetPos: { x: 1.5, y: 1.2, z: 28.5 },
        equipZooms: [
          { label: '🔍 Quầy Lễ Tân & Máy tính', labelEn: '🔍 Reception Desk & Terminals', camPos: { x: 1.5, y: 3.8, z: 33.5 }, targetPos: { x: 1.5, y: 1.1, z: 29.2 } }
        ]
      },
      {
        level: 1,
        name: 'Quầy Căn-tin Nước Giải Khát & Phòng Y Tế Sơ Cứu',
        nameEn: 'Beverage Canteen & Medical Clinic',
        detail: 'Quầy bar căn-tin có tủ mát cánh kính 4 tầng xếp đầy nước khoáng, bàn tròn cafe; cạnh bên là Phòng Y Tế có giường sơ cứu, bình Oxy xanh và tủ thuốc Chữ Thập Đỏ.',
        detailEn: 'Bar counter, 4-shelf beverage glass cooler with bottles, round cafe tables, adjacent medical clinic with exam bed, oxygen tank, and Red Cross cabinet.',
        camPos: { x: -6.5, y: 5.5, z: 33 },
        targetPos: { x: 1.5, y: 1.2, z: 25.5 },
        equipZooms: [
          { label: '🔍 Tủ mát nước khoáng & Quầy Bar', labelEn: '🔍 Drink Cooler & Café Bar', camPos: { x: -1.0, y: 3.4, z: 29.5 }, targetPos: { x: -4.3, y: 1.3, z: 24.5 } },
          { label: '🔍 Giường sơ cứu, Bình Oxy & Tủ thuốc', labelEn: '🔍 Exam Bed & Medical Kit', camPos: { x: 4.3, y: 3.5, z: 29.5 }, targetPos: { x: 7.3, y: 1.2, z: 24.5 } }
        ]
      }
    ]
  },
  parking: {
    id: 'parking',
    shortTitle: 'KHU BÃI ĐỖ XE Ô TÔ TẬP TRUNG (20 CHỖ)',
    shortTitleEn: 'CENTRALIZED CAR PARKING LOT (20 STALLS)',
    badge: '1 Khu Tập Trung Duy Nhất • Phía Đông Nam',
    badgeEn: 'Single Centralized Compound • South-East',
    area: '750 m² (48m × 15.6m • 2 Dãy Đối Diện • 20 Ô Đỗ)',
    areaEn: '750 m² (48m x 15.6m • 2 Facing Rows • 20 Bays)',
    desc: 'Toàn bộ ô tô được quy hoạch tập trung trong 1 khu phức hợp khép kín duy nhất ở góc Đông Nam. Bố trí 2 dãy chuồng đỗ đối diện nhau (Dãy Bắc 10 ô & Dãy Nam 10 ô) qua làn đường nội bộ rộng 5.2m ở giữa, có cổng Barrier kiểm soát riêng, 2 mái che Pin Mặt Trời và trạm sạc xe điện EV.',
    descEn: 'Consolidated parking compound in the South-East. 2 facing rows of 10 bays each across a 5.2m aisle, boom barrier control, dual solar carport canopies, and EV fast chargers.',
    color: '#06b6d4',
    targetPos: { x: 38, y: 1.8, z: 44 },
    camPos: { x: 38, y: 20, z: 68 },
    markerPos: [38, 8.0, 44],
    hasFloors: false,
    floors: [
      {
        level: 1,
        name: 'Dãy Đỗ Ô Tô Phía Bắc & Phía Nam (20 Chuồng Đỗ Tiêu Chuẩn)',
        nameEn: 'North & South Parking Stalls (20 Standard Bays)',
        detail: '20 ô đỗ xe sơn kẻ vạch trắng rõ nét, có cục chặn lùi bánh xe màu vàng, lối xe chạy 2 chiều ở giữa có mũi tên chỉ hướng và 14 xe SUV/Sedan đang đỗ gọn gàng.',
        detailEn: '20 marked stalls with yellow wheel stoppers, 2-way driving aisle, and 14 parked SUVs and sedans.',
        camPos: { x: 12, y: 11, z: 44 },
        targetPos: { x: 38, y: 1.2, z: 44 },
        equipZooms: [
          { label: '🔍 Toàn cảnh 2 dãy ô tô đối diện', labelEn: '🔍 2 Facing Parking Rows', camPos: { x: 10, y: 9.5, z: 44 }, targetPos: { x: 38, y: 1.2, z: 44 } },
          { label: '🔍 Cổng Barrier & Lối Vào Bãi Xe', labelEn: '🔍 Barrier Gate & Entrance', camPos: { x: 16, y: 6.0, z: 60 }, targetPos: { x: 17.5, y: 1.2, z: 50.5 } }
        ]
      },
      {
        level: 1,
        name: 'Hệ Thống Trạm Sạc Xe Điện (EV Chargers) & Mái Điện Mặt Trời',
        nameEn: 'EV Fast-Charging Network & Solar PV Carports',
        detail: '2 hệ mái che Carport lợp kín tấm Pin Năng Lượng Mặt Trời cung cấp điện trực tiếp cho 5 trụ sạc nhanh xe điện (EV Fast Charging Pillars) có màn hình LED xanh.',
        detailEn: 'Dual Carport canopies lined with monocrystalline solar PV panels powering 5 EV fast-charging stations with green status indicators.',
        camPos: { x: 42, y: 8.5, z: 58 },
        targetPos: { x: 42, y: 2.0, z: 48 },
        equipZooms: [
          { label: '🔍 Trụ sạc xe điện EV & Xe sạc', labelEn: '🔍 EV Chargers & Charging Cars', camPos: { x: 35, y: 3.6, z: 44.5 }, targetPos: { x: 39, y: 1.2, z: 49.5 } },
          { label: '🔍 Mái che Solar Carport Đôi', labelEn: '🔍 Dual Solar Carport Roofs', camPos: { x: 52, y: 9.0, z: 56 }, targetPos: { x: 38, y: 3.5, z: 44 } }
        ]
      }
    ]
  }
};

// ============================================================================
// PROCEDURAL CANVAS TEXTURE GENERATORS
// ============================================================================
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

function createSoccerTurfTexture(labelText = 'SÂN BÓNG') {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1536;
  const ctx = canvas.getContext('2d');

  const stripes = 14;
  const sh = canvas.height / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#166534' : '#15803d';
    ctx.fillRect(0, i * sh, canvas.width, sh);
  }

  const pad = 60;
  const w = canvas.width - pad * 2;
  const h = canvas.height - pad * 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = 10;
  ctx.strokeRect(pad, pad, w, h);

  ctx.beginPath();
  ctx.moveTo(pad, canvas.height / 2);
  ctx.lineTo(canvas.width - pad, canvas.height / 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, 115, 0, Math.PI * 2);
  ctx.stroke();

  const boxW = w * 0.56;
  const boxH = h * 0.16;
  ctx.strokeRect((canvas.width - boxW) / 2, pad, boxW, boxH);
  ctx.strokeRect((canvas.width - boxW) / 2, canvas.height - pad - boxH, boxW, boxH);

  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.font = 'bold 54px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(labelText, canvas.width / 2, canvas.height / 2 - 150);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  return tex;
}

function createPickleballCourtTexture(label = 'PICKLEBALL') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0f766e';
  ctx.fillRect(0, 0, 512, 1024);

  const padX = 56, padY = 82;
  const cw = 512 - padX * 2;
  const ch = 1024 - padY * 2;

  ctx.fillStyle = '#1d4ed8';
  ctx.fillRect(padX, padY, cw, ch);

  const kitchenH = ch * 0.32;
  ctx.fillStyle = '#ea580c';
  ctx.fillRect(padX, 512 - kitchenH / 2, cw, kitchenH);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 8;
  ctx.strokeRect(padX, padY, cw, ch);

  ctx.beginPath();
  ctx.moveTo(padX, 512 - kitchenH / 2);
  ctx.lineTo(padX + cw, 512 - kitchenH / 2);
  ctx.moveTo(padX, 512 + kitchenH / 2);
  ctx.lineTo(padX + cw, 512 + kitchenH / 2);
  ctx.moveTo(256, padY);
  ctx.lineTo(256, 512 - kitchenH / 2);
  ctx.moveTo(256, 512 + kitchenH / 2);
  ctx.lineTo(256, padY + ch);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, 256, 52);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  return tex;
}

function createBasketballHardwoodTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#d99b52';
  ctx.fillRect(0, 0, 1024, 512);
  ctx.fillStyle = 'rgba(146, 64, 14, 0.16)';
  for (let i = 0; i < 64; i++) {
    ctx.fillRect(0, i * 8, 1024, 3);
  }

  const pad = 42;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 7;
  ctx.strokeRect(pad, pad, 1024 - pad * 2, 512 - pad * 2);

  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(pad, 176, 155, 160);
  ctx.fillRect(1024 - pad - 155, 176, 155, 160);
  ctx.strokeRect(pad, 176, 155, 160);
  ctx.strokeRect(1024 - pad - 155, 176, 155, 160);

  ctx.beginPath();
  ctx.moveTo(512, pad);
  ctx.lineTo(512, 512 - pad);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(512, 256, 62, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(pad + 35, 256, 175, -Math.PI / 2.3, Math.PI / 2.3);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(1024 - pad - 35, 256, 175, Math.PI - Math.PI / 2.3, Math.PI + Math.PI / 2.3);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  return tex;
}

function createBadmintonCourtTexture(num = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#059669';
  ctx.fillRect(0, 0, 512, 1024);

  const pad = 44;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.strokeRect(pad, pad, 512 - pad * 2, 1024 - pad * 2);
  ctx.beginPath();
  ctx.moveTo(256, pad);
  ctx.lineTo(256, 1024 - pad);
  ctx.moveTo(pad, 360);
  ctx.lineTo(512 - pad, 360);
  ctx.moveTo(pad, 664);
  ctx.lineTo(512 - pad, 664);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = 'bold 34px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`SÂN CẦU LÔNG ${num}`, 256, 220);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  return tex;
}

function createPoolTileAndWaterTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 1024, 512);
  grad.addColorStop(0, '#0284c7');
  grad.addColorStop(0.5, '#38bdf8');
  grad.addColorStop(1, '#0369a1');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);

  const lanes = 5;
  const lh = 512 / lanes;
  ctx.fillStyle = '#0f172a';
  for (let i = 0; i < lanes; i++) {
    const cy = i * lh + lh / 2;
    ctx.fillRect(70, cy - 6, 884, 12);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  return tex;
}

function createSolarPanelTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(0, 0, 512, 256);

  const grad = ctx.createLinearGradient(0, 0, 512, 256);
  grad.addColorStop(0, '#0a192f');
  grad.addColorStop(0.5, '#172a45');
  grad.addColorStop(1, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(10, 10, 492, 236);

  const cols = 12, rows = 6;
  const cw = 492 / cols, ch = 236 / rows;
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
  ctx.lineWidth = 2;
  for (let c = 1; c < cols; c++) {
    ctx.beginPath();
    ctx.moveTo(10 + c * cw, 10);
    ctx.lineTo(10 + c * cw, 246);
    ctx.stroke();
  }
  for (let r = 1; r < rows; r++) {
    ctx.beginPath();
    ctx.moveTo(10, 10 + r * ch);
    ctx.lineTo(502, 10 + r * ch);
    ctx.stroke();
  }

  ctx.fillStyle = '#e2e8f0';
  for (let c = 1; c < cols; c++) {
    for (let r = 1; r < rows; r++) {
      ctx.fillRect(10 + c * cw - 3, 10 + r * ch - 3, 6, 6);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  return tex;
}

function createChainLinkFenceTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 256, 256);

  ctx.strokeStyle = 'rgba(203, 213, 225, 0.65)';
  ctx.lineWidth = 3;
  const step = 32;
  for (let i = -256; i <= 512; i += step) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 256, 256);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(i + 256, 0);
    ctx.lineTo(i, 256);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 2);
  return tex;
}

function createOlympicGateSignTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 384;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 2048, 384);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(0.5, '#1e293b');
  grad.addColorStop(1, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 2048, 384);

  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 14;
  ctx.strokeRect(18, 18, 2012, 348);

  const logoX = 330, logoY = 192;
  ctx.beginPath();
  ctx.arc(logoX, logoY, 118, 0, Math.PI * 2);
  ctx.fillStyle = '#141622';
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#eab308';
  ctx.stroke();

  const ringCols = ['#0081C8', '#FCB131', '#ffffff', '#00A651', '#EE334E'];
  const rPos = [
    { dx: -54, dy: -14, c: ringCols[0] },
    { dx: -27, dy: 18,  c: ringCols[1] },
    { dx: 0,   dy: -14, c: ringCols[2] },
    { dx: 27,  dy: 18,  c: ringCols[3] },
    { dx: 54,  dy: -14, c: ringCols[4] }
  ];
  rPos.forEach(r => {
    ctx.beginPath();
    ctx.arc(logoX + r.dx, logoY + r.dy, 25, 0, Math.PI * 2);
    ctx.strokeStyle = r.c;
    ctx.lineWidth = 7;
    ctx.stroke();
  });

  ctx.fillStyle = '#fef08a';
  ctx.font = '900 124px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Olympic Sports Area', 1170, 194);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  return tex;
}

// ============================================================================
// MAIN REACT COMPONENT: TrainingZones3D
// ============================================================================
export function TrainingZones3D({ isEn = false, onBookingClick }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const pmremGenRef = useRef(null);
  const skyDomeRef = useRef(null);

  const hemiLightRef = useRef(null);
  const sunLightRef = useRef(null);
  const floodLightsRef = useRef([]);
  const floodConesRef = useRef([]);
  const interiorNightLightsRef = useRef([]);
  const poolWaterMeshRef = useRef(null);
  const animatedAthletesRef = useRef([]);
  const buildingFloorGroupsRef = useRef({ khuA: {}, khuB: {}, khuC: {} });
  const clickableMeshesRef = useRef([]);

  // States
  const [activeZoneId, setActiveZoneId] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(0);
  const [lightingMode, setLightingMode] = useState('day');
  const [camMode, setCamMode] = useState('flycam');
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [markerPositions, setMarkerPositions] = useState({});

  // Booking Form State
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [bookingTimeSlot, setBookingTimeSlot] = useState('18:00 - 20:00 (Tối - Đèn LED)');
  const [bookingName, setBookingName] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Smooth Camera Animation Target Ref
  const camAnimRef = useRef(null);

  const animateCameraTo = useCallback((targetPos, camPos) => {
    if (!cameraRef.current || !controlsRef.current) return;
    camAnimRef.current = {
      startCam: cameraRef.current.position.clone(),
      endCam: new THREE.Vector3(camPos.x, camPos.y, camPos.z),
      startTarget: controlsRef.current.target.clone(),
      endTarget: new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z),
      progress: 0
    };
  }, []);

  const resetAllBuildingFloors = useCallback(() => {
    Object.values(buildingFloorGroupsRef.current).forEach(floors => {
      Object.values(floors).forEach(g => {
        if (!g) return;
        g.visible = true;
        g.position.y = g.userData?.baseY ?? 0;
      });
    });
  }, []);

  const selectFloor = useCallback((floorNum) => {
    setSelectedFloor(floorNum);
    if (!activeZoneId || !buildingFloorGroupsRef.current[activeZoneId]) return;

    const groups = buildingFloorGroupsRef.current[activeZoneId];
    for (let lvl = 1; lvl <= 4; lvl++) {
      const g = groups[lvl];
      if (!g) continue;
      if (floorNum === 0) {
        g.visible = true;
      } else {
        g.visible = (lvl <= floorNum);
      }
    }

    const zoneData = ZONES_DATA[activeZoneId];
    if (!zoneData) return;

    if (floorNum === 0) {
      animateCameraTo(zoneData.targetPos, zoneData.camPos);
    } else {
      const flObj = zoneData.floors?.find(f => f.level === floorNum);
      if (flObj && flObj.camPos && flObj.targetPos) {
        animateCameraTo(flObj.targetPos, flObj.camPos);
      }
    }
  }, [activeZoneId, animateCameraTo]);

  const focusZone = useCallback((zoneId, initialFloor = 0) => {
    const data = ZONES_DATA[zoneId];
    if (!data) return;

    setActiveZoneId(zoneId);
    setSelectedFloor(initialFloor);
    resetAllBuildingFloors();

    if (data.hasFloors && initialFloor > 0) {
      selectFloor(initialFloor);
    } else {
      animateCameraTo(data.targetPos, data.camPos);
    }
  }, [resetAllBuildingFloors, selectFloor, animateCameraTo]);

  const resetMasterView = useCallback(() => {
    setActiveZoneId(null);
    setSelectedFloor(0);
    setCamMode('flycam');
    resetAllBuildingFloors();
    animateCameraTo({ x: 0, y: 2, z: 0 }, { x: 0, y: 68, z: 98 });
  }, [resetAllBuildingFloors, animateCameraTo]);

  const setPlan2DView = useCallback(() => {
    setActiveZoneId(null);
    setSelectedFloor(0);
    setCamMode('plan2d');
    resetAllBuildingFloors();
    animateCameraTo({ x: 0, y: 0, z: 0 }, { x: 0, y: 148, z: 0.1 });
  }, [resetAllBuildingFloors, animateCameraTo]);

  const toggleWalkMode = useCallback(() => {
    if (camMode === 'walk') {
      resetMasterView();
    } else {
      setActiveZoneId(null);
      setSelectedFloor(0);
      setCamMode('walk');
      resetAllBuildingFloors();
      animateCameraTo({ x: -13.0, y: 3.2, z: -15 }, { x: -13.0, y: 2.4, z: 24 });
    }
  }, [camMode, resetMasterView, resetAllBuildingFloors, animateCameraTo]);

  const applyLightingMode = useCallback((mode) => {
    setLightingMode(mode);
    if (!sceneRef.current || !pmremGenRef.current || !skyDomeRef.current) return;

    sceneRef.current.environment = generateArchVizEnvMap(pmremGenRef.current, mode);
    skyDomeRef.current.material.map = createSkyDomeTexture(mode);
    skyDomeRef.current.material.needsUpdate = true;

    const hemi = hemiLightRef.current;
    const sun = sunLightRef.current;

    if (mode === 'day') {
      sceneRef.current.fog.color.setHex(0x8bb8e8);
      if (hemi) hemi.intensity = 0.68;
      if (sun) {
        sun.intensity = 1.35;
        sun.color.setHex(0xfffbeb);
        sun.position.set(68, 92, 54);
      }
      floodLightsRef.current.forEach(l => { l.intensity = 0; });
      floodConesRef.current.forEach(c => { c.opacity = 0; });
      interiorNightLightsRef.current.forEach(l => { l.intensity = 0; });
    } else if (mode === 'sunset') {
      sceneRef.current.fog.color.setHex(0x4a2538);
      if (hemi) hemi.intensity = 0.45;
      if (sun) {
        sun.intensity = 1.15;
        sun.color.setHex(0xfb923c);
        sun.position.set(-80, 28, 42);
      }
      floodLightsRef.current.forEach(l => { l.intensity = 0.7; });
      floodConesRef.current.forEach(c => { c.opacity = 0.06; });
      interiorNightLightsRef.current.forEach(l => { l.intensity = 0.7; });
    } else if (mode === 'night') {
      sceneRef.current.fog.color.setHex(0x090d16);
      if (hemi) hemi.intensity = 0.2;
      if (sun) {
        sun.intensity = 0.14;
        sun.color.setHex(0x60a5fa);
      }
      floodLightsRef.current.forEach(l => { l.intensity = 2.0; });
      floodConesRef.current.forEach(c => { c.opacity = 0.16; });
      interiorNightLightsRef.current.forEach(l => { l.intensity = 1.1; });
    }
  }, []);

  // Three.js Lifecycle
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x8bb8e8, 0.00065);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.5, 600);
    camera.position.set(0, 68, 104);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
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

    // PMREM Environment Map
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

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 0.68);
    hemiLight.position.set(0, 100, 0);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.35);
    sunLight.position.set(68, 92, 54);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 260;
    const shadowD = 82;
    sunLight.shadow.camera.left = -shadowD;
    sunLight.shadow.camera.right = shadowD;
    sunLight.shadow.camera.top = shadowD;
    sunLight.shadow.camera.bottom = -shadowD;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    const clickableMeshes = [];
    clickableMeshesRef.current = clickableMeshes;
    const registerClickable = (mesh, zoneId) => {
      mesh.userData.zoneId = zoneId;
      clickableMeshes.push(mesh);
    };

    const buildingFloorGroups = { khuA: {}, khuB: {}, khuC: {} };
    buildingFloorGroupsRef.current = buildingFloorGroups;
    const floodLights = [];
    floodLightsRef.current = floodLights;
    const floodCones = [];
    floodConesRef.current = floodCones;
    const interiorNightLights = [];
    interiorNightLightsRef.current = interiorNightLights;
    const animatedAthletes = [];
    animatedAthletesRef.current = animatedAthletes;

    const sharedSolarTex = createSolarPanelTexture();
    const sharedFenceTex = createChainLinkFenceTexture();

    // Human Figure Builder
    function createHumanFigure(x, y, z, shirtHex = 0x38bdf8, pantsHex = 0x0f172a, animated = false, radius = 1.4) {
      const g = new THREE.Group();
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), new THREE.MeshStandardMaterial({ color: 0xfde68a }));
      head.position.y = 1.55;
      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.62, 10), new THREE.MeshStandardMaterial({ color: shirtHex }));
      torso.position.y = 1.1;
      const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.72, 10), new THREE.MeshStandardMaterial({ color: pantsHex }));
      legs.position.y = 0.42;
      g.add(head, torso, legs);
      g.position.set(x, y, z);

      if (animated) {
        g.userData = { originX: x, originZ: z, phase: Math.random() * Math.PI * 2, speed: 0.9 + Math.random() * 0.9, radius };
        animatedAthletes.push(g);
      }
      return g;
    }

    // Realistic Tree Builder (3 Species)
    function createRealisticTree(x, z, scale = 1.0, type = 0) {
      const g = new THREE.Group();
      const barkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
      const green1 = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.75 });
      const green2 = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.72 });
      const green3 = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8 });

      if (type === 1) {
        // Tropical Palm
        for (let seg = 0; seg < 6; seg++) {
          const tSeg = new THREE.Mesh(new THREE.CylinderGeometry((0.18 - seg * 0.015) * scale, (0.21 - seg * 0.015) * scale, 0.75 * scale, 8), barkMat);
          tSeg.position.set(Math.sin(seg * 0.18) * 0.12 * scale, (0.38 + seg * 0.68) * scale, 0);
          tSeg.castShadow = true;
          g.add(tSeg);
        }
        const crownY = 4.4 * scale;
        for (let f = 0; f < 8; f++) {
          const angle = (f / 8) * Math.PI * 2;
          const frondGroup = new THREE.Group();
          frondGroup.position.set(0.15 * scale, crownY, 0);
          frondGroup.rotation.y = angle;
          const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.42 * scale, 0.06 * scale, 2.1 * scale), f % 2 === 0 ? green2 : green1);
          leaf.position.set(0, -0.15 * scale, 1.05 * scale);
          leaf.rotation.x = 0.38;
          leaf.castShadow = true;
          frondGroup.add(leaf);
          g.add(frondGroup);
        }
      } else if (type === 2) {
        // Tall Cypress / Pine
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14 * scale, 0.24 * scale, 1.6 * scale, 8), barkMat);
        trunk.position.y = 0.8 * scale;
        g.add(trunk);
        [0, 1, 2].forEach(tier => {
          const cone = new THREE.Mesh(new THREE.ConeGeometry((1.35 - tier * 0.28) * scale, (2.2 - tier * 0.3) * scale, 10), tier % 2 === 0 ? green3 : green1);
          cone.position.y = (2.1 + tier * 1.15) * scale;
          cone.castShadow = true;
          g.add(cone);
        });
      } else {
        // Broadleaf Shade Tree
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * scale, 0.34 * scale, 2.4 * scale, 8), barkMat);
        trunk.position.y = 1.2 * scale;
        trunk.castShadow = true;
        g.add(trunk);

        const puffs = [
          { x: 0, y: 3.2, z: 0, r: 1.75, m: green1 },
          { x: 0.85, y: 3.0, z: 0.55, r: 1.35, m: green2 },
          { x: -0.8, y: 3.1, z: -0.45, r: 1.4, m: green3 },
          { x: -0.45, y: 3.5, z: 0.75, r: 1.25, m: green2 },
          { x: 0.5, y: 3.9, z: -0.4, r: 1.3, m: green1 }
        ];
        puffs.forEach(p => {
          const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(p.r * scale, 1), p.m);
          puff.position.set(p.x * scale, p.y * scale, p.z * scale);
          puff.castShadow = true;
          g.add(puff);
        });
      }

      // Stone ring planter
      const planterRing = new THREE.Mesh(new THREE.CylinderGeometry(0.75 * scale, 0.8 * scale, 0.18, 12), new THREE.MeshStandardMaterial({ color: 0xd6d3c9, roughness: 0.7 }));
      planterRing.position.y = 0.09;
      g.add(planterRing);

      g.position.set(x, 0, z);
      scene.add(g);
    }

    function createHedgePlanter(x, z, w = 4.0, d = 1.0, flowerColor = 0xf43f5e) {
      const g = new THREE.Group();
      const box = new THREE.Mesh(new THREE.BoxGeometry(w, 0.32, d), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 }));
      box.position.y = 0.16;
      const hedge = new THREE.Mesh(new THREE.BoxGeometry(w - 0.2, 0.58, d - 0.2), new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.85 }));
      hedge.position.y = 0.55;
      hedge.castShadow = true;
      g.add(box, hedge);

      const fMat = new THREE.MeshStandardMaterial({ color: flowerColor, roughness: 0.5 });
      const steps = Math.max(2, Math.floor(w / 0.8));
      for (let i = 0; i < steps; i++) {
        const fx = -w / 2 + 0.45 + i * ((w - 0.9) / Math.max(1, steps - 1));
        const flower = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), fMat);
        flower.position.set(fx, 0.88, 0);
        g.add(flower);
      }
      g.position.set(x, 0, z);
      scene.add(g);
    }

    function createRealisticCar(x, z, rotY = 0, bodyHex = 0x2563eb, isSUV = false, zoneId = 'parking') {
      const g = new THREE.Group();
      const paintMat = new THREE.MeshPhysicalMaterial({ color: bodyHex, metalness: 0.55, roughness: 0.18, clearcoat: 0.8 });
      const cabinGlassMat = new THREE.MeshPhysicalMaterial({ color: 0x0f172a, metalness: 0.2, roughness: 0.08, reflectivity: 0.9 });
      const tireMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.85 });
      const rimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 });

      const chassisH = isSUV ? 0.68 : 0.54;
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.92, chassisH, 4.35), paintMat);
      chassis.position.y = 0.34 + chassisH / 2;
      chassis.castShadow = true;
      g.add(chassis);

      const cabinLen = isSUV ? 2.55 : 2.05;
      const cabinH = isSUV ? 0.56 : 0.46;
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.64, cabinH, cabinLen), cabinGlassMat);
      cabin.position.set(0, 0.34 + chassisH + cabinH / 2 - 0.04, isSUV ? -0.25 : -0.15);
      cabin.castShadow = true;
      g.add(cabin);

      const roofTop = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.06, cabinLen - 0.25), paintMat);
      roofTop.position.set(0, 0.34 + chassisH + cabinH, isSUV ? -0.25 : -0.15);
      g.add(roofTop);

      [[-0.94, 1.32], [0.94, 1.32], [-0.94, -1.32], [0.94, -1.32]].forEach(([wx, wz]) => {
        const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.24, 16), tireMat);
        tire.rotation.z = Math.PI / 2;
        tire.position.set(wx, 0.36, wz);
        const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.26, 12), rimMat);
        rim.rotation.z = Math.PI / 2;
        rim.position.set(wx, 0.36, wz);
        g.add(tire, rim);
      });

      const grille = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.26, 0.05), tireMat);
      grille.position.set(0, 0.56, 2.18);
      g.add(grille);

      [-0.68, 0.68].forEach(lx => {
        const headlight = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.06), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
        headlight.position.set(lx, 0.64, 2.17);
        const taillight = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.14, 0.06), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
        taillight.position.set(lx, 0.68, -2.17);
        g.add(headlight, taillight);
      });

      g.position.set(x, 0.04, z);
      g.rotation.y = rotY;
      registerClickable(chassis, zoneId);
      scene.add(g);
    }

    // Surroundings & Plinth Base
    const surroundingWorld = new THREE.Mesh(new THREE.PlaneGeometry(520, 520), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.95 }));
    surroundingWorld.rotation.x = -Math.PI / 2;
    surroundingWorld.position.y = -0.36;
    surroundingWorld.receiveShadow = true;
    scene.add(surroundingWorld);

    const masterSite = new THREE.Mesh(new THREE.BoxGeometry(132, 0.6, 104), new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.85 }));
    masterSite.position.set(0, -0.3, 2);
    masterSite.receiveShadow = true;
    scene.add(masterSite);

    // Highways, Boulevards & Plaza
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.82 });
    const frontHighway = new THREE.Mesh(new THREE.BoxGeometry(160, 0.08, 10), roadMat);
    frontHighway.position.set(0, 0.02, 57);
    frontHighway.receiveShadow = true;
    scene.add(frontHighway);

    for (let dx = -70; dx <= 70; dx += 8) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(4, 0.09, 0.25), new THREE.MeshBasicMaterial({ color: 0xf8fafc }));
      dash.position.set(dx, 0.03, 57);
      scene.add(dash);
    }
    for (let zx = -18.5; zx <= -8.5; zx += 1.25) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.09, 3.4), new THREE.MeshBasicMaterial({ color: 0xf8fafc }));
      stripe.position.set(zx, 0.03, 51.2);
      scene.add(stripe);
    }

    const mainBoulevardNS = new THREE.Mesh(new THREE.BoxGeometry(12, 0.06, 98), roadMat);
    mainBoulevardNS.position.set(-13.5, 0.03, 3);
    mainBoulevardNS.receiveShadow = true;
    scene.add(mainBoulevardNS);

    for (let bz = -42; bz <= 46; bz += 6) {
      const centerDash = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.075, 3.0), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
      centerDash.position.set(-13.5, 0.04, bz);
      scene.add(centerDash);
    }

    const avenueEW = new THREE.Mesh(new THREE.BoxGeometry(74, 0.06, 6.2), roadMat);
    avenueEW.position.set(23.5, 0.03, 10.2);
    avenueEW.receiveShadow = true;
    scene.add(avenueEW);

    const lobbyPlaza = new THREE.Mesh(new THREE.BoxGeometry(21, 0.07, 20), new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 }));
    lobbyPlaza.position.set(1.5, 0.035, 28);
    lobbyPlaza.receiveShadow = true;
    registerClickable(lobbyPlaza, 'lobby');
    scene.add(lobbyPlaza);

    // ============================================================================
    // UNIFIED SINGLE-ZONE CAR PARKING COMPOUND (parking)
    // ============================================================================
    const parkingCompoundGroup = new THREE.Group();
    scene.add(parkingCompoundGroup);

    const parkingAsphalt = new THREE.Mesh(new THREE.BoxGeometry(48.0, 0.07, 15.6), roadMat);
    parkingAsphalt.position.set(38.0, 0.035, 44.0);
    parkingAsphalt.receiveShadow = true;
    registerClickable(parkingAsphalt, 'parking');
    parkingCompoundGroup.add(parkingAsphalt);

    const parkingEntryDriveway = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.07, 4.5), roadMat);
    parkingEntryDriveway.position.set(17.6, 0.035, 51.5);
    registerClickable(parkingEntryDriveway, 'parking');
    parkingCompoundGroup.add(parkingEntryDriveway);

    const curbMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 });
    const curbNorth = new THREE.Mesh(new THREE.BoxGeometry(48.4, 0.22, 0.35), curbMat);
    curbNorth.position.set(38.0, 0.11, 36.2);
    const curbEast = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.22, 15.8), curbMat);
    curbEast.position.set(62.0, 0.11, 44.0);
    const curbWest = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.22, 15.8), curbMat);
    curbWest.position.set(14.0, 0.11, 44.0);
    const curbSouthEast = new THREE.Mesh(new THREE.BoxGeometry(40.8, 0.22, 0.35), curbMat);
    curbSouthEast.position.set(41.6, 0.11, 51.8);
    parkingCompoundGroup.add(curbNorth, curbEast, curbWest, curbSouthEast);

    const lineWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const stopperYellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15 });
    for (let ax = 21; ax <= 57; ax += 6) {
      const aisleDash = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 0.16), lineWhiteMat);
      aisleDash.position.set(ax, 0.045, 44.0);
      parkingCompoundGroup.add(aisleDash);
    }

    const pBooth = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.3, 1.8), new THREE.MeshStandardMaterial({ color: 0xf4f3ef, roughness: 0.45 }));
    pBooth.position.set(14.8, 1.15, 50.5);
    const pBarrierBox = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.1, 0.4), new THREE.MeshStandardMaterial({ color: 0xea580c }));
    pBarrierBox.position.set(15.6, 0.55, 51.4);
    const pBoomArm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.8, 8), lineWhiteMat);
    pBoomArm.rotation.z = Math.PI / 2 - 0.25;
    pBoomArm.position.set(17.4, 1.25, 51.4);

    const pSignPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    pSignPost.position.set(21.4, 1.6, 51.4);
    const pSignBoard = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.14), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
    pSignBoard.position.set(21.4, 3.1, 51.4);
    registerClickable(pSignBoard, 'parking');
    parkingCompoundGroup.add(pBooth, pBarrierBox, pBoomArm, pSignPost, pSignBoard);

    const carportRoofMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.3 });
    const carportSolarMat = new THREE.MeshPhysicalMaterial({ map: sharedSolarTex, roughness: 0.15, metalness: 0.65, clearcoat: 0.8 });

    [{ z: 39.0, tilt: 0.08 }, { z: 49.0, tilt: -0.08 }].forEach(rowCfg => {
      const cpRoof = new THREE.Mesh(new THREE.BoxGeometry(39.0, 0.18, 5.2), carportRoofMat);
      cpRoof.position.set(41.2, 3.25, rowCfg.z);
      cpRoof.rotation.x = rowCfg.tilt;
      cpRoof.castShadow = true;
      registerClickable(cpRoof, 'parking');
      parkingCompoundGroup.add(cpRoof);

      for (let csx = 23.2; csx <= 59.2; csx += 3.0) {
        const cPanel = new THREE.Mesh(new THREE.BoxGeometry(2.82, 0.08, 4.8), carportSolarMat);
        cPanel.position.set(csx, 3.38, rowCfg.z);
        cPanel.rotation.x = rowCfg.tilt;
        registerClickable(cPanel, 'parking');
        parkingCompoundGroup.add(cPanel);
      }
    });

    const carPalette = [0xffffff, 0x2563eb, 0xdc2626, 0x0f172a, 0x94a3b8, 0x059669, 0xea580c, 0x38bdf8, 0xe2e8f0, 0xfacc15];

    for (let i = 0; i < 10; i++) {
      const slotX = 23.2 + i * 3.9;

      // North Row
      const nLine = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 4.8), lineWhiteMat);
      nLine.position.set(slotX - 1.95, 0.045, 39.0);
      parkingCompoundGroup.add(nLine);
      if (i === 9) {
        const nLineEnd = nLine.clone();
        nLineEnd.position.set(slotX + 1.95, 0.045, 39.0);
        parkingCompoundGroup.add(nLineEnd);
      }
      const nStopper = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.2), stopperYellowMat);
      nStopper.position.set(slotX, 0.1, 37.1);
      parkingCompoundGroup.add(nStopper);

      if (i % 2 === 0) {
        const nPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.25, 8), carportRoofMat);
        nPillar.position.set(slotX - 1.95, 1.62, 36.8);
        parkingCompoundGroup.add(nPillar);
      }

      if (i !== 2 && i !== 6 && i !== 8) {
        createRealisticCar(slotX, 39.1, 0, carPalette[i % carPalette.length], i % 2 === 0, 'parking');
      }

      // South Row
      const sLine = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 4.8), lineWhiteMat);
      sLine.position.set(slotX - 1.95, 0.045, 49.0);
      parkingCompoundGroup.add(sLine);
      if (i === 9) {
        const sLineEnd = sLine.clone();
        sLineEnd.position.set(slotX + 1.95, 0.045, 49.0);
        parkingCompoundGroup.add(sLineEnd);
      }
      const sStopper = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.2), stopperYellowMat);
      sStopper.position.set(slotX, 0.1, 50.9);
      parkingCompoundGroup.add(sStopper);

      if (i % 2 === 0) {
        const sPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.25, 8), carportRoofMat);
        sPillar.position.set(slotX - 1.95, 1.62, 51.2);
        parkingCompoundGroup.add(sPillar);

        const evCharger = new THREE.Mesh(new THREE.BoxGeometry(0.38, 1.45, 0.26), new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.3 }));
        evCharger.position.set(slotX, 0.72, 51.35);
        const evScreen = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.32, 0.03), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
        evScreen.position.set(slotX, 1.05, 51.21);
        parkingCompoundGroup.add(evCharger, evScreen);
      }

      if (i !== 1 && i !== 5 && i !== 9) {
        createRealisticCar(slotX, 48.9, Math.PI, carPalette[(i + 4) % carPalette.length], i % 2 === 1, 'parking');
      }
    }

    // Architectural Perimeter Fence
    const fenceGroup = new THREE.Group();
    const baseWallMat = new THREE.MeshStandardMaterial({ color: 0xd6d3c9, roughness: 0.7 });
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0xf4f3ef, roughness: 0.45 });
    const ironBarMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.75, roughness: 0.25 });
    const goldCapMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.8, roughness: 0.2 });
    const lampGlowMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

    function addFenceRun(x1, z1, x2, z2, pillarStep = 6.5) {
      const dx = x2 - x1;
      const dz = z2 - z1;
      const length = Math.hypot(dx, dz);
      const angle = Math.atan2(dx, dz);
      const midX = (x1 + x2) / 2;
      const midZ = (z1 + z2) / 2;

      const runGroup = new THREE.Group();
      runGroup.position.set(midX, 0, midZ);
      runGroup.rotation.y = angle;

      const baseWall = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.65, length), baseWallMat);
      baseWall.position.y = 0.325;
      baseWall.castShadow = true;
      runGroup.add(baseWall);

      [0.95, 2.25, 2.42].forEach(ry => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, length), ironBarMat);
        rail.position.y = ry;
        runGroup.add(rail);
      });

      for (let posZ = -length / 2 + 0.3; posZ <= length / 2 - 0.3; posZ += 0.45) {
        const picket = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.85, 6), ironBarMat);
        picket.position.set(0, 1.55, posZ);
        const spear = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.14, 4), goldCapMat);
        spear.position.set(0, 2.52, posZ);
        runGroup.add(picket, spear);
      }

      const numPillars = Math.max(2, Math.round(length / pillarStep));
      for (let i = 0; i <= numPillars; i++) {
        const pz = -length / 2 + (i / numPillars) * length;
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.58, 2.65, 0.58), pillarMat);
        pillar.position.set(0, 1.325, pz);
        pillar.castShadow = true;

        const pCap = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.14, 0.72), baseWallMat);
        pCap.position.set(0, 2.7, pz);

        const lampOrb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), lampGlowMat);
        lampOrb.position.set(0, 2.9, pz);

        runGroup.add(pillar, pCap, lampOrb);
      }
      fenceGroup.add(runGroup);
    }

    addFenceRun(-65.2, -49.5, 65.2, -49.5, 6.5);
    addFenceRun(-65.2, -49.5, -65.2, 52.5, 6.5);
    addFenceRun(65.2, -49.5, 65.2, 52.5, 6.5);
    addFenceRun(-65.2, 52.5, -21.5, 52.5, 6.0);
    addFenceRun(-5.5, 52.5, 14.0, 52.5, 6.0);
    addFenceRun(21.2, 52.5, 65.2, 52.5, 6.0);
    scene.add(fenceGroup);

    // Trees & Landscaping
    const lushTreeCoords = [
      [-62, -46, 1.1, 0], [-62, -38, 1.0, 2], [-62, -30, 1.15, 0], [-62, -22, 0.95, 1],
      [-62, -14, 1.1, 0], [-62, -6, 1.0, 2],  [-62, 2, 1.15, 0],   [-62, 10, 1.0, 1],
      [-62, 18, 1.1, 0],  [-62, 26, 0.95, 2], [-62, 34, 1.1, 0],   [-62, 42, 1.05, 1], [-62, 49, 1.15, 0],
      [-52, -47, 1.0, 0], [-42, -47, 1.1, 1], [-32, -47, 0.95, 2], [-22, -47, 1.1, 0],
      [-12, -47, 1.0, 1], [0, -47, 1.15, 0],  [10, -47, 0.95, 2],  [22, -47, 1.05, 0],
      [34, -47, 1.1, 1],  [46, -47, 1.0, 0],  [56, -47, 1.15, 2],
      [63, -42, 1.05, 0], [63, -32, 1.0, 1],  [63, -22, 1.1, 2],   [63, -12, 1.05, 0],
      [63, -2, 1.0, 1],   [63, 8, 1.15, 0],   [63, 18, 0.95, 2],   [63, 28, 1.1, 1],
      [63, 38, 1.05, 0],  [63, 48, 1.15, 1],
      [-52, -12, 1.0, 1], [-45, -12, 1.15, 0], [-37, -12, 1.0, 1], [-29, -12, 1.1, 0], [-21, -12, 0.95, 2],
      [-52, 22, 0.95, 2], [-44, 22, 1.1, 0],  [-36, 22, 1.0, 1],   [-28, 22, 1.05, 0], [-20, 22, 0.95, 1],
      [-54, 48, 1.1, 0],  [-46, 48, 1.05, 1], [-38, 48, 1.15, 0],  [-30, 48, 1.0, 2],  [-23, 48, 1.1, 1],
      [-6.2, -38, 0.95, 1], [-6.2, -26, 1.0, 0], [-6.2, -14, 0.95, 1], [-6.2, -2, 1.0, 0], [-6.2, 8, 0.95, 1],
      [2.5, -38, 0.95, 2],  [2.5, -24, 1.0, 1],  [2.5, -10, 0.95, 2],  [2.5, 4, 1.0, 1],
      [12.0, 20, 1.0, 1],  [12.0, 30, 1.0, 0],
      [24.0, 19, 0.95, 1], [24.0, 30, 0.95, 2],
      [36.0, 19, 0.95, 1], [36.0, 30, 0.95, 2],
      [48.0, 19, 0.95, 1], [48.0, 30, 0.95, 2],
      [60.0, 20, 1.0, 1],  [60.0, 30, 1.0, 0],
      [12.2, 38, 1.05, 1], [12.2, 44, 1.0, 0], [12.2, 50, 1.05, 1]
    ];
    lushTreeCoords.forEach(([tx, tz, sc, tp]) => createRealisticTree(tx, tz, sc, tp));

    createHedgePlanter(-4.5, 48, 6.0, 1.1, 0xf43f5e);
    createHedgePlanter(5.5, 48, 6.0, 1.1, 0xfacc15);
    createHedgePlanter(-37, -15.5, 14.0, 1.1, 0xec4899);
    createHedgePlanter(-37, -8.5, 14.0, 1.1, 0x38bdf8);
    createHedgePlanter(26, 35.4, 14.0, 0.85, 0xf43f5e);
    createHedgePlanter(50, 35.4, 14.0, 0.85, 0xfacc15);

    // ============================================================================
    // ARCHITECTURAL PBR MATERIALS & EQUIPMENT BUILDERS
    // ============================================================================
    const archConcreteMat = new THREE.MeshStandardMaterial({ color: 0xf4f3ef, roughness: 0.45, metalness: 0.05 });
    const mullionMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.32, metalness: 0.72 });
    const woodLouverMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.52, metalness: 0.1 });
    const archGlassMat = new THREE.MeshPhysicalMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.28, roughness: 0.06, metalness: 0.1, reflectivity: 0.95, clearcoat: 1.0 });
    const darkSteelMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.35, metalness: 0.75 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.15, metalness: 0.92 });
    const redPadMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.45 });
    const bluePadMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.45 });
    const creamLeatherMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.5 });
    const oakWoodMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.45 });
    const rubberFloorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 });

    function createStartingBlock(x, z, rotY = 0) {
      const g = new THREE.Group();
      const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.65, 0.55), archConcreteMat);
      pedestal.position.y = 0.325;
      const topPlatform = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.08, 0.65), bluePadMat);
      topPlatform.position.set(0, 0.68, 0.04);
      topPlatform.rotation.x = 0.18;
      const gripBar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.45, 8), chromeMat);
      gripBar.rotation.z = Math.PI / 2;
      gripBar.position.set(0, 0.42, 0.32);
      g.add(pedestal, topPlatform, gripBar);
      g.position.set(x, 0.32, z);
      g.rotation.y = rotY;
      return g;
    }

    function createPoolLadder(x, z, rotY = 0) {
      const g = new THREE.Group();
      [-0.24, 0.24].forEach(lx => {
        const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.35, 8), chromeMat);
        rail.position.set(lx, 0.65, 0);
        const topLoop = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.03, 8, 16, Math.PI), chromeMat);
        topLoop.rotation.y = Math.PI / 2;
        topLoop.position.set(lx, 1.32, -0.18);
        g.add(rail, topLoop);
      });
      [0.35, 0.68, 1.0].forEach(ry => {
        const step = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.04, 0.12), chromeMat);
        step.position.set(0, ry, 0);
        g.add(step);
      });
      g.position.set(x, 0.25, z);
      g.rotation.y = rotY;
      return g;
    }

    function createLifeguardChair(x, z) {
      const g = new THREE.Group();
      [[-0.35, -0.35], [0.35, -0.35], [-0.35, 0.35], [0.35, 0.35]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.85, 8), chromeMat);
        leg.position.set(lx, 0.925, lz);
        g.add(leg);
      });
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.08, 0.7), archConcreteMat);
      seat.position.y = 1.85;
      const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.65, 0.08), archConcreteMat);
      backrest.position.set(0, 2.2, -0.32);
      const buoy = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.08, 10, 20), redPadMat);
      buoy.position.set(0.46, 1.5, 0);
      buoy.rotation.y = Math.PI / 2;
      g.add(seat, backrest, buoy);
      g.position.set(x, 0.32, z);
      return g;
    }

    function createSunLounger(x, z) {
      const g = new THREE.Group();
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.22, 1.95), oakWoodMat);
      base.position.y = 0.18;
      const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.1, 1.35), creamLeatherMat);
      cushion.position.set(0, 0.32, 0.25);
      const headRest = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.1, 0.62), creamLeatherMat);
      headRest.position.set(0, 0.52, -0.62);
      headRest.rotation.x = 0.48;
      const table = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.42, 12), oakWoodMat);
      table.position.set(0.68, 0.21, 0);
      g.add(base, cushion, headRest, table);
      g.position.set(x, 0.32, z);
      return g;
    }

    function createTreadmill(x, z, rotY = 0) {
      const g = new THREE.Group();
      const deck = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.18, 2.05), darkSteelMat);
      deck.position.y = 0.12;
      const belt = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.04, 1.75), rubberFloorMat);
      belt.position.set(0, 0.22, 0.08);
      [-0.4, 0.4].forEach(ux => {
        const upright = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.25, 8), darkSteelMat);
        upright.position.set(ux, 0.72, -0.78);
        upright.rotation.x = -0.18;
        const hrGrip = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.48, 8), chromeMat);
        hrGrip.position.set(ux, 1.12, -0.45);
        hrGrip.rotation.x = Math.PI / 2;
        g.add(upright, hrGrip);
      });
      const consoleBox = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.42, 0.22), darkSteelMat);
      consoleBox.position.set(0, 1.38, -0.68);
      consoleBox.rotation.x = -0.45;
      const ledScreen = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.28, 0.03), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
      ledScreen.position.set(0, 1.4, -0.57);
      ledScreen.rotation.x = -0.45;
      g.add(deck, belt, consoleBox, ledScreen);
      g.position.set(x, 0.32, z);
      g.rotation.y = rotY;
      return g;
    }

    function createSpinBike(x, z, rotY = 0) {
      const g = new THREE.Group();
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.08, 1.25), darkSteelMat);
      base.position.y = 0.06;
      const flywheel = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.08, 16), chromeMat);
      flywheel.rotation.z = Math.PI / 2;
      flywheel.position.set(0, 0.42, -0.36);
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.75, 0.85), redPadMat);
      frame.position.set(0, 0.55, 0);
      const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.1, 0.36), darkSteelMat);
      saddle.position.set(0, 0.98, 0.32);
      const handlebar = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.03, 8, 16, Math.PI), chromeMat);
      handlebar.rotation.x = Math.PI / 2;
      handlebar.position.set(0, 1.08, -0.38);
      g.add(base, flywheel, frame, saddle, handlebar);
      g.position.set(x, 0.32, z);
      g.rotation.y = rotY;
      return g;
    }

    function createPowerRackWithBarbell(x, z, rotY = 0) {
      const g = new THREE.Group();
      [[-0.65, -0.65], [0.65, -0.65], [-0.65, 0.65], [0.65, 0.65]].forEach(([px, pz]) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.35, 0.08), darkSteelMat);
        post.position.set(px, 1.18, pz);
        g.add(post);
      });
      const pullupBar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.35, 8), chromeMat);
      pullupBar.rotation.z = Math.PI / 2;
      pullupBar.position.set(0, 2.28, 0.65);
      g.add(pullupBar);

      const barbell = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.2, 10), chromeMat);
      barbell.rotation.z = Math.PI / 2;
      barbell.position.set(0, 1.42, 0.68);
      g.add(barbell);

      const plateSpecs = [
        { offset: 0.76, r: 0.24, col: 0xdc2626 },
        { offset: 0.83, r: 0.21, col: 0x2563eb },
        { offset: 0.89, r: 0.18, col: 0xfacc15 }
      ];
      [-1, 1].forEach(side => {
        plateSpecs.forEach(p => {
          const plate = new THREE.Mesh(new THREE.CylinderGeometry(p.r, p.r, 0.045, 16), new THREE.MeshStandardMaterial({ color: p.col, roughness: 0.35 }));
          plate.rotation.z = Math.PI / 2;
          plate.position.set(side * p.offset, 1.42, 0.68);
          g.add(plate);
        });
      });

      const benchPad = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.1, 1.35), redPadMat);
      benchPad.position.set(0, 0.48, 0.15);
      const benchLeg = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.42, 1.1), darkSteelMat);
      benchLeg.position.set(0, 0.21, 0.15);
      g.add(benchPad, benchLeg);

      g.position.set(x, 0.32, z);
      g.rotation.y = rotY;
      return g;
    }

    function createDumbbellRack(x, z, length = 3.6) {
      const g = new THREE.Group();
      [-length / 2 + 0.2, 0, length / 2 - 0.2].forEach(sx => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.88, 0.65), darkSteelMat);
        leg.position.set(sx, 0.44, 0);
        g.add(leg);
      });
      [0.45, 0.82].forEach(ty => {
        const tray = new THREE.Mesh(new THREE.BoxGeometry(length, 0.06, 0.42), darkSteelMat);
        tray.position.set(0, ty, 0);
        g.add(tray);

        for (let dx = -length / 2 + 0.35; dx <= length / 2 - 0.35; dx += 0.45) {
          const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.28, 6), chromeMat);
          handle.rotation.x = Math.PI / 2;
          handle.position.set(dx, ty + 0.08, 0);
          [-0.12, 0.12].forEach(hz => {
            const hexHead = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 6), rubberFloorMat);
            hexHead.rotation.x = Math.PI / 2;
            hexHead.position.set(dx, ty + 0.08, hz);
            g.add(hexHead);
          });
          g.add(handle);
        }
      });
      g.position.set(x, 0.32, z);
      return g;
    }

    function createCableCrossover(x, z) {
      const g = new THREE.Group();
      [-1.7, 1.7].forEach(tx => {
        const tower = new THREE.Mesh(new THREE.BoxGeometry(0.55, 2.35, 0.65), darkSteelMat);
        tower.position.set(tx, 1.18, 0);
        const weightStack = new THREE.Mesh(new THREE.BoxGeometry(0.38, 1.35, 0.25), rubberFloorMat);
        weightStack.position.set(tx, 0.85, 0);
        const pulley = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 12), new THREE.MeshStandardMaterial({ color: 0xfacc15 }));
        pulley.position.set(tx * 0.82, 2.05, 0);
        g.add(tower, weightStack, pulley);
      });
      const topArch = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.16, 0.35), darkSteelMat);
      topArch.position.set(0, 2.3, 0);
      g.add(topArch);
      g.position.set(x, 0.32, z);
      return g;
    }

    function createLatPulldown(x, z, rotY = 0) {
      const g = new THREE.Group();
      const tower = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.25, 0.55), darkSteelMat);
      tower.position.set(0, 1.12, -0.55);
      const topBoom = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.85), darkSteelMat);
      topBoom.position.set(0, 2.22, -0.2);
      const latBar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.15, 8), chromeMat);
      latBar.rotation.z = Math.PI / 2;
      latBar.position.set(0, 1.85, 0.12);
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.55), redPadMat);
      seat.position.set(0, 0.48, 0.22);
      const thighRoller = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.48, 10), rubberFloorMat);
      thighRoller.rotation.z = Math.PI / 2;
      thighRoller.position.set(0, 0.68, 0.05);
      g.add(tower, topBoom, latBar, seat, thighRoller);
      g.position.set(x, 0.32, z);
      g.rotation.y = rotY;
      return g;
    }

    function createLegPress45(x, z, rotY = 0) {
      const g = new THREE.Group();
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 2.1), darkSteelMat);
      base.position.y = 0.06;
      const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.12, 0.85), redPadMat);
      seatBack.position.set(0, 0.45, 0.68);
      seatBack.rotation.x = 0.55;
      const sledPlate = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.72, 0.1), darkSteelMat);
      sledPlate.position.set(0, 1.15, -0.35);
      sledPlate.rotation.x = 0.65;
      [-0.58, 0.58].forEach(px => {
        const weightPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.06, 16), bluePadMat);
        weightPlate.rotation.z = Math.PI / 2;
        weightPlate.position.set(px, 1.15, -0.35);
        g.add(weightPlate);
      });
      g.add(base, seatBack, sledPlate);
      g.position.set(x, 0.32, z);
      g.rotation.y = rotY;
      return g;
    }

    function createRowingMachine(x, z, rotY = 0) {
      const g = new THREE.Group();
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 2.2), chromeMat);
      rail.position.y = 0.32;
      const fanCage = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.16, 16), darkSteelMat);
      fanCage.rotation.z = Math.PI / 2;
      fanCage.position.set(0, 0.58, -0.88);
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.07, 0.28), rubberFloorMat);
      seat.position.set(0, 0.4, 0.25);
      g.add(rail, fanCage, seat);
      g.position.set(x, 0.32, z);
      g.rotation.y = rotY;
      return g;
    }

    function createProBasketballHoop(x, z, dirX = 1) {
      const g = new THREE.Group();
      const baseBox = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 1.25), bluePadMat);
      baseBox.position.set(-dirX * 1.4, 0.55, 0);
      const boomArm = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.22, 0.22), archConcreteMat);
      boomArm.position.set(-dirX * 0.45, 2.15, 0);
      boomArm.rotation.z = dirX * 0.45;
      const backboard = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.15, 1.85), archGlassMat);
      backboard.position.set(dirX * 0.35, 3.05, 0);
      const boardFrame = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(0.09, 1.16, 1.86)),
        new THREE.LineBasicMaterial({ color: 0xffffff })
      );
      boardFrame.position.copy(backboard.position);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.025, 8, 20), new THREE.MeshStandardMaterial({ color: 0xea580c }));
      rim.rotation.x = Math.PI / 2;
      rim.position.set(dirX * 0.65, 2.75, 0);
      const net = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.14, 0.42, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true }));
      net.position.set(dirX * 0.65, 2.54, 0);
      g.add(baseBox, boomArm, backboard, boardFrame, rim, net);
      g.position.set(x, 0.32, z);
      return g;
    }

    function createTableTennisUnit(x, z) {
      const g = new THREE.Group();
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.06, 2.75), new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.3 }));
      top.position.y = 0.76;
      const net = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.16, 0.03), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 }));
      net.position.y = 0.86;
      [[-0.6, -1.1], [0.6, -1.1], [-0.6, 1.1], [0.6, 1.1]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.74, 8), darkSteelMat);
        leg.position.set(lx, 0.37, lz);
        g.add(leg);
      });
      const pad1 = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.02, 12), redPadMat);
      pad1.position.set(-0.32, 0.8, 0.95);
      const pad2 = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.02, 12), rubberFloorMat);
      pad2.position.set(0.32, 0.8, -0.95);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      ball.position.set(0.08, 0.82, 0.25);
      g.add(top, net, pad1, pad2, ball);
      g.position.set(x, 0.32, z);
      return g;
    }

    function createBoxingRing(x, z) {
      const g = new THREE.Group();
      const apron = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.85, 6.6), darkSteelMat);
      apron.position.y = 0.425;
      const canvasMat = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.08, 6.4), bluePadMat);
      canvasMat.position.y = 0.88;
      g.add(apron, canvasMat);

      const corners = [
        [-2.9, -2.9, 0xdc2626],
        [2.9, 2.9, 0x2563eb],
        [-2.9, 2.9, 0xffffff],
        [2.9, -2.9, 0xffffff]
      ];
      corners.forEach(([cx, cz, col]) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.55, 10), darkSteelMat);
        post.position.set(cx, 1.65, cz);
        const pad = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.35, 0.24), new THREE.MeshStandardMaterial({ color: col }));
        pad.position.set(cx * 0.92, 1.65, cz * 0.92);
        g.add(post, pad);
      });

      [1.2, 1.5, 1.8, 2.1].forEach((ry, idx) => {
        const ropeMat = new THREE.MeshStandardMaterial({
          color: idx === 0 ? 0xdc2626 : idx === 3 ? 0x2563eb : 0xffffff
        });
        [-2.85, 2.85].forEach(offset => {
          const ropeX = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 5.7, 8), ropeMat);
          ropeX.rotation.z = Math.PI / 2;
          ropeX.position.set(0, ry, offset);
          const ropeZ = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 5.7, 8), ropeMat);
          ropeZ.rotation.x = Math.PI / 2;
          ropeZ.position.set(offset, ry, 0);
          g.add(ropeX, ropeZ);
        });
      });

      [0.25, 0.52, 0.78].forEach((sy, sIdx) => {
        const step = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.24, 0.35), darkSteelMat);
        step.position.set(3.55 + (2 - sIdx) * 0.32, sy / 2, -2.5);
        g.add(step);
      });

      g.position.set(x, 0.32, z);
      return g;
    }

    function createPilatesReformer(x, z) {
      const g = new THREE.Group();
      const frame = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.34, 0.82), oakWoodMat);
      frame.position.y = 0.22;
      const carriage = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.08, 0.72), creamLeatherMat);
      carriage.position.set(0.18, 0.42, 0);
      [-0.18, 0.18].forEach(sz => {
        const block = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.12), creamLeatherMat);
        block.position.set(0.55, 0.52, sz);
        g.add(block);
      });
      const spCols = [0xdc2626, 0xdc2626, 0x2563eb, 0xfacc15, 0x22c55e];
      spCols.forEach((sc, idx) => {
        const spring = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.52, 6), new THREE.MeshStandardMaterial({ color: sc, metalness: 0.5 }));
        spring.rotation.z = Math.PI / 2;
        spring.position.set(-0.68, 0.38, -0.2 + idx * 0.1);
        g.add(spring);
      });
      const footbar = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.025, 8, 16, Math.PI), chromeMat);
      footbar.rotation.y = Math.PI / 2;
      footbar.position.set(-1.05, 0.42, 0);
      g.add(frame, carriage, footbar);
      g.position.set(x, 0.32, z);
      return g;
    }

    // ============================================================================
    // MULTI-STORY ARCHITECTURAL SHELL BUILDER
    // ============================================================================
    function createArchBuildingShell(zoneId, cx, cz, width, depth, accentHex, buildInteriorFn) {
      const root = new THREE.Group();
      root.position.set(cx, 0, cz);
      scene.add(root);

      const floorH = 4.4;

      for (let lvl = 1; lvl <= 3; lvl++) {
        const flGroup = new THREE.Group();
        const baseY = (lvl - 1) * floorH;
        flGroup.position.y = baseY;
        flGroup.userData.baseY = baseY;

        const slab = new THREE.Mesh(new THREE.BoxGeometry(width, 0.32, depth), archConcreteMat);
        slab.position.y = 0.16;
        slab.receiveShadow = true;
        slab.castShadow = true;
        registerClickable(slab, zoneId);
        flGroup.add(slab);

        const colGeo = new THREE.BoxGeometry(0.55, floorH, 0.55);
        [-width / 2 + 0.4, 0, width / 2 - 0.4].forEach(colX => {
          [-depth / 2 + 0.4, depth / 2 - 0.4].forEach(colZ => {
            const col = new THREE.Mesh(colGeo, mullionMat);
            col.position.set(colX, floorH / 2, colZ);
            col.castShadow = true;
            flGroup.add(col);
          });
        });

        const glassFront = new THREE.Mesh(new THREE.BoxGeometry(width - 1.0, floorH - 0.45, 0.1), archGlassMat);
        glassFront.position.set(0, floorH / 2 + 0.1, depth / 2 - 0.25);
        registerClickable(glassFront, zoneId);
        const glassBack = glassFront.clone();
        glassBack.position.set(0, floorH / 2 + 0.1, -depth / 2 + 0.25);
        registerClickable(glassBack, zoneId);

        const glassEast = new THREE.Mesh(new THREE.BoxGeometry(0.1, floorH - 0.45, depth - 1.0), archGlassMat);
        glassEast.position.set(width / 2 - 0.25, floorH / 2 + 0.1, 0);
        registerClickable(glassEast, zoneId);
        const glassWest = glassEast.clone();
        glassWest.position.set(-width / 2 + 0.25, floorH / 2 + 0.1, 0);
        registerClickable(glassWest, zoneId);

        flGroup.add(glassFront, glassBack, glassEast, glassWest);

        const iLight = new THREE.PointLight(0xfffbeb, 0, 26, 1.5);
        iLight.position.set(0, floorH - 0.6, 0);
        flGroup.add(iLight);
        interiorNightLights.push(iLight);

        buildInteriorFn(flGroup, lvl, width, depth);

        root.add(flGroup);
        buildingFloorGroups[zoneId][lvl] = flGroup;
      }

      // Roof
      const roofGroup = new THREE.Group();
      const roofBaseY = 3 * floorH;
      roofGroup.position.y = roofBaseY;
      roofGroup.userData.baseY = roofBaseY;

      const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(width + 0.8, 0.42, depth + 0.8), mullionMat);
      roofSlab.position.y = 0.21;
      roofSlab.castShadow = true;
      registerClickable(roofSlab, zoneId);
      roofGroup.add(roofSlab);

      const ledRim = new THREE.Mesh(
        new THREE.BoxGeometry(width + 1.0, 0.18, depth + 1.0),
        new THREE.MeshStandardMaterial({ color: accentHex, emissive: accentHex, emissiveIntensity: 0.5 })
      );
      ledRim.position.y = 0.48;
      roofGroup.add(ledRim);

      const solarMat = new THREE.MeshPhysicalMaterial({ map: sharedSolarTex, roughness: 0.15, metalness: 0.65, clearcoat: 0.85 });
      const panelW = 3.2, panelD = 1.9;
      for (let sx = -width / 2 + 2.2; sx <= width / 2 - 2.2; sx += 3.6) {
        for (let sz = -depth / 2 + 1.8; sz <= depth / 2 - 1.8; sz += 2.35) {
          const panel = new THREE.Mesh(new THREE.BoxGeometry(panelW, 0.07, panelD), solarMat);
          panel.position.set(sx, 0.78, sz);
          panel.rotation.x = 0.22;
          panel.castShadow = true;
          registerClickable(panel, zoneId);

          const stand = new THREE.Mesh(new THREE.BoxGeometry(panelW - 0.4, 0.32, 0.12), darkSteelMat);
          stand.position.set(sx, 0.58, sz - 0.55);
          roofGroup.add(panel, stand);
        }
      }

      const inverter = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 0.8), new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35 }));
      inverter.position.set(width / 2 - 1.2, 0.95, -depth / 2 + 1.1);
      roofGroup.add(inverter);

      root.add(roofGroup);
      buildingFloorGroups[zoneId][4] = roofGroup;
    }

    // Build Khu A
    createArchBuildingShell('khuA', -37, 6, 38, 24, 0x38bdf8, (group, lvl) => {
      if (lvl === 1) {
        const poolWater = new THREE.Mesh(
          new THREE.BoxGeometry(25, 0.2, 12.5),
          new THREE.MeshPhysicalMaterial({ map: createPoolTileAndWaterTexture(), roughness: 0.08, metalness: 0.05, transmission: 0.25, reflectivity: 0.9 })
        );
        poolWater.position.set(0, 0.36, -0.8);
        group.add(poolWater);
        poolWaterMeshRef.current = poolWater;

        const laneZ = [-4.55, -2.05, 0.45, 2.95];
        laneZ.forEach(lz => {
          const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 24.6, 8), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
          rope.rotation.z = Math.PI / 2;
          rope.position.set(0, 0.46, lz);
          group.add(rope);
        });

        [-5.8, -3.3, -0.8, 1.7, 4.2].forEach(bz => group.add(createStartingBlock(-13.1, bz, Math.PI / 2)));
        [[-10, -7.2, 0], [10, -7.2, 0], [-10, 5.6, Math.PI], [10, 5.6, Math.PI]].forEach(([lx, lz, rot]) => {
          group.add(createPoolLadder(lx, lz, rot));
        });
        group.add(createLifeguardChair(0, -7.8));
        [-11, -6.6, -2.2, 2.2, 6.6, 11].forEach(sx => group.add(createSunLounger(sx, 8.2)));
      } else if (lvl === 2) {
        const gymMat = new THREE.Mesh(new THREE.BoxGeometry(36, 0.05, 22), rubberFloorMat);
        gymMat.position.y = 0.34;
        const turfStrip = new THREE.Mesh(new THREE.BoxGeometry(22, 0.07, 3.2), new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.8 }));
        turfStrip.position.set(2.5, 0.35, 2.5);
        group.add(gymMat, turfStrip);

        [-13, -9.5, -6].forEach(tx => group.add(createTreadmill(tx, 6.8, 0)));
        [-15.5, -15.5, -15.5].forEach((bx, idx) => group.add(createSpinBike(bx, -2 + idx * 3.2, Math.PI / 2)));
        [-11.5, -5.5].forEach(rx => group.add(createPowerRackWithBarbell(rx, -6.8, 0)));
        group.add(createDumbbellRack(0.5, -8.5, 4.2));

        group.add(createCableCrossover(7.5, -7.2));
        group.add(createLatPulldown(12.5, -7.2, 0));
        group.add(createLatPulldown(15.2, -7.2, 0));
        group.add(createLegPress45(10.5, -1.8, -Math.PI / 2));
        group.add(createLegPress45(14.5, -1.8, -Math.PI / 2));
        group.add(createRowingMachine(6.5, 7.2, Math.PI / 2));
        group.add(createRowingMachine(11.5, 7.2, Math.PI / 2));

        const sled = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.85, 1.3), redPadMat);
        sled.position.set(-5.5, 0.78, 2.5);
        group.add(sled);
      } else if (lvl === 3) {
        [-5, 0, 5].forEach(lz => {
          const locker = new THREE.Mesh(new THREE.BoxGeometry(14, 2.15, 0.85), oakWoodMat);
          locker.position.set(-7.5, 1.4, lz);
          const bench = new THREE.Mesh(new THREE.BoxGeometry(12, 0.45, 0.55), creamLeatherMat);
          bench.position.set(-7.5, 0.55, lz + 1.4);
          group.add(locker, bench);
        });
        for (let i = 0; i < 6; i++) {
          const sz = -7.5 + i * 3.0;
          const stall = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.35, 2.4), archGlassMat);
          stall.position.set(11.5, 1.5, sz);
          const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.9, 8), chromeMat);
          pipe.position.set(12.4, 1.35, sz);
          const rainHead = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 12), chromeMat);
          rainHead.position.set(12.15, 2.25, sz);
          group.add(stall, pipe, rainHead);
        }
      }
    });

    // Build Khu B
    createArchBuildingShell('khuB', -37, -30, 38, 24, 0xfbbf24, (group, lvl) => {
      if (lvl === 1) {
        const court = new THREE.Mesh(new THREE.BoxGeometry(28, 0.08, 15.5), new THREE.MeshStandardMaterial({ map: createBasketballHardwoodTexture(), roughness: 0.28 }));
        court.position.set(0, 0.36, 0.8);
        group.add(court);
        group.add(createProBasketballHoop(-13.8, 0.8, 1));
        group.add(createProBasketballHoop(13.8, 0.8, -1));

        [0, 1, 2].forEach(tier => {
          const step = new THREE.Mesh(new THREE.BoxGeometry(22, 0.42, 0.85), oakWoodMat);
          step.position.set(0, 0.55 + tier * 0.42, -8.2 - tier * 0.85);
          group.add(step);
        });
      } else if (lvl === 2) {
        [-12.6, -4.2, 4.2, 12.6].forEach((cx, idx) => {
          const bCourt = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.07, 14.2), new THREE.MeshStandardMaterial({ map: createBadmintonCourtTexture(idx + 1), roughness: 0.55 }));
          bCourt.position.set(cx, 0.35, 0);
          const net = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.78, 0.05), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 }));
          net.position.set(cx, 1.15, 0);
          const umpireChair = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.55, 0.55), darkSteelMat);
          umpireChair.position.set(cx + 3.45, 1.1, 0);
          group.add(bCourt, net, umpireChair);
        });
      } else if (lvl === 3) {
        [-12.6, -4.2, 4.2, 12.6].forEach(tx => {
          group.add(createTableTennisUnit(tx, 0));
          const barrier = new THREE.LineSegments(
            new THREE.EdgesGeometry(new THREE.BoxGeometry(6.8, 0.75, 12.5)),
            new THREE.LineBasicMaterial({ color: 0x38bdf8 })
          );
          barrier.position.set(tx, 0.7, 0);
          group.add(barrier);
        });
      }
    });

    // Build Khu C
    createArchBuildingShell('khuC', -40, 35, 32, 18, 0xf43f5e, (group, lvl) => {
      if (lvl === 1) {
        group.add(createBoxingRing(-9.5, 0));
        const tatami = new THREE.Mesh(new THREE.BoxGeometry(16, 0.07, 13.5), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.75 }));
        tatami.position.set(5.5, 0.35, 0);
        group.add(tatami);

        for (let bx = 1.5; bx <= 10.5; bx += 3.0) {
          [-3.2, 3.2].forEach(bz => {
            const bag = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.65, 12), redPadMat);
            bag.position.set(bx, 1.75, bz);
            const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.85, 6), chromeMat);
            chain.position.set(bx, 2.95, bz);
            group.add(bag, chain);
          });
        }
      } else if (lvl === 2) {
        [-8, -2.5, 3, 8.5].forEach(lx => {
          const locker = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.1, 11.5), oakWoodMat);
          locker.position.set(lx, 1.38, 0);
          group.add(locker);
        });
      } else if (lvl === 3) {
        [-11.5, -8.2, -4.9, -1.6].forEach(px => {
          [-3.4, 3.4].forEach(pz => group.add(createPilatesReformer(px, pz)));
        });
        const yogaMatMaterial = new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.65 });
        for (let yx = 3.2; yx <= 12.2; yx += 3.0) {
          [-4.2, 0, 4.2].forEach(yz => {
            const mat = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.04, 0.85), yogaMatMaterial);
            mat.position.set(yx, 0.35, yz);
            const ball = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.3 }));
            ball.position.set(yx + 0.75, 0.64, yz - 0.55);
            group.add(mat, ball);
          });
        }
      }
    });

    // ============================================================================
    // CENTRAL RECEPTION PAVILION, CANTEEN, MEDICAL & GATE
    // ============================================================================
    const lobbyGroup = new THREE.Group();
    lobbyGroup.position.set(1.5, 0, 28);
    scene.add(lobbyGroup);

    const lobbySlab = new THREE.Mesh(new THREE.BoxGeometry(18, 0.35, 14), archConcreteMat);
    lobbySlab.position.y = 0.175;
    registerClickable(lobbySlab, 'lobby');
    lobbyGroup.add(lobbySlab);

    const lobbyGlass = new THREE.Mesh(new THREE.BoxGeometry(17.2, 4.2, 13.2), archGlassMat);
    lobbyGlass.position.y = 2.4;
    registerClickable(lobbyGlass, 'lobby');
    lobbyGroup.add(lobbyGlass);

    const roofRimMat = new THREE.MeshStandardMaterial({ color: 0xe5d9b6, roughness: 0.35 });
    [-6.8, 6.8].forEach(rz => {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(17.0, 0.45, 1.4), roofRimMat);
      beam.position.set(0, 4.7, rz);
      registerClickable(beam, 'lobby');
      lobbyGroup.add(beam);
    });
    [-7.8, 7.8].forEach(rx => {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.45, 15.0), roofRimMat);
      beam.position.set(rx, 4.7, 0);
      registerClickable(beam, 'lobby');
      lobbyGroup.add(beam);
    });

    const entranceCanopy = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.22, 6.4), roofRimMat);
    entranceCanopy.position.set(-8.8, 3.6, 0);
    lobbyGroup.add(entranceCanopy);

    const deskBase = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.08, 1.3), woodLouverMat);
    deskBase.position.set(0, 0.88, 2.2);
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.1, 1.5), creamLeatherMat);
    deskTop.position.set(0, 1.45, 2.2);
    [-1.2, 1.2].forEach(mx => {
      const monitor = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.4, 0.05), darkSteelMat);
      monitor.position.set(mx, 1.72, 2.35);
      const screen = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.34, 0.02), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
      screen.position.set(mx, 1.72, 2.38);
      lobbyGroup.add(monitor, screen);
    });
    [-1.8, -0.6, 0.6].forEach(tx => {
      const gateBarrier = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.98, 1.25), chromeMat);
      gateBarrier.position.set(3.4 + tx, 0.84, 3.8);
      lobbyGroup.add(gateBarrier);
    });
    lobbyGroup.add(deskBase, deskTop);

    const barCounter = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.1, 1.1), new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.35 }));
    barCounter.position.set(-4.8, 0.9, -1.8);
    const fridgeBox = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 0.85), darkSteelMat);
    fridgeBox.position.set(-5.4, 1.45, -4.6);
    const bottleCols = [0x38bdf8, 0x22c55e, 0xf97316, 0xef4444];
    [0.75, 1.2, 1.65, 2.1].forEach((sy, sIdx) => {
      for (let bx = -6.2; bx <= -4.6; bx += 0.28) {
        const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.28, 8), new THREE.MeshStandardMaterial({ color: bottleCols[sIdx] }));
        bottle.position.set(bx, sy, -4.35);
        lobbyGroup.add(bottle);
      }
    });
    [-5.4, -3.2].forEach(cx => {
      const cTable = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.06, 16), creamLeatherMat);
      cTable.position.set(cx, 0.95, 1.8);
      const cPed = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.25, 0.62, 10), chromeMat);
      cPed.position.set(cx, 0.65, 1.8);
      lobbyGroup.add(cTable, cPed);
    });
    lobbyGroup.add(barCounter, fridgeBox);

    const medBedFrame = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.55, 2.2), chromeMat);
    medBedFrame.position.set(5.0, 0.62, -2.5);
    const medMattress = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.14, 2.15), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    medMattress.position.set(5.0, 0.96, -2.5);
    const medPillow = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.12, 0.42), new THREE.MeshStandardMaterial({ color: 0xbae6fd }));
    medPillow.position.set(5.0, 1.08, -3.25);
    medPillow.rotation.x = 0.25;

    const oxyTank = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.35, 12), new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.4 }));
    oxyTank.position.set(6.4, 1.02, -3.5);

    const medCab = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.35), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    medCab.position.set(5.8, 2.1, -5.2);
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.22, 0.06), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    crossH.position.set(5.8, 2.1, -5.0);
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.75, 0.06), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    crossV.position.set(5.8, 2.1, -5.0);
    lobbyGroup.add(medBedFrame, medMattress, medPillow, oxyTank, medCab, crossH, crossV);

    // Grand Entrance Archway
    const gateGroup = new THREE.Group();
    gateGroup.position.set(-13.5, 0, 49.5);

    [-7.4, 7.4].forEach(px => {
      const pBase = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.6, 2.0), mullionMat);
      pBase.position.set(px, 0.3, 0);
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.5, 6.8, 1.5), archConcreteMat);
      pillar.position.set(px, 3.6, 0);
      pillar.castShadow = true;
      const woodClad = new THREE.Mesh(new THREE.BoxGeometry(1.62, 5.2, 0.85), woodLouverMat);
      woodClad.position.set(px, 3.5, 0);
      const ledStrip = new THREE.Mesh(new THREE.BoxGeometry(0.14, 5.8, 1.66), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
      ledStrip.position.set(px, 3.6, 0);
      registerClickable(pillar, 'lobby');
      gateGroup.add(pBase, pillar, woodClad, ledStrip);
    });

    const gateBeam = new THREE.Mesh(new THREE.BoxGeometry(18.6, 2.2, 2.0), mullionMat);
    gateBeam.position.set(0, 7.6, 0);
    gateBeam.castShadow = true;
    registerClickable(gateBeam, 'lobby');
    gateGroup.add(gateBeam);

    const goldCrown = new THREE.Mesh(new THREE.BoxGeometry(19.0, 0.22, 2.2), new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.7, roughness: 0.25 }));
    goldCrown.position.set(0, 8.8, 0);
    gateGroup.add(goldCrown);

    const signTex = createOlympicGateSignTexture();
    const signMat = new THREE.MeshBasicMaterial({ map: signTex });
    const frontSign = new THREE.Mesh(new THREE.PlaneGeometry(17.4, 1.85), signMat);
    frontSign.position.set(0, 7.6, 1.02);
    const backSign = new THREE.Mesh(new THREE.PlaneGeometry(17.4, 1.85), signMat);
    backSign.position.set(0, 7.6, -1.02);
    backSign.rotation.y = Math.PI;
    gateGroup.add(frontSign, backSign);

    const olympicRingSpecs = [
      { x: -2.2, y: 10.05, z: 0,    col: 0x0284c7 },
      { x: -1.1, y: 9.45,  z: 0.08, col: 0xfacc15 },
      { x: 0.0,  y: 10.05, z: 0,    col: 0x1e293b },
      { x: 1.1,  y: 9.45,  z: 0.08, col: 0x16a34a },
      { x: 2.2,  y: 10.05, z: 0,    col: 0xef4444 }
    ];
    olympicRingSpecs.forEach(r => {
      const torus = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.095, 14, 32), new THREE.MeshStandardMaterial({ color: r.col, metalness: 0.4, roughness: 0.2 }));
      torus.position.set(r.x, r.y, r.z);
      torus.castShadow = true;
      gateGroup.add(torus);
    });

    scene.add(gateGroup);

    // ============================================================================
    // OUTDOOR SPORTS COMPLEX (EAST WING)
    // ============================================================================
    const outdoorGroup = new THREE.Group();
    scene.add(outdoorGroup);

    function addDetailedSoccerPitchEquipment(cx, cz, w, d) {
      const postMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
      const netMat = new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.55 });
      const goalW = w * 0.24;

      [-1, 1].forEach(dir => {
        const gz = cz + dir * (d / 2 - 1.8);
        const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.3, 10), postMat);
        postL.position.set(cx - goalW / 2, 1.15, gz);
        const postR = postL.clone();
        postR.position.set(cx + goalW / 2, 1.15, gz);
        const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, goalW + 0.16, 10), postMat);
        crossbar.rotation.z = Math.PI / 2;
        crossbar.position.set(cx, 2.3, gz);

        const netBox = new THREE.Mesh(new THREE.BoxGeometry(goalW, 2.25, 1.45), netMat);
        netBox.position.set(cx, 1.15, gz + dir * 0.72);
        outdoorGroup.add(postL, postR, crossbar, netBox);
      });

      [[-w / 2 + 1.2, -d / 2 + 1.2], [w / 2 - 1.2, -d / 2 + 1.2], [-w / 2 + 1.2, d / 2 - 1.2], [w / 2 - 1.2, d / 2 - 1.2]].forEach(([fx, fz]) => {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 6), postMat);
        pole.position.set(cx + fx, 0.75, cz + fz);
        const flag = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.3, 0.03), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
        flag.position.set(cx + fx + 0.22, 1.35, cz + fz);
        outdoorGroup.add(pole, flag);
      });

      const dugout = new THREE.Group();
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.1, 5.2), new THREE.MeshPhysicalMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.45 }));
      canopy.position.y = 1.1;
      const benchRow = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.5, 4.8), redPadMat);
      benchRow.position.set(0, 0.45, 0);
      dugout.add(canopy, benchRow);
      dugout.position.set(cx - w / 2 - 0.85, 0.1, cz);
      outdoorGroup.add(dugout);

      const fenceH = 4.2;
      const fPostMat = new THREE.MeshStandardMaterial({ color: 0x065f46, metalness: 0.6, roughness: 0.35 });
      const fMeshMat = new THREE.MeshBasicMaterial({ map: sharedFenceTex, transparent: true, opacity: 0.42, side: THREE.DoubleSide, depthWrite: false });

      const wallN = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.6, fenceH), fMeshMat);
      wallN.position.set(cx, fenceH / 2, cz - d / 2 - 0.3);
      const wallS = wallN.clone();
      wallS.position.set(cx, fenceH / 2, cz + d / 2 + 0.3);
      const wallW = new THREE.Mesh(new THREE.PlaneGeometry(d + 0.6, fenceH), fMeshMat);
      wallW.rotation.y = Math.PI / 2;
      wallW.position.set(cx - w / 2 - 0.3, fenceH / 2, cz);
      const wallE = wallW.clone();
      wallE.position.set(cx + w / 2 + 0.3, fenceH / 2, cz);
      outdoorGroup.add(wallN, wallS, wallW, wallE);

      for (let fx = -w / 2 - 0.3; fx <= w / 2 + 0.31; fx += 4.5) {
        [-d / 2 - 0.3, d / 2 + 0.3].forEach(fz => {
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, fenceH, 8), fPostMat);
          post.position.set(cx + fx, fenceH / 2, cz + fz);
          outdoorGroup.add(post);
        });
      }
      for (let fz = -d / 2 - 0.3; fz <= d / 2 + 0.31; fz += 4.5) {
        [-w / 2 - 0.3, w / 2 + 0.3].forEach(fx => {
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, fenceH, 8), fPostMat);
          post.position.set(cx + fx, fenceH / 2, cz + fz);
          outdoorGroup.add(post);
        });
      }

      const fenceBorder = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(w + 0.6, fenceH, d + 0.6)),
        new THREE.LineBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.7 })
      );
      fenceBorder.position.set(cx, fenceH / 2, cz);
      outdoorGroup.add(fenceBorder);
    }

    // 1 Sân bóng đá 5 người
    const pitch5 = new THREE.Mesh(new THREE.BoxGeometry(20, 0.18, 34), new THREE.MeshStandardMaterial({ map: createSoccerTurfTexture('SÂN BÓNG 5 NGƯỜI'), roughness: 0.75 }));
    pitch5.position.set(15, 0.09, -25);
    pitch5.receiveShadow = true;
    registerClickable(pitch5, 'outdoor');
    outdoorGroup.add(pitch5);
    addDetailedSoccerPitchEquipment(15, -25, 20, 34);

    [
      [11, -34, 0xfacc15], [19, -32, 0xfacc15], [15, -28, 0xfacc15], [12, -22, 0xfacc15], [18, -19, 0xfacc15],
      [15, -15, 0x22c55e], [11, -20, 0x22c55e], [19, -23, 0x22c55e], [13, -30, 0x22c55e], [17, -35, 0x22c55e]
    ].forEach(([px, pz, col]) => {
      scene.add(createHumanFigure(px, 0.18, pz, col, 0x0f172a, true, 1.5));
    });

    // 1 Sân bóng đá 7 người
    const pitch7 = new THREE.Mesh(new THREE.BoxGeometry(32, 0.18, 48), new THREE.MeshStandardMaterial({ map: createSoccerTurfTexture('SÂN BÓNG 7 NGƯỜI'), roughness: 0.75 }));
    pitch7.position.set(44, 0.09, -18);
    pitch7.receiveShadow = true;
    registerClickable(pitch7, 'outdoor');
    outdoorGroup.add(pitch7);
    addDetailedSoccerPitchEquipment(44, -18, 32, 48);

    for (let i = 0; i < 14; i++) {
      const teamColor = i % 2 === 0 ? 0xef4444 : 0x38bdf8;
      const px = 34 + (i % 4) * 6.5;
      const pz = -35 + Math.floor(i / 4) * 11;
      scene.add(createHumanFigure(px, 0.18, pz, teamColor, 0xffffff, true, 2.0));
    }

    // 4 Sân Pickleball
    [18, 30, 42, 54].forEach((px, idx) => {
      const courtZ = 24.5;
      const courtMat = new THREE.MeshStandardMaterial({ map: createPickleballCourtTexture(`PICKLEBALL ${idx + 1}`), roughness: 0.45 });
      const court = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.16, 19.2), courtMat);
      court.position.set(px, 0.08, courtZ);
      court.receiveShadow = true;
      registerClickable(court, 'outdoor');
      outdoorGroup.add(court);

      [-4.0, 4.0].forEach(postX => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.02, 10), darkSteelMat);
        post.position.set(px + postX, 0.58, courtZ);
        outdoorGroup.add(post);
      });
      const net = new THREE.Mesh(new THREE.BoxGeometry(7.9, 0.86, 0.06), new THREE.MeshStandardMaterial({ color: 0x1e293b, transparent: true, opacity: 0.88 }));
      net.position.set(px, 0.56, courtZ);
      const tape = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.08, 0.08), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      tape.position.set(px, 1.0, courtZ);
      const centerStrap = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.88, 0.09), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      centerStrap.position.set(px, 0.56, courtZ);

      const bench = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.45, 0.55), oakWoodMat);
      bench.position.set(px, 0.32, courtZ + 9.9);
      const umbPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.5, 8), chromeMat);
      umbPole.position.set(px, 1.25, courtZ + 10.1);
      const umbCanopy = new THREE.Mesh(new THREE.ConeGeometry(1.55, 0.55, 8), new THREE.MeshStandardMaterial({ color: idx % 2 === 0 ? 0x0284c7 : 0x10b981, roughness: 0.6 }));
      umbCanopy.position.set(px, 2.45, courtZ + 10.1);

      const pfH = 2.15;
      const pfPostMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 });
      const pfMeshMat = new THREE.MeshBasicMaterial({ map: sharedFenceTex, transparent: true, opacity: 0.36, side: THREE.DoubleSide, depthWrite: false });

      const pWallN = new THREE.Mesh(new THREE.PlaneGeometry(9.5, pfH), pfMeshMat);
      pWallN.position.set(px, pfH / 2, courtZ - 9.75);
      const pWallS = pWallN.clone();
      pWallS.position.set(px, pfH / 2, courtZ + 9.75);
      const pWallW = new THREE.Mesh(new THREE.PlaneGeometry(19.5, pfH), pfMeshMat);
      pWallW.rotation.y = Math.PI / 2;
      pWallW.position.set(px - 4.75, pfH / 2, courtZ);
      const pWallE = pWallW.clone();
      pWallE.position.set(px + 4.75, pfH / 2, courtZ);
      outdoorGroup.add(pWallN, pWallS, pWallW, pWallE);

      [-4.75, 0, 4.75].forEach(ofx => {
        [-9.75, 9.75].forEach(ofz => {
          const pPost = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, pfH, 8), pfPostMat);
          pPost.position.set(px + ofx, pfH / 2, courtZ + ofz);
          outdoorGroup.add(pPost);
        });
      });
      [-4.8, 4.8].forEach(ofz => {
        [-4.75, 4.75].forEach(ofx => {
          const pPost = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, pfH, 8), pfPostMat);
          pPost.position.set(px + ofx, pfH / 2, courtZ + ofz);
          outdoorGroup.add(pPost);
        });
      });

      const pFence = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(9.5, pfH, 19.5)),
        new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65 })
      );
      pFence.position.set(px, pfH / 2, courtZ);
      outdoorGroup.add(net, tape, centerStrap, bench, umbPole, umbCanopy, pFence);

      scene.add(createHumanFigure(px, 0.16, courtZ - 5.2, 0x38bdf8, 0xffffff, true, 1.2));
      scene.add(createHumanFigure(px, 0.16, courtZ + 5.2, 0xf43f5e, 0x1e293b, true, 1.2));
    });

    // 10 Floodlight Towers
    const mastCoords = [
      { x: 4,    z: -43, tx: 15, tz: -25 },
      { x: 4,    z: -7,  tx: 15, tz: -25 },
      { x: 26.5, z: -43, tx: 35, tz: -22 },
      { x: 26.5, z: -7,  tx: 35, tz: -22 },
      { x: 61.5, z: -43, tx: 44, tz: -18 },
      { x: 61.5, z: 7,   tx: 44, tz: -18 },
      { x: 12.0, z: 14,  tx: 24, tz: 24.5 },
      { x: 36.0, z: 14,  tx: 36, tz: 24.5 },
      { x: 60.0, z: 14,  tx: 48, tz: 24.5 },
      { x: 36.0, z: 35.5, tx: 36, tz: 24.5 }
    ];

    mastCoords.forEach(m => {
      const mastGroup = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.34, 15.5, 10), mullionMat);
      pole.position.set(m.x, 7.75, m.z);
      pole.castShadow = true;
      mastGroup.add(pole);

      const headRack = new THREE.Group();
      headRack.position.set(m.x, 15.6, m.z);
      headRack.lookAt(m.tx, 12.0, m.tz);
      const crossArm = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.16, 0.16), mullionMat);
      headRack.add(crossArm);

      [-0.9, 0, 0.9].forEach(lx => {
        [0.22, -0.22].forEach(ly => {
          const housing = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.32, 0.25), darkSteelMat);
          housing.position.set(lx, ly, 0.12);
          const lens = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.24, 0.04), new THREE.MeshBasicMaterial({ color: 0xfffbeb }));
          lens.position.set(lx, ly, 0.24);
          headRack.add(housing, lens);
        });
      });
      mastGroup.add(headRack);
      scene.add(mastGroup);

      const coneGeo = new THREE.ConeGeometry(9.5, 18, 16, 1, true);
      const coneMat = new THREE.MeshBasicMaterial({
        color: 0xfef08a,
        transparent: true,
        opacity: 0.0,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.set((m.x + m.tx) * 0.5, 7.8, (m.z + m.tz) * 0.5);
      cone.lookAt(m.tx, 0, m.tz);
      cone.rotateX(Math.PI / 2);
      scene.add(cone);
      floodCones.push(coneMat);

      const pLight = new THREE.PointLight(0xfffbeb, 0, 56, 1.5);
      pLight.position.set(m.x, 15.0, m.z);
      scene.add(pLight);
      floodLights.push(pLight);
    });

    // Pointer Interaction (Raycasting)
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    const handlePointerDown = (e) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e) => {
      if (Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y) > 6) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const hits = raycaster.intersectObjects(clickableMeshes, false);
      if (hits.length > 0 && hits[0].object.userData.zoneId) {
        focusZone(hits[0].object.userData.zoneId);
      }
    };

    const handlePointerMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(clickableMeshes, false);
      renderer.domElement.style.cursor = hits.length > 0 ? 'pointer' : 'grab';
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('pointerdown', handlePointerDown);
    domEl.addEventListener('pointerup', handlePointerUp);
    domEl.addEventListener('pointermove', handlePointerMove);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    const animate = (now) => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const time = (now || 0) * 0.001;

      if (camAnimRef.current) {
        const anim = camAnimRef.current;
        anim.progress += 0.042;
        const t = 1 - Math.pow(1 - Math.min(anim.progress, 1), 3);
        camera.position.lerpVectors(anim.startCam, anim.endCam, t);
        controls.target.lerpVectors(anim.startTarget, anim.endTarget, t);
        if (anim.progress >= 1) camAnimRef.current = null;
      }

      animatedAthletes.forEach(p => {
        const u = p.userData;
        if (!u) return;
        p.position.x = u.originX + Math.sin(time * u.speed + u.phase) * u.radius;
        p.rotation.y = Math.cos(time * u.speed + u.phase) * 1.2;
      });

      if (poolWaterMeshRef.current) {
        poolWaterMeshRef.current.position.y = 0.36 + Math.sin(time * 2.5) * 0.018;
      }

      controls.update();

      // Project 3D Markers to 2D Screen
      const curW = container.clientWidth;
      const curH = container.clientHeight;
      const newMarkerPositions = {};
      Object.entries(ZONES_DATA).forEach(([zKey, zData]) => {
        const v = new THREE.Vector3(...zData.markerPos);
        v.project(camera);
        if (v.z < 1) {
          const x = ((v.x + 1) * curW) / 2;
          const y = ((-v.y + 1) * curH) / 2;
          newMarkerPositions[zKey] = { x, y, visible: true };
        } else {
          newMarkerPositions[zKey] = { visible: false };
        }
      });
      setMarkerPositions(newMarkerPositions);

      renderer.render(scene, camera);
    };

    animate(performance.now());

    return () => {
      window.removeEventListener('resize', handleResize);
      domEl.removeEventListener('pointerdown', handlePointerDown);
      domEl.removeEventListener('pointerup', handlePointerUp);
      domEl.removeEventListener('pointermove', handlePointerMove);
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

  const activeZone = activeZoneId ? ZONES_DATA[activeZoneId] : null;

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    setBookingSuccess(true);
    setTimeout(() => {
      setIsBookingModalOpen(false);
      setBookingSuccess(false);
      if (onBookingClick && activeZone) {
        onBookingClick(activeZone);
      }
    }, 1800);
  };

  return (
    <div className={`relative w-full select-none ${isFullscreen ? 'fixed inset-0 z-50 bg-[#141622] h-screen' : 'h-[680px] md:h-[780px] rounded-3xl overflow-hidden shadow-2xl border border-white/10'}`}>
      <style>{`
        .arch-panel {
          background: rgba(20, 22, 34, 0.86);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(247, 245, 240, 0.14);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.55);
        }
        .arch-card {
          background: rgba(34, 38, 56, 0.72);
          border: 1px solid rgba(247, 245, 240, 0.1);
          transition: all 0.22s ease;
        }
        .arch-card:hover {
          background: rgba(46, 52, 76, 0.9);
          border-color: rgba(229, 217, 182, 0.55);
        }
        .zone-marker {
          position: absolute;
          transform: translate(-50%, -100%);
          pointer-events: auto;
          cursor: pointer;
          transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.22s;
          z-index: 10;
        }
        .zone-marker:hover { transform: translate(-50%, -108%) scale(1.06); z-index: 30; }
        .zone-marker.active .marker-card {
          background: #E5D9B6;
          color: #141622;
          border-color: #FFFFFF;
          box-shadow: 0 0 28px rgba(229, 217, 182, 0.75);
        }
        .zone-marker.active .marker-sub { color: #2b3040; font-weight: 700; }
        .marker-stem {
          width: 2px;
          height: 24px;
          background: linear-gradient(to bottom, #E5D9B6, rgba(229, 217, 182, 0.1));
          margin: 0 auto;
        }
        .marker-dot {
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          background: #E5D9B6;
          margin: -2px auto 0;
          box-shadow: 0 0 10px #E5D9B6;
        }
      `}</style>

      {/* 3D Canvas Mounting Point */}
      <div ref={mountRef} className="w-full h-full relative cursor-grab active:cursor-grabbing outline-none" />

      {/* 3D Floating HTML Markers Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        {Object.entries(ZONES_DATA).map(([zKey, zData]) => {
          const marker = markerPositions[zKey];
          if (!marker || !marker.visible) return null;
          const isActive = activeZoneId === zKey;
          return (
            <div
              key={zKey}
              style={{
                left: `${marker.x}px`,
                top: `${marker.y}px`
              }}
              className={`zone-marker ${isActive ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                focusZone(zKey);
              }}
            >
              <div className="marker-card arch-panel px-3 py-1.5 rounded-xl border border-white/20 flex items-center gap-2 transition-all">
                <span className="w-2 h-2 rounded-full bg-[#E5D9B6]" />
                <div>
                  <div className="text-[11px] font-extrabold leading-tight whitespace-nowrap">
                    {isEn ? (zData.shortTitleEn || zData.shortTitle) : zData.shortTitle}
                  </div>
                  <div className="marker-sub text-[9px] text-slate-300 leading-tight whitespace-nowrap mt-0.5">
                    {isEn ? (zData.badgeEn || zData.badge) : zData.badge}
                  </div>
                </div>
              </div>
              <div className="marker-stem" />
              <div className="marker-dot" />
            </div>
          );
        })}
      </div>

      {/* TOP BAR */}
      <header className="absolute top-3 left-3 right-3 md:top-4 md:left-4 md:right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Brand Title */}
        <div className="arch-panel px-4 py-3 rounded-2xl pointer-events-auto flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#E5D9B6]/15 border border-[#E5D9B6]/40 flex items-center justify-center text-[#E5D9B6] shrink-0">
            <span className="material-symbols-outlined text-[24px]">explore</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase tracking-widest text-[#E5D9B6] font-bold">
                {isEn ? 'Optimized Spatial Layout' : 'Bố Trí Không Gian Thuận Tiện'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                {isEn ? 'ArchViz 3D • 13,000 m² (130m × 100m)' : 'ArchViz Thực Tế • 13.000 m² (130m × 100m)'}
              </span>
            </div>
            <h1 className="text-sm md:text-lg font-extrabold text-[#F7F5F0] tracking-tight leading-snug">
              {isEn ? '3D INTERACTIVE TRAINING CAMPUS & FACILITIES' : 'SƠ ĐỒ 3D CÁC KHU VỰC TẬP LUYỆN'}
            </h1>
          </div>
        </div>

        {/* Controls Toolbar */}
        <div className="flex items-center gap-2 flex-wrap pointer-events-auto">
          {/* Modal Specs Trigger */}
          <button
            type="button"
            onClick={() => setIsInfoModalOpen(true)}
            className="arch-panel hover:border-[#E5D9B6]/60 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#F7F5F0] flex items-center gap-2 transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-[#E5D9B6] text-[18px]">grid_view</span>
            <span className="hidden sm:inline">{isEn ? 'Campus Specifications' : 'Bảng Sơ Đồ & Tiện Ích'}</span>
          </button>

          {/* 2D Plan View */}
          <button
            type="button"
            onClick={setPlan2DView}
            className={`arch-panel hover:border-[#E5D9B6]/60 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#F7F5F0] flex items-center gap-1.5 transition cursor-pointer ${camMode === 'plan2d' ? 'border-[#E5D9B6] bg-[#E5D9B6]/20' : ''}`}
            title="Xem mặt bằng quy hoạch thẳng đứng từ trên xuống"
          >
            <span className="material-symbols-outlined text-emerald-400 text-[18px]">map</span>
            <span>{isEn ? '📐 2D Plan' : '📐 Mặt Bằng 2D'}</span>
          </button>

          {/* Walk Mode Toggle */}
          <button
            type="button"
            onClick={toggleWalkMode}
            className={`arch-panel hover:border-[#E5D9B6]/60 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#F7F5F0] flex items-center gap-2 transition cursor-pointer ${camMode === 'walk' ? 'border-[#E5D9B6] bg-[#E5D9B6]/20' : ''}`}
            title="Chuyển đổi góc nhìn Flycam trên cao và góc nhìn mắt người thực tế dưới mặt đất"
          >
            <span className="material-symbols-outlined text-sky-400 text-[18px]">visibility</span>
            <span>
              {camMode === 'walk'
                ? (isEn ? 'View: Ground Level' : 'Góc nhìn: Thực Tế Mặt Đất')
                : (isEn ? 'View: 3D Flycam' : 'Góc nhìn: Flycam 3D')}
            </span>
          </button>

          {/* Lighting Mode Switcher */}
          <div className="arch-panel p-1.5 rounded-xl flex items-center gap-1">
            <button
              type="button"
              onClick={() => applyLightingMode('day')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${lightingMode === 'day' ? 'bg-[#E5D9B6] text-[#141622]' : 'text-[#F7F5F0]/80 hover:bg-white/10'}`}
            >
              ☀️ {isEn ? 'Daylight' : 'Nắng Thực Tế'}
            </button>
            <button
              type="button"
              onClick={() => applyLightingMode('sunset')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${lightingMode === 'sunset' ? 'bg-[#E5D9B6] text-[#141622]' : 'text-[#F7F5F0]/80 hover:bg-white/10'}`}
            >
              🌅 {isEn ? 'Sunset' : 'Hoàng Hôn'}
            </button>
            <button
              type="button"
              onClick={() => applyLightingMode('night')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${lightingMode === 'night' ? 'bg-[#E5D9B6] text-[#141622]' : 'text-[#F7F5F0]/80 hover:bg-white/10'}`}
            >
              💡 {isEn ? 'LED Night' : 'Đèn LED Đêm'}
            </button>
          </div>

          {/* Reset Master View */}
          <button
            type="button"
            onClick={resetMasterView}
            className="arch-panel bg-[#E5D9B6]/15 hover:bg-[#E5D9B6]/25 border-[#E5D9B6]/40 px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#E5D9B6] flex items-center gap-1.5 transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">crop_free</span>
            <span>{isEn ? 'Overview' : 'Toàn Cảnh'}</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(prev => !prev)}
            className="arch-panel hover:border-[#E5D9B6]/60 p-2.5 rounded-xl text-xs font-semibold text-[#F7F5F0] flex items-center justify-center transition cursor-pointer"
            title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
            </span>
          </button>
        </div>
      </header>

      {/* LEFT FLOATING MASTERPLAN OVERVIEW (Desktop) */}
      <aside className="absolute left-4 top-24 z-20 w-72 hidden xl:flex flex-col gap-3 pointer-events-none">
        <div className="arch-panel p-4 rounded-2xl pointer-events-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#E5D9B6]">
              {isEn ? '9 Olympic Clusters' : 'Quy Hoạch Chuẩn 9 Cụm'}
            </span>
            <span className="text-xs font-extrabold text-emerald-400">13.000 m²</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
            {isEn
              ? 'West Wing sports buildings (A, B, C), Central Reception Pavilion, and East Wing Outdoor Pitches are strictly separated by wide internal avenues and tree belts.'
              : 'Các khối nhà A, B, C (Cánh Tây), Sảnh Lễ Tân (Trục Giữa) và Khu Sân Ngoài Trời (Cánh Đông) được tách biệt hoàn toàn bởi đại lộ nội khu và hành lang cây xanh.'}
          </p>
          <div className="space-y-1.5 text-xs">
            <div onClick={() => focusZone('outdoor')} className="arch-card p-2 rounded-xl flex justify-between items-center cursor-pointer">
              <span className="text-slate-200 font-medium">⚽ 1 Sân 7 + 1 Sân 5 + 4 Pickleball</span>
              <span className="font-bold text-emerald-400">5.200 m²</span>
            </div>
            <div onClick={() => focusZone('khuA')} className="arch-card p-2 rounded-xl flex justify-between items-center cursor-pointer">
              <span className="text-slate-200 font-medium">🏊 Khu A: 1 Bể 25m, Gym, Locker</span>
              <span className="font-bold text-sky-400">2.200 m²</span>
            </div>
            <div onClick={() => focusZone('khuB')} className="arch-card p-2 rounded-xl flex justify-between items-center cursor-pointer">
              <span className="text-slate-200 font-medium">🏀 Khu B: 1 Bóng rổ, 4 Cầu lông, 4 Bàn</span>
              <span className="font-bold text-amber-400">1.800 m²</span>
            </div>
            <div onClick={() => focusZone('khuC')} className="arch-card p-2 rounded-xl flex justify-between items-center cursor-pointer">
              <span className="text-slate-200 font-medium">🥊 Khu C: 1 Võ Boxing, Locker, Yoga</span>
              <span className="font-bold text-rose-400">1.200 m²</span>
            </div>
            <div onClick={() => focusZone('lobby')} className="arch-card p-2 rounded-xl flex justify-between items-center cursor-pointer">
              <span className="text-slate-200 font-medium">☕ Sảnh Lễ tân, Căn-tin & Y tế</span>
              <span className="font-bold text-[#E5D9B6]">1.850 m²</span>
            </div>
            <div onClick={() => focusZone('parking')} className="arch-card p-2 rounded-xl flex justify-between items-center cursor-pointer">
              <span className="text-slate-200 font-medium">🚗 Bãi Đỗ Xe Ô Tô Tập Trung (20 ô)</span>
              <span className="font-bold text-cyan-400">750 m²</span>
            </div>
          </div>
        </div>

        {/* 4 Key Standard Amenities */}
        <div className="arch-panel p-3.5 rounded-2xl pointer-events-auto space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#E5D9B6]">
            {isEn ? 'Standard Amenities' : 'Tiện Ích Tiêu Chuẩn'}
          </div>
          <div onClick={() => focusZone('khuA', 3)} className="arch-card p-2.5 rounded-xl flex items-center gap-2.5 cursor-pointer">
            <span className="material-symbols-outlined text-emerald-400 text-[18px]">key</span>
            <span className="text-[11px] text-slate-200 leading-tight">
              {isEn ? 'Secure locker storage with individual locks' : 'Tủ cất đồ cá nhân có chìa khóa an toàn, thuận tiện sử dụng'}
            </span>
          </div>
          <div onClick={() => focusZone('khuA', 3)} className="arch-card p-2.5 rounded-xl flex items-center gap-2.5 cursor-pointer">
            <span className="material-symbols-outlined text-emerald-400 text-[18px]">shower</span>
            <span className="text-[11px] text-slate-200 leading-tight">
              {isEn ? 'Pristine hot/cold rain showers and dressing suites' : 'Phòng thay đồ và khu vực tắm tráng nóng lạnh sạch sẽ'}
            </span>
          </div>
          <div onClick={() => focusZone('lobby')} className="arch-card p-2.5 rounded-xl flex items-center gap-2.5 cursor-pointer">
            <span className="material-symbols-outlined text-emerald-400 text-[18px]">local_cafe</span>
            <span className="text-[11px] text-slate-200 leading-tight">
              {isEn ? 'Energy canteen bar serving quick mineral drinks' : 'Quầy căn-tin nước giải khát, nước khoáng phục vụ nhanh'}
            </span>
          </div>
          <div onClick={() => focusZone('lobby')} className="arch-card p-2.5 rounded-xl flex items-center gap-2.5 cursor-pointer">
            <span className="material-symbols-outlined text-emerald-400 text-[18px]">medical_services</span>
            <span className="text-[11px] text-slate-200 leading-tight">
              {isEn ? 'First-aid clinic & emergency kits ready on site' : 'Tủ thuốc y tế và dụng cụ sơ cứu ban đầu luôn sẵn sàng'}
            </span>
          </div>
        </div>
      </aside>

      {/* RIGHT INSPECTOR DRAWER */}
      <aside
        className={`absolute right-3 md:right-4 top-20 bottom-20 z-20 w-[92vw] sm:w-96 arch-panel rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 overflow-hidden ${
          activeZone ? 'translate-x-0 opacity-100 pointer-events-auto' : 'translate-x-[120%] opacity-0 pointer-events-none'
        }`}
      >
        {activeZone && (
          <>
            <div className="overflow-y-auto pr-1 space-y-4">
              <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#E5D9B6]/20 text-[#E5D9B6]">
                    {isEn ? (activeZone.badgeEn || activeZone.badge) : activeZone.badge}
                  </span>
                  <h2 className="text-base md:text-lg font-extrabold text-[#F7F5F0] mt-1.5 leading-snug">
                    {isEn ? (activeZone.shortTitleEn || activeZone.shortTitle) : activeZone.shortTitle}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={resetMasterView}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition shrink-0 cursor-pointer"
                  title="Đóng và về toàn cảnh"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {isEn ? (activeZone.descEn || activeZone.desc) : activeZone.desc}
              </p>

              {/* Interactive 3D Floor Slicer */}
              {activeZone.hasFloors && (
                <div className="p-3 rounded-xl bg-black/35 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#E5D9B6] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">layers</span>
                      {isEn ? '3D Floor Cutaway Slicer' : 'Bóc Tách Mặt Cắt Nội Thất 3D'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {isEn ? 'Open roof to see inside' : 'Mở mái xem bên trong'}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => selectFloor(0)}
                      className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                        selectedFloor === 0 ? 'bg-[#E5D9B6] text-[#141622]' : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      {isEn ? 'All 3' : 'Cả 3 Tầng'}
                    </button>
                    <button
                      type="button"
                      onClick={() => selectFloor(1)}
                      className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                        selectedFloor === 1 ? 'bg-[#E5D9B6] text-[#141622]' : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      {isEn ? 'Floor 1' : 'Tầng 1'}
                    </button>
                    <button
                      type="button"
                      onClick={() => selectFloor(2)}
                      className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                        selectedFloor === 2 ? 'bg-[#E5D9B6] text-[#141622]' : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      {isEn ? 'Floor 2' : 'Tầng 2'}
                    </button>
                    <button
                      type="button"
                      onClick={() => selectFloor(3)}
                      className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                        selectedFloor === 3 ? 'bg-[#E5D9B6] text-[#141622]' : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      {isEn ? 'Floor 3' : 'Tầng 3'}
                    </button>
                  </div>
                </div>
              )}

              {/* Sub-area Details & Close-up Equipment Zooms */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-2">
                  {isEn ? 'Spatial Details & Equipment (Click to Zoom)' : 'Chi Tiết Không Gian & Thiết Bị (Bấm để Zoom)'}
                </div>
                <div className="space-y-2.5">
                  {activeZone.floors?.map((f, idx) => (
                    <div
                      key={idx}
                      className="arch-card p-3 rounded-xl cursor-pointer"
                      onClick={() => {
                        if (activeZone.hasFloors) {
                          selectFloor(f.level);
                        } else if (f.camPos && f.targetPos) {
                          animateCameraTo(f.targetPos, f.camPos);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-extrabold text-[#E5D9B6]">
                          {isEn ? (f.nameEn || f.name) : f.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white font-semibold shrink-0">
                          {isEn ? 'Inspect' : 'Xem Tầng'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 leading-relaxed">
                        {isEn ? (f.detailEn || f.detail) : f.detail}
                      </div>

                      {f.equipZooms && f.equipZooms.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-white/10">
                          {f.equipZooms.map((ez, ezIdx) => (
                            <button
                              key={ezIdx}
                              type="button"
                              onClick={(ev) => {
                                ev.stopPropagation();
                                if (activeZone.hasFloors) {
                                  selectFloor(f.level);
                                }
                                if (ez.camPos && ez.targetPos) {
                                  animateCameraTo(ez.targetPos, ez.camPos);
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#E5D9B6]/15 hover:bg-[#E5D9B6] text-[#E5D9B6] hover:text-[#141622] text-[10px] font-bold transition cursor-pointer"
                            >
                              {isEn ? (ez.labelEn || ez.label) : ez.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-white/10 mt-3 flex items-center justify-between gap-2">
              <div className="text-[11px] text-slate-300">
                <span className="text-slate-400 block text-[10px]">
                  {isEn ? 'Total Footprint:' : 'Quy mô diện tích:'}
                </span>
                <strong className="text-[#E5D9B6]">
                  {isEn ? (activeZone.areaEn || activeZone.area) : activeZone.area}
                </strong>
              </div>
              <button
                type="button"
                onClick={() => setIsBookingModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-[#E5D9B6] hover:bg-[#f0e6c8] text-[#141622] font-extrabold text-xs flex items-center gap-1.5 shadow-lg transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                <span>{isEn ? 'Book Court Now' : 'Đặt Sân Ngay'}</span>
              </button>
            </div>
          </>
        )}
      </aside>

      {/* BOTTOM QUICK NAVIGATION DOCK */}
      <nav className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 arch-panel p-1.5 rounded-2xl flex items-center gap-1.5 max-w-[96vw] overflow-x-auto pointer-events-auto">
        <button
          type="button"
          onClick={resetMasterView}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            !activeZoneId ? 'bg-[#E5D9B6] text-[#141622]' : 'hover:bg-white/10 text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">public</span>
          <span>{isEn ? 'Overview (13,000m²)' : 'Toàn Cảnh (13.000m²)'}</span>
        </button>

        <button
          type="button"
          onClick={() => focusZone('khuA')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeZoneId === 'khuA' ? 'bg-[#E5D9B6] text-[#141622]' : 'hover:bg-white/10 text-white'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
          <span>{isEn ? 'Zone A: Swimming, Gym & Fitness' : 'Khu A: Bơi Lội, Gym & Fitness'}</span>
        </button>

        <button
          type="button"
          onClick={() => focusZone('khuB')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeZoneId === 'khuB' ? 'bg-[#E5D9B6] text-[#141622]' : 'hover:bg-white/10 text-white'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span>{isEn ? 'Zone B: Basketball, Badminton & TT' : 'Khu B: Bóng Rổ, Cầu Lông & Bóng Bàn'}</span>
        </button>

        <button
          type="button"
          onClick={() => focusZone('khuC')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeZoneId === 'khuC' ? 'bg-[#E5D9B6] text-[#141622]' : 'hover:bg-white/10 text-white'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
          <span>{isEn ? 'Zone C: Martial Arts, Boxing, Yoga' : 'Khu C: Võ Thuật, Boxing, Yoga & Pilates'}</span>
        </button>

        <button
          type="button"
          onClick={() => focusZone('outdoor')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeZoneId === 'outdoor' ? 'bg-[#E5D9B6] text-[#141622]' : 'hover:bg-white/10 text-white'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span>{isEn ? 'Outdoor: Soccer & Pickleball' : 'Khu Ngoài Trời: Bóng Đá & Pickleball'}</span>
        </button>

        <button
          type="button"
          onClick={() => focusZone('lobby')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeZoneId === 'lobby' ? 'bg-[#E5D9B6] text-[#141622]' : 'hover:bg-white/10 text-white'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
          <span>{isEn ? 'Reception, Café & Medical' : 'Lễ Tân, Căn-Tin & Y Tế'}</span>
        </button>

        <button
          type="button"
          onClick={() => focusZone('parking')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeZoneId === 'parking' ? 'bg-[#E5D9B6] text-[#141622]' : 'hover:bg-white/10 text-white'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          <span>{isEn ? 'Central Parking (20 Stalls)' : 'Bãi Đỗ Ô Tô Tập Trung (20 Chỗ)'}</span>
        </button>
      </nav>

      {/* MODAL 1: CAMPUS SPECIFICATIONS & AMENITIES */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#23273a] border border-white/15 rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-10 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsInfoModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5 space-y-5">
                <div>
                  <div className="text-xs font-bold tracking-[0.15em] uppercase text-[#E5D9B6] mb-2">
                    {isEn ? 'OPTIMIZED SPATIAL MASTERPLAN' : 'BỐ TRÍ KHÔNG GIAN THUẬN TIỆN'}
                  </div>
                  <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                    {isEn ? 'CAMPUS FACILITIES & ZONES' : 'SƠ ĐỒ CÁC KHU VỰC TẬP LUYỆN'}
                  </h2>
                  <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                    {isEn
                      ? '9 training clusters across 13,000 m² are systematically planned with clear pedestrian boulevards and signage. Dedicated reception lobby supports quick booking both on-site and online.'
                      : '9 cụm sân bãi và phòng tập trên diện tích 13.000 m² được quy hoạch gọn gàng, lối đi thông thoáng, biển báo chỉ dẫn rõ ràng. Hệ thống quầy lễ tân tiếp đón chu đáo và hỗ trợ đặt sân nhanh chóng trực tiếp hoặc online.'}
                  </p>
                </div>
                <div className="space-y-2.5 text-xs md:text-sm">
                  <div
                    onClick={() => { setIsInfoModalOpen(false); focusZone('khuA', 3); }}
                    className="arch-card rounded-xl p-3.5 flex items-center gap-3.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-emerald-400 text-[20px] shrink-0">key</span>
                    <span>{isEn ? 'Secure key-coded lockers for peace of mind' : 'Tủ cất đồ cá nhân có chìa khóa an toàn, thuận tiện sử dụng'}</span>
                  </div>
                  <div
                    onClick={() => { setIsInfoModalOpen(false); focusZone('khuA', 3); }}
                    className="arch-card rounded-xl p-3.5 flex items-center gap-3.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-emerald-400 text-[20px] shrink-0">shower</span>
                    <span>{isEn ? 'Luxury rain shower stalls and hot/cold dressing rooms' : 'Phòng thay đồ và khu vực tắm tráng nóng lạnh sạch sẽ'}</span>
                  </div>
                  <div
                    onClick={() => { setIsInfoModalOpen(false); focusZone('lobby'); }}
                    className="arch-card rounded-xl p-3.5 flex items-center gap-3.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-emerald-400 text-[20px] shrink-0">local_cafe</span>
                    <span>{isEn ? 'Hydration café bar serving rapid beverages' : 'Quầy căn-tin nước giải khát, nước khoáng phục vụ nhanh'}</span>
                  </div>
                  <div
                    onClick={() => { setIsInfoModalOpen(false); focusZone('lobby'); }}
                    className="arch-card rounded-xl p-3.5 flex items-center gap-3.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-emerald-400 text-[20px] shrink-0">medical_services</span>
                    <span>{isEn ? 'Emergency medical clinic & first-aid kits ready' : 'Tủ thuốc y tế và dụng cụ sơ cứu ban đầu luôn sẵn sàng'}</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => { setIsInfoModalOpen(false); focusZone('khuA'); }}
                  className="arch-card rounded-2xl p-5 cursor-pointer"
                >
                  <h3 className="text-sm font-extrabold text-white mb-3">🏊 KHU A: BƠI LỘI, GYM & FITNESS</h3>
                  <ul className="space-y-2 text-xs text-slate-200">
                    <li>• <strong>Tầng 1:</strong> Bể bơi 4 mùa 25m trong nhà nước ấm</li>
                    <li>• <strong>Tầng 2:</strong> Phòng tập Gym & Fitness</li>
                    <li>• <strong>Tầng 3:</strong> Khu thay đồ & tắm tráng nóng lạnh</li>
                  </ul>
                  <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-[#E5D9B6] font-bold">
                    {isEn ? 'Click to inspect Zone A →' : 'Bấm để bay tới Khu A →'}
                  </div>
                </div>

                <div
                  onClick={() => { setIsInfoModalOpen(false); focusZone('khuB'); }}
                  className="arch-card rounded-2xl p-5 cursor-pointer"
                >
                  <h3 className="text-sm font-extrabold text-white mb-3">🏀 KHU B: BÓNG RỔ, CẦU LÔNG & BÓNG BÀN</h3>
                  <ul className="space-y-2 text-xs text-slate-200">
                    <li>• <strong>Tầng 1:</strong> Sân bóng rổ tiêu chuẩn phong trào có mái che</li>
                    <li>• <strong>Tầng 2:</strong> Cụm 4 sân cầu lông thảm cao su chống trượt</li>
                    <li>• <strong>Tầng 3:</strong> Khu bóng bàn trong nhà với 4 bàn tập</li>
                  </ul>
                  <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-[#E5D9B6] font-bold">
                    {isEn ? 'Click to inspect Zone B →' : 'Bấm để bay tới Khu B →'}
                  </div>
                </div>

                <div
                  onClick={() => { setIsInfoModalOpen(false); focusZone('khuC'); }}
                  className="arch-card rounded-2xl p-5 cursor-pointer"
                >
                  <h3 className="text-sm font-extrabold text-white mb-3">🧘 KHU C: VÕ THUẬT, BOXING, YOGA & PILATES</h3>
                  <ul className="space-y-2 text-xs text-slate-200">
                    <li>• <strong>Tầng 1:</strong> Phòng tập võ thuật & Boxing, thảm và bao cát</li>
                    <li>• <strong>Tầng 2:</strong> Tủ đồ cá nhân và khu thay đồ phục vụ học viên</li>
                    <li>• <strong>Tầng 3:</strong> Phòng tập Yoga & Pilates, 8 máy Reformer</li>
                  </ul>
                  <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-[#E5D9B6] font-bold">
                    {isEn ? 'Click to inspect Zone C →' : 'Bấm để bay tới Khu C →'}
                  </div>
                </div>

                <div
                  onClick={() => { setIsInfoModalOpen(false); focusZone('outdoor'); }}
                  className="arch-card rounded-2xl p-5 cursor-pointer"
                >
                  <h3 className="text-sm font-extrabold text-white mb-3">🏟️ KHU NGOÀI TRỜI: BÓNG ĐÁ & PICKLEBALL</h3>
                  <ul className="space-y-2 text-xs text-slate-200">
                    <li>• Cụm sân bóng đá cỏ nhân tạo (sân 5 và sân 7)</li>
                    <li>• Cụm 4 sân Pickleball, có lưới riêng và vạch bếp</li>
                    <li>• Dàn 10 trụ đèn pha LED chiếu sáng ban đêm rõ nét</li>
                  </ul>
                  <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-[#E5D9B6] font-bold">
                    {isEn ? 'Click to inspect Outdoor Area →' : 'Bấm để bay tới Sân Ngoài Trời →'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ONLINE COURT BOOKING */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="arch-panel rounded-3xl max-w-md w-full p-6 relative border border-[#E5D9B6]/40">
            <button
              type="button"
              onClick={() => setIsBookingModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
            <div className="text-xs font-bold uppercase tracking-wider text-[#E5D9B6]">
              {isEn ? 'Online Court Booking System' : 'Hệ Thống Đặt Sân Online'}
            </div>
            <h3 className="text-lg font-extrabold text-white mt-0.5 mb-4">
              {isEn ? 'Court Reservation & Training Passes' : 'Đặt Sân & Đăng Ký Tập Luyện'}
            </h3>
            <form onSubmit={handleBookingSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isEn ? 'Selected Zone' : 'Khu vực đã chọn'}
                </label>
                <input
                  type="text"
                  readOnly
                  value={activeZone ? (isEn ? (activeZone.shortTitleEn || activeZone.shortTitle) : activeZone.shortTitle) : (isEn ? 'Olympic Sports Area 13,000m²' : 'Toàn Khu Thể Thao 13.000m²')}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-[#E5D9B6] font-bold outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isEn ? 'Date' : 'Ngày tập'}
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
                    <option>06:00 - 08:00 (Sáng)</option>
                    <option>16:00 - 18:00 (Chiều)</option>
                    <option>18:00 - 20:00 (Tối - Đèn LED)</option>
                    <option>20:00 - 22:00 (Tối - Đèn LED)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isEn ? 'Full Name & Phone Number' : 'Họ tên & Số điện thoại'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isEn ? 'Enter phone number for confirmation...' : 'Nhập SĐT để lễ tân xác nhận...'}
                  value={bookingPhone}
                  onChange={(e) => setBookingPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white outline-none"
                />
              </div>

              {bookingSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-center">
                  {isEn ? '✅ Booking received! Reception will confirm your slot shortly.' : '✅ Đặt lịch thành công! Lễ tân đã ghi nhận mã đặt sân của bạn.'}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#E5D9B6] hover:bg-[#f2e8c9] text-[#141622] font-extrabold uppercase tracking-wider transition cursor-pointer"
              >
                {isEn ? 'Confirm Reservation' : 'Xác Nhận Đặt Sân'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrainingZones3D;

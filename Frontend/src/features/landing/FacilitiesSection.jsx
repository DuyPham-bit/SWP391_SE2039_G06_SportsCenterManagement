const { useState, useMemo, useEffect } = React;

export const SCMS_FACILITIES = [
  {
    id: 'room-01',
    name: 'Bể Bơi 4 Mùa Nước Ấm 25m',
    category: 'aquatics',
    categoryName: 'Bơi lội',
    location: 'Khu A • Tầng 1',
    zone: 'Khu A',
    capacity: '25 - 35 người/ca',
    openHours: '06:00 - 21:00 hàng ngày',
    priceRate: 'Từ 50.000đ/lượt • 250.000đ/làn/giờ',
    badge: 'Nước Ấm 4 Mùa',
    badgeColor: 'bg-cyan-600',
    image: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?q=80&w=1200&auto=format&fit=crop',
    secondaryImage: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=800&auto=format&fit=crop',
    highlights: 'Bể bơi 25m tiêu chuẩn tập luyện • Nước ấm quanh năm • Cứu hộ túc trực liên tục',
    description: 'Bể bơi trong nhà kích thước 25m x 12.5m với 5 làn bơi riêng biệt, độ sâu an toàn từ 1.2m đến 1.8m. Hệ thống lọc nước tuần hoàn khử khuẩn sạch sẽ mỗi ngày, nước ấm ổn định phù hợp cho việc học bơi và rèn luyện thể lực quanh năm cho cả người lớn lẫn trẻ em.',
    specs: [
      { label: 'Quy cách hồ', value: '25m x 12.5m (5 làn bơi)' },
      { label: 'Độ sâu an toàn', value: '1.2m - 1.8m tiện tập luyện' },
      { label: 'Hệ thống nước', value: 'Lọc tuần hoàn & Gia nhiệt 4 mùa' },
      { label: 'Khung giờ mở', value: '06:00 - 21:00 hàng ngày' }
    ],
    amenities: ['Phòng thay đồ & tắm tráng nóng lạnh', 'Tủ để đồ cá nhân có chìa khóa', 'Phao bơi & áo phao mượn miễn phí', 'Nhân viên cứu hộ quan sát thường trực'],
    tags: ['Bơi lội phong trào', 'Lớp học bơi cơ bản', 'Rèn luyện sức khỏe']
  },
  {
    id: 'room-02',
    name: 'Sân Bóng Đá Cỏ Nhân Tạo (Sân 5 & Sân 7)',
    category: 'team-sports',
    categoryName: 'Sân bóng & Vợt',
    location: 'Khu Ngoài trời',
    zone: 'Ngoài trời',
    capacity: '10 - 20 cầu thủ/sân',
    openHours: '06:00 - 22:30 hàng ngày',
    priceRate: 'Từ 180.000đ - 350.000đ/giờ',
    badge: 'Cỏ Nhân Tạo Tiêu Chuẩn',
    badgeColor: 'bg-emerald-600',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200&auto=format&fit=crop',
    secondaryImage: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=800&auto=format&fit=crop',
    highlights: 'Mặt cỏ nhân tạo êm chân • Dàn đèn LED chiếu sáng ban đêm • Lưới bao sân an toàn',
    description: 'Cụm sân bóng đá cỏ nhân tạo ngoài trời gồm các sân 5 người và có thể ghép thành sân 7 người. Mặt cỏ dày, rải hạt cao su đàn hồi giảm chấn động cho khớp gối và cổ chân. Hệ thống thoát nước nhanh chóng giúp sân luôn khô ráo sau mưa.',
    specs: [
      { label: 'Quy cách sân', value: '2 sân 5 hoặc ghép thành 1 sân 7' },
      { label: 'Mặt cỏ', value: 'Cỏ nhân tạo chuyên dụng rải hạt cao su' },
      { label: 'Chiếu sáng', value: 'Dàn đèn LED cao áp rõ nét ban đêm' },
      { label: 'Bao quanh', value: 'Lưới chắn bóng cao 6m chắc chắn' }
    ],
    amenities: ['Ghế ngồi chờ có mái che bên sân', 'Phòng thay đồ & vệ sinh sạch sẽ', 'Cho mượn áo bib phân đội & bóng tập', 'Quầy nước giải khát tiện lợi'],
    tags: ['Bóng đá phong trào', 'Giao lưu đội nhóm', 'Thi đấu giao hữu']
  },
  {
    id: 'room-03',
    name: 'Cụm Sân Cầu Lông Thảm Chống Trượt',
    category: 'team-sports',
    categoryName: 'Sân bóng & Vợt',
    location: 'Khu B • Tầng 2',
    zone: 'Khu B',
    capacity: '16 - 24 người chơi',
    openHours: '06:00 - 22:00 hàng ngày',
    priceRate: 'Từ 60.000đ - 100.000đ/giờ/sân',
    badge: 'Thảm Chuyên Dụng',
    badgeColor: 'bg-blue-600',
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1200&auto=format&fit=crop',
    secondaryImage: 'https://images.unsplash.com/photo-1613918108466-292b78a8ef95?q=80&w=800&auto=format&fit=crop',
    highlights: 'Thảm cao su chống trơn trượt • Đèn LED góc xiên không lóa mắt • Không gian thoáng mát',
    description: 'Khu vực gồm 4 sân cầu lông tiêu chuẩn trong nhà, mặt sàn trải thảm cao su chuyên dụng bám giày và giảm chấn êm ái. Hệ thống đèn chiếu sáng bố trí góc chếch hạn chế chói mắt khi ngửa đầu đón cầu, thông gió tự nhiên không tạo gió xoáy làm bạt cầu.',
    specs: [
      { label: 'Quy mô cụm sân', value: '4 sân cầu lông trong nhà' },
      { label: 'Mặt sàn', value: 'Thảm cao su PVC vân chống trượt' },
      { label: 'Độ cao trần', value: '8m thoáng mát, không gió tạt' },
      { label: 'Ánh sáng', value: 'Đèn LED chống chói mắt người chơi' }
    ],
    amenities: ['Ghế nghỉ có quạt gió mát mẻ', 'Dịch vụ căng cước và bán cầu tại quầy', 'Tủ cất balo và giày thể thao', 'Bình nước lọc phục vụ miễn phí'],
    tags: ['Cầu lông phong trào', 'Giao lưu câu lạc bộ', 'Rèn luyện phản xạ']
  },
  {
    id: 'room-04',
    name: 'Khu Bóng Bàn Trong Nhà',
    category: 'team-sports',
    categoryName: 'Sân bóng & Vợt',
    location: 'Khu B • Tầng 3',
    zone: 'Khu B',
    capacity: '8 - 16 người chơi',
    openHours: '06:00 - 22:00 hàng ngày',
    priceRate: 'Từ 40.000đ - 70.000đ/giờ/bàn',
    badge: 'Bàn Tập Chuyên Dụng',
    badgeColor: 'bg-purple-600',
    image: 'https://images.unsplash.com/photo-1708268411988-d30e0e1eef0c?q=80&w=1200&auto=format&fit=crop',
    secondaryImage: 'https://images.unsplash.com/photo-1621726543096-a8be76db3708?q=80&w=800&auto=format&fit=crop',
    highlights: '4 bàn bóng bàn chuyên dụng • Lưới và vợt tập đầy đủ • Đèn chiếu sáng đều, hạn chế chói',
    description: 'Khu bóng bàn trong nhà gồm 4 bàn tập, bố trí khoảng trống quanh bàn để di chuyển và luyện kỹ thuật an toàn. Mặt sàn chống trượt, ánh sáng đều và thông gió nhẹ phù hợp cho các lớp bóng bàn cơ bản, luyện đánh đơn, đánh đôi và giao lưu câu lạc bộ.',
    specs: [
      { label: 'Quy mô', value: '4 bàn bóng bàn trong nhà' },
      { label: 'Kích thước bàn', value: '2.74m x 1.525m, cao 0.76m' },
      { label: 'Mặt sàn', value: 'Sàn thể thao chống trượt, có khoảng trống di chuyển' },
      { label: 'Thiết bị tập', value: 'Lưới, vợt, bóng tập và bảng điểm' }
    ],
    amenities: ['Cho mượn vợt và bóng tập cơ bản', 'Ghế nghỉ giữa các lượt chơi', 'Tủ cất đồ cá nhân', 'Bình nước lọc phục vụ miễn phí'],
    tags: ['Bóng bàn cơ bản', 'Đánh đơn & Đánh đôi', 'Giao lưu câu lạc bộ']
  },
  {
    id: 'room-05',
    name: 'Sân Bóng Rổ Tiêu Chuẩn Phong Trào',
    category: 'team-sports',
    categoryName: 'Sân bóng & Vợt',
    location: 'Khu B • Tầng 1',
    zone: 'Khu B',
    capacity: '15 - 20 người chơi',
    openHours: '06:00 - 22:00 hàng ngày',
    priceRate: 'Từ 80.000đ/nửa sân • 180.000đ/trọn sân/giờ',
    badge: 'Sân Tiêu Chuẩn',
    badgeColor: 'bg-amber-600',
    image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=1200&auto=format&fit=crop',
    secondaryImage: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800&auto=format&fit=crop',
    highlights: 'Mặt sân sơn thể thao chống trơn • Trụ rổ kiên cố bảng kính cường lực • Mái che râm mát',
    description: 'Sân bóng rổ trong nhà có mái che, mặt sân sơn phủ thể thao chống trơn trượt và vạch kẻ chuẩn xác. Trụ rổ chắc chắn, bảng rổ kính cường lực có độ nảy bóng tốt, tạo không gian năng động cho các bạn học sinh, sinh viên và hội nhóm giao lưu cuối tuần.',
    specs: [
      { label: 'Quy cách', value: '1 sân thi đấu chính hoặc 2 nửa sân tập' },
      { label: 'Mặt sân', value: 'Sơn phủ thể thao Acrylic chống mài mòn' },
      { label: 'Bảng rổ', value: 'Kính cường lực kèm vành lò xo bền bỉ' },
      { label: 'Chỗ ngồi', value: 'Băng ghế nghỉ bên sân thoáng mát' }
    ],
    amenities: ['Bảng lật điểm số tay', 'Cho mượn bóng tập luyện cơ bản', 'Quạt công nghiệp làm mát', 'Khu vệ sinh và rửa tay gần sân'],
    tags: ['Bóng rổ học sinh sinh viên', 'Giao lưu cuối tuần', 'Rèn luyện sức bật']
  },
  {
    id: 'room-06',
    name: 'Cụm Sân Pickleball Ngoài Trời',
    category: 'team-sports',
    categoryName: 'Sân bóng & Vợt',
    location: 'Khu Ngoài trời',
    zone: 'Ngoài trời',
    capacity: '8 - 16 người chơi',
    openHours: '05:30 - 22:00 hàng ngày',
    priceRate: 'Từ 50.000đ - 90.000đ/giờ/sân',
    badge: 'Sân Sơn Đạt Chuẩn',
    badgeColor: 'bg-teal-600',
    image: 'https://images.unsplash.com/photo-1693142517898-2f986215e412?q=80&w=1200&auto=format&fit=crop',
    secondaryImage: 'https://images.unsplash.com/photo-1753901821774-22a88913130f?q=80&w=800&auto=format&fit=crop',
    highlights: 'Mặt sân cứng phẳng đẹp • Lưới căng đúng kích thước • Đèn chiếu sáng phục vụ chơi tối',
    description: 'Cụm 4 sân Pickleball ngoài trời dành cho các lớp nhập môn, luyện đánh đơn, đánh đôi và giao lưu phong trào. Mặt sân phủ sơn thể thao chống trượt, có vạch khu vực bếp rõ ràng và lưới riêng cho từng sân. Hệ thống đèn LED và rào chắn bóng hỗ trợ tập luyện thuận tiện vào buổi tối.',
    specs: [
      { label: 'Quy mô', value: '4 sân Pickleball, mỗi sân 6.1m x 13.41m' },
      { label: 'Mặt sàn', value: 'Sơn Acrylic chống trượt, vạch khu vực bếp rõ ràng' },
      { label: 'Hệ thống đèn', value: 'Đèn pha LED chiếu sáng ban đêm' },
      { label: 'Rào chắn', value: 'Lưới thép bọc nhựa bảo vệ quanh sân' }
    ],
    amenities: ['Ghế ngồi nghỉ có ô che nắng', 'Dịch vụ cho thuê vợt và bóng tập', 'Bình nước uống mát phục vụ người chơi', 'Bãi đỗ xe rộng rãi ngay cạnh sân'],
    tags: ['Pickleball cơ bản', 'Đánh đơn & Đánh đôi', 'Rèn luyện phản xạ']
  },
  {
    id: 'room-07',
    name: 'Phòng Tập Võ Thuật & Boxing',
    category: 'combat-studio',
    categoryName: 'Võ thuật & Boxing',
    location: 'Khu C • Tầng 1',
    zone: 'Khu C',
    capacity: '15 - 25 võ sinh/ca',
    openHours: '06:00 - 21:30 hàng ngày',
    priceRate: 'Theo khóa học từ 300.000đ/tháng hoặc thuê sàn từ 150.000đ/giờ',
    badge: 'Sàn Thảm An Toàn',
    badgeColor: 'bg-red-700',
    image: 'https://images.unsplash.com/photo-1517438322307-e67111335449?q=80&w=1200&auto=format&fit=crop',
    secondaryImage: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?q=80&w=800&auto=format&fit=crop',
    highlights: 'Thảm xốp ghép êm ái • Dàn bao cát tập đấm đá • Dụng cụ bảo hộ tập luyện cơ bản',
    description: 'Phòng tập võ thuật sạch sẽ, thoáng mát dành cho các câu lạc bộ Taekwondo, Karate, Vovinam, Boxing và các lớp kỹ năng tự vệ. Mặt sàn trải thảm xốp ghép thể thao êm ái, giảm chấn va đập, trang bị bao đấm và đích đá cơ bản giúp võ sinh an tâm rèn luyện.',
    specs: [
      { label: 'Diện tích', value: '90m² mặt sàn thông thoáng' },
      { label: 'Thảm sàn', value: 'Thảm xốp ghép mút EVA dày 3cm chống trơn' },
      { label: 'Dàn bao cát', value: '4 - 6 bao đấm treo kiên cố' },
      { label: 'Dụng cụ tập', value: 'Đích đấm, đích đá, găng tay cơ bản' }
    ],
    amenities: ['Tủ cất đồ võ phục và dụng cụ cá nhân', 'Gương dán tường hỗ trợ chỉnh đòn thế', 'Quạt gió công nghiệp thoáng đãng', 'Tủ thuốc y tế và băng gạc sơ cứu cơ bản'],
    tags: ['Taekwondo & Karate', 'Boxing căn bản', 'Tự vệ & Rèn luyện tính kỷ luật']
  },
  {
    id: 'room-08',
    name: 'Phòng Tập Gym & Fitness',
    category: 'fitness',
    categoryName: 'Gym, Yoga & Pilates',
    location: 'Khu A • Tầng 2',
    zone: 'Khu A',
    capacity: '30 - 45 hội viên cùng lúc',
    openHours: '05:30 - 21:30 hàng ngày',
    priceRate: 'Vé ngày 30.000đ • Vé tháng từ 250.000đ - 350.000đ/tháng',
    badge: 'Máy Tập Đầy Đủ',
    badgeColor: 'bg-orange-600',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop',
    secondaryImage: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=800&auto=format&fit=crop',
    highlights: 'Đầy đủ máy Cardio & máy khối kháng lực • Dàn tạ đơn đa dạng cân nặng • Không gian sạch sẽ',
    description: 'Phòng tập thể hình trang bị đầy đủ máy chạy bộ, xe đạp tập, máy ép ngực, kéo xô và các dàn tạ tay từ nhẹ đến nặng. Không gian tập luyện hòa đồng, thân thiện, có nhân viên túc trực hỗ trợ hướng dẫn cơ bản cho người mới bắt đầu.',
    specs: [
      { label: 'Diện tích', value: 'Khoảng 250m² chia khu hợp lý' },
      { label: 'Máy Cardio', value: 'Máy chạy bộ điện & xe đạp tập thể lực' },
      { label: 'Khu tạ tự do', value: 'Tạ tay cao su từ 2kg đến 35kg, đòn tạ dài' },
      { label: 'Giàn máy khối', value: 'Máy ép ngực, kéo xô, đạp đùi đa năng' }
    ],
    amenities: ['Tủ gửi đồ có khóa an toàn', 'Cân sức khỏe và thước đo chiều cao', 'Phòng tắm và thay đồ riêng biệt', 'Quạt gió và điều hòa thông thoáng'],
    tags: ['Tập Gym tăng cơ giảm mỡ', 'Cardio rèn luyện tim mạch', 'Rèn luyện sức bền hàng ngày']
  },
  {
    id: 'room-09',
    name: 'Phòng Tập Yoga & Pilates',
    category: 'fitness',
    categoryName: 'Gym, Yoga & Pilates',
    location: 'Khu C • Tầng 3',
    zone: 'Khu C',
    capacity: '15 - 20 học viên/lớp',
    openHours: '06:00 - 21:00 hàng ngày',
    priceRate: 'Từ 50.000đ/buổi • Gói tháng từ 350.000đ/tháng',
    badge: 'Thư Giãn & Tĩnh Tâm',
    badgeColor: 'bg-emerald-700',
    image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?q=80&w=1200&auto=format&fit=crop',
    secondaryImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800&auto=format&fit=crop',
    highlights: 'Không gian yên tĩnh • Khu thảm Yoga & Pilates Mat • Máy Reformer tập theo nhóm nhỏ',
    description: 'Phòng tập Yoga & Pilates có khu thảm cho các bài tập thở, kéo giãn, thăng bằng và Pilates Mat, cùng khu máy Reformer dành cho nhóm nhỏ theo lịch hướng dẫn. Trang bị thảm tập, gạch Yoga, dây đai, vòng Pilates và bóng tập hỗ trợ học viên rèn luyện sự dẻo dai, sức mạnh cơ trung tâm và kiểm soát tư thế.',
    specs: [
      { label: 'Không gian', value: 'Yên tĩnh, thoáng mát, sàn lót gỗ sạch sẽ' },
      { label: 'Khu thảm', value: 'Thảm Yoga TPE và thảm Pilates Mat bám sàn tốt' },
      { label: 'Khu Pilates Reformer', value: '4 máy Reformer cho lớp nhóm nhỏ theo lịch' },
      { label: 'Dụng cụ hỗ trợ', value: 'Gạch Yoga, dây đai, vòng Pilates và bóng tập' }
    ],
    amenities: ['Bình nước uống lọc miễn phí', 'Giá cất thảm và tủ để đồ cá nhân', 'Phòng thay đồ lịch sự', 'Có mở các lớp cơ bản cho người mới'],
    tags: ['Yoga cơ bản', 'Pilates Mat & Reformer', 'Kéo giãn & Cân bằng tư thế']
  }
];

export function FacilitiesSection({ externalFacility = null, onModalClose = null } = {}) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState('booking'); // 'booking' | 'specs' | 'photos'
  const [bookingType, setBookingType] = useState('rent'); // 'rent' (thuê sân) | 'tour' (tham quan trải nghiệm)
  
  // Booking Form State
  const [formState, setFormState] = useState({
    fullName: '',
    phone: '',
    email: '',
    organization: '',
    expectedDate: '',
    timeSlot: 'Sáng (08:00 - 11:30)',
    rentalPurpose: 'Tập luyện thể thao thường xuyên',
    extraServices: ['Nước uống đóng chai'],
    notes: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [showFacilityPicker, setShowFacilityPicker] = useState(false);

  const categories = [
    { id: 'all', label: `Tất cả (${SCMS_FACILITIES.length} cụm sân)`, icon: 'grid_view' },
    { id: 'team-sports', label: 'Sân bóng & Vợt', icon: 'sports_soccer' },
    { id: 'aquatics', label: 'Bơi lội', icon: 'pool' },
    { id: 'fitness', label: 'Gym, Yoga & Pilates', icon: 'fitness_center' },
    { id: 'combat-studio', label: 'Võ thuật & Boxing', icon: 'sports_mma' }
  ];

  const filteredFacilities = useMemo(() => {
    return SCMS_FACILITIES.filter(fac => {
      const matchCat = activeCategory === 'all' || fac.category === activeCategory;
      const matchSearch = !searchQuery.trim() || 
        fac.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fac.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fac.highlights.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fac.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  const handleOpenModal = (facility, initialTab = 'rent') => {
    setSelectedFacility(facility);
    setBookingType('rent');
    const targetTab = (initialTab === 'rent' || initialTab === 'booking') ? 'booking' : 'specs';
    setActiveModalTab(targetTab);
    setSubmitted(false);
    setShowFacilityPicker(false);
  };

  const handleCloseModal = () => {
    setSelectedFacility(null);
    setSubmitted(false);
    setShowFacilityPicker(false);
    if (onModalClose) onModalClose();
  };

  const handleChangeFacility = (facilityId) => {
    const facility = SCMS_FACILITIES.find(f => f.id === facilityId);
    if (!facility) return;
    setSelectedFacility(facility);
    setShowFacilityPicker(false);
  };

  // Sync when parent component (LandingPage) requests to open a specific facility -> open specs
  useEffect(() => {
    if (externalFacility) {
      handleOpenModal(externalFacility, 'specs');
    }
  }, [externalFacility]);

  // Support global event dispatching as well
  useEffect(() => {
    const handleCustomOpen = (e) => {
      const { facility, facilityId, type } = e.detail || {};
      const target = facility || SCMS_FACILITIES.find(f => f.id === facilityId);
      if (target) {
        handleOpenModal(target, type || 'specs');
      }
    };
    window.addEventListener('SCMS_OPEN_FACILITY', handleCustomOpen);
    return () => window.removeEventListener('SCMS_OPEN_FACILITY', handleCustomOpen);
  }, []);

  const handleToggleExtraService = (service) => {
    setFormState(prev => {
      const exists = prev.extraServices.includes(service);
      return {
        ...prev,
        extraServices: exists 
          ? prev.extraServices.filter(s => s !== service)
          : [...prev.extraServices, service]
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formState.fullName.trim() || !formState.phone.trim()) {
      alert('Vui lòng điền đầy đủ họ tên và số điện thoại liên hệ!');
      return;
    }
    setSubmitted(true);
  };

  return (
    <section id="co-so-vat-chat" className="w-full bg-slate-50 text-slate-900 font-inter min-h-screen py-24 px-6 sm:px-10 md:px-14 lg:px-20 relative overflow-hidden flex flex-col justify-center">
      
      {/* Decorative ambient elements */}
      <div className="pointer-events-none absolute -top-40 -right-40 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 -left-40 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />

      <div className="w-full max-w-[1720px] mx-auto relative z-10">
        
        {/* SECTION HEADER: BẢN SẮC THỂ THAO SCMS TIÊU CHUẨN */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-100 text-red-700 text-xs font-chivo font-black uppercase tracking-widest mb-4">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            HẠ TẦNG THỂ THAO TIÊU CHUẨN
          </div>
          <h2 className="font-chivo text-3xl sm:text-4xl lg:text-5xl font-black uppercase text-slate-900 tracking-tight leading-tight">
            HỆ THỐNG CƠ SỞ VẬT CHẤT <span className="text-red-600">TIỆN NGHI &amp; CHẤT LƯỢNG</span>
          </h2>
          <p className="font-inter text-slate-600 text-sm sm:text-base mt-4 leading-relaxed">
            Khu liên hợp thể thao rộng rãi, sạch đẹp với {SCMS_FACILITIES.length} cụm sân bãi và phòng tập dành cho bơi lội, Gym &amp; Fitness, Yoga &amp; Pilates, Võ thuật &amp; Boxing, bóng đá, cầu lông, bóng rổ, bóng bàn và Pickleball. Phục vụ nhu cầu học tập, rèn luyện sức khỏe, sinh hoạt câu lạc bộ và thi đấu phong trào.
          </p>
        </div>

        {/* 4 CORE HIGHLIGHT METRICS (CON SỐ THỰC TẾ CẤP TRUNG) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[28px]">domain</span>
            </div>
            <div>
              <div className="font-chivo text-2xl sm:text-3xl font-black text-slate-900">3.500m²</div>
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Tổng diện tích mặt sàn</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[28px]">verified</span>
            </div>
            <div>
              <div className="font-chivo text-2xl sm:text-3xl font-black text-slate-900">{SCMS_FACILITIES.length} Khu Vực</div>
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Đa dạng môn tập luyện</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[28px]">groups</span>
            </div>
            <div>
              <div className="font-chivo text-2xl sm:text-3xl font-black text-slate-900">600+</div>
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Lượt tập luyện/ngày</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[28px]">cleaning_services</span>
            </div>
            <div>
              <div className="font-chivo text-2xl sm:text-3xl font-black text-slate-900">100%</div>
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Vệ sinh &amp; Bảo trì định kỳ</div>
            </div>
          </div>
        </div>

        {/* SEARCH & CATEGORY FILTER BAR */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm mb-10 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-xl font-chivo text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                  activeCategory === cat.id
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                    : 'bg-slate-100 text-slate-700 hover:text-red-600 hover:bg-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Quick Search Field */}
          <div className="relative w-full md:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Tìm theo tên sân, môn tập..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>
        </div>

        {/* RESULTS COUNT & STATUS */}
        <div className="flex items-center justify-between mb-6 text-xs text-slate-500 font-semibold px-1">
          <div>
            Hiển thị <strong>{filteredFacilities.length}</strong> / {SCMS_FACILITIES.length} cụm sân và phòng chức năng
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span className="text-emerald-700">Tất cả cụm sân đều sẵn sàng phục vụ</span>
          </div>
        </div>

        {/* FACILITIES ATHLETIC CARDS GRID */}
        {filteredFacilities.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
            <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">search_off</span>
            <h3 className="font-chivo text-lg font-bold text-slate-700">Không tìm thấy cụm sân phù hợp</h3>
            <p className="text-xs text-slate-500 mt-1">Hãy thử tìm với từ khóa khác như "bơi lội", "bóng đá", "cầu lông", hoặc chọn mục Tất cả.</p>
            <button
              onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
              className="mt-4 px-4 py-2 bg-red-600 text-white text-xs font-bold uppercase rounded-lg font-chivo"
            >
              Xem tất cả
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {filteredFacilities.map(fac => (
              <div
                key={fac.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group"
              >
                {/* Visual Header with Photography */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-950">
                  <img
                    src={fac.image}
                    alt={fac.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                  
                  {/* Certification Badge */}
                  <span className={`absolute left-3.5 top-3.5 px-3 py-1 rounded-full text-white text-[11px] font-chivo font-black tracking-wider uppercase shadow-md ${fac.badgeColor}`}>
                    {fac.badge}
                  </span>

                  {/* Zone Tag */}
                  <span className="absolute right-3.5 top-3.5 px-2.5 py-1 rounded-full bg-slate-950/75 backdrop-blur-md text-slate-200 text-[11px] font-semibold flex items-center gap-1 border border-white/10">
                    <span className="material-symbols-outlined text-[14px] text-red-500">pin_drop</span>
                    <span>{fac.location}</span>
                  </span>

                  {/* Live Status Chip & Capacity */}
                  <div className="absolute left-3.5 bottom-3 right-3.5 flex items-center justify-between text-white text-xs">
                    <div className="flex items-center gap-1.5 font-medium drop-shadow">
                      <span className="material-symbols-outlined text-[16px] text-red-400">group</span>
                      <span>Sức chứa: <strong>{fac.capacity}</strong></span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-semibold backdrop-blur-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Mở cửa
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Facility Name & Price Rate */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-chivo text-lg font-black text-slate-900 group-hover:text-red-600 transition-colors leading-snug">
                        {fac.name}
                      </h3>
                    </div>

                    <div className="text-xs text-red-600 font-bold mt-1.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">payments</span>
                      <span>{fac.priceRate}</span>
                    </div>

                    {/* Highlights pill */}
                    <div className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 mt-3 leading-relaxed">
                      <strong className="text-red-600 font-semibold block mb-0.5">Đặc điểm nổi bật:</strong>
                      {fac.highlights}
                    </div>

                    <p className="text-xs text-slate-600 mt-3 line-clamp-3 leading-relaxed">
                      {fac.description}
                    </p>

                    {/* Key Technical Specs Chips */}
                    <div className="grid grid-cols-2 gap-1.5 mt-4 pt-3 border-t border-slate-100">
                      {fac.specs.slice(0, 2).map((s, idx) => (
                        <div key={idx} className="bg-slate-50/80 rounded px-2 py-1 text-[11px]">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">{s.label}</span>
                          <span className="text-slate-800 font-semibold truncate block">{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenModal(fac, 'rent')}
                      className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-bold uppercase rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                      <span>Đặt Thuê Sân</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenModal(fac, 'specs')}
                      className="px-3.5 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-chivo text-xs font-bold uppercase transition-colors flex items-center gap-1"
                      title="Xem thông số kỹ thuật &amp; Tiện ích sân"
                    >
                      <span className="material-symbols-outlined text-[17px]">info</span>
                      <span>Chi tiết</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CAMPUS ARCHITECTURE & ZONE DIRECTORY (SƠ ĐỒ PHÂN BỐ KHU VỰC) */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-2xl relative overflow-hidden mb-16">
          <div className="pointer-events-none absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-red-600/10 blur-3xl" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5">
              <span className="text-red-500 font-chivo text-xs font-black uppercase tracking-widest block mb-2">
                BỐ TRÍ KHÔNG GIAN THUẬN TIỆN
              </span>
              <h3 className="font-chivo text-2xl sm:text-3xl font-black uppercase text-white leading-tight">
                SƠ ĐỒ CÁC KHU VỰC TẬP LUYỆN
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm mt-3 leading-relaxed">
                {SCMS_FACILITIES.length} cụm sân bãi và phòng tập được quy hoạch gọn gàng, lối đi thông thoáng, biển báo chỉ dẫn rõ ràng. Hệ thống quầy lễ tân tiếp đón chu đáo và hỗ trợ đặt sân nhanh chóng trực tiếp hoặc online.
              </p>

              {/* 4 Added Service Amenities */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <span className="material-symbols-outlined text-red-500 text-[20px]">badge</span>
                  <span>Tủ cất đồ cá nhân có chìa khóa an toàn, thuận tiện sử dụng</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <span className="material-symbols-outlined text-red-500 text-[20px]">shower</span>
                  <span>Phòng thay đồ và khu vực tắm tráng nóng lạnh sạch sẽ</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <span className="material-symbols-outlined text-red-500 text-[20px]">local_cafe</span>
                  <span>Quầy căn-tin nước giải khát, nước khoáng phục vụ nhanh</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <span className="material-symbols-outlined text-red-500 text-[20px]">medical_services</span>
                  <span>Tủ thuốc y tế và dụng cụ sơ cứu ban đầu luôn sẵn sàng</span>
                </div>
              </div>
            </div>

            {/* 4 Zones Map Columns */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/50 transition-colors">
                <div className="flex items-center gap-2 text-red-400 font-chivo text-xs font-bold uppercase mb-1.5">
                  <span className="material-symbols-outlined text-[18px]">pool</span>
                  <span>Khu A: Bơi Lội, Gym &amp; Fitness</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-1">
                  <li>• <strong>Tầng 1:</strong> Bể bơi 4 mùa 25m trong nhà nước ấm</li>
                  <li>• <strong>Tầng 2:</strong> Phòng tập Gym &amp; Fitness</li>
                  <li>• <strong>Tầng 3:</strong> Khu thay đồ &amp; tắm tráng nóng lạnh</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/50 transition-colors">
                <div className="flex items-center gap-2 text-blue-400 font-chivo text-xs font-bold uppercase mb-1.5">
                  <span className="material-symbols-outlined text-[18px]">sports_basketball</span>
                  <span>Khu B: Bóng Rổ, Cầu Lông &amp; Bóng Bàn</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-1">
                  <li>• <strong>Tầng 1:</strong> Sân bóng rổ tiêu chuẩn phong trào có mái che</li>
                  <li>• <strong>Tầng 2:</strong> Cụm 4 sân cầu lông thảm cao su chống trượt</li>
                  <li>• <strong>Tầng 3:</strong> Khu bóng bàn trong nhà với 4 bàn tập</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/50 transition-colors">
                <div className="flex items-center gap-2 text-purple-400 font-chivo text-xs font-bold uppercase mb-1.5">
                  <span className="material-symbols-outlined text-[18px]">self_improvement</span>
                  <span>Khu C: Võ Thuật, Boxing, Yoga &amp; Pilates</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-1">
                  <li>• <strong>Tầng 1:</strong> Phòng tập võ thuật &amp; Boxing, thảm và bao cát</li>
                  <li>• <strong>Tầng 3:</strong> Phòng tập Yoga &amp; Pilates, khu thảm và máy Reformer</li>
                  <li>• Tủ đồ cá nhân và khu thay đồ phục vụ học viên</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/50 transition-colors">
                <div className="flex items-center gap-2 text-emerald-400 font-chivo text-xs font-bold uppercase mb-1.5">
                  <span className="material-symbols-outlined text-[18px]">stadium</span>
                  <span>Khu Ngoài Trời: Bóng Đá &amp; Pickleball</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-1">
                  <li>• Cụm sân bóng đá cỏ nhân tạo (sân 5 và sân 7)</li>
                  <li>• Cụm 4 sân Pickleball, có lưới riêng và vạch khu vực bếp</li>
                  <li>• Dàn đèn pha LED chiếu sáng ban đêm rõ nét</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* CALL TO ACTION: RENTAL & EVENT BANNER */}
        <div className="bg-gradient-to-r from-red-600 via-red-600 to-red-700 text-white rounded-3xl p-8 sm:p-12 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl">
            <span className="inline-block px-3 py-1 rounded bg-black/20 text-white font-chivo text-[11px] font-black uppercase tracking-wider mb-2">
              DÀNH CHO ĐỘI NHÓM &amp; TỔ CHỨC SỰ KIỆN
            </span>
            <h3 className="font-chivo text-2xl sm:text-3xl font-black uppercase text-white">
              Liên Hệ Đặt Thuê Sân Tập &amp; Tổ Chức Giải Đấu
            </h3>
            <p className="text-white/90 text-xs sm:text-sm mt-2 leading-relaxed">
              Bạn đang tìm sân tập thường xuyên cho đội nhóm hoặc cần thuê sân tổ chức giao lưu, giải đấu phong trào? Hãy liên hệ ngay với chúng tôi để chọn khung giờ đẹp và nhận mức giá ưu đãi nhất.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleOpenModal(SCMS_FACILITIES[0], 'rent')}
              className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-slate-100 text-red-600 font-chivo text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[19px]">calendar_today</span>
              <span>Đặt Thuê Cụm Sân Ngay</span>
            </button>
            <a
              href="#/login"
              className="w-full sm:w-auto px-6 py-3.5 bg-red-900/40 hover:bg-red-900 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-xl border border-white/20 transition-colors flex items-center justify-center gap-2"
            >
              <span>Xem Bảng Giá Gói Tập</span>
              <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
            </a>
          </div>
        </div>

      </div>

      {/* DETAIL & BOOKING MODAL */}
      {selectedFacility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shrink-0">
                  <span className="material-symbols-outlined text-[22px]">domain</span>
                </span>
                <div>
                  <span className="font-chivo text-[10px] font-black uppercase tracking-widest text-red-400 block">
                    {selectedFacility.location} • {selectedFacility.badge}
                  </span>
                  <h3 className="font-chivo text-lg sm:text-xl font-black uppercase text-white leading-tight mt-0.5">
                    {selectedFacility.name}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                title="Đóng modal"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex items-center bg-slate-100 border-b border-slate-200 px-6 shrink-0">
              <button
                onClick={() => setActiveModalTab('booking')}
                className={`py-3 px-4 font-chivo text-xs font-bold uppercase border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeModalTab === 'booking'
                    ? 'border-red-600 text-red-600 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">edit_calendar</span>
                <span>Đặt thuê cụm sân</span>
              </button>
              <button
                onClick={() => setActiveModalTab('specs')}
                className={`py-3 px-4 font-chivo text-xs font-bold uppercase border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeModalTab === 'specs'
                    ? 'border-red-600 text-red-600 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">straighten</span>
                <span>Thông số &amp; Tiện ích</span>
              </button>
              <button
                onClick={() => setActiveModalTab('photos')}
                className={`py-3 px-4 font-chivo text-xs font-bold uppercase border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeModalTab === 'photos'
                    ? 'border-red-600 text-red-600 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">photo_library</span>
                <span>Hình ảnh thực tế</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {submitted ? (
                <div className="p-8 rounded-2xl bg-emerald-50 border-2 border-emerald-500 text-emerald-950 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                    <span className="material-symbols-outlined text-3xl">check</span>
                  </div>
                  <h4 className="font-chivo text-xl font-black text-emerald-900 uppercase">
                    Gửi Yêu Cầu Đặt Thuê Sân Thành Công!
                  </h4>
                  <p className="text-xs text-emerald-800 leading-relaxed max-w-md mx-auto">
                    Cảm ơn <strong>{formState.fullName}</strong>! Nhân viên phụ trách cụm sân <strong>{selectedFacility.name}</strong> sẽ liên hệ trực tiếp qua số <strong>{formState.phone}</strong> trong thời gian sớm nhất để xác nhận giờ tập và hỗ trợ nhận sân.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-chivo text-xs font-bold uppercase rounded-lg shadow transition-colors"
                    >
                      Hoàn Tất &amp; Đóng
                    </button>
                  </div>
                </div>
              ) : activeModalTab === 'specs' ? (
                /* SPECS & AMENITIES TAB */
                <div className="space-y-5">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="font-chivo text-xs font-bold uppercase text-slate-900 mb-3 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-red-600 text-[18px]">verified</span>
                      <span>Thông số kỹ thuật &amp; Tiêu chuẩn sân</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {selectedFacility.specs.map((spec, sIdx) => (
                        <div key={sIdx} className="p-2.5 rounded-lg bg-white border border-slate-200">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">{spec.label}</span>
                          <strong className="text-slate-800 font-semibold">{spec.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-chivo text-xs font-bold uppercase text-slate-900 mb-2.5 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-red-600 text-[18px]">check_circle</span>
                      <span>Tiện ích dịch vụ tích hợp sẵn</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedFacility.amenities.map((amenity, aIdx) => (
                        <div key={aIdx} className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium">
                          <span className="material-symbols-outlined text-emerald-600 text-[18px]">done</span>
                          <span>{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-red-50 border border-red-200/80 text-xs text-red-900">
                    <strong className="block font-bold mb-1">Mức giá tham khảo:</strong>
                    <span>{selectedFacility.priceRate}. Hội viên sở hữu gói tập tháng hoặc thẻ hội viên được hưởng ưu đãi giảm giá khi thuê sân.</span>
                  </div>
                </div>
              ) : activeModalTab === 'photos' ? (
                /* PHOTOS GALLERY TAB */
                <div className="space-y-4">
                  <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                    <img
                      src={selectedFacility.image}
                      alt={selectedFacility.name}
                      className="w-full h-64 object-cover"
                    />
                    <div className="p-3 bg-slate-900 text-white text-xs font-medium flex items-center justify-between">
                      <span>Góc máy toàn cảnh - {selectedFacility.name}</span>
                      <span className="text-slate-400 text-[11px]">{selectedFacility.location}</span>
                    </div>
                  </div>

                  {selectedFacility.secondaryImage && (
                    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                      <img
                        src={selectedFacility.secondaryImage}
                        alt={`${selectedFacility.name} chi tiết`}
                        className="w-full h-56 object-cover"
                      />
                      <div className="p-3 bg-slate-900 text-white text-xs font-medium flex items-center justify-between">
                        <span>Chi tiết mặt sàn &amp; không gian tập luyện</span>
                        <span className="text-slate-400 text-[11px]">Thực tế tại trung tâm</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* BOOKING & TOUR FORM TAB */
                <>
                  {/* Quick Card Summary */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-start sm:items-center gap-3">
                      <img
                        src={selectedFacility.image}
                        alt={selectedFacility.name}
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover shrink-0"
                      />
                      <div className="text-xs flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <strong className="text-slate-900 block font-bold">{selectedFacility.name}</strong>
                          <button
                            type="button"
                            onClick={() => setShowFacilityPicker(prev => !prev)}
                            aria-expanded={showFacilityPicker}
                            aria-controls="booking-facility-picker"
                            className="self-start sm:self-auto shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-200 bg-white text-red-600 text-[11px] font-bold hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">swap_horiz</span>
                            <span>Đổi sân</span>
                          </button>
                        </div>
                        <span className="text-slate-500 block mt-0.5">{selectedFacility.location} • Giờ mở cửa: {selectedFacility.openHours}</span>
                        <span className="text-red-600 font-semibold block mt-0.5">{selectedFacility.priceRate}</span>
                      </div>
                    </div>
                    {showFacilityPicker && (
                      <div id="booking-facility-picker" className="mt-3 pt-3 border-t border-slate-200">
                        <label htmlFor="booking-facility" className="block text-xs font-bold text-slate-700 mb-1.5">
                          Chọn sân hoặc phòng tập muốn đặt
                        </label>
                        <select
                          id="booking-facility"
                          autoFocus
                          value={selectedFacility.id}
                          onChange={e => handleChangeFacility(e.target.value)}
                          className="w-full min-w-0 px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600"
                        >
                          {SCMS_FACILITIES.map(facility => (
                            <option key={facility.id} value={facility.id}>
                              {facility.name} — {facility.location}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-red-600 text-[20px]">calendar_month</span>
                        <span className="text-xs font-chivo font-black uppercase tracking-wider text-slate-900">
                          Phiếu Đăng Ký Đặt Thuê Cụm Sân
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Giữ chỗ &amp; xác nhận nhanh qua điện thoại
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Họ và tên người liên hệ *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Nguyễn Văn A"
                          value={formState.fullName}
                          onChange={e => setFormState({ ...formState, fullName: e.target.value })}
                          className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Số điện thoại liên hệ *
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="0912 345 678"
                          value={formState.phone}
                          onChange={e => setFormState({ ...formState, phone: e.target.value })}
                          className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Email (để nhận hóa đơn &amp; xác nhận)
                        </label>
                        <input
                          type="email"
                          placeholder="vidu@scms.vn"
                          value={formState.email}
                          onChange={e => setFormState({ ...formState, email: e.target.value })}
                          className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Đơn vị / Doanh nghiệp / CLB
                        </label>
                        <input
                          type="text"
                          placeholder="Tập thể lớp / Công ty ABC..."
                          value={formState.organization}
                          onChange={e => setFormState({ ...formState, organization: e.target.value })}
                          className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Ngày dự kiến *
                        </label>
                        <input
                          type="date"
                          required
                          value={formState.expectedDate}
                          onChange={e => setFormState({ ...formState, expectedDate: e.target.value })}
                          className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Khung giờ mong muốn
                        </label>
                        <select
                          value={formState.timeSlot}
                          onChange={e => setFormState({ ...formState, timeSlot: e.target.value })}
                          className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
                        >
                          <option value="Sáng sớm (05:30 - 08:00)">Buổi sáng sớm (05:30 - 08:00)</option>
                          <option value="Sáng (08:00 - 11:30)">Buổi sáng (08:00 - 11:30)</option>
                          <option value="Chiều (13:30 - 17:30)">Buổi chiều (13:30 - 17:30)</option>
                          <option value="Tối (17:30 - 22:00)">Buổi tối (17:30 - 22:00)</option>
                          <option value="Trọn gói sự kiện">Thuê trọn ngày tổ chức giải đấu</option>
                        </select>
                      </div>
                    </div>

                    {/* Dịch vụ bổ trợ (Optional Extra Services) */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Dịch vụ bổ trợ mong muốn:
                      </label>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {[
                          'Nước uống đóng chai',
                          'Áo bib phân đội',
                          'Trọng tài giao lưu',
                          'Bóng tập thể thao',
                          'Loa mic di động',
                          'Bảng lật điểm số tay'
                        ].map((srv, idx) => (
                          <label key={idx} className="flex items-center gap-2 p-2 rounded bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100">
                            <input
                              type="checkbox"
                              checked={formState.extraServices.includes(srv)}
                              onChange={() => handleToggleExtraService(srv)}
                              className="accent-red-600"
                            />
                            <span className="text-slate-700">{srv}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Ghi chú yêu cầu cụ thể
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Số lượng người tham gia dự kiến, yêu cầu về bảng điểm, nước uống hoặc thời gian bàn giao..."
                        value={formState.notes}
                        onChange={e => setFormState({ ...formState, notes: e.target.value })}
                        className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white resize-none"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                      >
                        Đóng
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-md transition-colors flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">send</span>
                        <span>Xác Nhận Đặt Thuê Sân</span>
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </section>
  );
}

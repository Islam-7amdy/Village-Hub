import type {
  BookingRequest,
  CharityOrg,
  DemoTestAccount,
  DoctorService,
  FarmHarvestItem,
  FoodItem,
  GroceryItem,
  OtherService,
  PharmacyItem,
  ProviderListing,
  ReviewItem,
  TechnicianService,
  TutoringService,
  VillageAd,
  VillageAnnouncement,
  VillageRide
} from './villageData';

const IS_DEV = import.meta.env.DEV;

export const TEST_DEMO_ACCOUNTS: DemoTestAccount[] = IS_DEV
  ? [
      {
        uid: 'test-user-1',
        displayName: 'أحمد محمود',
        phone: '01011111111',
        password: '123456',
        address: 'قرية نقباس - وسط البلد أمام المسجد الكبير',
        neighborhood: 'وسط البلد - نقباس',
        role: 'resident',
        villageId: 'noqbas',
        providerStatus: 'none',
        serviceCategory: 'none',
        isBanned: false,
        labelAr: 'حساب مستخدم ١ (للتجربة)',
        labelEn: 'Test User 1'
      },
      {
        uid: 'test-user-2',
        displayName: 'سارة حسن',
        phone: '01022222222',
        password: '123456',
        address: 'قرية نقباس - الناحية الشرقية طريق الترعة',
        neighborhood: 'الناحية الشرقية - نقباس',
        role: 'resident',
        villageId: 'noqbas',
        providerStatus: 'none',
        serviceCategory: 'none',
        isBanned: false,
        labelAr: 'حساب مستخدم ٢ (للتجربة)',
        labelEn: 'Test User 2'
      },
      {
        uid: 'test-prov-1',
        displayName: 'د. كريم الشناوي',
        phone: '01033333333',
        password: '123456',
        address: 'قرية نقباس - الشارع العمومي بجوار الصيدلية',
        neighborhood: 'الشارع العمومي - نقباس',
        role: 'provider',
        villageId: 'noqbas',
        providerStatus: 'approved',
        serviceCategory: 'doctor',
        serviceTitle: 'طب وجراحة الفم والأسنان',
        serviceFeeEgp: '150 ج.م',
        serviceBio: 'حشو وعلاج جذور وتنظيف جير وتقويم أسنان بأحدث الأجهزة في نقباس.',
        isBanned: false,
        labelAr: 'مقدم خدمة ١ — دكتور معتمد (للتجربة)',
        labelEn: 'Test Provider 1 (Approved Doctor)'
      },
      {
        uid: 'test-prov-2',
        displayName: 'الأسطى عادل نجار',
        phone: '01044444444',
        password: '123456',
        address: 'قرية نقباس - الناحية الغربية مفرق المدارس',
        neighborhood: 'الناحية الغربية - نقباس',
        role: 'provider',
        villageId: 'noqbas',
        providerStatus: 'pending',
        serviceCategory: 'technician',
        serviceTitle: 'سباكة صحية وصيانة مواتير ميه',
        serviceFeeEgp: '80 ج.م للمعاينة',
        serviceBio: 'تأسيس وصيانة سباكة الحمامات والمطابخ وتركيب المواتير داخل نقباس.',
        isBanned: false,
        labelAr: 'مقدم خدمة ٢ — فني سباكة (قيد المراجعة)',
        labelEn: 'Test Provider 2 (Pending Technician)'
      }
    ]
  : [];

export const TEST_DEMO_PROVIDERS: ProviderListing[] = IS_DEV
  ? [
      {
        id: 'test-prov-1',
        ownerId: 'test-prov-1',
        villageId: 'noqbas',
        nameAr: 'د. كريم الشناوي',
        nameEn: 'Dr. Karim El-Shenawy',
        category: 'doctor',
        specialtyAr: 'طب وجراحة الفم والأسنان',
        specialtyEn: 'Dentistry & Oral Surgery',
        phone: '01033333333',
        neighborhoodAr: 'الشارع العمومي - بجوار الصيدلية',
        neighborhoodEn: 'Main Street - Near Pharmacy',
        priceLabelAr: '150 ج.م',
        priceLabelEn: '150 EGP',
        bioAr: 'حشو وعلاج جذور وتنظيف جير وتقويم أسنان بأحدث الأجهزة في نقباس.',
        bioEn: 'Modern dental care, fillings, root canal, and orthodontics in Noqbas.',
        isAcceptingOrders: true,
        scheduleEnabled: false,
        openTime: '09:00',
        closeTime: '22:00',
        workingDays: [6, 0, 1, 2, 3, 4],
        status: 'approved'
      },
      {
        id: 'test-prov-2',
        ownerId: 'test-prov-2',
        villageId: 'noqbas',
        nameAr: 'الأسطى عادل نجار',
        nameEn: 'Master Adel Naggar',
        category: 'technician',
        specialtyAr: 'سباكة صحية وصيانة مواتير ميه',
        specialtyEn: 'Plumbing & Water Pump Repair',
        phone: '01044444444',
        neighborhoodAr: 'الناحية الغربية - مفرق المدارس',
        neighborhoodEn: 'West Quarter - School Junction',
        priceLabelAr: '80 ج.م للمعاينة',
        priceLabelEn: '80 EGP / Visit',
        bioAr: 'تأسيس وصيانة سباكة الحمامات والمطابخ وتركيب المواتير داخل نقباس.',
        bioEn: 'Home plumbing, water pumps, and leak repairs across Noqbas.',
        isAcceptingOrders: true,
        scheduleEnabled: false,
        openTime: '08:00',
        closeTime: '21:00',
        workingDays: [6, 0, 1, 2, 3, 4],
        status: 'pending'
      }
    ]
  : [];

export const TEST_DEMO_BOOKINGS: BookingRequest[] = IS_DEV
  ? [
      {
        id: 'book-demo-1',
        ownerId: 'test-user-1',
        villageId: 'noqbas',
        serviceType: 'doctor',
        title: 'كشف باطنة ومتابعة ضغط وسكر',
        providerName: 'د. طارق الخطيب',
        customerName: 'أحمد محمود',
        customerPhone: '01011111111',
        address: 'قرية نقباس - وسط البلد أمام المسجد الكبير',
        date: '2026-11-14',
        time: '10:00 AM',
        subtotalEgp: 100,
        deliveryFeeEgp: 0,
        codFeeEgp: 0,
        totalAmountEgp: 100,
        paymentMethod: 'instapay',
        paymentStatus: 'paid',
        providerVisible: true,
        paymentVerifiedAt: '2026-11-13',
        transactionRef: 'NQB-849201',
        itemsSummary: 'كشف عيادة باطنة وأسرة',
        status: 'confirmed',
        createdAt: '2026-11-13'
      },
      {
        id: 'book-demo-2',
        ownerId: 'test-user-1',
        villageId: 'noqbas',
        serviceType: 'food',
        title: 'طلب طعام: فطير مشلتت بالسمن البلدي',
        providerName: 'فرن ومخبز البركة البلدي',
        customerName: 'أحمد محمود',
        customerPhone: '01011111111',
        address: 'قرية نقباس - وسط البلد أمام المسجد الكبير',
        distanceKm: 0.5,
        deliveryFeeEgp: 13,
        codFeeEgp: 0,
        subtotalEgp: 140,
        totalAmountEgp: 153,
        paymentMethod: 'instapay',
        paymentStatus: 'paid',
        providerVisible: true,
        paymentVerifiedAt: '2026-11-14',
        transactionRef: 'NQB-849315',
        itemsSummary: 'فطير مشلتت فلاحي بالسمن البلدي ×1',
        date: '2026-11-14',
        time: '01:30 PM',
        status: 'on_the_way',
        createdAt: '2026-11-14'
      },
      {
        id: 'book-demo-3',
        ownerId: 'test-user-2',
        villageId: 'noqbas',
        serviceType: 'pharmacy',
        title: 'طلب صيدلية: فيتامينات ومستلزمات أطفال',
        providerName: 'صيدلية الشفاء - د. هاني',
        customerName: 'سارة حسن',
        customerPhone: '01022222222',
        address: 'قرية نقباس - الناحية الشرقية طريق الترعة',
        distanceKm: 1.5,
        deliveryFeeEgp: 18,
        codFeeEgp: 0,
        subtotalEgp: 230,
        totalAmountEgp: 248,
        paymentMethod: 'instapay',
        paymentStatus: 'paid',
        providerVisible: true,
        paymentVerifiedAt: '2026-11-14',
        transactionRef: 'NQB-849422',
        itemsSummary: 'مستلزمات أطفال وفيتامينات',
        date: '2026-11-14',
        time: '04:00 PM',
        status: 'preparing',
        createdAt: '2026-11-14'
      },
      {
        id: 'book-demo-4',
        ownerId: 'test-user-2',
        villageId: 'noqbas',
        serviceType: 'technician',
        title: 'صيانة كهرباء ومنظم جهد بالمنزل',
        providerName: 'الأسطى أحمد النجار (أبو أحمد)',
        customerName: 'سارة حسن',
        customerPhone: '01022222222',
        address: 'قرية نقباس - الناحية الشرقية طريق الترعة',
        date: '2026-11-15',
        time: '11:00 AM',
        subtotalEgp: 80,
        deliveryFeeEgp: 0,
        codFeeEgp: 10,
        totalAmountEgp: 90,
        paymentMethod: 'cod',
        paymentStatus: 'pending_cod',
        providerVisible: true,
        transactionRef: 'COD-849509',
        itemsSummary: 'معاينة وصيانة كهرباء منزلية',
        status: 'pending',
        createdAt: '2026-11-14'
      },
      {
        id: 'book-demo-5',
        ownerId: 'test-user-1',
        villageId: 'noqbas',
        serviceType: 'grocery',
        title: 'مقاضي سوبر ماركت وسلة خضار طازة',
        providerName: 'سوبر ماركت البركة',
        customerName: 'أحمد محمود',
        customerPhone: '01011111111',
        address: 'قرية نقباس - وسط البلد أمام المسجد الكبير',
        distanceKm: 0.5,
        deliveryFeeEgp: 13,
        subtotalEgp: 305,
        codFeeEgp: 10,
        totalAmountEgp: 328,
        paymentMethod: 'cod',
        paymentStatus: 'pending_cod',
        providerVisible: true,
        transactionRef: 'COD-849104',
        deliveryConfirmedRef: 'COD-849104',
        deliveryConfirmedAt: '2026-11-14',
        itemsSummary: 'سلة خضار ومقاضي أساسية',
        date: '2026-11-14',
        time: '06:00 PM',
        status: 'completed',
        settlementStatus: 'pending',
        createdAt: '2026-11-14'
      },
      {
        id: 'book-demo-6',
        ownerId: 'test-user-2',
        villageId: 'noqbas',
        serviceType: 'doctor',
        title: 'حجز كشف في العيادة / زيارة: طب وجراحة الفم والأسنان',
        providerOwnerId: 'test-prov-1',
        providerName: 'د. كريم الشناوي',
        customerName: 'سارة حسن',
        customerPhone: '01022222222',
        address: 'قرية نقباس - الناحية الشرقية طريق الترعة',
        date: '2026-11-15',
        time: '05:30 PM',
        subtotalEgp: 150,
        deliveryFeeEgp: 0,
        codFeeEgp: 0,
        totalAmountEgp: 150,
        paymentMethod: 'instapay',
        paymentStatus: 'paid',
        providerVisible: true,
        paymentVerifiedAt: '2026-11-14',
        transactionRef: 'NQB-912044',
        itemsSummary: 'كشف وحشو عصب أسنان',
        status: 'confirmed',
        settlementStatus: 'pending',
        createdAt: '2026-11-14'
      },
      {
        id: 'book-demo-7',
        ownerId: 'test-user-1',
        villageId: 'noqbas',
        serviceType: 'technician',
        title: 'اطلب صنايعي للبيت: سباكة صحية وصيانة مواتير ميه',
        providerOwnerId: 'test-prov-2',
        providerName: 'الأسطى عادل نجار',
        customerName: 'أحمد محمود',
        customerPhone: '01011111111',
        address: 'قرية نقباس - وسط البلد أمام المسجد الكبير',
        date: '2026-11-15',
        time: '12:00 PM',
        subtotalEgp: 80,
        deliveryFeeEgp: 0,
        codFeeEgp: 10,
        totalAmountEgp: 90,
        paymentMethod: 'cod',
        paymentStatus: 'pending_cod',
        providerVisible: true,
        transactionRef: 'COD-912188',
        itemsSummary: 'صيانة موتور ميه وتغيير أوتوماتيك',
        status: 'pending',
        settlementStatus: 'pending',
        createdAt: '2026-11-14'
      },
      {
        id: 'book-demo-8',
        ownerId: 'test-user-1',
        villageId: 'noqbas',
        serviceType: 'food',
        title: 'طلب طعام: صينية بط ومحشي بيتي',
        providerOwnerId: 'test-prov-1',
        providerName: 'مطبخ أم سالم للأكل البيتي',
        customerName: 'أحمد محمود',
        customerPhone: '01011111111',
        address: 'قرية نقباس - وسط البلد أمام المسجد الكبير',
        distanceKm: 1.5,
        deliveryFeeEgp: 18,
        codFeeEgp: 0,
        subtotalEgp: 420,
        totalAmountEgp: 438,
        paymentMethod: 'instapay',
        paymentStatus: 'pending_verification',
        providerVisible: false,
        instaPaySender: '01011111111',
        instaPayCustomerRef: 'IPN-7741',
        transactionRef: 'NQB-912555',
        itemsSummary: 'صينية بط ومحشي ورق عنب وكرنب بيتي ×1',
        date: '2026-11-15',
        time: '02:00 PM',
        status: 'pending',
        settlementStatus: 'pending',
        createdAt: '2026-11-14'
      },
      {
        id: 'book-demo-9',
        ownerId: 'test-user-2',
        villageId: 'noqbas',
        serviceType: 'grocery',
        title: 'طلب بقالة: سلة خضار ومنتجات ألبان',
        providerOwnerId: 'test-prov-1',
        providerName: 'سوبر ماركت البركة',
        customerName: 'سارة حسن',
        customerPhone: '01022222222',
        address: 'قرية نقباس - الناحية الشرقية طريق الترعة',
        distanceKm: 1.5,
        deliveryFeeEgp: 18,
        subtotalEgp: 235,
        codFeeEgp: 10,
        totalAmountEgp: 263,
        paymentMethod: 'cod',
        paymentStatus: 'pending_cod',
        providerVisible: true,
        transactionRef: 'COD-912777',
        itemsSummary: 'زيت ذرة صافي + زجاجة سمن طبيعي ×1',
        date: '2026-11-15',
        time: '03:15 PM',
        status: 'on_the_way',
        settlementStatus: 'pending',
        createdAt: '2026-11-14'
      }
    ]
  : [];

export const VILLAGE_DOCTORS: DoctorService[] = IS_DEV
  ? [
      {
        id: 'doc-1',
        villageId: 'noqbas',
        name: { ar: 'د. طارق الخطيب', en: 'Dr. Tariq Al-Khatib' },
        specialty: { ar: 'دكتور باطنة وطب أسرة - الوحدة الصحية', en: 'Internal Medicine & Family Doctor' },
        clinicName: { ar: 'عيادة نقباس المركزية', en: 'Noqbas Central Clinic' },
        phone: '01012345678',
        location: { ar: 'الشارع العمومي - جنب الوحدة المحلية', en: 'Main Street - Next to Village Hall' },
        rating: 4.9,
        reviewsCount: 88,
        availableDays: { ar: 'كل يوم ما عدا الجمعة: 9 ص - 3 عصراً', en: 'Sat - Thu: 9:00 AM - 3:00 PM' },
        fee: { ar: '100 ج.م (في العيادة)', en: '100 EGP (Clinic)' },
        supportsHomeVisit: true,
        avatar: '/images/doctor_marcus_vance_1794474296129.webp'
      },
      {
        id: 'doc-2',
        villageId: 'noqbas',
        name: { ar: 'د. ليلى منصور', en: 'Dr. Laila Mansour' },
        specialty: { ar: 'أخصائية أطفال وحديثي الولادة', en: 'Pediatrician & Newborn Specialist' },
        clinicName: { ar: 'عيادة الأمل للأطفال', en: 'Al-Amal Pediatric Clinic' },
        phone: '01123456789',
        location: { ar: 'الناحية الشرقية - عمارة السلام الدور الأول', en: 'East Quarter - Al-Salam Bldg' },
        rating: 4.9,
        reviewsCount: 112,
        availableDays: { ar: 'الحد والتلات والخميس: 4 عصراً - 9 بالليل', en: 'Sun, Tue, Thu: 4:00 PM - 9:00 PM' },
        fee: { ar: '150 ج.م', en: '150 EGP' },
        supportsHomeVisit: true,
        avatar: '/images/doctor_sarah_jenkins_1794474295843.webp'
      },
      {
        id: 'nurse-1',
        villageId: 'noqbas',
        name: { ar: 'الممرضة فاطمة عبد الله', en: 'Nurse Fatima Abdullah' },
        specialty: { ar: 'حقن، تغيير على الجروح، وقياس ضغط وسكر في البيت', en: 'Home Nursing, Injections & Wound Dressing' },
        clinicName: { ar: 'خدمة التمريض المنزلي السريع', en: 'Village Home Nursing Dispatch' },
        phone: '01234567890',
        location: { ar: 'بتلف كل بيوت القرية والعزب', en: 'Home Visits across Village' },
        rating: 4.9,
        reviewsCount: 64,
        availableDays: { ar: 'موجودة 24 ساعة للحالات العاجلة', en: 'Daily 24/7 for Injections & Dressing' },
        fee: { ar: '50 ج.م للزيارة', en: '50 EGP per visit' },
        supportsHomeVisit: true,
        avatar: '/images/doctor_sarah_jenkins_1794474295843.webp'
      }
    ]
  : [];

export const VILLAGE_TECHNICIANS: TechnicianService[] = IS_DEV
  ? [
      {
        id: 'tech-1',
        villageId: 'noqbas',
        name: { ar: 'الأسطى أحمد النجار (أبو أحمد)', en: 'Abu Ahmad (Electrician Ahmad)' },
        craft: { ar: 'كهربائي منازل ومواتير وطوارئ', en: 'Home & Motor Electrician' },
        category: 'electrician',
        phone: '01045678901',
        whatsapp: '201045678901',
        rating: 4.9,
        reviewsCount: 140,
        experienceYears: 18,
        hourlyRate: { ar: '80 ج.م / كشف ومعاينة', en: '80 EGP / Callout' },
        neighborhood: { ar: 'الناحية الغربية ووسط البلد', en: 'West Quarter & Village Square' },
        avatar: '/images/village_technician_electrician_1794475355366.webp',
        bio: {
          ar: 'خبرة 18 سنة في تأسيس شقق العرسان، تصليح القفلات، وتركيب منظم الكهرباء عشان يحمي التلاجات والغسالات.',
          en: '18 years experience in house wiring, voltage stabilizers, breaker panels, and emergency repairs.'
        }
      },
      {
        id: 'tech-2',
        villageId: 'noqbas',
        name: { ar: 'المعلم محمود السباك', en: 'Master Plumber Mahmoud' },
        craft: { ar: 'سباكة صحية ومواتير ميه وطلمبات', en: 'Plumbing & Water Pump Specialist' },
        category: 'plumber',
        phone: '01156789012',
        whatsapp: '201156789012',
        rating: 4.9,
        reviewsCount: 96,
        experienceYears: 14,
        hourlyRate: { ar: '70 ج.م / زيارة', en: '70 EGP / Visit' },
        neighborhood: { ar: 'الناحية الشرقية والعزبة', en: 'East Quarter & Farmlands' },
        avatar: '/images/village_technician_electrician_1794475355366.webp',
        bio: {
          ar: 'صيانة مواتير الميه والأوتوماتيك، تسليك بلاعات، وتركيب سباكة الحمامات والمطابخ بأمانة وسرعة.',
          en: 'Water pump repair, pipe leak detection, bathroom & kitchen plumbing with honest pricing.'
        }
      },
      {
        id: 'tech-3',
        villageId: 'noqbas',
        name: { ar: 'البشمهندس يوسف للتبريد والتكييف', en: 'Eng. Youssef (HVAC & Appliances)' },
        craft: { ar: 'صيانة تكييفات، تلاجات، وسخانات', en: 'AC Units, Fridges & Water Heaters' },
        category: 'hvac',
        phone: '01267890123',
        whatsapp: '201267890123',
        rating: 4.9,
        reviewsCount: 78,
        experienceYears: 10,
        hourlyRate: { ar: '120 ج.م / صيانة', en: '120 EGP / Service' },
        neighborhood: { ar: 'شارع المدارس والطريق الزراعي', en: 'School Road & Agricultural Rd' },
        avatar: '/images/village_technician_electrician_1794475355366.webp',
        bio: {
          ar: 'شحن فريون تكييفات، غسيل وتنظيف التكييف قبل الصيف، وتصليح تلاجات الديب فريزر في البيت.',
          en: 'AC Freon recharge, seasonal unit cleaning, deep freezers, and water heater servicing.'
        }
      },
      {
        id: 'tech-4',
        villageId: 'noqbas',
        name: { ar: 'طارق للطاقة الشمسية والإنفرتر', en: 'Tariq Solar & Battery Systems' },
        craft: { ar: 'تركيب ألواح طاقة شمسية للبيوت والغيطان', en: 'Solar Panels & Farm Pump Inverters' },
        category: 'solar',
        phone: '01578901234',
        whatsapp: '201578901234',
        rating: 4.9,
        reviewsCount: 52,
        experienceYears: 8,
        hourlyRate: { ar: 'معاينة مجانية', en: 'Free Inspection' },
        neighborhood: { ar: 'بيلف كل القرى والعزب', en: 'All Villages & Farms' },
        avatar: '/images/village_technician_electrician_1794475355366.webp',
        bio: {
          ar: 'حلول الطاقة الشمسية لتشغيل طلمبات الري أو إنارة البيوت وقت قطع النور، ببطاريات عمرها طويل.',
          en: 'Off-grid solar inverters for farm irrigation pumps and backup home battery banks.'
        }
      }
    ]
  : [];

export const VILLAGE_FOOD_ITEMS: FoodItem[] = IS_DEV
  ? [
      {
        id: 'food-1',
        villageId: 'noqbas',
        name: { ar: 'فطير مشلتت فلاحي بالسمن البلدي (فطيرة كبيرة)', en: 'Authentic Feteer Meshaltet with Baladi Ghee' },
        description: { ar: 'مورق وطازة طالع من الفرن البلدي حالا، معمول بسمن جاموسي صافي 100%', en: 'Flaky layered Egyptian country pie baked fresh with pure village ghee' },
        price: 140,
        currency: { ar: 'ج.م', en: 'EGP' },
        category: 'bakery',
        restaurantName: { ar: 'فرن ومخبز البركة البلدي', en: 'Al-Baraka Village Bakery' },
        image: '/images/village_fresh_food_bakery_1794475356032.webp'
      },
      {
        id: 'food-2',
        villageId: 'noqbas',
        name: { ar: 'مناقيش زعتر وجبنة رومي على الصاج (3 قطع)', en: 'Thyme & Cheese Saj Pies (3 Pieces)' },
        description: { ar: 'عجينة طرية بزيت زيتون نقي وجبنة طازة للفطار أو العشا', en: 'Warm freshly baked pies with thyme, olive oil, and local cheese' },
        price: 65,
        currency: { ar: 'ج.م', en: 'EGP' },
        category: 'bakery',
        restaurantName: { ar: 'فرن ومخبز البركة البلدي', en: 'Al-Baraka Village Bakery' },
        image: '/images/village_fresh_food_bakery_1794475356032.webp'
      },
      {
        id: 'food-3',
        villageId: 'noqbas',
        name: { ar: 'صينية بط ومحشي ورق عنب وكرنب بيتي (تكفي 4 أفراد)', en: 'Homemade Duck & Stuffed Vine Leaves Tray (Serves 4)' },
        description: { ar: 'أكل بيتي نضيف على أصوله من إيد الحاجة أم سالم مع شوربة وسلطة بلدي', en: 'Authentic village feast cooked fresh at home with rich broth and salad' },
        price: 420,
        currency: { ar: 'ج.م', en: 'EGP' },
        category: 'traditional',
        restaurantName: { ar: 'مطبخ أم سالم للأكل البيتي', en: "Um Salem's Homemade Kitchen" },
        image: '/images/village_fresh_food_bakery_1794475356032.webp'
      },
      {
        id: 'food-4',
        villageId: 'noqbas',
        name: { ar: 'وجبة كفتة وشيش طاووق على الفحم مع رز بسمتي', en: 'Charcoal Kofta & Shish Tawook Meal with Rice' },
        description: { ar: 'لحمة بلدي مفرومة طازة مشوية على الفحم مع طحينة وسلطة وعيش سخن', en: 'Fresh local grilled kofta & chicken skewers with tahini, salad, and warm bread' },
        price: 210,
        currency: { ar: 'ج.م', en: 'EGP' },
        category: 'grill',
        restaurantName: { ar: 'مشويات الوادي على الفحم', en: 'Al-Wadi Charcoal Grill' },
        image: '/images/village_fresh_food_bakery_1794475356032.webp'
      }
    ]
  : [];

export const VILLAGE_PHARMACY_ITEMS: PharmacyItem[] = IS_DEV
  ? [
      {
        id: 'ph-1',
        villageId: 'noqbas',
        name: { ar: 'بنادول إكسترا (مسكن صداع وسخونية - شريطين)', en: 'Panadol Extra (24 Tablets)' },
        description: { ar: 'مسكن سريع للصداع، وجع السنان، وتكسير الجسم', en: 'Fast relief for headache, toothache, and fever' },
        category: 'pain',
        price: 45,
        currency: { ar: 'ج.م', en: 'EGP' },
        inStock: true,
        requiresPrescription: false
      },
      {
        id: 'ph-2',
        villageId: 'noqbas',
        name: { ar: 'كونكور 5 مجم (علاج الضغط والقلب - علبة)', en: 'Concor 5mg Bisoprolol (Box)' },
        description: { ar: 'لتنظيم ضغط الدم وضربات القلب — متوفر شهرياً بدون نقص', en: 'Chronic blood pressure & heart rhythm medication' },
        category: 'chronic',
        price: 88,
        currency: { ar: 'ج.م', en: 'EGP' },
        inStock: true,
        requiresPrescription: true
      },
      {
        id: 'ph-3',
        villageId: 'noqbas',
        name: { ar: 'شنطة إسعافات أولية كاملة للبيت', en: 'Complete Home First Aid Kit' },
        description: { ar: 'شاش معقم، ميبو للحروق، بيتادين، بلاستر، ترمومتر ديجيتال وقطن', en: 'Sterile gauze, burn cream, antiseptic, thermometer, and bandages' },
        category: 'firstaid',
        price: 195,
        currency: { ar: 'ج.م', en: 'EGP' },
        inStock: true,
        requiresPrescription: false
      },
      {
        id: 'ph-4',
        villageId: 'noqbas',
        name: { ar: 'لبن أطفال بيبيلاك 1 + باكيت حفاضات', en: 'Bebelac Stage 1 Formula + Diapers Pack' },
        description: { ar: 'عبوة غذائية متكاملة للرضع مع حفاضات مريحة بالقطن', en: 'Fortified infant milk formula bundled with comfort cotton diapers' },
        category: 'baby',
        price: 360,
        currency: { ar: 'ج.م', en: 'EGP' },
        inStock: true,
        requiresPrescription: false
      }
    ]
  : [];

export const VILLAGE_FARM_PRODUCE: FarmHarvestItem[] = IS_DEV
  ? [
      {
        id: 'farm-1',
        villageId: 'noqbas',
        name: { ar: 'سمن جاموسي فلاحي مرمل صافي (برطمان 1 كيلو)', en: 'Pure Baladi Buffalo Ghee (1 kg Jar)' },
        farmerName: { ar: 'مزرعة الحاج أبو عمر', en: 'Hajj Abu Omar Farm' },
        price: 390,
        unit: { ar: 'برطمان 1 كيلو صافي', en: '1 kg Pure Jar' },
        currency: { ar: 'ج.م', en: 'EGP' },
        description: { ar: 'زبدة جاموسي مسيحة على الهادي بدون أي خلط أو زيوت نباتية — ريحة وطعم الفلاحي الأصلي', en: 'Slow-clarified pure farm ghee with zero additives.' },
        location: { ar: 'طريق الغيطان الجنوبية', en: 'South Farmlands Road' }
      },
      {
        id: 'farm-2',
        villageId: 'noqbas',
        name: { ar: 'بيض بلدي طازة من الغيط (كرتونة 30 بيضة)', en: 'Free-Range Farm Eggs (30 Eggs)' },
        farmerName: { ar: 'مزرعة أم خليل للدواجن البلدي', en: "Um Khalil's Free-Range Farm" },
        price: 165,
        unit: { ar: 'كرتونة 30 بيضة', en: 'Tray (30 eggs)' },
        currency: { ar: 'ج.م', en: 'EGP' },
        description: { ar: 'فراخ بلدي بترعى على الدرة والبرسيم، بيض صابح كل يوم الصبح', en: 'Pasture-raised organic eggs collected fresh every morning.' },
        location: { ar: 'الناحية الشرقية جنب الترعة', en: 'East Quarter by Canal' }
      },
      {
        id: 'farm-3',
        villageId: 'noqbas',
        name: { ar: 'لبن جاموسي طازة بخيره (2 كيلو معبأ مبرد)', en: 'Fresh Whole Buffalo Milk (2 kg)' },
        farmerName: { ar: 'زريبة ومزرعة أبو إبراهيم', en: 'Abu Ibrahim Dairy Farm' },
        price: 75,
        unit: { ar: '2 كيلو معبأ', en: '2 kg Chilled' },
        currency: { ar: 'ج.م', en: 'EGP' },
        description: { ar: 'لبن كامل الدسم بقشطته ممتاز للزبادي والرز بلبن والقشطة البيتي', en: 'Raw grass-fed rich buffalo milk ideal for homemade cream and yoghurt.' },
        location: { ar: 'أول طريق العزبة', en: 'Hamlet Entrance' }
      },
      {
        id: 'farm-4',
        villageId: 'noqbas',
        name: { ar: 'عسل نحل موالح وبرسيم صافي 100% (كيلو)', en: 'Pure Clover & Citrus Blossom Honey (1 kg)' },
        farmerName: { ar: 'مناحل العم فهد', en: 'Uncle Fahad Apiaries' },
        price: 260,
        unit: { ar: 'برطمان 1 كيلو', en: '1 kg Jar' },
        currency: { ar: 'ج.م', en: 'EGP' },
        description: { ar: 'عسل نحل طبيعي فرز أول من مناحل البساتين بدون أي تغذية سكرية', en: '100% natural raw honey from local orchards with zero sugar syrup.' },
        location: { ar: 'بساتين الموالح القبلية', en: 'Southern Citrus Orchards' }
      }
    ]
  : [];

export const VILLAGE_ANNOUNCEMENTS: VillageAnnouncement[] = IS_DEV
  ? [
      {
        id: 'ann-1',
        villageId: 'noqbas',
        title: { ar: 'مواعيد ضخ ميه الشرب وتنظيف الخزانات الأسبوع ده', en: 'Weekly Water Pumping & Tank Maintenance Schedule' },
        category: 'utility',
        date: '2026-11-13',
        content: {
          ar: 'يا جماعة الخير: ميه الناحية الشرقية هتشتغل بقوة من بكرة الجمعة الصبح الساعة 6 لحد السبت بالليل، والناحية الغربية يوم الحد. ياريت الكل يشيك على العوامات.',
          en: 'Water pumping for the East Quarter starts Friday 6:00 AM through Saturday night; West Quarter follows on Sunday.'
        },
        author: { ar: 'لجنة ميه القرية', en: 'Village Water Committee' }
      },
      {
        id: 'ann-2',
        villageId: 'noqbas',
        title: { ar: 'يوم نضافة وتشجير حوالين المدرسة الابتدائية السبت الجاي', en: 'Community Clean-Up & Tree Planting Saturday' },
        category: 'community',
        date: '2026-11-11',
        content: {
          ar: 'شباب القرية متجمعين يوم السبت الساعة 9 الصبح قدام المدرسة الابتدائية عشان نزرع شجر زيتون وظل وننضف الرصيف. اللي يقدر يشرفنا أهلاً بيه.',
          en: 'Village youth are gathering Saturday at 9:00 AM by the elementary school to plant shade trees and tidy the street.'
        },
        author: { ar: 'شباب الخير بالبلد', en: 'Village Youth Group' }
      }
    ]
  : [];

export const INITIAL_VILLAGE_ADS: VillageAd[] = IS_DEV
  ? [
      {
        id: 'ad-1',
        ownerId: 'seed-1',
        authorName: 'محل أولاد بركات للأجهزة',
        villageId: 'noqbas',
        title: 'عرض خاص على صيانة وتغيير شمعات فلاتر الميه (7 مراحل)',
        description: 'تغيير طقم الشمعات الأصلي مع غسيل الخزان وقياس الأملاح مجاناً لبيوت نقباس طول الأسبوع ده.',
        category: 'offer',
        priceText: '220 ج.م بدل 300 ج.م',
        contactPhone: '01022334455',
        status: 'approved',
        createdDate: '2026-11-12'
      },
      {
        id: 'ad-2',
        ownerId: 'seed-2',
        authorName: 'سنتر النور التعليمي',
        villageId: 'noqbas',
        title: 'مجموعات تقوية ومراجعة نهائية للمرحلة الإعدادية والثانوية',
        description: 'مراجعات مكثفة في الرياضة والإنجليزي والعلوم مع نخبة من مدرسين البلد بأسعار مخفضة لغير القادرين.',
        category: 'event',
        priceText: 'خصم 30% للإخوات',
        contactPhone: '01199887766',
        status: 'approved',
        createdDate: '2026-11-11'
      },
      {
        id: 'ad-3',
        ownerId: 'seed-3',
        authorName: 'الحاج رضا للعقارات',
        villageId: 'noqbas',
        title: 'شقة لقطة للإيجار لعرسان أول سكن - الشارع العمومي',
        description: 'شقة 3 غرف وصالة تشطيب سوبر لوكس الدور التاني علوي، قريبة من الموقف والوحدة الصحية، عداد كهرباء وغاز.',
        category: 'property',
        priceText: '2,200 ج.م / شهر',
        contactPhone: '01244556677',
        status: 'approved',
        createdDate: '2026-11-10'
      }
    ]
  : [];

export const VILLAGE_RIDES: VillageRide[] = IS_DEV
  ? [
      {
        id: 'ride-1',
        villageId: 'noqbas',
        driverName: { ar: 'الأسطى سالم (أبو زيد)', en: 'Abu Zaid (Salem)' },
        from: { ar: 'موقف القرية العمومي', en: 'Village Main Square' },
        to: { ar: 'بنها الجديدة والجامعة وموقف الأتوبيس', en: 'Central City & University Terminal' },
        departureTime: '07:15 AM',
        availableSeats: 3,
        pricePerSeat: { ar: '25 ج.م للكرسي', en: '25 EGP / Seat' },
        carModel: 'Hyundai Elantra 2022',
        phone: '01089012345'
      },
      {
        id: 'ride-2',
        villageId: 'noqbas',
        driverName: { ar: 'محمد عبد الله', en: 'Mohammad Abdullah' },
        from: { ar: 'الناحية الغربية - مفرق المدارس', en: 'West Quarter - School Junction' },
        to: { ar: 'المستشفى العام وسوق الخضار بالبندر', en: 'General Hospital & Central Market' },
        departureTime: '08:30 AM',
        availableSeats: 2,
        pricePerSeat: { ar: '30 ج.م للكرسي', en: '30 EGP / Seat' },
        carModel: 'Kia Cerato',
        phone: '01190123456'
      }
    ]
  : [];

export const INITIAL_REVIEWS: ReviewItem[] = IS_DEV
  ? [
      {
        id: 'rev-1',
        targetId: 'doc-1',
        villageId: 'noqbas',
        author: 'أبو خليل (خليل محمد)',
        neighborhood: { ar: 'الناحية الشرقية', en: 'East Quarter' },
        rating: 5,
        date: '2026-11-10',
        comment: {
          ar: 'دكتور محترم جداً وباله طويل، جه لوالدي البيت وشاف الضغط وكتبلنا علاج ريحه على طول ربنا يباركله.',
          en: 'Very respectful and patient doctor. Did a home visit for my elderly father and prescribed effective treatment.'
        },
        isVerifiedResident: true
      },
      {
        id: 'rev-2',
        targetId: 'doc-1',
        villageId: 'noqbas',
        author: 'أم سالم',
        neighborhood: { ar: 'الناحية الغربية', en: 'West Quarter' },
        rating: 5,
        date: '2026-11-06',
        comment: {
          ar: 'د. طارق بركة البلد، موجود دايماً في العيادة وتشخيصه مظبوط وبيعامل الكل زي أهله.',
          en: 'Dr. Tariq is always reliable and treats every patient like family.'
        },
        isVerifiedResident: true
      },
      {
        id: 'rev-3',
        targetId: 'doc-2',
        villageId: 'noqbas',
        author: 'أم يوسف',
        neighborhood: { ar: 'شارع المدارس', en: 'School Road' },
        rating: 5,
        date: '2026-11-08',
        comment: {
          ar: 'دكتورة ليلى شاطرة جداً وهادية مع العيال الصغيرة، بنتي خفت من دور البرد بعد ما تابعت معاها.',
          en: 'Dr. Laila is great with young kids and very thorough.'
        },
        isVerifiedResident: true
      },
      {
        id: 'rev-5',
        targetId: 'tech-1',
        villageId: 'noqbas',
        author: 'عمر التميمي',
        neighborhood: { ar: 'الناحية الغربية', en: 'West Quarter' },
        rating: 5,
        date: '2026-11-11',
        comment: {
          ar: 'الأسطى أبو أحمد صلح قفلة الكهرباء في نص ساعة ولحق التلاجة والغسالة، راجل أمين وسعره حنين.',
          en: 'Abu Ahmad fixed our breaker box in 30 minutes and saved our appliances. Honest and fairly priced.'
        },
        isVerifiedResident: true
      },
      {
        id: 'rev-7',
        targetId: 'tech-2',
        villageId: 'noqbas',
        author: 'سالم النجار',
        neighborhood: { ar: 'الناحية الشرقية', en: 'East Quarter' },
        rating: 5,
        date: '2026-11-09',
        comment: {
          ar: 'المعلم محمود غير أوتوماتيك الموتور وحل مشكلة ضعف الميه في الدور التالت، شغله نضيف ومظبوط.',
          en: 'Mahmoud fixed our roof water pressure issue cleanly and quickly.'
        },
        isVerifiedResident: true
      }
    ]
  : [];

export const VILLAGE_GROCERY_ITEMS: GroceryItem[] = IS_DEV
  ? [
      {
        id: 'groc-1',
        villageId: 'noqbas',
        name: { ar: 'شيكارة أرز مصري فاخر حبة عريضة (5 كيلو)', en: 'Egyptian Short-Grain Rice (5 kg Bag)' },
        storeName: { ar: 'سوبر ماركت أولاد علام', en: 'Awlad Allam Supermarket' },
        description: { ar: 'أرز مصري نضيف منقي ومعبأ بدون أي شوائب للأكل اليومي', en: 'Premium sorted Egyptian rice packed fresh for family cooking' },
        category: 'staples',
        price: 165,
        unit: { ar: 'شيكارة 5 كيلو', en: '5 kg Bag' },
        currency: { ar: 'ج.م', en: 'EGP' }
      },
      {
        id: 'groc-2',
        villageId: 'noqbas',
        name: { ar: 'زيت ذرة صافي + زجاجة سمن طبيعي (عرض التوفير)', en: 'Pure Corn Oil + Ghee Value Pack' },
        storeName: { ar: 'سوبر ماركت البركة - وسط البلد', en: 'Al-Baraka Mini Market' },
        description: { ar: 'باكدج المطبخ الشهري بسعر الجملة لأهل القرية مع توصيل سريع', en: 'Monthly cooking oil & ghee bundle at village wholesale pricing' },
        category: 'staples',
        price: 235,
        unit: { ar: 'عبوتين معاً', en: 'Twin Pack' },
        currency: { ar: 'ج.م', en: 'EGP' }
      },
      {
        id: 'groc-3',
        villageId: 'noqbas',
        name: { ar: 'سلة خضار وفاكهة الغيط الطازة (طماطم، بطاطس، بصل، خيار)', en: 'Fresh Farm Veggie Basket (5 kg)' },
        storeName: { ar: 'وكالة الحاج سعيد للخضار', en: 'Hajj Saeed Produce Stand' },
        description: { ar: 'مقطوفة النهاردة الصبح من أراضي البلد — 5 كيلو مشكل بالوزن المظبوط', en: 'Picked fresh this morning from local fields — 5 kg mixed staples' },
        category: 'produce',
        price: 120,
        unit: { ar: 'سلة 5 كيلو مشكل', en: '5 kg Mixed Basket' },
        currency: { ar: 'ج.م', en: 'EGP' }
      },
      {
        id: 'groc-4',
        villageId: 'noqbas',
        name: { ar: 'علبة جبنة قريش طازة + لبن جاموسي بخيره (2 كيلو)', en: 'Fresh Qareesh Cheese + 2kg Whole Milk' },
        storeName: { ar: 'منتجات ألبان النور الفلاحي', en: 'Al-Noor Baladi Dairy' },
        description: { ar: 'جبنة قريش خفيفة الملح مع لبن طازة مبرد يوصل لحد البيت', en: 'Low-salt village qareesh cheese paired with chilled whole buffalo milk' },
        category: 'dairy',
        price: 115,
        unit: { ar: 'علبة جبنة + 2ك لبن', en: 'Cheese + 2kg Milk' },
        currency: { ar: 'ج.م', en: 'EGP' }
      }
    ]
  : [];

export const VILLAGE_TUTORING_SERVICES: TutoringService[] = IS_DEV
  ? [
      {
        id: 'tut-1',
        villageId: 'noqbas',
        teacherName: { ar: 'أستاذ حسن المنشاوي', en: 'Mr. Hassan El-Menshawy' },
        subject: { ar: 'رياضيات وحساب (تأسيس ومراجعات نهائية)', en: 'Mathematics & Mental Math' },
        category: 'math',
        grades: { ar: 'ابتدائي وإعدادي (مجموعات صغيرة 6 طلاب)', en: 'Primary & Prep (Small Groups)' },
        feePerSession: { ar: '60 ج.م / حصة', en: '60 EGP / Session' },
        schedule: { ar: 'السبت والاتنين والأربعاء: 3 م - 7 م', en: 'Sat, Mon, Wed: 3:00 PM - 7:00 PM' },
        location: { ar: 'سنتر النور التعليمي - الشارع العمومي', en: 'Al-Noor Center - Main Street' },
        phone: '01066778899',
        mode: { ar: 'حضوري في السنتر أو بالبيت', en: 'In-person or Home Tutoring' }
      },
      {
        id: 'tut-2',
        villageId: 'noqbas',
        teacherName: { ar: 'مس أميرة عبد السلام', en: 'Ms. Amira Abdelsalam' },
        subject: { ar: 'لغة إنجليزية (محادثة وتأسيس جرامر)', en: 'English Language & Grammar' },
        category: 'languages',
        grades: { ar: 'من 4 ابتدائي لحد 3 ثانوي', en: 'Grade 4 to High School' },
        feePerSession: { ar: '75 ج.م / حصة', en: '75 EGP / Session' },
        schedule: { ar: 'الحد والتلات والخميس: 4 م - 8 م', en: 'Sun, Tue, Thu: 4:00 PM - 8:00 PM' },
        location: { ar: 'الناحية الغربية - جنب المدرسة الإعدادية', en: 'West Quarter - Near Prep School' },
        phone: '01122334466',
        mode: { ar: 'مجموعات + متابعة أونلاين', en: 'Small Groups + Online Follow-up' }
      },
      {
        id: 'tut-3',
        villageId: 'noqbas',
        teacherName: { ar: 'الشيخ محمود أبو النجا', en: 'Sheikh Mahmoud Abou El-Naga' },
        subject: { ar: 'تحفيظ قرآن كريم وتجويد وأساسيات اللغة العربية', en: 'Quran Memorization, Tajweed & Arabic' },
        category: 'quran',
        grades: { ar: 'الأطفال والشباب (تحفيظ وتأسيس قراءة وكتابة)', en: 'Kids & Youth (Reading & Tajweed)' },
        feePerSession: { ar: 'مجاني / دعم رمزي 30 ج.م', en: 'Free / 30 EGP Symbolic' },
        schedule: { ar: 'يومياً بعد صلاة العصر بالمسجد الكبير', en: 'Daily after Asr at Grand Mosque' },
        location: { ar: 'مكتبة المسجد الكبير - وسط البلد', en: 'Grand Mosque Hall - Center' },
        phone: '01288990011',
        mode: { ar: 'حلقات تحفيظ يومية', en: 'Daily Study Circles' }
      }
    ]
  : [];

export const VILLAGE_CHARITIES: CharityOrg[] = IS_DEV
  ? [
      {
        id: 'char-1',
        villageId: 'noqbas',
        name: { ar: 'جمعية أهل الخير وتكافل نقباس', en: 'Ahl El-Kheir Noqbas Charity' },
        focus: { ar: 'كفالة الأيتام، شنط المواد الغذائية الشهرية، ودعم المرضى', en: 'Orphan sponsorship, monthly food boxes & medical aid' },
        activeCampaign: { ar: 'حملة تجهيز 150 شنطة غذائية وأغطية شتاء للأسر الأولى بالرعاية', en: 'Campaign: 150 Monthly Pantry Boxes & Winter Blankets' },
        address: { ar: 'بجوار المسجد الكبير - وسط البلد', en: 'Next to Grand Mosque - Center' },
        phone: '01099112233',
        donationExample: { ar: 'سهم الشنطة الشهرية 250 ج.م أو أي مساهمة مفتوحة', en: '250 EGP per family box or any contribution' }
      },
      {
        id: 'char-2',
        villageId: 'noqbas',
        name: { ar: 'مؤسسة شباب نقباس للتكافل والعلاج', en: 'Noqbas Youth Medical Aid Foundation' },
        focus: { ar: 'قوافل طبية مجانية، شراء أدوية مزمنة، وتجهيز العرائس', en: 'Free medical convoys, chronic medication fund & marriage aid' },
        activeCampaign: { ar: 'صندوق الدواء الخيري لصرف علاج غير القادرين من صيدلية الشفاء', en: 'Charitable Medicine Fund at Al-Shifa Pharmacy' },
        address: { ar: 'الشارع العمومي - عمارة الوحدة المحلية', en: 'Main Street - Civic Building' },
        phone: '01188776655',
        donationExample: { ar: 'سهم علاج مريض 100 ج.م أو التطوع بالوقت', en: '100 EGP Patient Medicine Share or Volunteer' }
      }
    ]
  : [];

export const VILLAGE_OTHER_SERVICES: OtherService[] = IS_DEV
  ? [
      {
        id: 'oth-1',
        villageId: 'noqbas',
        name: { ar: 'مكتبة ومركز تصوير الرسالة', en: 'Al-Resala Print & Stationery' },
        activityType: { ar: 'طباعة، تصوير مستندات وأدوات مدرسية', en: 'Printing, Copying & School Supplies' },
        description: { ar: 'تصوير أبيض وألوان، طباعة أبحاث، تغليف حراري، وتجهيز ملفات التقديم', en: 'B&W/color printing, binding, laminating, and official paperwork prep' },
        address: { ar: 'أمام المدرسة الإعدادية - نقباس', en: 'In front of Prep School - Noqbas' },
        priceLabel: { ar: 'من 2 ج.م / ورقة', en: 'From 2 EGP / page' },
        hours: { ar: 'يومياً: 8 ص - 9 م', en: 'Daily: 8 AM - 9 PM' },
        phone: '01022113344'
      },
      {
        id: 'oth-2',
        villageId: 'noqbas',
        name: { ar: 'سنتر صيانة الموبايلات والإلكترونيات', en: 'Mobile Repair & Accessories Hub' },
        activityType: { ar: 'صيانة موبايلات، شواحن وأكسسوارات', en: 'Smartphone Repair & Accessories' },
        description: { ar: 'تغيير شاشات وبطاريات أصلية، سوفت وير، وشحن رصيد وفواتير فوري', en: 'Screen/battery replacements, software service, and bill payments' },
        address: { ar: 'الشارع العمومي - وسط البلد', en: 'Main Street - Village Center' },
        priceLabel: { ar: 'كشف الأعطال مجاني', en: 'Free Diagnostics' },
        hours: { ar: '10 ص - 11 م', en: '10 AM - 11 PM' },
        phone: '01133224455'
      },
      {
        id: 'oth-3',
        villageId: 'noqbas',
        name: { ar: 'مغسلة السجاد والبطاطين الحديثة', en: 'Modern Carpet & Blanket Laundry' },
        activityType: { ar: 'غسيل وتجفيف سجاد وبطاطين بالمنزل', en: 'Carpet & Blanket Washing Service' },
        description: { ar: 'استلام السجاد والبطاطين من البيت وتعطيرها وتسليمها خلال 48 ساعة', en: 'Home pickup and delivery within 48 hours with deep sanitization' },
        address: { ar: 'مدخل القرية البحري', en: 'North Village Entrance' },
        priceLabel: { ar: '35 ج.م / متر سجاد', en: '35 EGP / sq.meter' },
        hours: { ar: '9 ص - 8 م', en: '9 AM - 8 PM' },
        phone: '01244556677'
      }
    ]
  : [];

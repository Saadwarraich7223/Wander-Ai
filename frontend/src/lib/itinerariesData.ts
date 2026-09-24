export interface ItineraryStop {
  placeName: string;
  placeSlug?: string;
  timing: string;
  durationHours: number;
  highlight: string;
  elevationMeters?: number;
  tips?: string;
  image?: string;
}

export interface ItineraryDay {
  dayNumber: number;
  title: string;
  summary: string;
  overnightLocation: string;
  transitHours: number;
  stops: ItineraryStop[];
}

export interface ItineraryFaq {
  question: string;
  answer: string;
}

export interface CuratedItinerary {
  slug: string;
  title: string;
  subtitle: string;
  region: string;
  primaryCity: string;
  originHub: string;
  durationDays: number;
  activityLevel: "low" | "moderate" | "high";
  vehicleAccess: "sedan" | "crossover" | "suv_4x4";
  bestSeason: string;
  elevationRangeMeters: string;
  corridorName?: string;
  passabilityStatus?: string;
  gradeLabel?: string;
  estimatedBudgetPKR: {
    backpacker: number;
    moderate: number;
    luxury: number;
  };
  heroImage: string;
  summary: string;
  highlights: string[];
  days: ItineraryDay[];
  faqs: ItineraryFaq[];
  plannerParams: {
    destination: string;
    origin: string;
    days: number;
    budget: number;
    pace: "relaxed" | "balanced" | "intensive";
    travelStyle: "solo" | "couple" | "family" | "crew";
  };
}

export const CURATED_ITINERARIES: CuratedItinerary[] = [
  {
    slug: "hunza-3-day-express",
    title: "3-Day Hunza Valley & Karakoram Express",
    subtitle: "Ancient Silk Road Forts, Glacial Turquoise Lakes & 4,693m Khunjerab Border",
    region: "Gilgit-Baltistan",
    primaryCity: "Hunza Valley",
    originHub: "Gilgit / Islamabad",
    durationDays: 3,
    activityLevel: "moderate",
    vehicleAccess: "sedan",
    bestSeason: "April to October (Spring Blossoms & Autumn Gold)",
    elevationRangeMeters: "2,400m – 4,693m",
    corridorName: "Corridor Route: N-35 Karakoram Highway",
    passabilityStatus: "Passability: 100% Operational",
    gradeLabel: "Grade: Moderate",
    estimatedBudgetPKR: {
      backpacker: 25000,
      moderate: 48000,
      luxury: 95000,
    },
    heroImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Passu_Cones_Hunza.jpg/1200px-Passu_Cones_Hunza.jpg",
    summary: "The quintessential Northern Pakistan road trip. Trace the Karakoram Highway past 7,000m peaks, explore 900-year-old Baltit and Altit Forts, cruise on Attabad Lake, and reach the world's highest paved international border at Khunjerab Pass.",
    highlights: [
      "Panoramic sunrise view of Rakaposhi (7,788m) and Ladyfinger Peak",
      "900-year-old royal Tibetan-influenced architecture of Baltit & Altit Forts",
      "Jet boating and kayaking on the turquoise waters of Attabad Lake",
      "Passu Cones cathedral spires and thrilling Hussaini Suspension Bridge",
      "Pak-China Friendship Border & world's highest ATM at Khunjerab Pass (4,693m)",
    ],
    days: [
      {
        dayNumber: 1,
        title: "Gilgit Arrival, Rakaposhi View & Karimabad Heritage Forts",
        summary: "Drive along the legendary KKH to Karimabad. Tour the royal living quarters of Baltit Fort and watch sunset from Eagle's Nest overlooking the entire Hunza Valley.",
        overnightLocation: "Karimabad, Hunza",
        transitHours: 2.5,
        stops: [
          {
            placeName: "Rakaposhi View Point",
            placeSlug: "rakaposhi-viewpoint",
            timing: "10:30 AM",
            durationHours: 1,
            highlight: "Direct sightline to 7,788m ice wall with mountain river tea stop.",
            elevationMeters: 1950,
            tips: "Try local walnut cake and hot chai at the viewpoint cafes.",
          },
          {
            placeName: "Baltit Fort",
            placeSlug: "baltit-fort-hunza",
            timing: "02:00 PM",
            durationHours: 2,
            highlight: "900-year-old UNESCO heritage fortress perched high above Karimabad.",
            elevationMeters: 2438,
            tips: "Guided heritage tours run every 30 minutes in English and Urdu.",
          },
          {
            placeName: "Eagle's Nest (Duikar)",
            placeSlug: "eagles-nest-duikar",
            timing: "05:30 PM",
            durationHours: 1.5,
            highlight: "360-degree sunset panorama of 7 towering peaks including Golden Peak & Ultar Sar.",
            elevationMeters: 2850,
            tips: "Bring a light windbreaker; temperatures drop rapidly after dusk.",
          },
        ],
      },
      {
        dayNumber: 2,
        title: "Attabad Lake, Passu Cones & Hussaini Bridge",
        summary: "Head into Upper Hunza (Gojal). Speedboat across Attabad Lake, traverse the wooden slats of Hussaini Bridge, and admire the jagged Passu Cones.",
        overnightLocation: "Passu / Gulmit",
        transitHours: 2.0,
        stops: [
          {
            placeName: "Attabad Lake",
            placeSlug: "attabad-lake-hunza",
            timing: "09:30 AM",
            durationHours: 2,
            highlight: "Formed in 2010 landslide, renowned for its luminous turquoise glacial water.",
            elevationMeters: 2557,
            tips: "Speedboat ride costs ~PKR 2,500 for a 20-minute tour across the cliff face.",
          },
          {
            placeName: "Hussaini Suspension Bridge",
            placeSlug: "hussaini-bridge-passu",
            timing: "01:30 PM",
            durationHours: 1,
            highlight: "Historic wooden cable suspension bridge swinging above the Hunza River.",
            elevationMeters: 2600,
            tips: "Hold onto cables with both hands and avoid visiting in high-wind conditions.",
          },
          {
            placeName: "Passu Cathedral Cones & Glacier",
            placeSlug: "passu-cones-hunza",
            timing: "03:30 PM",
            durationHours: 2.5,
            highlight: "Dramatic razor-sharp granite needles rising to 6,106m.",
            elevationMeters: 2700,
            tips: "Taste authentic organic apricot juice and yak burgers at Glacier Breeze Restaurant.",
          },
        ],
      },
      {
        dayNumber: 3,
        title: "Sost Dry Port & Khunjerab Pass (Pak-China Border @ 4,693m)",
        summary: "Ascend through Khunjerab National Park to the international border. Spot Himalayan ibex, visit the world's highest ATM, and begin return transit.",
        overnightLocation: "Gilgit / Karimabad",
        transitHours: 4.5,
        stops: [
          {
            placeName: "Sost Bazaar & Dry Port",
            placeSlug: "sost-bazaar-border",
            timing: "09:00 AM",
            durationHours: 1,
            highlight: "Last Pakistani settlement before China, featuring imported goods and jade.",
            elevationMeters: 2800,
            tips: "Ensure everyone has original CNICs / Passports for the national park checkpost.",
          },
          {
            placeName: "Khunjerab National Park & Border Pass",
            placeSlug: "khunjerab-pass-pak-china",
            timing: "11:30 AM",
            durationHours: 2,
            highlight: "Monumental border gate at 4,693m AMSL surrounded by snow-capped peaks.",
            elevationMeters: 4693,
            tips: "Keep visits under 45 minutes to prevent acute mountain sickness (AMS). Dress in heavy thermal layers.",
          },
        ],
      },
    ],
    faqs: [
      {
        question: "Is Hunza accessible by normal sedan cars?",
        answer: "Yes! The entire Karakoram Highway (KKH) from Islamabad and Gilgit to Khunjerab Pass is 100% paved, smooth asphalt and fully accessible by sedans, crossovers, and passenger coasters.",
      },
      {
        question: "What is the best month to visit Hunza Valley?",
        answer: "April to May is ideal for apricot and cherry blossoms. June to August is great for summer warmth and high passes. October to early November offers world-famous golden autumn foliage.",
      },
      {
        question: "Is high altitude sickness a concern on this itinerary?",
        answer: "Karimabad (2,400m) and Passu (2,700m) are very comfortable. Khunjerab Pass reaches 4,693m, so stay hydrated and avoid strenuous running at the border gate.",
      },
    ],
    plannerParams: {
      destination: "Hunza Valley & Gojal, Gilgit-Baltistan",
      origin: "Islamabad (Islamabad Capital)",
      days: 3,
      budget: 48000,
      pace: "balanced",
      travelStyle: "couple",
    },
  },
  {
    slug: "skardu-5-day-classic",
    title: "5-Day Skardu & Deosai High Plateau Expedition",
    subtitle: "Shangrila Resort, Katpana Cold Desert Dunes, Shigar Fort & Land of Giants",
    region: "Gilgit-Baltistan",
    primaryCity: "Skardu",
    originHub: "Skardu Airport / Islamabad",
    durationDays: 5,
    activityLevel: "moderate",
    vehicleAccess: "suv_4x4",
    bestSeason: "May to October (Deosai plateau open June–September)",
    elevationRangeMeters: "2,228m – 4,114m",
    corridorName: "Corridor: Indus & Shigar River Basin",
    passabilityStatus: "Deosai Snow Clearance: Validated",
    gradeLabel: "Grade: Alpine 4x4",
    estimatedBudgetPKR: {
      backpacker: 38000,
      moderate: 72000,
      luxury: 145000,
    },
    heroImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Shangrila_Resort_Skardu.jpg/1200px-Shangrila_Resort_Skardu.jpg",
    summary: "A world-class expedition into the heart of Baltistan. From the heart-shaped Shangrila Lake and windswept dunes of Katpana Cold Desert to the 4,000m wilderness of Deosai Plains and 400-year-old Raja Palaces in Shigar and Khaplu.",
    highlights: [
      "Serene sunrise at Shangrila Lower Kachura Lake & Upper Kachura boat ride",
      "Stargazing and sunset over white sand dunes in Katpana Cold Desert (2,228m)",
      "400-year-old restored timber palace at Shigar Serena Fort",
      "4x4 safari across Deosai Plains (4,114m) and crystal-clear Sheosar Lake",
      "Royal gardens and Chaqchan 14th-century wooden mosque in Khaplu",
    ],
    days: [
      {
        dayNumber: 1,
        title: "Skardu Arrival & Shangrila Kachura Lakes",
        summary: "Arrive via scenic Skardu flight. Explore the legendary Shangrila Resort around Lower Kachura and hike to the untamed Upper Kachura Lake for trout lunch.",
        overnightLocation: "Kachura / Skardu",
        transitHours: 1.0,
        stops: [
          {
            placeName: "Shangrila Resort (Lower Kachura Lake)",
            placeSlug: "shangrila-resort-skardu",
            timing: "11:00 AM",
            durationHours: 2.5,
            highlight: "Chinese pagoda architecture bordering a natural heart-shaped mountain lake.",
            elevationMeters: 2228,
            tips: "Non-resident day visitors pay a nominal entry ticket at the reception gate.",
          },
          {
            placeName: "Upper Kachura Lake",
            placeSlug: "upper-kachura-lake-skardu",
            timing: "02:30 PM",
            durationHours: 2,
            highlight: "Deep pristine mountain lake surrounded by apricot orchards and pine forest.",
            elevationMeters: 2280,
            tips: "Enjoy fresh pan-fried local river trout at the lakeside open-air shacks.",
          },
        ],
      },
      {
        dayNumber: 2,
        title: "Katpana Cold Desert Dunes & Manthal Buddha Rock",
        summary: "Discover the world's highest cold desert with rolling white sand dunes set against snow-capped granite cliffs, followed by 8th-century Buddhist relief carvings.",
        overnightLocation: "Skardu Town",
        transitHours: 1.5,
        stops: [
          {
            placeName: "Katpana Cold Desert",
            placeSlug: "katpana-cold-desert-skardu",
            timing: "09:30 AM",
            durationHours: 2.5,
            highlight: "Surreal wind-sculpted sand dunes surrounded by snowy Karakoram mountains.",
            elevationMeters: 2228,
            tips: "Sunset and night astrophotography here are phenomenal under clear skies.",
          },
          {
            placeName: "Manthal Buddha Rock",
            placeSlug: "manthal-buddha-skardu",
            timing: "03:00 PM",
            durationHours: 1,
            highlight: "Carved granite monolith from the 8th century depicting Buddha and Bodhisattvas.",
            elevationMeters: 2300,
            tips: "Located in a quiet village just 15 minutes south of Skardu bazaar.",
          },
        ],
      },
      {
        dayNumber: 3,
        title: "Shigar Valley, Sarfaranga Desert & Fort on the Rock",
        summary: "Cross the mighty Indus River into Shigar Valley. Visit Sarfaranga desert rally track and tour Fong-Khar (Fort on the Rock) built in 1600 AD.",
        overnightLocation: "Shigar",
        transitHours: 1.5,
        stops: [
          {
            placeName: "Sarfaranga Cold Desert",
            placeSlug: "sarfaranga-desert-shigar",
            timing: "10:00 AM",
            durationHours: 1.5,
            highlight: "Vast desert expanse famous for annual international jeep and dirt bike rallies.",
            elevationMeters: 2250,
            tips: "Quad bike rentals are available near the main road parking.",
          },
          {
            placeName: "Shigar Fort (Fong-Khar)",
            placeSlug: "shigar-fort-palace",
            timing: "01:30 PM",
            durationHours: 2.5,
            highlight: "400-year-old restored Raja palace featuring Kashmiri wood carvings and museum.",
            elevationMeters: 2290,
            tips: "Enjoy high tea in the royal garden orchard under walnut trees.",
          },
        ],
      },
      {
        dayNumber: 4,
        title: "Deosai National Park & Sheosar Lake 4x4 Safari",
        summary: "Scale the Ali Malik pass to the 4,114m Deosai plateau (Land of Giants). Cross alpine rivers and photograph wildflowers and Himalayan brown bears.",
        overnightLocation: "Skardu Town",
        transitHours: 4.5,
        stops: [
          {
            placeName: "Ali Malik Pass & Deosai Gate",
            placeSlug: "ali-malik-pass-deosai",
            timing: "09:30 AM",
            durationHours: 1,
            highlight: "Steep switchback entry pass opening onto the vast endless plateau.",
            elevationMeters: 4080,
            tips: "4x4 high-clearance jeep is mandatory for this sector.",
          },
          {
            placeName: "Sheosar Lake & Deosai Plains",
            placeSlug: "sheosar-lake-deosai",
            timing: "12:00 PM",
            durationHours: 3,
            highlight: "Heart-shaped high-altitude lake mirroring Nanga Parbat on clear days.",
            elevationMeters: 4142,
            tips: "Pack a packed lunch and thermos; there are no permanent restaurants on the plateau.",
          },
        ],
      },
      {
        dayNumber: 5,
        title: "Khaplu Palace & Chaqchan Wooden Mosque",
        summary: "Journey to the eastern edge of Baltistan along the Shyok River. Explore the Yabgo royal residence at Khaplu and the ancient Chaqchan mosque.",
        overnightLocation: "Skardu / Departure",
        transitHours: 3.5,
        stops: [
          {
            placeName: "Khaplu Palace (Yabgo Khar)",
            placeSlug: "khaplu-palace-baltistan",
            timing: "10:30 AM",
            durationHours: 2,
            highlight: "1840 royal architectural marvel restored by the Aga Khan Trust for Culture.",
            elevationMeters: 2600,
            tips: "Visit the rooftop balcony for scenic views of the Shyok valley.",
          },
          {
            placeName: "Chaqchan Mosque",
            placeSlug: "chaqchan-mosque-khaplu",
            timing: "01:30 PM",
            durationHours: 1,
            highlight: "1370 AD wooden mosque founded by Mir Sayyid Ali Hamadani.",
            elevationMeters: 2610,
            tips: "Remarkable blend of Islamic, Tibetan, and Persian woodwork.",
          },
        ],
      },
    ],
    faqs: [
      {
        question: "Do I need a 4x4 vehicle for Skardu?",
        answer: "Skardu city, Shangrila, Katpana, and Shigar are reachable via standard cars. However, Deosai National Park strictly requires a high-clearance 4x4 Jeep.",
      },
      {
        question: "When is Deosai National Park open?",
        answer: "Deosai is snowbound most of the year. The park gates are open for vehicular access from approximately June 15 to October 15.",
      },
      {
        question: "How reliable are Islamabad to Skardu flights?",
        answer: "PIA and Airblue operate direct flights daily. Flights are weather-dependent; the newly upgraded Skardu All-Weather International Airport has significantly improved reliability.",
      },
    ],
    plannerParams: {
      destination: "Skardu & Deosai Plains, Gilgit-Baltistan",
      origin: "Islamabad (Islamabad Capital)",
      days: 5,
      budget: 72000,
      pace: "balanced",
      travelStyle: "couple",
    },
  },
  {
    slug: "lahore-2-day-cultural-weekend",
    title: "2-Day Lahore Walled City & Mughal Heritage Weekend",
    subtitle: "Imperial Badshahi Mosque, Shahi Qila, Wazir Khan Frescoes & Food Street",
    region: "Punjab",
    primaryCity: "Lahore",
    originHub: "Lahore / All Airports",
    durationDays: 2,
    activityLevel: "low",
    vehicleAccess: "sedan",
    bestSeason: "October to March (Pleasant Autumn & Winter Bazaars)",
    elevationRangeMeters: "217m AMSL",
    corridorName: "Corridor: Grand Trunk Road Historical Axis",
    passabilityStatus: "Walk Index: 14,000 steps/day",
    gradeLabel: "Grade: Cultural Walk",
    estimatedBudgetPKR: {
      backpacker: 12000,
      moderate: 28000,
      luxury: 65000,
    },
    heroImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Badshahi_Mosque_Lahore.jpg/1200px-Badshahi_Mosque_Lahore.jpg",
    summary: "Immerse yourself in centuries of Mughal grandeur, Sikh royalty, and world-renowned Punjabi culinary heritage. Tour the 16th-century Walled City on foot, admire illuminated minarets from Fort Road, and witness the patriotic Wagah Border ceremony.",
    highlights: [
      "Illuminated marble courtyards and red sandstone domes of Badshahi Mosque",
      "UNESCO World Heritage Lahore Fort, Sheesh Mahal (Palace of Mirrors) & Picture Wall",
      "Intricate Persian tile mosaics and frescoes of 17th-century Wazir Khan Mosque",
      "Traditional breakfast of Nihari & Halwa Puri on historic Delhi Gate trail",
      "Rooftop dining with frontal views of the illuminated Mughal monuments on Fort Road",
    ],
    days: [
      {
        dayNumber: 1,
        title: "Mughal Imperial Core & Fort Road Gastronomy",
        summary: "Spend day one exploring the majestic monuments of the Mughal Empire in Greater Iqbal Park and dining at the world-famous Fort Road Food Street.",
        overnightLocation: "Gulberg / Mall Road, Lahore",
        transitHours: 1.0,
        stops: [
          {
            placeName: "Badshahi Mosque",
            placeSlug: "badshahi-mosque-lahore",
            timing: "09:30 AM",
            durationHours: 2,
            highlight: "One of the largest imperial mosques in the world, built by Aurangzeb in 1673.",
            elevationMeters: 217,
            tips: "Modest attire covering shoulders and head is required. Remove shoes at the gate.",
          },
          {
            placeName: "Lahore Fort (Shahi Qila)",
            placeSlug: "lahore-fort-shahi-qila",
            timing: "12:00 PM",
            durationHours: 3,
            highlight: "Sheesh Mahal (Palace of Mirrors), Diwan-i-Aam, and the restored 400m Picture Wall.",
            elevationMeters: 217,
            tips: "Hire an authorized WCLA licensed tour guide for deep historical context.",
          },
          {
            placeName: "Fort Road Food Street",
            placeSlug: "fort-road-food-street",
            timing: "07:30 PM",
            durationHours: 2.5,
            highlight: "Rooftop dining overlooking the glowing illuminated minarets of Badshahi Mosque.",
            elevationMeters: 217,
            tips: "Book a rooftop table at Cooco's Den or Haveli Restaurant in advance for best views.",
          },
        ],
      },
      {
        dayNumber: 2,
        title: "Walled City Trail, Shalimar Gardens & Wagah Border",
        summary: "Step through historic Delhi Gate into the Mughal royal bath (Shahi Hammam), visit Wazir Khan Mosque, stroll through Shalimar Gardens, and watch the Wagah ceremony.",
        overnightLocation: "Lahore Departure",
        transitHours: 2.0,
        stops: [
          {
            placeName: "Shahi Hammam & Wazir Khan Mosque",
            placeSlug: "wazir-khan-mosque-lahore",
            timing: "09:00 AM",
            durationHours: 2.5,
            highlight: "Restored 17th-century Turkish-style bathhouse and sublime Persian tilework.",
            elevationMeters: 217,
            tips: "Walk through the spice and fabric bazaars between Delhi Gate and Chitta Gate.",
          },
          {
            placeName: "Shalimar Gardens",
            placeSlug: "shalimar-gardens-lahore",
            timing: "12:30 PM",
            durationHours: 1.5,
            highlight: "UNESCO-inscribed 3-tiered Mughal paradise gardens with 410 fountains.",
            elevationMeters: 217,
            tips: "Visit during late afternoon when the marble pavilions reflect warm golden sunlight.",
          },
          {
            placeName: "Wagah Border Flag Lowering Ceremony",
            placeSlug: "wagah-border-lahore",
            timing: "04:30 PM",
            durationHours: 2,
            highlight: "Electrifying daily military parade between Pakistan Rangers and Indian BSF.",
            elevationMeters: 217,
            tips: "Arrive by 4:00 PM to clear security. Carry your original CNIC or passport.",
          },
        ],
      },
    ],
    faqs: [
      {
        question: "When is the best season to tour Lahore?",
        answer: "November to March is ideal with cool, pleasant temperatures (12°C–24°C) perfect for walking through historical bazaars and open-air food streets.",
      },
      {
        question: "Is public transit available for this itinerary?",
        answer: "Yes! Lahore has the modern Orange Line Metro and Metrobus system, as well as affordable ride-hailing (Careem, Indrive, Yango).",
      },
    ],
    plannerParams: {
      destination: "Lahore, Punjab",
      origin: "Lahore (Punjab)",
      days: 2,
      budget: 28000,
      pace: "balanced",
      travelStyle: "couple",
    },
  },
  {
    slug: "swat-kalam-4-day-alpine-escape",
    title: "4-Day Swat Valley & Kalam Alpine Waters Tour",
    subtitle: "Switzerland of the East: Malam Jabba Ski Slopes, Ushu Pine Forest & Mahodand Lake",
    region: "Khyber Pakhtunkhwa",
    primaryCity: "Swat Valley",
    originHub: "Islamabad / Peshawar",
    durationDays: 4,
    activityLevel: "moderate",
    vehicleAccess: "crossover",
    bestSeason: "May to October (Summer green) or Dec to Feb (Skiing)",
    elevationRangeMeters: "980m – 2,865m",
    corridorName: "Corridor: Swat River Corridor & M-16",
    passabilityStatus: "Expressway: M-16 Operational",
    gradeLabel: "Grade: Easy-Moderate",
    estimatedBudgetPKR: {
      backpacker: 28000,
      moderate: 52000,
      luxury: 110000,
    },
    heroImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Mahodand_Lake_Swat.jpg/1200px-Mahodand_Lake_Swat.jpg",
    summary: "Known as the Switzerland of Pakistan, Swat Valley offers lush pine valleys, rushing emerald trout streams, Buddhist stupas, and alpine glacial lakes at Mahodand.",
    highlights: [
      "Smooth cruising via the scenic Swat Expressway into Mingora",
      "Chairlift and zipline adventures at Malam Jabba High-Altitude Resort (2,804m)",
      "Dense misty pine trails of the ancient Ushu Forest",
      "4x4 expedition to the turquoise glacial waters of Mahodand & Saifullah Lakes",
      "Traditional trout fish fried fresh alongside the gushing Swat River in Bahrain",
    ],
    days: [
      {
        dayNumber: 1,
        title: "Swat Expressway, White Palace & Mingora Bazaar",
        summary: "Depart Islamabad via Swat Motorway. Visit the historic white marble palace at Marghazar and explore Mingora's gemstones and trout bazaars.",
        overnightLocation: "Mingora / Fizza Ghat",
        transitHours: 3.5,
        stops: [
          {
            placeName: "White Palace Marghazar",
            placeSlug: "white-palace-marghazar-swat",
            timing: "01:30 PM",
            durationHours: 2,
            highlight: "1940 royal summer residence constructed entirely from white Swat marble.",
            elevationMeters: 1200,
            tips: "Walk through the terraced royal gardens and natural mountain spring.",
          },
        ],
      },
      {
        dayNumber: 2,
        title: "Malam Jabba Ski Resort & Chairlift Heights",
        summary: "Ascend the winding pine road to Malam Jabba. Ride the scenic chairlift, try the alpine zipline, and admire sweeping views of the Hindu Kush range.",
        overnightLocation: "Malam Jabba / Bahrain",
        transitHours: 2.5,
        stops: [
          {
            placeName: "Malam Jabba Ski Resort",
            placeSlug: "malam-jabba-resort-swat",
            timing: "10:30 AM",
            durationHours: 3.5,
            highlight: "Pakistan's premier ski and adventure resort with chairlift, zipline, and luxury hotels.",
            elevationMeters: 2804,
            tips: "Chairlift tickets are bought at the base terminal. Jackets recommended year-round.",
          },
        ],
      },
      {
        dayNumber: 3,
        title: "Kalam Valley, Ushu Pine Forest & Mahodand Lake",
        summary: "Travel north along the Swat River to Kalam. Transfer to a 4x4 jeep through the towering Ushu pine forest to Mahodand and Saifullah Lakes.",
        overnightLocation: "Kalam Valley",
        transitHours: 3.5,
        stops: [
          {
            placeName: "Ushu Pine Forest",
            placeSlug: "ushu-forest-kalam",
            timing: "10:00 AM",
            durationHours: 1.5,
            highlight: "Massive dense Himalayan cedar and pine forest with rushing river streams.",
            elevationMeters: 2200,
            tips: "Great spot for photography and morning nature walks.",
          },
          {
            placeName: "Mahodand Glacial Lake",
            placeSlug: "mahodand-lake-swat",
            timing: "12:30 PM",
            durationHours: 3,
            highlight: "Expansive high-altitude lake surrounded by meadows, waterfalls, and snow peaks.",
            elevationMeters: 2865,
            tips: "Boat rides and horse riding available along the lakeside meadows.",
          },
        ],
      },
      {
        dayNumber: 4,
        title: "Bahrain Riverside Bazaar & Return Transit",
        summary: "Stop in Bahrain town to watch local wood craftsmen, enjoy hot river trout, and return smoothly to Islamabad.",
        overnightLocation: "Islamabad Departure",
        transitHours: 4.5,
        stops: [
          {
            placeName: "Bahrain Riverside Trout Bazaars",
            placeSlug: "bahrain-swat-river",
            timing: "11:00 AM",
            durationHours: 1.5,
            highlight: "Confluence of Daral and Swat rivers with traditional carved woodwork shops.",
            elevationMeters: 1400,
            tips: "Purchase locally grown dried walnuts, honey, and handmade woolen shawls.",
          },
        ],
      },
    ],
    faqs: [
      {
        question: "Is Swat Expressway fully operational?",
        answer: "Yes! The Swat Motorway (M-16) is a modern 4-lane high-speed expressway reducing drive time from Islamabad to Mingora to under 3.5 hours.",
      },
      {
        question: "Do I need a 4x4 jeep for Mahodand Lake?",
        answer: "The road from Mingora to Kalam is paved. However, the 35km track from Kalam to Mahodand Lake is rough and unpaved, requiring a local 4x4 Jeep.",
      },
    ],
    plannerParams: {
      destination: "Swat & Kalam Emerald Valleys, Khyber Pakhtunkhwa",
      origin: "Islamabad (Islamabad Capital)",
      days: 4,
      budget: 52000,
      pace: "balanced",
      travelStyle: "family",
    },
  },
  {
    slug: "neelum-valley-4-day-kashmir-trail",
    title: "4-Day Neelum Valley & Arang Kel Kashmir Trail",
    subtitle: "Ratti Gali Glacial Lake, Sharda Peeth Ruins & Pearl of Neelum Heights",
    region: "Azad Kashmir",
    primaryCity: "Neelum Valley",
    originHub: "Islamabad / Muzaffarabad",
    durationDays: 4,
    activityLevel: "high",
    vehicleAccess: "suv_4x4",
    bestSeason: "May to October (Lush Alpine Blooms & Pleasant Weather)",
    elevationRangeMeters: "1,524m – 3,700m",
    corridorName: "Corridor: Neelum River Axis",
    passabilityStatus: "Cable Dolly: Operational",
    gradeLabel: "Grade: Moderate Hike",
    estimatedBudgetPKR: {
      backpacker: 26000,
      moderate: 48000,
      luxury: 105000,
    },
    heroImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Arang_Kel_Neelum_Valley.jpg/1200px-Arang_Kel_Neelum_Valley.jpg",
    summary: "Follow the azure Neelum River along the Line of Control. Ride the open-air cable car to the fairytale meadow of Arang Kel, explore the 2,000-year-old Buddhist/Hindu university at Sharda Peeth, and trek to Ratti Gali alpine lake.",
    highlights: [
      "Drive along the crystal Neelum River separating Pakistani and Indian Kashmir",
      "Dhani Waterfall and river-border viewpoints in Keran",
      "Historical stone sanctum of 6th-century Sharda Peeth Temple",
      "Cable car crossing and hike to Arang Kel — known as the Pearl of Neelum Valley",
      "4x4 jeep safari and optional horse trek to cobalt-blue Ratti Gali Lake (3,700m)",
    ],
    days: [
      {
        dayNumber: 1,
        title: "Muzaffarabad, Dhani Waterfall & Keran Border",
        summary: "Depart Islamabad past Muzaffarabad. Stop at roaring Dhani Waterfall and check into riverside cottages at Keran overlooking the opposite river bank.",
        overnightLocation: "Keran / Upper Neelum",
        transitHours: 4.5,
        stops: [
          {
            placeName: "Dhani Waterfall",
            placeSlug: "dhani-waterfall-muzaffarabad",
            timing: "01:00 PM",
            durationHours: 1,
            highlight: "Massive roadside cascade tumbling down lush green rock walls.",
            elevationMeters: 1050,
            tips: "Slippery rocks; wear shoes with strong rubber grip.",
          },
          {
            placeName: "Keran Riverbank",
            placeSlug: "keran-neelum-river",
            timing: "04:30 PM",
            durationHours: 2,
            highlight: "Peaceful river border town with scenic wooden riverfront lodges.",
            elevationMeters: 1524,
            tips: "Cellular signal (SCOM network) is available here.",
          },
        ],
      },
      {
        dayNumber: 2,
        title: "Sharda Peeth Ancient Ruins & Kel Village",
        summary: "Drive to Sharda to explore the 2,000-year-old temple ruins, then proceed deeper into the valley to Kel.",
        overnightLocation: "Kel / Sharda",
        transitHours: 2.5,
        stops: [
          {
            placeName: "Sharda Peeth Ruins",
            placeSlug: "sharda-peeth-neelum",
            timing: "10:30 AM",
            durationHours: 2,
            highlight: "Ancient learning academy and sacred stone temple dating to the 6th century.",
            elevationMeters: 1981,
            tips: "Walk up the stone steps for sweeping views of the Shardi and Nardi peaks.",
          },
        ],
      },
      {
        dayNumber: 3,
        title: "Arang Kel Cable Car & Fairytale Alpine Meadow",
        summary: "Take the Kel cable lift across the gorge and hike up through pine forests to the heavenly plateau of Arang Kel (2,550m).",
        overnightLocation: "Kel / Keran",
        transitHours: 2.0,
        stops: [
          {
            placeName: "Arang Kel",
            placeSlug: "arang-kel-neelum-valley",
            timing: "09:00 AM",
            durationHours: 5,
            highlight: "Lush green alpine village surrounded by snowy peaks, wooden houses, and wildflowers.",
            elevationMeters: 2550,
            tips: "Hike takes ~45 minutes from the cable car station. Moderate fitness required.",
          },
        ],
      },
      {
        dayNumber: 4,
        title: "Kutton Jagran Hydro & Return to Islamabad",
        summary: "Visit Kutton waterfall in Jagran Valley and journey back comfortably to Islamabad.",
        overnightLocation: "Islamabad Departure",
        transitHours: 5.5,
        stops: [
          {
            placeName: "Kutton Jagran Valley",
            placeSlug: "kutton-waterfall-jagran",
            timing: "11:00 AM",
            durationHours: 1.5,
            highlight: "Hydroelectric stream and pine resort nestled in a side valley.",
            elevationMeters: 1460,
            tips: "Great stop for fresh lunch before entering the expressway.",
          },
        ],
      },
    ],
    faqs: [
      {
        question: "Is Neelum Valley safe for tourists?",
        answer: "Yes, Neelum Valley is peaceful, welcoming, and open to all domestic and international travelers. Foreign tourists should carry their original passports and visas for routine checkposts.",
      },
      {
        question: "What mobile network works in Neelum Valley?",
        answer: "Special Communications Organization (SCOM) is the primary telecom provider in Azad Kashmir. SCOM 4G SIM cards can be purchased in Muzaffarabad or Keran.",
      },
    ],
    plannerParams: {
      destination: "Neelum Valley, Azad Kashmir",
      origin: "Islamabad (Islamabad Capital)",
      days: 4,
      budget: 48000,
      pace: "balanced",
      travelStyle: "crew",
    },
  },
  {
    slug: "makran-coastal-highway-6-day",
    title: "6-Day Makran Coastal Highway & Hingol Safari",
    subtitle: "Kund Malir Golden Beach, Princess of Hope & Deep-Sea Port of Gwadar",
    region: "Balochistan",
    primaryCity: "Makran Coast",
    originHub: "Karachi",
    durationDays: 6,
    activityLevel: "low",
    vehicleAccess: "sedan",
    bestSeason: "October to March (Gentle Coastal Breezes & Warm Sun)",
    elevationRangeMeters: "Sea Level – 120m",
    corridorName: "Corridor: Makran Coastal Highway (N-10)",
    passabilityStatus: "Highway: N-10 Paved Perfect",
    gradeLabel: "Grade: Coastal Safari",
    estimatedBudgetPKR: {
      backpacker: 32000,
      moderate: 64000,
      luxury: 125000,
    },
    heroImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Princess_of_Hope_Hingol.jpg/1200px-Princess_of_Hope_Hingol.jpg",
    summary: "Traverse 650km of pristine Arabian Sea coastline through the otherworldly mud volcanoes and carved rock sculptures of Hingol National Park, virgin golden beaches at Kund Malir, and the hammerhead peninsula of Gwadar.",
    highlights: [
      "Princess of Hope and Sphinx natural wind-sculpted rock monuments",
      "Active bubbling mud volcano at Chandragup geological complex",
      "Sunset over pristine deserted golden sand at Kund Malir beach",
      "Buzi Pass dramatic serpentine turns and canyon rock walls",
      "Gwadar Hammerhead peninsula and deep-water sunset boat ride",
    ],
    days: [
      {
        dayNumber: 1,
        title: "Karachi to Kund Malir via Hingol National Park",
        summary: "Depart Karachi on the pristine N-10 highway. Photograph Chandragup mud volcano and check into beach camps at Kund Malir.",
        overnightLocation: "Kund Malir Beach",
        transitHours: 4.0,
        stops: [
          {
            placeName: "Chandragup Mud Volcano",
            placeSlug: "chandragup-volcano-hingol",
            timing: "11:00 AM",
            durationHours: 1.5,
            highlight: "Active volcanic crater cone bubbling cold mineral mud in the desert.",
            elevationMeters: 100,
            tips: "Trek up the steep mud ridge; wind is strong at the rim.",
          },
          {
            placeName: "Kund Malir Golden Beach",
            placeSlug: "kund-malir-beach-makran",
            timing: "03:30 PM",
            durationHours: 3,
            highlight: "Golden dunes meeting the blue Arabian Sea with crystal clear water.",
            elevationMeters: 5,
            tips: "Great spot for beach camping and midnight stargazing.",
          },
        ],
      },
      {
        dayNumber: 2,
        title: "Princess of Hope, Sphinx & Buzi Pass",
        summary: "Explore the surreal geology of Hingol National Park and drive through Buzi Pass to Ormara.",
        overnightLocation: "Ormara Beach",
        transitHours: 3.0,
        stops: [
          {
            placeName: "Princess of Hope & Natural Sphinx",
            placeSlug: "princess-of-hope-hingol",
            timing: "09:30 AM",
            durationHours: 2,
            highlight: "Ancient natural rock pillar carved by Arabian coastal winds.",
            elevationMeters: 60,
            tips: "Named by Hollywood actress Angelina Jolie during her 2002 UN visit.",
          },
        ],
      },
      {
        dayNumber: 3,
        title: "Ormara Turtle Beach to Gwadar Port",
        summary: "Cruise the scenic coastal straight to Gwadar. Ascend Koh-e-Batil for panoramic views of the twin hammerhead bays.",
        overnightLocation: "Gwadar",
        transitHours: 3.5,
        stops: [
          {
            placeName: "Gwadar Hammerhead & Koh-e-Batil",
            placeSlug: "gwadar-hammerhead-peninsula",
            timing: "03:00 PM",
            durationHours: 2.5,
            highlight: "Massive natural rock formation jutting into the Arabian Sea.",
            elevationMeters: 120,
            tips: "Climb the 700 steps for the famous dual-bay sunset panorama.",
          },
        ],
      },
      {
        dayNumber: 4,
        title: "Gwadar Old Town, Dhow Harbor & Marine Drive",
        summary: "Visit the traditional wooden boat craftsmen and enjoy fresh Arabian Kingfish dinner.",
        overnightLocation: "Gwadar",
        transitHours: 1.5,
        stops: [
          {
            placeName: "Gwadar Dhow Building Yard",
            placeSlug: "gwadar-dhow-yard",
            timing: "10:00 AM",
            durationHours: 2,
            highlight: "Centuries-old artisanal wooden ship construction by hand.",
            elevationMeters: 2,
            tips: "Photographers are welcomed warmly by local fishermen.",
          },
        ],
      },
      {
        dayNumber: 5,
        title: "Jiwani Sunset Point & Mangrove Coast",
        summary: "Drive to Jiwani near the Iran border. Visit Victoria Hut and watch legendary sunsets.",
        overnightLocation: "Gwadar",
        transitHours: 2.5,
        stops: [
          {
            placeName: "Jiwani Sunset Point & Victoria Hut",
            placeSlug: "jiwani-sunset-point",
            timing: "03:30 PM",
            durationHours: 2.5,
            highlight: "Historic WW2 naval watch post offering majestic coastal sunsets.",
            elevationMeters: 30,
            tips: "World-renowned sunset vantage point praised by Queen Victoria.",
          },
        ],
      },
      {
        dayNumber: 6,
        title: "Return Coastal Cruise to Karachi",
        summary: "Smooth highway return to Karachi with fresh seafood lunch stop along the coast.",
        overnightLocation: "Karimabad / Karachi Departure",
        transitHours: 7.0,
        stops: [
          {
            placeName: "Makran Highway Coastal Drive",
            placeSlug: "makran-coastal-drive",
            timing: "09:00 AM",
            durationHours: 6,
            highlight: "Unmatched 650km scenic driving experience on pristine asphalt.",
            elevationMeters: 10,
            tips: "Ensure full fuel tank before leaving Gwadar or Ormara.",
          },
        ],
      },
    ],
    faqs: [
      {
        question: "Is Makran Coastal Highway (N-10) safe for family travel?",
        answer: "Yes, N-10 is one of the safest and most beautifully paved highways in Pakistan, with regular Coast Guards checkpoints and pristine asphalt.",
      },
      {
        question: "What vehicle is needed for Gwadar and Hingol?",
        answer: "The entire N-10 highway is 100% paved. Any standard sedan, hatchback, or SUV can easily make the journey.",
      },
    ],
    plannerParams: {
      destination: "Gwadar & Makran Coast, Balochistan",
      origin: "Karachi (Sindh)",
      days: 6,
      budget: 64000,
      pace: "balanced",
      travelStyle: "crew",
    },
  },
];

export function getItineraryBySlug(slug: string): CuratedItinerary | undefined {
  return CURATED_ITINERARIES.find((item) => item.slug === slug);
}

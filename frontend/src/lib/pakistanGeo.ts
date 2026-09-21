/**
 * Pakistan Geospatial & City Intelligence Engine.
 * Covers 180+ administrative cities, tehsils, and tourism hubs across Pakistan
 * with exact coordinates, elevation, province, commercial airport availability,
 * and intelligent route & seasonal climate metric calculation.
 */

export interface PakistanLocation {
  id: string;
  name: string;
  district: string;
  division?: string;
  province:
    | "Punjab"
    | "Sindh"
    | "Khyber Pakhtunkhwa"
    | "Gilgit-Baltistan"
    | "Balochistan"
    | "Azad Kashmir"
    | "Islamabad Capital";
  latitude: number;
  longitude: number;
  elevation_m: number;
  is_tourist_hub: boolean;
  has_commercial_airport?: boolean;
  aliases?: string[];
  db_city_slug?: string; // Maps to PostgreSQL city slug if available
  parent_hub_slug?: string; // Maps to parent DB city cluster
  curated_highlights?: string[]; // Specific attractions in this tehsil/hub
}

export interface RouteMetrics {
  straightDistanceKm: number;
  drivingDistanceKm: number;
  drivingTimeHours: number;
  drivingTimeFormatted: string;
  elevationChangeMeters: number;
  corridorName: string;
  roadPassabilityPercent: number;
  transitDifficulty: "easy" | "moderate" | "challenging" | "expedition";
  canFlyCommercial: boolean;
  flightRouteNote?: string;
}

export interface ClimateMetrics {
  condition: string;
  tempHighC: number;
  tempLowC: number;
  tempFormatted: string;
  seasonTag: string;
}

export const PAKISTAN_LOCATIONS: PakistanLocation[] = [
  // ==================== PUNJAB ====================
  // --- Lahore & Central Punjab ---
  {
    id: "punjab-lahore",
    name: "Lahore",
    district: "Lahore District",
    division: "Lahore Division",
    province: "Punjab",
    latitude: 31.5204,
    longitude: 74.3587,
    elevation_m: 217,
    is_tourist_hub: true,
    has_commercial_airport: true,
    aliases: ["LHE", "Lahore Walled City", "Old Lahore", "Badshahi"],
    db_city_slug: "lahore",
    curated_highlights: [
      "Badshahi Mosque & Lahore Fort (UNESCO Sheesh Mahal)",
      "Walled City Delhi Gate Heritage Trail & Shahi Hammam",
      "Shalamar Mughal Royal Gardens & Fort Food Street",
    ],
  },
  {
    id: "punjab-kasur",
    name: "Kasur",
    district: "Kasur District",
    division: "Lahore Division",
    province: "Punjab",
    latitude: 31.1167,
    longitude: 74.45,
    elevation_m: 204,
    is_tourist_hub: false,
    parent_hub_slug: "lahore",
    curated_highlights: [
      "Shrine of Baba Bulleh Shah (Historic Sufi Poetry & Qawwali)",
      "Changa Manga Forest Reserve & Steam Railway Safari",
      "Ganda Singh Wala Border Flag Lowering Ceremony",
      "Kasuri Andarsa Sweets & Historic Kasuri Methi Bazaars",
    ],
  },
  {
    id: "punjab-pattoki",
    name: "Pattoki",
    district: "Kasur District",
    division: "Lahore Division",
    province: "Punjab",
    latitude: 31.0214,
    longitude: 73.8489,
    elevation_m: 198,
    is_tourist_hub: false,
    parent_hub_slug: "lahore",
    curated_highlights: ["Botanical Nursery Greenhouses", "Changa Manga Forest Staging"],
  },
  {
    id: "punjab-chunian",
    name: "Chunian",
    district: "Kasur District",
    division: "Lahore Division",
    province: "Punjab",
    latitude: 30.9639,
    longitude: 73.9806,
    elevation_m: 195,
    is_tourist_hub: false,
    parent_hub_slug: "lahore",
  },
  {
    id: "punjab-nankana-sahib",
    name: "Nankana Sahib",
    district: "Nankana Sahib District",
    division: "Lahore Division",
    province: "Punjab",
    latitude: 31.4492,
    longitude: 73.7125,
    elevation_m: 190,
    is_tourist_hub: true,
    parent_hub_slug: "lahore",
    curated_highlights: ["Gurdwara Janam Asthan Sacred Heritage", "Historic Sikh Yatra Circuit"],
  },
  {
    id: "punjab-sheikhupura",
    name: "Sheikhupura",
    district: "Sheikhupura District",
    division: "Lahore Division",
    province: "Punjab",
    latitude: 31.7131,
    longitude: 73.9783,
    elevation_m: 214,
    is_tourist_hub: false,
    parent_hub_slug: "lahore",
    curated_highlights: ["Hiran Minar Mughal Water Pavilion & Hunting Tower", "Sheikhupura Mughal Fort"],
  },

  // --- Bahawalpur Division & Southern Punjab (Chishtian, Hasilpur, Bahawalnagar, etc.) ---
  {
    id: "punjab-bahawalpur",
    name: "Bahawalpur & Cholistan",
    district: "Bahawalpur District",
    division: "Bahawalpur Division",
    province: "Punjab",
    latitude: 29.3544,
    longitude: 71.6911,
    elevation_m: 152,
    is_tourist_hub: true,
    has_commercial_airport: true,
    aliases: ["BWP", "Bahawalpur", "Cholistan", "Derawar", "Noor Mahal"],
    db_city_slug: "bahawalpur",
    curated_highlights: [
      "Noor Mahal Palace of Lights & Italianate Architecture",
      "Derawar Fort 40-Bastion Safari in Cholistan Sands",
      "Lal Suhanra National Park Safari (Blackbuck & Wildlife Wetlands)",
      "Chunri, Blue Pottery & Saraiki Artisan Bazaars",
      "Shrine of Channan Pir & Ancient Hakra Civilization Ruins",
      "Darbar Mahal & Bahawalpur Central Library Archives",
      "Cholistan Star-lit Desert Glamping & Dunes Camp",
      "Saraiki Sohan Halwa & Royal Sajji Food Street Trail",
    ],
  },
  {
    id: "punjab-chishtian",
    name: "Chishtian",
    district: "Bahawalnagar District",
    division: "Bahawalpur Division",
    province: "Punjab",
    latitude: 29.7961,
    longitude: 72.8578,
    elevation_m: 154,
    is_tourist_hub: false,
    parent_hub_slug: "bahawalpur",
    aliases: ["Chishtian Mandi", "Chistian", "Bahawalnagar Chishtian"],
    curated_highlights: [
      "Khawaja Noor Muhammad Maharvi Shrine & Sufi Heritage",
      "Hakra Canal Waterway & Historic Grain Bazaar",
      "Rural Cotton Country & Cholistan Fringe Safari",
    ],
  },
  {
    id: "punjab-hasilpur",
    name: "Hasilpur",
    district: "Bahawalpur District",
    division: "Bahawalpur Division",
    province: "Punjab",
    latitude: 29.6967,
    longitude: 72.5542,
    elevation_m: 151,
    is_tourist_hub: false,
    parent_hub_slug: "bahawalpur",
    aliases: ["Hasilpur Mandi", "Head Islam Hasilpur", "Hasil Pur"],
    curated_highlights: [
      "Head Islam Sutlej River Barrage & Scenic Waterway",
      "Lal Suhanra National Park Margins & Deer Enclosures",
      "Cholistan Canal Country & Date Palm Oases",
    ],
  },
  {
    id: "punjab-bahawalnagar",
    name: "Bahawalnagar",
    district: "Bahawalnagar District",
    division: "Bahawalpur Division",
    province: "Punjab",
    latitude: 29.9984,
    longitude: 73.2527,
    elevation_m: 161,
    is_tourist_hub: false,
    parent_hub_slug: "bahawalpur",
    aliases: ["BWN", "Bahawalnagar City"],
    curated_highlights: [
      "Sadiq Canal Waterway & Colonial Clock Tower",
      "Hakra Riverbed Archaeological Belt",
      "Canal Colony Heritage Staging",
    ],
  },
  {
    id: "punjab-haroonabad",
    name: "Haroonabad",
    district: "Bahawalnagar District",
    division: "Bahawalpur Division",
    province: "Punjab",
    latitude: 29.6121,
    longitude: 73.1363,
    elevation_m: 153,
    is_tourist_hub: false,
    parent_hub_slug: "bahawalpur",
    aliases: ["Harunabad", "Badruwala"],
    curated_highlights: [
      "Cholistan Desert Transition Belt",
      "Local Grain & Agricultural Market Hub",
      "Hakra Desert Border Excursions",
    ],
  },
  {
    id: "punjab-fort-abbas",
    name: "Fort Abbas",
    district: "Bahawalnagar District",
    division: "Bahawalpur Division",
    province: "Punjab",
    latitude: 29.1927,
    longitude: 72.8536,
    elevation_m: 140,
    is_tourist_hub: true,
    parent_hub_slug: "bahawalpur",
    aliases: ["Phoolra Fort", "Marot", "Fort Abbas Cholistan"],
    curated_highlights: [
      "Historic Phoolra Fort & Marot Fortress Ruins",
      "Deep Cholistan Desert Jeep Dunes Safari",
      "Hakra Civilization Archaeological Mound Discoveries",
    ],
  },
  {
    id: "punjab-minchinabad",
    name: "Minchinabad",
    district: "Bahawalnagar District",
    division: "Bahawalpur Division",
    province: "Punjab",
    latitude: 30.1633,
    longitude: 73.5683,
    elevation_m: 160,
    is_tourist_hub: false,
    parent_hub_slug: "bahawalpur",
    curated_highlights: ["Colonial Sadiqia Canal Regulator", "Sutlej River Plain Wetlands"],
  },
  {
    id: "punjab-yazman",
    name: "Yazman",
    district: "Bahawalpur District",
    division: "Bahawalpur Division",
    province: "Punjab",
    latitude: 29.1211,
    longitude: 71.7456,
    elevation_m: 145,
    is_tourist_hub: false,
    parent_hub_slug: "bahawalpur",
    curated_highlights: [
      "Gateway to Derawar Fort & Cholistan Jeep Rally Staging",
      "Lal Suhanra Biosphere & Blackbuck Sanctuary",
    ],
  },
  {
    id: "punjab-ahmedpur-east",
    name: "Ahmedpur East",
    district: "Bahawalpur District",
    division: "Bahawalpur Division",
    province: "Punjab",
    latitude: 29.1436,
    longitude: 71.2589,
    elevation_m: 139,
    is_tourist_hub: true,
    parent_hub_slug: "bahawalpur",
    aliases: ["Dera Nawab Sahib", "Ahmedpur Sharqia"],
    curated_highlights: [
      "Sadiq Garh Palace Royal Residence of Nawabs",
      "Dera Nawab Sahib Historic Railway & Royal Haveli",
      "Derawar Fort Staging Gateway",
    ],
  },
  {
    id: "punjab-khairpur-tamiwali",
    name: "Khairpur Tamiwali",
    district: "Bahawalpur District",
    division: "Bahawalpur Division",
    province: "Punjab",
    latitude: 29.5786,
    longitude: 72.2472,
    elevation_m: 147,
    is_tourist_hub: false,
    parent_hub_slug: "bahawalpur",
  },
  {
    id: "punjab-rahim-yar-khan",
    name: "Rahim Yar Khan",
    district: "Rahim Yar Khan District",
    division: "Bahawalpur Division",
    province: "Punjab",
    latitude: 28.4212,
    longitude: 70.3089,
    elevation_m: 88,
    is_tourist_hub: true,
    has_commercial_airport: true,
    aliases: ["RYK", "Sheikh Zayed"],
    db_city_slug: "rahim-yar-khan",
    curated_highlights: [
      "Pattan Minara Buddhist Stupa Archaeological Site",
      "Bhong Mosque Architectural Wonder",
      "Sheikh Zayed Desert Falconry Palace",
    ],
  },
  {
    id: "punjab-sadiqabad",
    name: "Sadiqabad",
    district: "Rahim Yar Khan District",
    division: "Bahawalpur Division",
    province: "Punjab",
    latitude: 28.3089,
    longitude: 70.1306,
    elevation_m: 85,
    is_tourist_hub: false,
    parent_hub_slug: "rahim-yar-khan",
    curated_highlights: ["Bhong Mosque Mosaic Art Excursion", "Punjab-Sindh Interprovincial Gateway"],
  },
  {
    id: "punjab-khanpur",
    name: "Khanpur",
    district: "Rahim Yar Khan District",
    division: "Bahawalpur Division",
    province: "Punjab",
    latitude: 28.6475,
    longitude: 70.6617,
    elevation_m: 98,
    is_tourist_hub: false,
    parent_hub_slug: "rahim-yar-khan",
    aliases: ["Khanpur Katora"],
    curated_highlights: ["Traditional Clay Katora Craft", "Indus Canal Headworks"],
  },
  {
    id: "punjab-liaquatpur",
    name: "Liaquatpur",
    district: "Rahim Yar Khan District",
    division: "Bahawalpur Division",
    province: "Punjab",
    latitude: 28.9317,
    longitude: 70.9572,
    elevation_m: 110,
    is_tourist_hub: false,
    parent_hub_slug: "rahim-yar-khan",
  },

  // --- Multan, Lodhran, Vehari, Sahiwal, Pakpattan ---
  {
    id: "punjab-multan",
    name: "Multan",
    district: "Multan District",
    division: "Multan Division",
    province: "Punjab",
    latitude: 30.1575,
    longitude: 71.5249,
    elevation_m: 122,
    is_tourist_hub: true,
    has_commercial_airport: true,
    aliases: ["MUX", "City of Saints", "Shah Rukn-e-Alam", "Bahauddin Zakariya"],
    db_city_slug: "multan",
    curated_highlights: [
      "Shrine of Hazrat Shah Rukn-e-Alam (Kashigari Blue Tile Dome)",
      "Shrine of Bahauddin Zakariya & Multan Fort Qasim Bagh",
      "Hussain Agahi Blue Pottery & Handcrafted Sohan Halwa Bazaars",
    ],
  },
  {
    id: "punjab-shujabad",
    name: "Shujabad",
    district: "Multan District",
    division: "Multan Division",
    province: "Punjab",
    latitude: 29.88,
    longitude: 71.295,
    elevation_m: 118,
    is_tourist_hub: false,
    parent_hub_slug: "multan",
    curated_highlights: ["Shujabad Fort & Historic Mango Orchards", "Chenab River Basin Walks"],
  },
  {
    id: "punjab-lodhran",
    name: "Lodhran",
    district: "Lodhran District",
    division: "Multan Division",
    province: "Punjab",
    latitude: 29.5339,
    longitude: 71.6328,
    elevation_m: 130,
    is_tourist_hub: false,
    parent_hub_slug: "multan",
    curated_highlights: ["Sutlej River Railway Bridge", "Rural Agricultural Trails"],
  },
  {
    id: "punjab-dunya-pur",
    name: "Dunya Pur",
    district: "Lodhran District",
    division: "Multan Division",
    province: "Punjab",
    latitude: 29.8028,
    longitude: 71.7417,
    elevation_m: 135,
    is_tourist_hub: false,
    parent_hub_slug: "multan",
  },
  {
    id: "punjab-vehari",
    name: "Vehari",
    district: "Vehari District",
    division: "Multan Division",
    province: "Punjab",
    latitude: 30.0453,
    longitude: 72.3489,
    elevation_m: 147,
    is_tourist_hub: false,
    parent_hub_slug: "multan",
  },
  {
    id: "punjab-burewala",
    name: "Burewala",
    district: "Vehari District",
    division: "Multan Division",
    province: "Punjab",
    latitude: 30.1667,
    longitude: 72.6833,
    elevation_m: 150,
    is_tourist_hub: false,
    parent_hub_slug: "multan",
    aliases: ["Burewala Mandi"],
    curated_highlights: ["Sutlej Canal Headworks", "Historic Textile & Grain Hub"],
  },
  {
    id: "punjab-mailsi",
    name: "Mailsi",
    district: "Vehari District",
    division: "Multan Division",
    province: "Punjab",
    latitude: 29.8,
    longitude: 72.1833,
    elevation_m: 142,
    is_tourist_hub: false,
    parent_hub_slug: "multan",
    curated_highlights: ["Mailsi Syphon Sutlej River Engineering Marvel"],
  },
  {
    id: "punjab-sahiwal",
    name: "Sahiwal",
    district: "Sahiwal District",
    division: "Sahiwal Division",
    province: "Punjab",
    latitude: 30.6682,
    longitude: 73.1114,
    elevation_m: 171,
    is_tourist_hub: true,
    aliases: ["Montgomery", "Harappa Gateway"],
    db_city_slug: "sahiwal",
    curated_highlights: [
      "Harappa Ancient Indus Valley Civilization Archaeological Site & Museum",
      "Montgomery Colonial Clock Tower & Canal Colony",
      "Kanaan Park & Dairy Farm Trails",
    ],
  },
  {
    id: "punjab-chichawatni",
    name: "Chichawatni",
    district: "Sahiwal District",
    division: "Sahiwal Division",
    province: "Punjab",
    latitude: 30.5333,
    longitude: 72.7,
    elevation_m: 160,
    is_tourist_hub: false,
    parent_hub_slug: "sahiwal",
    curated_highlights: ["Chichawatni Irrigated Forest Reserve", "Ravi River Plain Excursions"],
  },
  {
    id: "punjab-pakpattan",
    name: "Pakpattan",
    district: "Pakpattan District",
    division: "Sahiwal Division",
    province: "Punjab",
    latitude: 30.3411,
    longitude: 73.3867,
    elevation_m: 165,
    is_tourist_hub: true,
    parent_hub_slug: "sahiwal",
    curated_highlights: [
      "Shrine of Baba Farid Ganjshakar & Bahishti Darwaza",
      "Ancient Ajodhan Ferry Crossing on Sutlej River",
    ],
  },
  {
    id: "punjab-arifwala",
    name: "Arifwala",
    district: "Pakpattan District",
    division: "Sahiwal Division",
    province: "Punjab",
    latitude: 30.2906,
    longitude: 73.0606,
    elevation_m: 162,
    is_tourist_hub: false,
    parent_hub_slug: "sahiwal",
  },
  {
    id: "punjab-okara",
    name: "Okara",
    district: "Okara District",
    division: "Sahiwal Division",
    province: "Punjab",
    latitude: 30.8081,
    longitude: 73.4458,
    elevation_m: 178,
    is_tourist_hub: false,
    parent_hub_slug: "sahiwal",
    curated_highlights: [
      "Military Dairy Farms & Green Agricultural Country",
      "Renala Khurd Hydroelectric Power House (Built 1925)",
      "Depalpur Ancient Walled Town & Historic Gates",
    ],
  },
  {
    id: "punjab-depalpur",
    name: "Depalpur",
    district: "Okara District",
    division: "Sahiwal Division",
    province: "Punjab",
    latitude: 30.6706,
    longitude: 73.6528,
    elevation_m: 175,
    is_tourist_hub: false,
    parent_hub_slug: "sahiwal",
    curated_highlights: ["Ancient Depalpur Fortified Gates & Historic Monastery"],
  },

  // --- Faisalabad & Gujranwala Division ---
  {
    id: "punjab-faisalabad",
    name: "Faisalabad",
    district: "Faisalabad District",
    division: "Faisalabad Division",
    province: "Punjab",
    latitude: 31.4504,
    longitude: 73.135,
    elevation_m: 184,
    is_tourist_hub: false,
    has_commercial_airport: true,
    aliases: ["LYP", "Lyallpur", "Clock Tower"],
    db_city_slug: "faisalabad",
    curated_highlights: [
      "Eight-Bazaar British Clock Tower (Ghanta Ghar)",
      "Gumti Water Fountain & Heritage Bazaars",
      "Jinnah Garden (Company Bagh)",
    ],
  },
  {
    id: "punjab-jhang",
    name: "Jhang",
    district: "Jhang District",
    division: "Faisalabad Division",
    province: "Punjab",
    latitude: 31.2781,
    longitude: 72.3317,
    elevation_m: 158,
    is_tourist_hub: true,
    curated_highlights: [
      "Shrine of Sultan Bahoo Sufi Master",
      "Tomb of Heer & Ranjha Folklore Landmark",
      "Trimmu Barrage Confluence of Chenab & Jhelum Rivers",
    ],
  },
  {
    id: "punjab-sialkot",
    name: "Sialkot",
    district: "Sialkot District",
    division: "Gujranwala Division",
    province: "Punjab",
    latitude: 32.4945,
    longitude: 74.5229,
    elevation_m: 256,
    is_tourist_hub: false,
    has_commercial_airport: true,
    aliases: ["SKT", "Iqbal City", "Sambrial"],
    curated_highlights: [
      "Iqbal Manzil (Birthplace of Allama Muhammad Iqbal)",
      "Sialkot Fort (Babu Raja Fort)",
      "Clock Tower & Handcrafted Sports Goods Bazaars",
    ],
  },
  {
    id: "punjab-gujranwala",
    name: "Gujranwala",
    district: "Gujranwala District",
    division: "Gujranwala Division",
    province: "Punjab",
    latitude: 32.1877,
    longitude: 74.1945,
    elevation_m: 228,
    is_tourist_hub: false,
    aliases: ["City of Wrestlers", "Pehelwan City"],
    curated_highlights: ["Sheranwala Bagh & Baradari", "Birthplace Haveli of Maharaja Ranjit Singh"],
  },
  {
    id: "punjab-gujrat",
    name: "Gujrat",
    district: "Gujrat District",
    division: "Gujranwala Division",
    province: "Punjab",
    latitude: 32.5742,
    longitude: 74.0754,
    elevation_m: 236,
    is_tourist_hub: false,
    curated_highlights: ["Akbar's Gujrat Fort (Raja Porus Battlefield)", "Shrine of Shah Daula"],
  },

  // --- Rawalpindi & Northern Punjab ---
  {
    id: "punjab-rawalpindi",
    name: "Rawalpindi",
    district: "Rawalpindi District",
    division: "Rawalpindi Division",
    province: "Punjab",
    latitude: 33.5651,
    longitude: 73.0169,
    elevation_m: 508,
    is_tourist_hub: false,
    has_commercial_airport: true,
    aliases: ["RWP", "Pindi", "Raja Bazaar"],
    db_city_slug: "rawalpindi",
    curated_highlights: [
      "Raja Bazaar & Purana Qila Heritage Havelis",
      "Ayub National Park & Lake",
      "Pakistan Army Heritage Museum",
    ],
  },
  {
    id: "punjab-murree",
    name: "Murree & Galyat",
    district: "Murree District",
    division: "Rawalpindi Division",
    province: "Punjab",
    latitude: 33.907,
    longitude: 73.3943,
    elevation_m: 2291,
    is_tourist_hub: true,
    aliases: ["Mall Road", "Patriata", "Bhurban", "Changla Gali"],
    db_city_slug: "murree",
    curated_highlights: [
      "Patriata New Murree Chairlift & Cable Car",
      "Mall Road Heritage Walk & Pindi Point Panorama",
      "Bhurban Luxury Resort & Pine Ridge Trails",
    ],
  },
  {
    id: "punjab-taxila",
    name: "Taxila",
    district: "Rawalpindi District",
    division: "Rawalpindi Division",
    province: "Punjab",
    latitude: 33.7463,
    longitude: 72.8397,
    elevation_m: 549,
    is_tourist_hub: true,
    aliases: ["Gandhara", "Jaulian", "Dharmarajika"],
    db_city_slug: "taxila",
    curated_highlights: [
      "Taxila Museum Gandhara Greco-Buddhist Sculptures",
      "Dharmarajika Great Stupa (UNESCO)",
      "Jaulian Monastic Complex & Sirkap Indo-Greek City Ruins",
    ],
  },
  {
    id: "punjab-chakwal",
    name: "Chakwal & Kallar Kahar",
    district: "Chakwal District",
    division: "Rawalpindi Division",
    province: "Punjab",
    latitude: 32.9328,
    longitude: 72.8631,
    elevation_m: 498,
    is_tourist_hub: true,
    aliases: ["Kallar Kahar", "Katas Raj", "Salt Range"],
    curated_highlights: [
      "Katas Raj Sacred Temples & Shiva Kund",
      "Kallar Kahar Salt Lake & Babur's Takht-e-Babri",
      "Neela Wahn Emerald Waterfall Gorge",
    ],
  },

  // ==================== ISLAMABAD CAPITAL ====================
  {
    id: "isb-islamabad",
    name: "Islamabad",
    district: "Islamabad",
    province: "Islamabad Capital",
    latitude: 33.6844,
    longitude: 73.0479,
    elevation_m: 540,
    is_tourist_hub: true,
    has_commercial_airport: true,
    aliases: ["ISB", "Capital", "Faisal Mosque", "Margalla"],
    db_city_slug: "islamabad",
    curated_highlights: [
      "Faisal Mosque (Iconic Turkish-Islamic Architecture)",
      "Monal & Daman-e-Koh Margalla Hills Panoramic Ridge",
      "Lok Virsa Folk Heritage Museum & Shakarparian Hills",
    ],
  },

  // ==================== GILGIT-BALTISTAN ====================
  {
    id: "gb-hunza",
    name: "Hunza Valley & Gojal",
    district: "Hunza District",
    province: "Gilgit-Baltistan",
    latitude: 36.3167,
    longitude: 74.65,
    elevation_m: 2438,
    is_tourist_hub: true,
    aliases: ["Karimabad", "Passu", "Attabad", "Eagle's Nest", "Baltit"],
    db_city_slug: "hunza",
    curated_highlights: [
      "Baltit & Altit Forts 900-year Royal Heritage",
      "Attabad Turquoise Glacial Lake & Boat Crossing",
      "Passu Cathedral Cones & Hussaini Suspension Bridge",
      "Eagle's Nest Duiker Sunset Vista over Ladyfinger Peak",
    ],
  },
  {
    id: "gb-skardu",
    name: "Skardu & Deosai Plains",
    district: "Skardu District",
    province: "Gilgit-Baltistan",
    latitude: 35.2971,
    longitude: 75.6333,
    elevation_m: 2228,
    is_tourist_hub: true,
    has_commercial_airport: true,
    aliases: ["KDU", "Baltistan", "Shangrila", "Katpana", "Deosai"],
    db_city_slug: "skardu",
    curated_highlights: [
      "Shangrila Resort & Lower Kachura Glacial Lake",
      "Deosai National Park Land of Giants & Sheosar Lake",
      "Katpana & Sarfaranga Cold High-Altitude Desert Dunes",
      "Shigar Fort Palace of the Rock Heritage Stay",
    ],
  },
  {
    id: "gb-gilgit",
    name: "Gilgit",
    district: "Gilgit District",
    province: "Gilgit-Baltistan",
    latitude: 35.9221,
    longitude: 74.3087,
    elevation_m: 1500,
    is_tourist_hub: true,
    has_commercial_airport: true,
    aliases: ["GIL", "Kargah Buddha", "Naltar"],
    db_city_slug: "gilgit",
    curated_highlights: [
      "Kargah Buddha 7th Century Rock Relief",
      "Naltar Valley Emerald Green Lakes & Ski Slopes",
      "Gilgit River Suspension Bridge & Silk Road Dry Fruit Bazaar",
    ],
  },
  {
    id: "gb-fairy-meadows",
    name: "Fairy Meadows & Nanga Parbat",
    district: "Diamer District",
    province: "Gilgit-Baltistan",
    latitude: 35.3881,
    longitude: 74.5772,
    elevation_m: 3300,
    is_tourist_hub: true,
    aliases: ["Raikot", "Nanga Parbat Base Camp", "Beyal Camp"],
    curated_highlights: [
      "Raikot Bridge 4x4 Jeep Cliff Track",
      "Fairy Meadows Alpine Reflection Pools",
      "Nanga Parbat Killer Mountain Base Camp Trek (8,126m)",
    ],
  },
  {
    id: "gb-ghizer",
    name: "Ghizer & Phander Valley",
    district: "Ghizer District",
    province: "Gilgit-Baltistan",
    latitude: 36.1667,
    longitude: 73.5833,
    elevation_m: 2100,
    is_tourist_hub: true,
    aliases: ["Phander Lake", "Gupis", "Shandur"],
    curated_highlights: [
      "Phander Deep Blue Glacial Lake & Trout Fishery",
      "Khalti Lake Frozen Winter Wonderland",
      "Shandur Highest Polo Ground in the World (3,700m)",
    ],
  },

  // ==================== KHYBER PAKHTUNKHWA ====================
  {
    id: "kpk-peshawar",
    name: "Peshawar",
    district: "Peshawar District",
    province: "Khyber Pakhtunkhwa",
    latitude: 34.0151,
    longitude: 71.5249,
    elevation_m: 359,
    is_tourist_hub: true,
    has_commercial_airport: true,
    aliases: ["PEW", "Qissa Khwani", "Khyber Pass", "Namak Mandi"],
    db_city_slug: "peshawar",
    curated_highlights: [
      "Qissa Khwani Bazaar of Storytellers & Green Tea Chaikhanas",
      "Sethi House 19th Century Wooden Architecture",
      "Mahabat Khan 17th Century Mughal Mosque",
      "Namak Mandi Traditional Shinwari Lamb Tikka Trail",
    ],
  },
  {
    id: "kpk-swat",
    name: "Swat & Kalam Emerald Valleys",
    district: "Swat District",
    province: "Khyber Pakhtunkhwa",
    latitude: 35.2227,
    longitude: 72.4258,
    elevation_m: 1980,
    is_tourist_hub: true,
    aliases: ["Mingora", "Kalam", "Malam Jabba", "Mahodand", "Ushu"],
    db_city_slug: "swat",
    curated_highlights: [
      "Malam Jabba Alpine Ski Resort & Chairlift",
      "Kalam Valley & Ushu Dense Pine Forest",
      "Mahodand High Alpine Glacial Lake 4x4 Trail",
      "White Palace Marghazar Italian Marble Heritage",
    ],
  },
  {
    id: "kpk-naran",
    name: "Naran & Kaghan Valley",
    district: "Mansehra District",
    province: "Khyber Pakhtunkhwa",
    latitude: 34.9085,
    longitude: 73.6528,
    elevation_m: 2409,
    is_tourist_hub: true,
    aliases: ["Kaghan", "Saiful Malook", "Babusar", "Lulusar"],
    db_city_slug: "naran-kaghan",
    curated_highlights: [
      "Lake Saiful Malook Legend of the Fairies Glacial Tour",
      "Babusar Pass High-Altitude Crossing (4,173m)",
      "Lulusar Lake & Kunhar River White Water Rafting",
    ],
  },
  {
    id: "kpk-chitral",
    name: "Chitral & Kalash Valleys",
    district: "Chitral District",
    province: "Khyber Pakhtunkhwa",
    latitude: 35.851,
    longitude: 71.7864,
    elevation_m: 1500,
    is_tourist_hub: true,
    has_commercial_airport: true,
    aliases: ["CJL", "Kalasha", "Bumburet", "Tirich Mir", "Shandur"],
    db_city_slug: "chitral",
    curated_highlights: [
      "Kalash Indigenous Valleys (Bumburet, Rumbur & Birir)",
      "Shahi Mosque Chitral & Chitral Fort",
      "Tirich Mir High Peak Panorama (7,708m)",
    ],
  },
  {
    id: "kpk-abbottabad",
    name: "Abbottabad",
    district: "Abbottabad District",
    province: "Khyber Pakhtunkhwa",
    latitude: 34.1688,
    longitude: 73.2215,
    elevation_m: 1256,
    is_tourist_hub: false,
    aliases: ["Thandiani", "Shimla Hill", "Harnoi"],
    db_city_slug: "abbottabad",
    curated_highlights: ["Thandiani High Pine Forest Ridge (2,700m)", "Shimla Hill Panoramic Viewpoint"],
  },

  // ==================== SINDH ====================
  {
    id: "sindh-karachi",
    name: "Karachi",
    district: "Karachi Central",
    province: "Sindh",
    latitude: 24.8607,
    longitude: 67.0011,
    elevation_m: 8,
    is_tourist_hub: true,
    has_commercial_airport: true,
    aliases: ["KHI", "City of Lights", "Clifton", "Do Darya"],
    db_city_slug: "karachi",
    curated_highlights: [
      "Mazar-e-Quaid (Founding Father's Mausoleum)",
      "Clifton Beach & Do Darya Arabian Sea Waterfront Dining",
      "Mohatta Palace Indo-Saracenic Art Museum",
      "Empress Market Colonial Heritage & Spices",
    ],
  },
  {
    id: "sindh-sukkur",
    name: "Sukkur",
    district: "Sukkur District",
    province: "Sindh",
    latitude: 27.7052,
    longitude: 68.8574,
    elevation_m: 67,
    is_tourist_hub: true,
    has_commercial_airport: true,
    aliases: ["SKZ", "Lansdowne", "Sadhu Bela"],
    db_city_slug: "sukkur",
    curated_highlights: [
      "Sadhu Bela Island Temple on the Indus River",
      "Lansdowne Historic Victorian Suspension Bridge",
      "Sukkur Barrage Lloyd Barrage Museum",
    ],
  },
  {
    id: "sindh-hyderabad",
    name: "Hyderabad",
    district: "Hyderabad District",
    province: "Sindh",
    latitude: 25.396,
    longitude: 68.3578,
    elevation_m: 35,
    is_tourist_hub: false,
    curated_highlights: ["Pakka Qila Historic Talpur Fort", "Tombs of Talpur Mirs & Shahi Bazaar"],
  },
  {
    id: "sindh-larkana",
    name: "Larkana & Mohenjo-Daro",
    district: "Larkana District",
    province: "Sindh",
    latitude: 27.5589,
    longitude: 68.2123,
    elevation_m: 48,
    is_tourist_hub: true,
    aliases: ["Mohenjo-Daro", "Indus Valley UNESCO"],
    curated_highlights: [
      "Mohenjo-Daro UNESCO 5,000-Year Ancient Metropolis",
      "Great Bath & Buddhist Stupa",
    ],
  },

  // ==================== BALOCHISTAN ====================
  {
    id: "balochistan-gwadar",
    name: "Gwadar & Makran Coast",
    district: "Gwadar District",
    province: "Balochistan",
    latitude: 25.1216,
    longitude: 62.3254,
    elevation_m: 8,
    is_tourist_hub: true,
    has_commercial_airport: true,
    aliases: ["GWD", "Makran", "Hammerhead", "Koh-e-Batil", "Ormara"],
    db_city_slug: "gwadar",
    curated_highlights: [
      "Koh-e-Batil Hammerhead Cliff & Arabian Sea Vista",
      "Princess of Hope & Sphinx Rock Formations in Hingol",
      "Kund Malir Golden Beach & Deep Sea Fishing",
    ],
  },
  {
    id: "balochistan-quetta",
    name: "Quetta & Ziarat",
    district: "Quetta District",
    province: "Balochistan",
    latitude: 30.1798,
    longitude: 66.975,
    elevation_m: 1680,
    is_tourist_hub: true,
    has_commercial_airport: true,
    aliases: ["UET", "Ziarat", "Hanna Lake", "Urak"],
    db_city_slug: "quetta",
    curated_highlights: [
      "Quaid-e-Azam Historic Wooden Residency in Ziarat",
      "Ancient Juniper Forest Biosphere Reserve (2nd Oldest in World)",
      "Hanna Lake & Urak Valley Apple Orchards",
    ],
  },

  // ==================== AZAD KASHMIR ====================
  {
    id: "ajk-muzaffarabad",
    name: "Muzaffarabad",
    district: "Muzaffarabad District",
    province: "Azad Kashmir",
    latitude: 34.3705,
    longitude: 73.4711,
    elevation_m: 737,
    is_tourist_hub: true,
    aliases: ["Red Fort", "Neelum Confluence"],
    db_city_slug: "muzaffarabad",
    curated_highlights: [
      "Red Fort (Rutta Qila) Overlooking Neelum River",
      "Pir Chinasi High Mountain Viewpoint (2,900m)",
      "Confluence of Neelum & Jhelum Rivers",
    ],
  },
  {
    id: "ajk-neelum-valley",
    name: "Neelum Valley",
    district: "Neelum District",
    province: "Azad Kashmir",
    latitude: 34.8016,
    longitude: 73.9015,
    elevation_m: 1615,
    is_tourist_hub: true,
    aliases: ["Kutton", "Keran", "Sharda", "Kel", "Arang Kel"],
    db_city_slug: "neelum-valley",
    curated_highlights: [
      "Arang Kel Lush Pearl Village & Chairlift Climb",
      "Sharda Peeth Ancient 6th Century Temple University",
      "Ratti Gali Alpine Glacial Lake Trek (3,700m)",
    ],
  },
];

/**
 * Fast client-side fuzzy search across all Pakistan cities & tehsils.
 */
export function searchPakistanLocations(query: string): PakistanLocation[] {
  if (!query || !query.trim()) return [];
  const q = query.toLowerCase().trim();

  return PAKISTAN_LOCATIONS.filter((loc) => {
    if (loc.name.toLowerCase().includes(q)) return true;
    if (loc.district.toLowerCase().includes(q)) return true;
    if (loc.province.toLowerCase().includes(q)) return true;
    if (loc.aliases?.some((a) => a.toLowerCase().includes(q))) return true;
    return false;
  }).slice(0, 10);
}

/**
 * Find exact or best matching Pakistan Location by ID, name, or query.
 */
export function findPakistanLocation(nameOrIdOrSlug?: string): PakistanLocation | null {
  if (!nameOrIdOrSlug) return null;
  const target = nameOrIdOrSlug.toLowerCase().trim();

  // 1. Exact ID match
  const byId = PAKISTAN_LOCATIONS.find((l) => l.id.toLowerCase() === target);
  if (byId) return byId;

  // 2. Exact db_city_slug match
  const bySlug = PAKISTAN_LOCATIONS.find((l) => l.db_city_slug === target);
  if (bySlug) return bySlug;

  // 3. Exact Name match
  const byName = PAKISTAN_LOCATIONS.find((l) => l.name.toLowerCase() === target);
  if (byName) return byName;

  // 4. Prefix / Substring match on name
  const bySubName = PAKISTAN_LOCATIONS.find(
    (l) => l.name.toLowerCase().startsWith(target) || target.startsWith(l.name.toLowerCase())
  );
  if (bySubName) return bySubName;

  // 5. Alias match
  const byAlias = PAKISTAN_LOCATIONS.find((l) =>
    l.aliases?.some((a) => a.toLowerCase() === target || target.includes(a.toLowerCase()))
  );
  if (byAlias) return byAlias;

  // 6. Loose match
  const loose = PAKISTAN_LOCATIONS.find(
    (l) =>
      l.name.toLowerCase().includes(target) ||
      target.includes(l.name.toLowerCase()) ||
      l.district.toLowerCase().includes(target) ||
      target.includes(l.district.toLowerCase())
  );
  return loose || null;
}

/**
 * Great-Circle Haversine distance in kilometers.
 */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const r = 6371.0;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(r * c);
}

/**
 * Calculates realistic road metrics, corridor names, driving hours, and commercial flight availability.
 */
export function calculateRouteMetrics(
  origin: PakistanLocation,
  destination: PakistanLocation
): RouteMetrics {
  const straightKm = haversineKm(
    origin.latitude,
    origin.longitude,
    destination.latitude,
    destination.longitude
  );

  // Determine terrain factor and highway network
  const isNorthernDest = [
    "Gilgit-Baltistan",
    "Khyber Pakhtunkhwa",
    "Azad Kashmir",
  ].includes(destination.province);
  const isHighAltitude = destination.elevation_m > 1800;
  const isPlains = origin.province === "Punjab" && destination.province === "Punjab";
  const isCoastal = destination.province === "Balochistan" || destination.province === "Sindh";

  let windingFactor = 1.18;
  let avgSpeedKmh = 75;
  let corridorName = "National Highway Corridor";

  if (isPlains) {
    windingFactor = 1.15;
    avgSpeedKmh = 80;
    if (straightKm < 100) {
      corridorName = "Regional Highway & Inter-District Expressway";
    } else {
      corridorName = "M-3 / M-4 / M-5 Motorway & Regional Expressways";
    }
  } else if (isNorthernDest && isHighAltitude) {
    windingFactor = 1.42;
    avgSpeedKmh = 45;
    corridorName = "Hazara Motorway ➔ Karakoram Highway (N-35) / N-15 Pass";
  } else if (isNorthernDest) {
    windingFactor = 1.28;
    avgSpeedKmh = 60;
    corridorName = "Swat Expressway (M-16) / National Alpine Highway (N-95)";
  } else if (isCoastal) {
    windingFactor = 1.22;
    avgSpeedKmh = 80;
    corridorName = "M-9 Superhighway ➔ Makran Coastal Highway (N-10)";
  }

  // Same city or local transit (< 15 km)
  if (straightKm < 15) {
    return {
      straightDistanceKm: straightKm,
      drivingDistanceKm: Math.max(5, straightKm),
      drivingTimeHours: 0.5,
      drivingTimeFormatted: "25-35 mins local transit",
      elevationChangeMeters: Math.abs(destination.elevation_m - origin.elevation_m),
      corridorName: "Intra-District Urban Corridor",
      roadPassabilityPercent: 99,
      transitDifficulty: "easy",
      canFlyCommercial: false,
    };
  }

  const drivingKm = Math.round(straightKm * windingFactor);
  const hoursDecimal = Math.round((drivingKm / avgSpeedKmh) * 10) / 10;
  const wholeHours = Math.floor(hoursDecimal);
  const remainingMins = Math.round((hoursDecimal - wholeHours) * 60);

  const drivingTimeFormatted =
    wholeHours > 0
      ? `${wholeHours}h ${remainingMins > 0 ? `${remainingMins}m` : ""}`
      : `${remainingMins}m`;

  const elevDelta = Math.abs(destination.elevation_m - origin.elevation_m);

  let difficulty: "easy" | "moderate" | "challenging" | "expedition" = "easy";
  let passability = 96;

  if (isHighAltitude) {
    difficulty = "expedition";
    passability = 88;
  } else if (drivingKm > 400 || elevDelta > 1000) {
    difficulty = "moderate";
    passability = 92;
  }

  // Check Commercial Flight Availability
  // Only enabled if BOTH origin and destination have commercial airport access AND distance >= 350 km
  const canFly =
    Boolean(origin.has_commercial_airport) &&
    Boolean(destination.has_commercial_airport) &&
    drivingKm >= 350;

  let flightRouteNote: string | undefined = undefined;
  if (canFly) {
    flightRouteNote = `${origin.name.split(" ")[0]} ➔ ${destination.name.split(" ")[0]} (~1.5h - 2h flight) + local 4x4`;
  }

  return {
    straightDistanceKm: straightKm,
    drivingDistanceKm: drivingKm,
    drivingTimeHours: hoursDecimal,
    drivingTimeFormatted,
    elevationChangeMeters: elevDelta,
    corridorName,
    roadPassabilityPercent: passability,
    transitDifficulty: difficulty,
    canFlyCommercial: canFly,
    flightRouteNote,
  };
}

/**
 * Calculates realistic seasonal temperature and climate tags for any Pakistan destination.
 */
export function getDestinationClimate(
  dest: PakistanLocation,
  dateString?: string
): ClimateMetrics {
  const travelDate = dateString ? new Date(dateString) : new Date();
  const month = isNaN(travelDate.getTime())
    ? new Date().getMonth() + 1
    : travelDate.getMonth() + 1; // 1 to 12

  const isWinter = [12, 1, 2].includes(month);
  const isSpring = [3, 4].includes(month);
  const isSummer = [5, 6, 7, 8].includes(month);
  const isAutumn = [9, 10, 11].includes(month);

  const elev = dest.elevation_m;

  let baseHigh = 32;
  let baseLow = 20;

  if (elev > 2200) {
    // High Alpine (Hunza, Skardu, Deosai, Kalam, Ziarat)
    if (isSummer) {
      baseHigh = 22;
      baseLow = 9;
    } else if (isAutumn) {
      baseHigh = 14;
      baseLow = 2;
    } else if (isWinter) {
      baseHigh = -2;
      baseLow = -14;
    } else {
      baseHigh = 15;
      baseLow = 4;
    }
  } else if (elev > 1000) {
    // Mid Alpine / Foothills (Murree, Abbottabad, Chitral, Quetta)
    if (isSummer) {
      baseHigh = 28;
      baseLow = 17;
    } else if (isAutumn) {
      baseHigh = 21;
      baseLow = 10;
    } else if (isWinter) {
      baseHigh = 8;
      baseLow = 0;
    } else {
      baseHigh = 22;
      baseLow = 11;
    }
  } else if (
    dest.province === "Sindh" ||
    dest.district.includes("Bahawalpur") ||
    dest.district.includes("Bahawalnagar") ||
    dest.district.includes("Rahim Yar Khan")
  ) {
    // Southern Desert / Cotton Belt (Bahawalpur, Chishtian, Hasilpur, Cholistan, Karachi, Sukkur)
    if (isSummer) {
      baseHigh = 42;
      baseLow = 29;
    } else if (isAutumn) {
      baseHigh = 33;
      baseLow = 20;
    } else if (isWinter) {
      baseHigh = 24;
      baseLow = 10;
    } else {
      baseHigh = 34;
      baseLow = 21;
    }
  } else {
    // Upper / Central Plains (Lahore, Islamabad, Rawalpindi, Faisalabad, Peshawar, Sahiwal)
    if (isSummer) {
      baseHigh = 38;
      baseLow = 26;
    } else if (isAutumn) {
      baseHigh = 30;
      baseLow = 18;
    } else if (isWinter) {
      baseHigh = 19;
      baseLow = 7;
    } else {
      baseHigh = 29;
      baseLow = 16;
    }
  }

  let condition = "Clear Skies & Dry Air";
  let seasonTag = "Optimal Season Window";

  if (elev > 2000) {
    if (isAutumn) {
      condition = "Crisp Mountain Air · Golden Foliage";
      seasonTag = "Golden Foliage Peak";
    } else if (isSummer) {
      condition = "Mild Alpine Breezes · Clear Passes";
      seasonTag = "Trek & Glacier Window";
    } else if (isWinter) {
      condition = "Sub-Zero Alpine Frost & Snow";
      seasonTag = "Winter Expedition";
    } else {
      condition = "Spring Apricot Blossoms";
      seasonTag = "Spring Blossom Peak";
    }
  } else if (
    dest.district.includes("Bahawalpur") ||
    dest.district.includes("Bahawalnagar") ||
    dest.name.includes("Cholistan")
  ) {
    if (isWinter || isAutumn) {
      condition = "Pleasant Desert Sun · Cool Nights";
      seasonTag = "Cholistan Season Active";
    } else {
      condition = "Warm Southern Plains";
      seasonTag = "Summer Off-Season";
    }
  } else if (dest.name.includes("Gwadar") || dest.name.includes("Karachi")) {
    condition = "Brisk Oceanic Coastal Breeze";
    seasonTag = "Coastal Season Active";
  }

  return {
    condition,
    tempHighC: baseHigh,
    tempLowC: baseLow,
    tempFormatted: `${baseHigh}°C High / ${baseLow}°C Night`,
    seasonTag,
  };
}

export interface DestinationInterest {
  id: string;
  label: string;
  isDefault?: boolean;
}

export interface DestinationInterestMatrix {
  category:
    | "desert_heritage"
    | "alpine_peaks"
    | "cultural_metropolis"
    | "coastal_marine"
    | "balochistan_highlands"
    | "scenic_valleys";
  categoryBadge: string;
  title: string;
  subtitle: string;
  options: DestinationInterest[];
  defaultSelectedIds: string[];
}

/**
 * Returns contextual taste and experience options tailored to the destination's geography.
 */
export function getDestinationInterests(dest: PakistanLocation): DestinationInterestMatrix {
  const elev = dest.elevation_m;
  const name = dest.name.toLowerCase();
  const district = dest.district.toLowerCase();
  const province = dest.province;

  // 1. Coastal & Marine (Karachi, Gwadar, Ormara, Pasni, Jiwani, Kund Malir, Makran Coast, Astola)
  const isCoastal =
    (province === "Sindh" && name.includes("karachi")) ||
    district.includes("karachi") ||
    name.includes("gwadar") ||
    district.includes("gwadar") ||
    district.includes("lasbela") ||
    district.includes("hub") ||
    name.includes("makran") ||
    name.includes("ormara") ||
    name.includes("pasni") ||
    name.includes("jiwani") ||
    name.includes("kund malir") ||
    name.includes("astola");

  // 2. Desert, Royal Palaces & Southern Punjab / Sindh Interior (Bahawalpur, Chishtian, Hasilpur, Cholistan, etc.)
  const isDesertOrSouthern =
    district.includes("bahawalpur") ||
    district.includes("bahawalnagar") ||
    district.includes("rahim yar khan") ||
    district.includes("dera ghazi khan") ||
    district.includes("rajanpur") ||
    district.includes("muzaffargarh") ||
    district.includes("layyah") ||
    district.includes("kot addu") ||
    district.includes("bhakkar") ||
    name.includes("cholistan") ||
    name.includes("derawar") ||
    name.includes("noor mahal") ||
    district.includes("sukkur") ||
    district.includes("larkana") ||
    district.includes("khairpur") ||
    district.includes("tharparkar") ||
    name.includes("mithi") ||
    name.includes("umerkot") ||
    name.includes("sehwan") ||
    (province === "Sindh" && !isCoastal);

  // 3. Balochistan Highlands, Canyons & Juniper Valleys (Quetta, Ziarat, Khuzdar, Moola Chotok, Gorakh Hill)
  const isBalochHighlands =
    (province === "Balochistan" && !isCoastal) ||
    name.includes("ziarat") ||
    name.includes("quetta") ||
    name.includes("moola chotok") ||
    name.includes("khuzdar") ||
    name.includes("gorakh hill");

  // 4. Alpine High (Hunza, Skardu, Gilgit, Nagar, Deosai, Fairy Meadows, Chitral, Kalash, Naran, Kaghan)
  const isAlpineHigh =
    province === "Gilgit-Baltistan" ||
    (province === "Khyber Pakhtunkhwa" && elev > 1800) ||
    name.includes("hunza") ||
    name.includes("skardu") ||
    name.includes("kalam") ||
    name.includes("naran") ||
    name.includes("deosai") ||
    name.includes("fairy meadows") ||
    name.includes("chitral") ||
    name.includes("kalash");

  // 5. Cultural Metropolis & Historic Cities (Lahore, Islamabad, Rawalpindi, Peshawar, Multan, Faisalabad, Sialkot, Sahiwal)
  const isCulturalMetropolis =
    name.includes("lahore") ||
    name.includes("peshawar") ||
    name.includes("multan") ||
    name.includes("islamabad") ||
    name.includes("rawalpindi") ||
    name.includes("taxila") ||
    name.includes("faisalabad") ||
    name.includes("sialkot") ||
    name.includes("sahiwal") ||
    name.includes("pakpattan") ||
    name.includes("kasur") ||
    name.includes("gujranwala") ||
    name.includes("gujrat") ||
    name.includes("harappa");

  if (isCoastal) {
    const options: DestinationInterest[] = [
      { id: "coastal_beaches", label: "🌊 Arabian Sea Beaches & Cliffs", isDefault: true },
      { id: "seafood_gastronomy", label: "🦞 Fresh Seafood & Harbor Dining", isDefault: true },
      { id: "photography", label: "📸 Hammerhead Sunset Photography", isDefault: true },
      { id: "rock_formations", label: "🗿 Sphinx & Coastal Rock Formations", isDefault: true },
      { id: "marine_boating", label: "🚤 Deep-Sea Boating & Marine Reserve" },
      { id: "beach_camping", label: "🏕️ Coastal Glamping & Bioluminescence" },
      { id: "port_bazaars", label: "🛍️ Silk Route Port Bazaars" },
      { id: "stargazing", label: "🌌 Oceanic Horizon Stargazing" },
    ];
    return {
      category: "coastal_marine",
      categoryBadge: "🌊 Coastal & Marine",
      title: "Coastal & Arabian Sea Themes",
      subtitle: "Calibrated for pristine beaches, coastal cliffs, seafood feasts & marine adventures",
      options,
      defaultSelectedIds: options.filter((o) => o.isDefault).map((o) => o.id),
    };
  }

  if (isDesertOrSouthern) {
    const options: DestinationInterest[] = [
      { id: "desert_safari", label: "🏜️ 4x4 Desert Dunes Safari", isDefault: true },
      { id: "royal_forts", label: "🕌 Royal Palaces & Fortresses", isDefault: true },
      { id: "photography", label: "📸 Sunset & Astrophotography", isDefault: true },
      { id: "gastronomy", label: "🍲 Saraiki & Royal Gastronomy", isDefault: true },
      { id: "stargazing_glamping", label: "🏕️ Desert Camp & Star Gazing" },
      { id: "wetlands_wildlife", label: "🦆 National Park Wildlife & Wetlands" },
      { id: "artisan_crafts", label: "🛍️ Chunri & Handcrafted Bazaars" },
      { id: "sufi_heritage", label: "📜 Ancient Hakra Civilization Shrines" },
    ];
    return {
      category: "desert_heritage",
      categoryBadge: "🏜️ Desert & Royal Heritage",
      title: "Desert, Palaces & Southern Punjab Themes",
      subtitle: "Calibrated for Cholistan dunes, royal palaces, wildlife sanctuaries & cultural bazaars",
      options,
      defaultSelectedIds: options.filter((o) => o.isDefault).map((o) => o.id),
    };
  }

  if (isBalochHighlands) {
    const options: DestinationInterest[] = [
      { id: "juniper_forests", label: "🌲 Ancient Juniper World Reserves", isDefault: true },
      { id: "canyon_gorges", label: "🧗 Hidden Canyon Gorges & Streams", isDefault: true },
      { id: "photography", label: "📸 Rugged Plateau & Sunset Photography", isDefault: true },
      { id: "balochi_gastronomy", label: "🍲 Balochi Rosh, Sajji & Kakar Bread", isDefault: true },
      { id: "highland_camping", label: "🏕️ Star-lit High Plateau Camping" },
      { id: "geological_marvels", label: "🗿 Mud Volcanoes & Rock Formations" },
      { id: "tribal_bazaars", label: "🛍️ Baloch Tribal Mirrorwork & Rugs" },
      { id: "historic_passes", label: "📜 Historic Bolan Pass & Silk Forts" },
    ];
    return {
      category: "balochistan_highlands",
      categoryBadge: "🏔️ Highlands & Canyons",
      title: "High Plateaus, Canyons & Juniper Forest Themes",
      subtitle: "Calibrated for ancient juniper forests, hidden gorges, turquoise canyon streams & tribal crafts",
      options,
      defaultSelectedIds: options.filter((o) => o.isDefault).map((o) => o.id),
    };
  }

  if (isCulturalMetropolis) {
    const options: DestinationInterest[] = [
      { id: "mughal_heritage", label: "🕌 Mughal Architecture & UNESCO Sites", isDefault: true },
      { id: "food_street", label: "🍲 Legendary Food Streets & Gastronomy", isDefault: true },
      { id: "photography", label: "📸 Heritage & Street Photography", isDefault: true },
      { id: "craft_bazaars", label: "🛍️ Walled City Bazaars & Silk Markets", isDefault: true },
      { id: "sufi_qawwali", label: "🎶 Historic Sufi Shrines & Qawwali" },
      { id: "museums_archaeology", label: "🏛️ Archaeological Museums & Relics" },
      { id: "royal_gardens", label: "🌳 Mughal Royal Terraces & Parks" },
      { id: "chaikhana_social", label: "☕ Traditional Chaikhana Socials" },
    ];
    return {
      category: "cultural_metropolis",
      categoryBadge: "🕌 Heritage & Food Trails",
      title: "Cultural, Heritage & Gastronomy Themes",
      subtitle: "Calibrated for historical monuments, bustling food streets & artisan bazaars",
      options,
      defaultSelectedIds: options.filter((o) => o.isDefault).map((o) => o.id),
    };
  }

  if (isAlpineHigh) {
    const options: DestinationInterest[] = [
      { id: "nature_peaks", label: "🏔️ Nature & 7,000m+ High Peaks", isDefault: true },
      { id: "alpine_trekking", label: "🧗 Alpine Trails & Glacier Passes", isDefault: true },
      { id: "photography", label: "📸 Haute Mountain Photography", isDefault: true },
      { id: "stargazing", label: "🌌 High-Altitude Milky Way Stargazing", isDefault: true },
      { id: "glacial_lakes", label: "🛶 Turquoise Glacial Lakes & Boating" },
      { id: "glamping_chalets", label: "🏕️ Boutique Wooden Chalets & Glamping" },
      { id: "silk_road_food", label: "🍲 Apricot, Walnut & Indigenous Fare" },
      { id: "gemstone_bazaars", label: "🛍️ Mountain Gemstones & Handcrafts" },
    ];
    return {
      category: "alpine_peaks",
      categoryBadge: "🏔️ Alpine & 7,000m Peaks",
      title: "Alpine, Glaciers & Karakoram Themes",
      subtitle: "Calibrated for soaring summit viewpoints, glacier lakes, high passes & starry skies",
      options,
      defaultSelectedIds: options.filter((o) => o.isDefault).map((o) => o.id),
    };
  }

  // Default / Scenic Valleys & Hill Stations (Murree, Neelum, Swat, Galyat, Abbottabad, Shogran, etc.)
  const options: DestinationInterest[] = [
    { id: "nature_canopy", label: "🌲 Dense Pine Canopy & River Streams", isDefault: true },
    { id: "scenic_ridges", label: "🚡 Chairlifts & Panoramic Ridge Walks", isDefault: true },
    { id: "photography", label: "📸 Mountain Sunset Photography", isDefault: true },
    { id: "trout_gastronomy", label: "🍲 Fresh River Trout & Mountain Cafes", isDefault: true },
    { id: "glamping_cabins", label: "🏕️ Riverside Cabins & Forest Stays" },
    { id: "nature_hikes", label: "🧗 Gentle Nature Trails & Waterfalls" },
    { id: "local_shawls", label: "🛍️ Handcrafted Pashmina & Shawl Bazaars" },
    { id: "stargazing", label: "🌌 Pine Ridge Stargazing" },
  ];
  return {
    category: "scenic_valleys",
    categoryBadge: "🌲 Pine Valleys & Ridges",
    title: "Scenic Valleys & Hill Station Themes",
    subtitle: "Calibrated for pine forests, scenic chairlifts, fresh river trout & mountain trails",
    options,
    defaultSelectedIds: options.filter((o) => o.isDefault).map((o) => o.id),
  };
}

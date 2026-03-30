export interface Hotel {
  id: string;
  name: string;
  location: string;
  city: string;
  rating: number;
  reviewCount: number;
  pricePerNight: number;
  currency: string;
  image: string;
  images: string[];
  amenities: string[];
  description: string;
  stars: number;
  freeCancellation: boolean;
  breakfastIncluded: boolean;
  roomTypes: RoomType[];
  reviews: Review[];
}

export interface RoomType {
  id: string;
  name: string;
  price: number;
  maxGuests: number;
  bedType: string;
  size: string;
  amenities: string[];
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
}

export const hotels: Hotel[] = [
  {
    id: "h1",
    name: "Grand Roma Palace",
    location: "Via Veneto, Rome",
    city: "Rome",
    rating: 4.8,
    reviewCount: 1243,
    pricePerNight: 189,
    currency: "$",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1590490360182-c33d7dc3b4b0?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&h=500&fit=crop",
    ],
    amenities: ["Free WiFi", "Pool", "Spa", "Restaurant", "Bar", "Gym", "Room Service", "Parking"],
    description: "Experience the grandeur of Rome at our luxurious palace hotel. Located on the iconic Via Veneto, steps from the Spanish Steps and Trevi Fountain. Featuring stunning rooftop views, a world-class spa, and Michelin-starred dining.",
    stars: 5,
    freeCancellation: true,
    breakfastIncluded: true,
    roomTypes: [
      { id: "r1", name: "Classic Double", price: 189, maxGuests: 2, bedType: "King Bed", size: "30m²", amenities: ["City View", "Mini Bar", "Safe"] },
      { id: "r2", name: "Superior Suite", price: 299, maxGuests: 3, bedType: "King Bed + Sofa", size: "50m²", amenities: ["Balcony", "Living Area", "Jacuzzi"] },
      { id: "r3", name: "Presidential Suite", price: 549, maxGuests: 4, bedType: "King Bed", size: "85m²", amenities: ["Panoramic View", "Butler Service", "Private Terrace"] },
    ],
    reviews: [
      { id: "rv1", author: "Sarah M.", rating: 5, date: "Feb 2026", comment: "Absolutely stunning hotel. The rooftop breakfast with views of Rome was unforgettable." },
      { id: "rv2", author: "James K.", rating: 4, date: "Jan 2026", comment: "Beautiful property, great location. Spa was excellent. Would definitely return." },
      { id: "rv3", author: "Aiko T.", rating: 5, date: "Dec 2025", comment: "Perfect in every way. Staff went above and beyond to make our anniversary special." },
    ],
  },
  {
    id: "h2",
    name: "Sakura Inn Tokyo",
    location: "Shinjuku, Tokyo",
    city: "Tokyo",
    rating: 4.6,
    reviewCount: 876,
    pricePerNight: 142,
    currency: "$",
    image: "https://images.unsplash.com/photo-1590490360182-c33d7dc3b4b0?w=600&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1590490360182-c33d7dc3b4b0?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=500&fit=crop",
    ],
    amenities: ["Free WiFi", "Onsen", "Restaurant", "Laundry", "Concierge", "Airport Shuttle"],
    description: "A modern Japanese inn blending traditional hospitality with contemporary comfort in the heart of Shinjuku. Enjoy our authentic onsen, kaiseki dining, and easy access to Tokyo's best attractions.",
    stars: 4,
    freeCancellation: true,
    breakfastIncluded: false,
    roomTypes: [
      { id: "r4", name: "Standard Twin", price: 142, maxGuests: 2, bedType: "Twin Beds", size: "22m²", amenities: ["City View", "Tea Set", "Yukata"] },
      { id: "r5", name: "Deluxe King", price: 198, maxGuests: 2, bedType: "King Bed", size: "32m²", amenities: ["Mt. Fuji View", "Soaking Tub", "Mini Bar"] },
    ],
    reviews: [
      { id: "rv4", author: "Mark L.", rating: 5, date: "Mar 2026", comment: "The onsen experience was incredible. Staff were so welcoming and helpful." },
      { id: "rv5", author: "Lisa P.", rating: 4, date: "Feb 2026", comment: "Great location near Shinjuku Station. Rooms are compact but very well designed." },
    ],
  },
  {
    id: "h3",
    name: "Bali Serenity Resort",
    location: "Ubud, Bali",
    city: "Bali",
    rating: 4.9,
    reviewCount: 654,
    pricePerNight: 220,
    currency: "$",
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&h=500&fit=crop",
    ],
    amenities: ["Infinity Pool", "Spa", "Yoga Studio", "Restaurant", "Free WiFi", "Shuttle", "Garden"],
    description: "Nestled among rice terraces in Ubud, our eco-luxury resort offers a tranquil escape. Enjoy private villa living with infinity pools, daily yoga, and farm-to-table cuisine.",
    stars: 5,
    freeCancellation: true,
    breakfastIncluded: true,
    roomTypes: [
      { id: "r6", name: "Garden Villa", price: 220, maxGuests: 2, bedType: "King Bed", size: "45m²", amenities: ["Private Garden", "Outdoor Shower", "Day Bed"] },
      { id: "r7", name: "Pool Villa", price: 380, maxGuests: 2, bedType: "King Bed", size: "65m²", amenities: ["Private Pool", "Rice Terrace View", "Dining Pavilion"] },
      { id: "r8", name: "Royal Pool Villa", price: 550, maxGuests: 4, bedType: "2 King Beds", size: "120m²", amenities: ["Private Pool", "Butler", "Kitchen", "Living Room"] },
    ],
    reviews: [
      { id: "rv6", author: "Emma R.", rating: 5, date: "Mar 2026", comment: "Paradise on earth. The pool villa with rice terrace views was magical." },
      { id: "rv7", author: "David W.", rating: 5, date: "Jan 2026", comment: "Best resort we've ever stayed at. The spa treatments were world-class." },
    ],
  },
  {
    id: "h4",
    name: "The Mayfair London",
    location: "Mayfair, London",
    city: "London",
    rating: 4.7,
    reviewCount: 1102,
    pricePerNight: 265,
    currency: "$",
    image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=500&fit=crop",
    ],
    amenities: ["Free WiFi", "Spa", "Restaurant", "Bar", "Gym", "Concierge", "Valet Parking"],
    description: "An elegant five-star hotel in the heart of London's Mayfair. Walk to Hyde Park, Bond Street, and Buckingham Palace. Classic British luxury with impeccable service.",
    stars: 5,
    freeCancellation: false,
    breakfastIncluded: true,
    roomTypes: [
      { id: "r9", name: "Classic Room", price: 265, maxGuests: 2, bedType: "Queen Bed", size: "28m²", amenities: ["Street View", "Nespresso", "Marble Bath"] },
      { id: "r10", name: "Junior Suite", price: 395, maxGuests: 2, bedType: "King Bed", size: "42m²", amenities: ["Park View", "Sitting Area", "Champagne Bar"] },
    ],
    reviews: [
      { id: "rv8", author: "Charlotte B.", rating: 5, date: "Feb 2026", comment: "Quintessentially British luxury. Afternoon tea was divine." },
      { id: "rv9", author: "Robert H.", rating: 4, date: "Jan 2026", comment: "Impeccable service and stunning decor. Location couldn't be better." },
    ],
  },
  {
    id: "h5",
    name: "Le Marais Boutique",
    location: "Le Marais, Paris",
    city: "Paris",
    rating: 4.5,
    reviewCount: 432,
    pricePerNight: 175,
    currency: "$",
    image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=600&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1590490360182-c33d7dc3b4b0?w=800&h=500&fit=crop",
    ],
    amenities: ["Free WiFi", "Breakfast", "Bar", "Concierge", "Bike Rental"],
    description: "A charming boutique hotel in the vibrant Le Marais district. Exposed stone walls meet modern Parisian design. Steps from Notre-Dame, the Louvre, and trendy cafés.",
    stars: 4,
    freeCancellation: true,
    breakfastIncluded: true,
    roomTypes: [
      { id: "r11", name: "Cozy Double", price: 175, maxGuests: 2, bedType: "Double Bed", size: "18m²", amenities: ["Courtyard View", "Rain Shower"] },
      { id: "r12", name: "Parisian Suite", price: 280, maxGuests: 3, bedType: "King Bed", size: "35m²", amenities: ["Eiffel Tower View", "Bathtub", "Balcony"] },
    ],
    reviews: [
      { id: "rv10", author: "Sophie L.", rating: 5, date: "Mar 2026", comment: "So charming! The Eiffel Tower view from the suite was breathtaking." },
    ],
  },
  {
    id: "h6",
    name: "Marina Bay Suites",
    location: "Marina Bay, Dubai",
    city: "Dubai",
    rating: 4.7,
    reviewCount: 789,
    pricePerNight: 310,
    currency: "$",
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=500&fit=crop",
    ],
    amenities: ["Infinity Pool", "Private Beach", "Spa", "5 Restaurants", "Free WiFi", "Gym", "Kids Club"],
    description: "Ultra-luxury waterfront resort with panoramic views of the Dubai skyline. Features a private beach, world-class dining, and the city's largest infinity pool.",
    stars: 5,
    freeCancellation: true,
    breakfastIncluded: false,
    roomTypes: [
      { id: "r13", name: "Ocean View Room", price: 310, maxGuests: 2, bedType: "King Bed", size: "40m²", amenities: ["Ocean View", "Lounge Access", "Mini Bar"] },
      { id: "r14", name: "Skyline Suite", price: 520, maxGuests: 3, bedType: "King Bed + Sofa", size: "70m²", amenities: ["Skyline View", "Private Lounge", "Butler Service"] },
    ],
    reviews: [
      { id: "rv11", author: "Ahmed K.", rating: 5, date: "Feb 2026", comment: "The infinity pool at sunset is something you must experience." },
    ],
  },
];

/**
 * Mock gallery data — exported so HomeScreen can reflect the real
 * counts without hard-coding "74 photos" everywhere.
 */

export type GalleryPhoto = { url: string; likes: number; author?: string };

export const professionalPhotos: GalleryPhoto[] = [
  { url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400', likes: 24 },
  { url: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=400', likes: 31 },
  { url: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400', likes: 18 },
  { url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=400', likes: 42 },
  { url: 'https://images.unsplash.com/photo-1551818255-e6e10975bc17?w=400', likes: 15 },
  { url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400', likes: 27 },
  { url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400', likes: 38 },
  { url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400', likes: 22 },
  { url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=400', likes: 29 },
  { url: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=400', likes: 33 },
  { url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400', likes: 19 },
  { url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=400', likes: 44 },
  { url: 'https://images.unsplash.com/photo-1464047736614-af63643285bf?w=400', likes: 26 },
  { url: 'https://images.unsplash.com/photo-1478145046317-39f10e56b5e9?w=400', likes: 35 },
  { url: 'https://images.unsplash.com/photo-1499364615650-ec38552f4f34?w=400', likes: 21 },
  { url: 'https://images.unsplash.com/photo-1519167758481-83f29da8856a?w=400', likes: 40 },
];

/**
 * Guest photos — what attendees would actually post: group shots from
 * a session, networking corners, booth visits, panel discussions.
 * Avoid solo headshots (those belong on profiles, not in a gallery).
 */
export const guestPhotos: GalleryPhoto[] = [
  // Group photo at a session
  { url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600', author: 'Sarah Johnson', likes: 22 },
  // People networking with drinks
  { url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600', author: 'Michael Chen', likes: 14 },
  // Audience listening at a talk
  { url: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=600', author: 'Emma Rodriguez', likes: 31 },
  // Two people chatting at a booth
  { url: 'https://images.unsplash.com/photo-1559223607-a43c990c692c?w=600', author: 'James Wilson', likes: 9 },
  // Panel discussion on stage
  { url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600', author: 'Liam Patel', likes: 38 },
  // Group standing in foyer
  { url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600', author: 'Maya Park', likes: 17 },
  // Workshop in a small room
  { url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600', author: 'Daniel Kovács', likes: 26 },
  // Coffee break crowd
  { url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600', author: 'Olivia Nguyen', likes: 21 },
  // Speaker on stage with screen behind
  { url: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=600', author: 'Rasmus Lindqvist', likes: 33 },
  // Hallway conversation
  { url: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=600', author: 'Yuki Tanaka', likes: 12 },
  // Hands-on demo at a booth
  { url: 'https://images.unsplash.com/photo-1519666336592-e225a99dcd2f?w=600', author: 'Priya Iyer', likes: 19 },
  // Roundtable discussion
  { url: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600', author: 'Felix Schmidt', likes: 15 },
  // Notebook + laptop scene at a table
  { url: 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=600', author: 'Camila Reyes', likes: 11 },
  // Group selfie on stage
  { url: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=600', author: 'Nikolai Dmitriev', likes: 28 },
  // Audience cheering / applauding
  { url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600', author: 'Zara Hassan', likes: 24 },
  // Outdoor mingling near venue entrance
  { url: 'https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?w=600', author: 'Diego Fernández', likes: 13 },
  // Whiteboarding session
  { url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=600', author: 'Anna K.', likes: 18 },
  // Stage shot with title slide
  { url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600', author: 'Sara P.', likes: 35 },
];

/** Total photo count across both sources (used by HomeScreen widget). */
export function getTotalPhotoCount(): number {
  return professionalPhotos.length + guestPhotos.length;
}

/** "+9 new" placeholder — static for the prototype. */
export const NEW_PHOTOS_COUNT = 9;

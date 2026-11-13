/**
 * Curated high-resolution sports and athletic facility photography.
 * Ensures cards, carousels, and venue modals always display world-class Olympic-grade imagery
 * without falling back to blank grey placeholders.
 */

const CURATED_SPORT_IMAGES = {
  badminton: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1200&auto=format&fit=crop',
  swimming: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=1200&auto=format&fit=crop',
  tennis: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=1200&auto=format&fit=crop',
  basketball: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1200&auto=format&fit=crop',
  football: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1200&auto=format&fit=crop',
  soccer: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1200&auto=format&fit=crop',
  gym: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop',
  fitness: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1200&auto=format&fit=crop',
  yoga: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?q=80&w=1200&auto=format&fit=crop',
  pilates: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1200&auto=format&fit=crop',
  boxing: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?q=80&w=1200&auto=format&fit=crop',
  martialArts: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=1200&auto=format&fit=crop',
  tableTennis: 'https://images.unsplash.com/photo-1534158914592-062992fbe900?q=80&w=1200&auto=format&fit=crop',
  pickleball: 'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?q=80&w=1200&auto=format&fit=crop',
  golf: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=1200&auto=format&fit=crop',
  volleyball: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=1200&auto=format&fit=crop',
  running: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1200&auto=format&fit=crop',
  arena: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop'
};

export function getSportFallbackImage(name = '', category = '') {
  const text = `${name} ${category}`.toLowerCase();

  if (/cầu lông|badminton/i.test(text)) return CURATED_SPORT_IMAGES.badminton;
  if (/bơi|swimming|pool|aquatic/i.test(text)) return CURATED_SPORT_IMAGES.swimming;
  if (/quần vợt|tennis/i.test(text)) return CURATED_SPORT_IMAGES.tennis;
  if (/bóng rổ|basketball/i.test(text)) return CURATED_SPORT_IMAGES.basketball;
  if (/bóng đá|futsal|football|soccer/i.test(text)) return CURATED_SPORT_IMAGES.football;
  if (/yoga|pilates|thiền|mindful/i.test(text)) return CURATED_SPORT_IMAGES.yoga;
  if (/boxing|quyền anh|võ|mma|taekwondo|karate|judo|combat/i.test(text)) return CURATED_SPORT_IMAGES.boxing;
  if (/bóng bàn|table tennis|ping pong/i.test(text)) return CURATED_SPORT_IMAGES.tableTennis;
  if (/pickleball/i.test(text)) return CURATED_SPORT_IMAGES.pickleball;
  if (/golf/i.test(text)) return CURATED_SPORT_IMAGES.golf;
  if (/bóng chuyền|volleyball/i.test(text)) return CURATED_SPORT_IMAGES.volleyball;
  if (/chạy|running|track|điền kinh/i.test(text)) return CURATED_SPORT_IMAGES.running;
  if (/gym|fitness|thể hình|tạ|cardio|workout/i.test(text)) return CURATED_SPORT_IMAGES.gym;

  return CURATED_SPORT_IMAGES.arena;
}

export function getFacilityFallbackImage(facName = '', roomType = '') {
  return getSportFallbackImage(facName, roomType);
}

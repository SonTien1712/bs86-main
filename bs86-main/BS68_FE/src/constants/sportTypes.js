export const SPORT_TYPES = [
  { key: 'FOOTBALL', label: 'Bóng đá', icon: '⚽' },
  { key: 'PICKLEBALL', label: 'Pickleball', icon: '🏓' },
  { key: 'VOLLEYBALL', label: 'Bóng chuyền', icon: '🏐' },
  { key: 'BASKETBALL', label: 'Bóng rổ', icon: '🏀' }
];

export function getSportLabel(value) {
  return SPORT_TYPES.find((item) => item.key === value)?.label || value;
}
/**
 * TypeScript types for the-fab-cube/flesh-and-blood-cards data
 * Based on: https://github.com/the-fab-cube/flesh-and-blood-cards
 */

export interface FaBCardPrinting {
  unique_id: string;
  set_printing_unique_id: string;
  id: string; // e.g. "MST131"
  set_id: string; // e.g. "MST"
  edition: string; // "N" = Normal, "F" = First Edition
  foiling: string; // "S" = Standard, "R" = Rainbow Foil
  rarity: string; // "M" = Majestic, "L" = Legendary, "F" = Fabled
  expansion_slot: boolean;
  artists: string[];
  art_variations: string[];
  flavor_text: string;
  flavor_text_plain: string;
  image_url: string;
  image_rotation_degrees: number;
  tcgplayer_product_id: string;
  tcgplayer_url: string;
}

export interface FaBCardData {
  unique_id: string; // Card UUID
  name: string;
  color: string; // "Red", "Blue", "Generic", etc.
  pitch: string; // "1", "2", "3"
  cost: string; // Resource cost
  power: string;
  defense: string;
  health: string; // For heroes
  intelligence: string; // For heroes
  arcane: string;
  types: string[]; // ["Illusionist", "Action", "Aura"]
  traits: string[];
  card_keywords: string[]; // ["Ward 10"]
  abilities_and_effects: string[];
  ability_and_effect_keywords: string[];
  granted_keywords: string[];
  removed_keywords: string[];
  interacts_with_keywords: string[];
  functional_text: string; // With formatting
  functional_text_plain: string; // Plain text
  type_text: string; // "Illusionist Action - Aura"
  played_horizontally: boolean;

  // Format legality
  blitz_legal: boolean;
  cc_legal: boolean;
  commoner_legal: boolean;
  ll_legal: boolean;
  silver_age_legal: boolean;

  // Special status
  blitz_living_legend: boolean;
  cc_living_legend: boolean;
  blitz_banned: boolean;
  cc_banned: boolean;
  commoner_banned: boolean;
  ll_banned: boolean;
  silver_age_banned: boolean;
  upf_banned: boolean;
  blitz_suspended: boolean;
  cc_suspended: boolean;
  commoner_suspended: boolean;
  ll_restricted: boolean;

  printings: FaBCardPrinting[];
}

export interface FaBSet {
  unique_id: string;
  id: string; // e.g. "MST"
  name: string;
  formatted_name: string;
  edition: string;
}

export interface FaBKeyword {
  unique_id: string;
  name: string;
  description: string;
  description_plain: string;
}

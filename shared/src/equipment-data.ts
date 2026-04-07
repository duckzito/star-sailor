import type { EquipmentItem } from './types';

export const EQUIPMENT: Record<string, EquipmentItem> = {
  // Weapons
  cosmic_claws: {
    id: 'cosmic_claws',
    name: 'Cosmic Claws',
    category: 'weapon',
    description: 'Sharp claws infused with stellar energy. Increases melee damage.',
    statModifiers: { attack: 8 },
    specialEffect: 'melee_speed_up',
  },
  nova_blaster: {
    id: 'nova_blaster',
    name: 'Nova Blaster',
    category: 'weapon',
    description: 'A powerful ranged weapon that fires concentrated star energy.',
    statModifiers: { attack: 6 },
    specialEffect: 'ranged_piercing',
  },
  meteor_hammer: {
    id: 'meteor_hammer',
    name: 'Meteor Hammer',
    category: 'weapon',
    description: 'A heavy hammer made from a meteorite. Slow but devastating.',
    statModifiers: { attack: 12 },
    specialEffect: 'melee_aoe',
  },

  // Armor
  nebula_shield: {
    id: 'nebula_shield',
    name: 'Nebula Shield',
    category: 'armor',
    description: 'A shield woven from nebula gas. Absorbs incoming damage.',
    statModifiers: { defense: 8 },
  },
  asteroid_plate: {
    id: 'asteroid_plate',
    name: 'Asteroid Plate',
    category: 'armor',
    description: 'Heavy armor crafted from asteroid rock. Maximum protection.',
    statModifiers: { defense: 12, speed: -30 },
  },

  // Accessories
  gravity_boots: {
    id: 'gravity_boots',
    name: 'Gravity Boots',
    category: 'accessory',
    description: 'Boots that let you control gravity. Higher jumps!',
    statModifiers: { speed: 20 },
    specialEffect: 'higher_jump',
  },
  solar_wings: {
    id: 'solar_wings',
    name: 'Solar Wings',
    category: 'accessory',
    description: 'Wings of pure solar energy. Allows gliding.',
    statModifiers: { speed: 15 },
    specialEffect: 'glide',
  },
  comet_trail: {
    id: 'comet_trail',
    name: 'Comet Trail',
    category: 'accessory',
    description: 'Leaves a damaging trail when dashing.',
    statModifiers: { speed: 10 },
    specialEffect: 'dash_damage',
  },
  cosmic_crown: {
    id: 'cosmic_crown',
    name: 'Cosmic Crown',
    category: 'accessory',
    description: 'The ultimate accessory. Boosts all stats.',
    statModifiers: { hp: 25, attack: 5, defense: 5, speed: 10 },
  },

  // Consumables
  star_dust: {
    id: 'star_dust',
    name: 'Star Dust',
    category: 'consumable',
    description: 'Healing dust from a dying star. Restores 30 HP.',
    statModifiers: { hp: 30 },
  },
  supernova_charge: {
    id: 'supernova_charge',
    name: 'Supernova Charge',
    category: 'consumable',
    description: 'Temporarily doubles attack power for 10 seconds.',
    statModifiers: { attack: 15 },
    specialEffect: 'temp_power_boost',
  },
};

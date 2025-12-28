// Popular high-volume items for flipping
export const POPULAR_ITEMS = {
  2: 'Cannonball',
  314: 'Feather',
  453: 'Coal',
  554: 'Fire rune',
  555: 'Water rune',
  556: 'Air rune',
  557: 'Earth rune',
  560: 'Death rune',
  561: 'Nature rune',
  562: 'Chaos rune',
  565: 'Blood rune',
  1515: 'Yew logs',
  1517: 'Maple logs',
  1519: 'Willow logs',
  1521: 'Oak logs',
  1523: 'Logs',
  2150: 'Swamp toad',
  2970: 'Cosmic rune',
  5295: 'Ranarr seed',
  5300: 'Snapdragon seed',
  5304: 'Torstol seed',
  6686: 'Saradomin brew(4)',
  6688: 'Saradomin brew(3)',
  7937: 'Pure essence',
  11937: 'Dragon bones',
  12934: 'Zulrah\'s scales',
  13190: 'Dragon knife',
  22124: 'Anglerfish',
  385: 'Shark',
  391: 'Manta ray',
  3025: 'Super restore(4)',
  2437: 'Super attack(4)',
  2441: 'Super strength(4)',
  2443: 'Super defence(4)',
  2453: 'Ranging potion(4)',
  3041: 'Magic potion(4)',
  12695: 'Stamina potion(4)',
  11936: 'Dark crab',
  13442: 'Twisted bow',
  22486: 'Scythe of vitur',
  12002: 'Occult necklace',
  11802: 'Armadyl godsword',
  11804: 'Bandos godsword',
  11806: 'Saradomin godsword',
  11808: 'Zamorak godsword',
  11832: 'Bandos chestplate',
  11834: 'Bandos tassets',
  11836: 'Bandos boots',
  11826: 'Armadyl helmet',
  11828: 'Armadyl chestplate',
  11830: 'Armadyl chainskirt',
  4151: 'Abyssal whip',
  4153: 'Granite maul',
  6585: 'Amulet of fury',
  11785: 'Armadyl crossbow',
  12924: 'Toxic blowpipe',
  12927: 'Serpentine helm',
  12929: 'Magma helm',
  12931: 'Tanzanite helm',
  13576: 'Dragon warhammer',
  21003: 'Elder maul',
  21006: 'Kodai wand',
  21015: 'Dinh\'s bulwark',
  21021: 'Ancestral hat',
  21024: 'Ancestral robe top',
  21027: 'Ancestral robe bottom',
  22325: 'Justiciar faceguard',
  22327: 'Justiciar chestguard',
  22329: 'Justiciar legguards',
  22322: 'Avernic defender',
  19544: 'Tormented bracelet',
  19547: 'Necklace of anguish',
  19553: 'Ring of suffering',
  19550: 'Amulet of torture',
  21012: 'Dragon hunter crossbow',
  22978: 'Dragonbone necklace'
};

// Sample mapping data for when API is blocked
export const SAMPLE_MAPPING = {
  2: { id: 2, name: 'Cannonball', icon: 'Cannonball', limit: 11000, members: true, highalch: 5 },
  314: { id: 314, name: 'Feather', icon: 'Feather', limit: 13000, members: false, highalch: 1 },
  453: { id: 453, name: 'Coal', icon: 'Coal', limit: 11000, members: false, highalch: 27 },
  560: { id: 560, name: 'Death rune', icon: 'Death_rune', limit: 18000, members: false, highalch: 180 },
  561: { id: 561, name: 'Nature rune', icon: 'Nature_rune', limit: 18000, members: false, highalch: 162 },
  562: { id: 562, name: 'Chaos rune', icon: 'Chaos_rune', limit: 18000, members: false, highalch: 90 },
  565: { id: 565, name: 'Blood rune', icon: 'Blood_rune', limit: 18000, members: true, highalch: 270 },
  385: { id: 385, name: 'Shark', icon: 'Shark', limit: 6000, members: true, highalch: 90 },
  391: { id: 391, name: 'Manta ray', icon: 'Manta_ray', limit: 10000, members: true, highalch: 135 },
  3025: { id: 3025, name: 'Super restore(4)', icon: 'Super_restore(4)', limit: 2000, members: true, highalch: 180 },
  6686: { id: 6686, name: 'Saradomin brew(4)', icon: 'Saradomin_brew(4)', limit: 2000, members: true, highalch: 120 },
  7937: { id: 7937, name: 'Pure essence', icon: 'Pure_essence', limit: 25000, members: true, highalch: 1 },
  11937: { id: 11937, name: 'Dragon bones', icon: 'Dragon_bones', limit: 7500, members: true, highalch: 1 },
  12695: { id: 12695, name: 'Stamina potion(4)', icon: 'Stamina_potion(4)', limit: 2000, members: true, highalch: 200 },
  4151: { id: 4151, name: 'Abyssal whip', icon: 'Abyssal_whip', limit: 70, members: true, highalch: 72000 },
  6585: { id: 6585, name: 'Amulet of fury', icon: 'Amulet_of_fury', limit: 8, members: true, highalch: 51000 },
  11785: { id: 11785, name: 'Armadyl crossbow', icon: 'Armadyl_crossbow', limit: 8, members: true, highalch: 39000 },
  11802: { id: 11802, name: 'Armadyl godsword', icon: 'Armadyl_godsword', limit: 8, members: true, highalch: 780000 },
  11832: { id: 11832, name: 'Bandos chestplate', icon: 'Bandos_chestplate', limit: 8, members: true, highalch: 195000 },
  11834: { id: 11834, name: 'Bandos tassets', icon: 'Bandos_tassets', limit: 8, members: true, highalch: 192000 },
  13576: { id: 13576, name: 'Dragon warhammer', icon: 'Dragon_warhammer', limit: 8, members: true, highalch: 72000 },
  12924: { id: 12924, name: 'Toxic blowpipe', icon: 'Toxic_blowpipe_(empty)', limit: 8, members: true, highalch: 120000 },
  21006: { id: 21006, name: 'Kodai wand', icon: 'Kodai_wand', limit: 8, members: true, highalch: 108000 },
  21021: { id: 21021, name: 'Ancestral hat', icon: 'Ancestral_hat', limit: 8, members: true, highalch: 120000 },
  21024: { id: 21024, name: 'Ancestral robe top', icon: 'Ancestral_robe_top', limit: 8, members: true, highalch: 162000 },
  21027: { id: 21027, name: 'Ancestral robe bottom', icon: 'Ancestral_robe_bottom', limit: 8, members: true, highalch: 150000 },
  13442: { id: 13442, name: 'Twisted bow', icon: 'Twisted_bow', limit: 8, members: true, highalch: 600000 },
  22486: { id: 22486, name: 'Scythe of vitur', icon: 'Scythe_of_vitur_(uncharged)', limit: 8, members: true, highalch: 450000 },
  22322: { id: 22322, name: 'Avernic defender', icon: 'Avernic_defender', limit: 8, members: true, highalch: 420000 },
  19544: { id: 19544, name: 'Tormented bracelet', icon: 'Tormented_bracelet', limit: 8, members: true, highalch: 78000 },
  19547: { id: 19547, name: 'Necklace of anguish', icon: 'Necklace_of_anguish', limit: 8, members: true, highalch: 78000 },
  19550: { id: 19550, name: 'Amulet of torture', icon: 'Amulet_of_torture', limit: 8, members: true, highalch: 78000 },
  21012: { id: 21012, name: 'Dragon hunter crossbow', icon: 'Dragon_hunter_crossbow', limit: 8, members: true, highalch: 192000 },
};

// Sample price data for when API is blocked
export const SAMPLE_PRICES = {
  2: { high: 195, low: 185, highTime: Date.now()/1000, lowTime: Date.now()/1000 },
  314: { high: 3, low: 2, highTime: Date.now()/1000, lowTime: Date.now()/1000 },
  453: { high: 185, low: 175, highTime: Date.now()/1000, lowTime: Date.now()/1000 },
  560: { high: 215, low: 205, highTime: Date.now()/1000, lowTime: Date.now()/1000 },
  561: { high: 195, low: 185, highTime: Date.now()/1000, lowTime: Date.now()/1000 },
  562: { high: 85, low: 78, highTime: Date.now()/1000, lowTime: Date.now()/1000 },
  565: { high: 385, low: 370, highTime: Date.now()/1000, lowTime: Date.now()/1000 },
  385: { high: 1050, low: 980, highTime: Date.now()/1000, lowTime: Date.now()/1000 },
  391: { high: 1450, low: 1380, highTime: Date.now()/1000, lowTime: Date.now()/1000 },
  3025: { high: 9500, low: 8800, highTime: Date.now()/1000, lowTime: Date.now()/1000 },
  6686: { high: 6800, low: 6200, highTime: Date.now()/1000, lowTime: Date.now()/1000 },
  7937: { high: 4, low: 2, highTime: Date.now()/1000, lowTime: Date.now()/1000 },
  11937: { high: 2650, low: 2450, highTime: Date.now()/1000, lowTime: Date.now()/1000 },
  12695: { high: 8500, low: 7800, highTime: Date.now()/1000, lowTime: Date.now()/1000 },
  4151: { high: 1850000, low: 1780000, highTime: Date.now()/1000, lowTime: Date.now()/1000 },
  6585: { high: 2950000, low: 2850000, highTime: Date.now()/1000, lowTime: Date.now()/1000 },
  11785: { high: 8500000, low: 8200000, highTime: Date.now()/1000, lowTime: Date.now()/1000 },
  11802: { high: 12500000, low: 12000000, highTime: Date.now()/1000, lowTime: Date.now()/1000 },
  11832: { high: 18500000, low: 17800000, highTime: Date.now()/1000, lowTime: Date.now()/1000 },
  11834: { high: 28500000, low: 27500000, highTime: Date.now()/1000, lowTime: Date.now()/1000 },
  13576: { high: 42000000, low: 40500000, highTime: Date.now()/1000, lowTime: Date.now()/1000 },
  12924: { high: 4500000, low: 4300000, highTime: Date.now()/1000, lowTime: Date.now()/1000 },
  21006: { high: 85000000, low: 82000000, highTime: Date.now()/1000, lowTime: Date.now()/1000 },
  21021: { high: 18000000, low: 17200000, highTime: Date.now()/1000, lowTime: Date.now()/1000 },
  21024: { high: 52000000, low: 50000000, highTime: Date.now()/1000, lowTime: Date.now()/1000 },
  21027: { high: 42000000, low: 40500000, highTime: Date.now()/1000, lowTime: Date.now()/1000 },
  13442: { high: 1450000000, low: 1420000000, highTime: Date.now()/1000, lowTime: Date.now()/1000 },
  22486: { high: 680000000, low: 665000000, highTime: Date.now()/1000, lowTime: Date.now()/1000 },
  22322: { high: 95000000, low: 92000000, highTime: Date.now()/1000, lowTime: Date.now()/1000 },
  19544: { high: 12500000, low: 12000000, highTime: Date.now()/1000, lowTime: Date.now()/1000 },
  19547: { high: 14500000, low: 14000000, highTime: Date.now()/1000, lowTime: Date.now()/1000 },
  19550: { high: 11500000, low: 11000000, highTime: Date.now()/1000, lowTime: Date.now()/1000 },
  21012: { high: 75000000, low: 72000000, highTime: Date.now()/1000, lowTime: Date.now()/1000 },
};

// Sample volume data (daily trade volume)
export const SAMPLE_VOLUMES = {
  2: 2500000, // Cannonballs - very high volume
  314: 15000000, // Feathers - extremely high
  453: 3000000, // Coal
  560: 1200000, // Death rune
  561: 2000000, // Nature rune
  562: 1500000, // Chaos rune
  565: 800000, // Blood rune
  385: 450000, // Shark
  391: 120000, // Manta ray
  3025: 85000, // Super restore
  6686: 95000, // Sara brew
  7937: 5000000, // Pure essence
  11937: 180000, // Dragon bones
  12695: 65000, // Stamina pot
  4151: 2500, // Abyssal whip
  6585: 800, // Fury
  11785: 150, // ACB
  11802: 120, // AGS
  11832: 350, // Bandos chest
  11834: 400, // Bandos tassets
  13576: 180, // DWH
  12924: 450, // Blowpipe
  21006: 45, // Kodai
  21021: 80, // Ancestral hat
  21024: 60, // Ancestral top
  21027: 65, // Ancestral bottom
  13442: 25, // Tbow
  22486: 35, // Scythe
  22322: 90, // Avernic
  19544: 120, // Tormented
  19547: 130, // Anguish
  19550: 140, // Torture
  21012: 85, // DHCB
};

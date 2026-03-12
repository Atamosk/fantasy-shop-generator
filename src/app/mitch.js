const spells = require("./spells");

const uniqueSpells = spells.buildSpellList(spells.dndSpells);
const conjurationSpells = spells.filterSpells(uniqueSpells, { school: 'conjuration', level: 1 });
console.log(conjurationSpells);


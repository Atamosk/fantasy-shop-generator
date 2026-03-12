const { buildSpellList, filterSpells, dndSpells, DEFAULT_BOOK_LIST } = require('./spells.js');

// Scroll pricing and rarity by spell level (from items.json)
const SCROLL_DATA = {
    0: { price: 30, rarity: 'Common' },      // Cantrip
    1: { price: 74, rarity: 'Common' },
    2: { price: 182, rarity: 'Uncommon' },
    3: { price: 448, rarity: 'Uncommon' },
    4: { price: 1103, rarity: 'Rare' },
    5: { price: 2714, rarity: 'Rare' },
    6: { price: 6676, rarity: 'Very Rare' },
    7: { price: 16422, rarity: 'Very Rare' },
    8: { price: 40398, rarity: 'Very Rare' },
    9: { price: 99380, rarity: 'Legendary' }
};

/**
 * Convert a spell into a spell scroll item.
 *
 * @param {Object} spell - Spell object from spells.js
 * @returns {Object} Scroll item with price, rarity, and spell info
 */
function spellToScroll(spell) {
    const level = spell.properties?.Level ?? 0;
    const scrollInfo = SCROLL_DATA[level] || SCROLL_DATA[0];

    return {
        name: `Spell Scroll: ${spell.name}`,
        type: 'Scroll',
        price: scrollInfo.price,
        rarity: scrollInfo.rarity,
        spellLevel: level,
        spellSchool: spell.properties?.School,
        spellName: spell.name,
        sourceBook: spell.sourceBook || spell.book,
        description: spell.description
    };
}

/**
 * Build a collection of spell scrolls from a spell list.
 *
 * @param {Array} spells - Array of spell objects
 * @returns {Array} Array of scroll items sorted alphabetically
 */
function buildScrollList(spells) {
    return spells
        .map(spellToScroll)
        .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Build a scroll collection from dnd-data using specified books.
 *
 * @param {Array<string>} bookList - Ordered list of books (last = highest priority)
 * @returns {Array} Array of scroll items
 */
function buildScrollListFromBooks(bookList = DEFAULT_BOOK_LIST) {
    const spells = buildSpellList(dndSpells, bookList);
    return buildScrollList(spells);
}

/**
 * Filter scrolls by various criteria.
 *
 * @param {Array} scrolls - Array of scroll items
 * @param {Object} criteria - Filter criteria
 * @param {number} criteria.maxPrice - Maximum price in gold
 * @param {number} criteria.minPrice - Minimum price in gold
 * @param {number} criteria.level - Exact spell level
 * @param {number} criteria.maxLevel - Maximum spell level
 * @param {string} criteria.rarity - Exact rarity match
 * @param {string} criteria.school - Spell school (uses normalized matching)
 * @returns {Array} Filtered scroll array
 */
function filterScrolls(scrolls, criteria = {}) {
    const { maxPrice, minPrice, level, maxLevel, rarity, school } = criteria;

    return scrolls.filter(scroll => {
        if (maxPrice !== undefined && scroll.price > maxPrice) return false;
        if (minPrice !== undefined && scroll.price < minPrice) return false;
        if (level !== undefined && scroll.spellLevel !== level) return false;
        if (maxLevel !== undefined && scroll.spellLevel > maxLevel) return false;
        if (rarity && scroll.rarity.toLowerCase() !== rarity.toLowerCase()) return false;
        if (school && !scroll.spellSchool?.toLowerCase().includes(school.toLowerCase())) return false;
        return true;
    });
}

module.exports = {
    spellToScroll,
    buildScrollList,
    buildScrollListFromBooks,
    filterScrolls,
    SCROLL_DATA
};

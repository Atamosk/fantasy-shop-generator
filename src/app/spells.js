const dndSpells = require('dnd-data').spells;

// Default book list: Wizards of the Coast books in priority order (last = highest)
const DEFAULT_BOOK_LIST = [
    // Core 2014
    "Player's Handbook",
    "Free Basic Rules (2014)",
    // Expansions (roughly chronological)
    "Princes of the Apocalypse",
    "Sword Coast Adventurer's Guide",
    "Volo's Guide to Monsters",
    "Xanathar's Guide to Everything",
    "Acquisitions Incorporated",
    "Eberron - Rising from the Last War",
    "Explorer's Guide to Wildemount",
    "Mythic Odysseys of Theros",
    "Icewind Dale - Rime of the Frostmaiden",
    "Tasha's Cauldron of Everything",
    "Fizban's Treasury of Dragons",
    "Strixhaven A Curriculum of Chaos",
    "Spelljammer - Adventures in Space",
    "Planescape - Adventures in the Multiverse",
    "The Book of Many Things",
    // 2024 rules
    "Free Basic Rules (2024)",
    "Player's Handbook (2024)",
];

/**
 * Build a deduplicated spell list from an ordered list of books.
 *
 * The book list defines both which books to include AND their priority.
 * Earlier books in the list have lower priority; later books override duplicates.
 *
 * @param {Array} spells - Array of spell objects with name, book, etc.
 * @param {Array<string>} bookList - Ordered list of books (last = highest priority)
 * @returns {Array} Deduplicated spell array sorted alphabetically, with sourceBook preserved
 */
function buildSpellList(spells, bookList = DEFAULT_BOOK_LIST) {
    const bookSet = new Set(bookList);

    // Filter to only include spells from books in our list
    const filteredSpells = spells.filter(s => bookSet.has(s.book));

    // Sort by book priority (earlier in list = lower priority = processed first)
    const sortedSpells = [...filteredSpells].sort((a, b) => {
        return bookList.indexOf(a.book) - bookList.indexOf(b.book);
    });

    // Build deduplicated collection (last write wins)
    const spellMap = new Map();
    for (const spell of sortedSpells) {
        // Normalize: lowercase and convert curly quotes to straight quotes
        const key = spell.name.toLowerCase().replace(/[\u2018\u2019]/g, "'");
        spellMap.set(key, {
            ...spell,
            sourceBook: spell.book
        });
    }

    // Sort alphabetically by spell name
    return Array.from(spellMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
    );
}

// TODO: Add school normalization helper to handle variants like "Conjuration (Shadow)",
//       "conjuration", "Abjuration (Ritual; Angelic)" -> base school only

/**
 * Filter spells by various criteria using native JS methods
 */
function filterSpells(spells, criteria = {}) {
    const { school, level, publisher, name } = criteria;

    return spells.filter(spell => {
        if (school && spell.properties?.School?.toLowerCase() !== school.toLowerCase()) {
            return false;
        }
        if (level !== undefined && spell.properties?.Level !== level) {
            return false;
        }
        if (publisher && spell.publisher !== publisher) {
            return false;
        }
        if (name && !spell.name.toLowerCase().includes(name.toLowerCase())) {
            return false;
        }
        return true;
    });
}

/**
 * Get distinct values for a spell property
 */
function getDistinctValues(spells, propertyPath) {
    const values = spells.map(spell => {
        if (propertyPath.includes('.')) {
            const [obj, key] = propertyPath.split('.');
            return spell[obj]?.[key];
        }
        return spell[propertyPath];
    });
    return [...new Set(values)].filter(v => v !== undefined).sort();
}

module.exports = {
    buildSpellList,
    filterSpells,
    getDistinctValues,
    DEFAULT_BOOK_LIST,
    dndSpells
};

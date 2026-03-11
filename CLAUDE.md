# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fantasy Shop Generator creates shop inventories compatible with pen and paper RPGs (D&D-compatible). It uses AlaSQL to query item and spell data from JSON datasets.

## Commands

```bash
npm start       # Run main app (src/app/app.js)
npm test        # Run tests (src/test/test.js) - currently placeholder
```

## Architecture

- **src/app/app.js** - Main entry point, queries local item data using AlaSQL
- **src/app/mitch.js** - Example queries demonstrating AlaSQL usage with both local items and dnd-data package
- **src/data/items.json** - Local item dataset with fields: type, name, price, base_item, rarity, requirements, weight
- **dnd-data package** - External NPM package providing `items` and `spells` collections

## Data Querying

Uses AlaSQL for SQL-like queries against JSON arrays. Key patterns:

```javascript
const alasql = require('alasql');
const itemList = require("../data/items.json");

// Basic query
alasql("SELECT * FROM ? WHERE price <= 10", [itemList]);

// Nested property access for dnd-data
alasql("SELECT * FROM ? WHERE properties->('Item Type') = 'Potion'", [dnd_items]);
```

## Legal Notice

This is unofficial Fan Content under Wizards of the Coast's Fan Content Policy. Not approved/endorsed by Wizards.

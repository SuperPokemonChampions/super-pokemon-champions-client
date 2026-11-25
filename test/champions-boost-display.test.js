'use strict';

const assert = require('assert').strict;
const fs = require('fs');
const vm = require('vm');

global.window = global;
for (const [name, file] of [['BattlePokedex', 'pokedex'], ['BattleMovedex', 'moves'], ['BattleItems', 'items'], ['BattleAbilities', 'abilities'], ['BattleTypeChart', 'typechart'], ['BattleTeambuilderTable', 'teambuilder-tables']]) {
	global[name] = require('../play.pokemonshowdown.com/data/' + file + '.js')[name];
}
require('../play.pokemonshowdown.com/js/battle-dex-data.js');
require('../play.pokemonshowdown.com/js/battle-dex.js');
require('../play.pokemonshowdown.com/js/battle.js');
const Tooltips = vm.runInNewContext(
	fs.readFileSync(require.resolve('../play.pokemonshowdown.com/js/battle-tooltips.js'), 'utf8') + '\nBattleTooltips;',
	{Dex}
);

describe('Champions stat boost display', () => {
	const battle = {dex: Dex.mod('champions'), gen: 9};
	const tooltips = new Tooltips(battle);
	const stats = {atk: 100, def: 100, spa: 100, spd: 100, spe: 100};

	it('matches the 25% stage scale in badges and tooltips for every battle stat', () => {
		for (const stat of Object.keys(stats)) {
			for (let stage = -12; stage <= 12; stage++) {
				if (!stage) continue;
				const pokemon = {boosts: {[stat]: stage}, volatiles: {}, side: {battle}};
				const factor = stage < 0 ? 1 / (1 + Math.abs(stage) / 4) : 1 + stage / 4;
				assert(Pokemon.prototype.getBoost.call(pokemon, stat).startsWith(factor.toFixed(2) + '&times;'), stat + ': ' + stage);
				assert.equal(tooltips.calculateModifiedStats(pokemon, {stats}, true)[stat], Math.floor(100 * factor));
			}
		}
	});

	it('shows a retained +1 Special Attack as 1.25x and computes the matching stat', () => {
		const gengar = {boosts: {spa: 1}, volatiles: {}, side: {battle}};
		assert.equal(Pokemon.prototype.getBoost.call(gengar, 'spa'), '1.25&times;&nbsp;SpA');
		assert.equal(tooltips.calculateModifiedStats(gengar, {stats: {...stats, spa: 150}}, true).spa, 187);
	});

	it('keeps accuracy and evasion on their separate scale', () => {
		const pokemon = {boosts: {accuracy: 1, evasion: 2}, side: {battle}};
		assert(Pokemon.prototype.getBoost.call(pokemon, 'accuracy').startsWith('1.33&times;'));
		assert(Pokemon.prototype.getBoost.call(pokemon, 'evasion').startsWith('1.67&times;'));
	});

	it('renders Standardite with the same item-sheet icon as Eviolite', () => {
		const dex = Dex.mod('champions');
		assert.equal(dex.items.get('standardite').spritenum, dex.items.get('eviolite').spritenum);
		assert.equal(Dex.getItemIcon('standardite'), Dex.getItemIcon('eviolite'));
	});
});

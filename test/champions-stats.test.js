const assert = require('assert').strict;
global.window = global;
for (const [name, file] of [['BattlePokedex', 'pokedex'], ['BattleMovedex', 'moves'], ['BattleItems', 'items'], ['BattleAbilities', 'abilities'], ['BattleTypeChart', 'typechart'], ['BattleTeambuilderTable', 'teambuilder-tables']]) {
 global[name] = require('../play.pokemonshowdown.com/data/' + file + '.js')[name];
}
require('../play.pokemonshowdown.com/js/battle-dex-data.js');
require('../play.pokemonshowdown.com/js/battle-dex.js');
require('../play.pokemonshowdown.com/js/battle-tooltips.js');

function sampleSet() {
 return {species: 'Charizard', ability: 'Blaze', item: 'Heavy-Duty Boots', nature: 'Serious', level: 50,
  moves: ['Flamethrower', 'Air Slash', 'Roost', 'Dragon Pulse'], evs: {hp: 2, spa: 32, spe: 32}};
}
describe('Champions stat editor', () => {
 for (const format of ['superchampionssingles6v6', 'superchampionssingles3v3', 'superchampionssingles4v4', 'superchampionsvgc6v6', 'superchampionscustomgame', 'superchampionsdoublescustomgame']) {
  it('opens stat suggestions and optimizer for ' + format, () => {
   const guesser = new BattleStatGuesser(format);
   assert.equal(guesser.dex.modid, 'champions');
   assert.equal(guesser.useStatPoints, true);
   const guessed = guesser.guess(sampleSet());
   assert(Object.values(guessed.evs).every(Number.isFinite));
   assert.doesNotThrow(() => BattleStatOptimizer(sampleSet(), format));
  });
 }
 it('uses Champions point calculations for edited values', () => {
  const guesser = new BattleStatGuesser('superchampionssingles6v6');
  const set = sampleSet();
  for (const stat of ['hp', 'atk', 'def', 'spa', 'spd', 'spe']) {
   assert.equal(guesser.getStat(stat, set, 20) - guesser.getStat(stat, set, 0), 20, stat);
  }
 });
 it('preserves generation selection for standard formats', () => {
  assert.equal(new BattleStatGuesser('gen7ou').dex.gen, 7);
  assert.equal(new BattleStatGuesser('gen9ou').dex.gen, 9);
 });
});

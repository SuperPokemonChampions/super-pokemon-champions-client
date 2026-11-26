const assert = require('assert').strict;
const fs = require('fs');
const vm = require('vm');
global.window = global;
for (const [name, file] of [['BattlePokedex','pokedex'], ['BattleMovedex','moves'], ['BattleItems','items'], ['BattleAbilities','abilities'], ['BattleTypeChart','typechart'], ['BattleTeambuilderTable','teambuilder-tables']]) global[name] = require('../play.pokemonshowdown.com/data/'+file+'.js')[name];
require('../play.pokemonshowdown.com/js/battle-dex-data.js');
require('../play.pokemonshowdown.com/js/battle-dex.js');
vm.runInThisContext(fs.readFileSync(require.resolve('../play.pokemonshowdown.com/js/battle-choices.js'),'utf8'));
vm.runInThisContext(fs.readFileSync(require.resolve('../play.pokemonshowdown.com/js/battle-dex-search.js'),'utf8'));
describe('Champions client patch', () => {
 it('shows the base ability selection for Charizardite X', () => {
  const search = new DexSearch();
  search.setType('ability', 'superchampionssingles6v6', {species: 'Charizard', item: 'Charizardite X'});
  const rows = search.typedSearch.getBaseResults();
  assert(rows.some(([type, text]) => type === 'html' && /Solar Power.*Levitate/.test(text)));
  assert(rows.some(([type, id]) => type === 'ability' && id === 'solarpower'));
 });
 it('shows current stat, ability and PP data from the server', () => {
  const dex = Dex.mod('champions');
  assert.deepEqual(dex.species.get('gengar').abilities, {0: 'Cursed Body', 1: 'Levitate'});
  assert.equal(dex.species.get('scyther').baseStats.spa, 50);
  for (const [id, pp] of Object.entries({revivalblessing: 1, sketch: 1, encore: 8, closecombat: 8, recover: 8, earthquake: 12, icebeam: 16, shadowball: 16, tackle: 20})) {
   assert.equal(dex.moves.get(id).pp, pp, id);
   assert.equal(dex.moves.get(id).noPPBoosts, true, id);
  }
 });
 it('shows Taunt as legal in the actual Clodsire move picker', () => {
  const search = new DexSearch('move', 'superchampionssingles6v6', 'clodsire');
  const moves = search.typedSearch.getBaseResults();
  assert(moves.some(row => row[0] === 'move' && row[1] === 'taunt'));
  assert(search.typedSearch.canLearn('clodsire', 'taunt'));
  assert(!search.typedSearch.canLearn('clodsire', 'spore'));
 });
 it('includes universal Taunt in every generated Champions learnset', () => {
  for (const [species, learnset] of Object.entries(BattleTeambuilderTable.champions.learnsets)) {
   assert(learnset.taunt?.includes('9'), species);
  }
 });
 it('describes Parting Shot and Shadow Tag effects without substituting PP', () => {
  const dex = Dex.mod('champions');
  const move = dex.moves.get('partingshot');
  assert.equal(move.pp, 8);
  assert.equal(move.noPPBoosts, true);
  assert.match(move.shortDesc, /Atk and Sp\. Atk by 2/);
  assert.match(move.desc, /Attack and Special Attack by 2 stages/);
  assert(!/\bPP\b/.test(move.shortDesc + move.desc));
  assert.match(dex.abilities.get('shadowtag').shortDesc, /2 turns/);
 });
 it('shows exact PP, power and accuracy from Champions overrides', () => {
  const dex = Dex.mod('champions');
  for (const [id,pp] of [['airslash',12],['bodyslam',12],['bind',8],['metalclaw',16],['return',8],['dragonrage',8],['seismictoss',8]]) {
   const move = dex.moves.get(id); assert.equal(move.pp, pp, id); assert.equal(move.noPPBoosts, true, id);
  }
  assert.equal(dex.moves.get('lastresort').accuracy,90);
  assert.equal(dex.moves.get('overheat').basePower,110);
 });
 it('includes Standardite and Fairy Hidden Power', () => {
  const dex = Dex.mod('champions'); assert(dex.items.get('standardite').exists); assert.equal(dex.moves.get('hiddenpowerfairy').type,'Fairy');
 });
 it('keeps Dodge preference through waiting, switching, and exhausted requests', () => {
  for (const request of [{requestType:'wait'},{requestType:'switch',forceSwitch:[true],side:{pokemon:[]}},{requestType:'move',active:[{canDodge:0}],side:{pokemon:[]}}]) {
   const choices = new BattleChoiceBuilder(request,true); assert(choices.dodgeEnabled); assert(!choices.current.dodge);
  }
  const request={requestType:'move',active:[{canDodge:2}],side:{pokemon:[]}};
  assert(new BattleChoiceBuilder(request,true).current.dodge);
  assert(!new BattleChoiceBuilder(request,false).dodgeEnabled);
 });
});

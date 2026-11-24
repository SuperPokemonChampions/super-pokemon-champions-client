const assert = require('assert').strict;
const fs = require('fs');
const vm = require('vm');
global.window = global;
for (const [name, file] of [['BattlePokedex','pokedex'], ['BattleMovedex','moves'], ['BattleItems','items'], ['BattleAbilities','abilities'], ['BattleTypeChart','typechart'], ['BattleTeambuilderTable','teambuilder-tables']]) global[name] = require('../play.pokemonshowdown.com/data/'+file+'.js')[name];
require('../play.pokemonshowdown.com/js/battle-dex-data.js');
require('../play.pokemonshowdown.com/js/battle-dex.js');
vm.runInThisContext(fs.readFileSync(require.resolve('../play.pokemonshowdown.com/js/battle-choices.js'),'utf8'));
describe('Champions client patch', () => {
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

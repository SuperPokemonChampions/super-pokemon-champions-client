const assert = require('assert').strict;
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const jsRoot = path.join(__dirname, '../play.pokemonshowdown.com/js');
const source = fs.readFileSync(path.join(jsRoot, 'client.js'), 'utf8');
const method = /getActionPHP: function \(action\) \{([\s\S]*?)\n\t\t\},/.exec(source)[1];
function route(action, testclient = false) {
 const context = {Config: {server: {id: 'pokemonshowdownbeta'}, routes: {client: 'play.pokemonshowdown.com'}, testclient}, action};
 return vm.runInNewContext('(function (action) {' + method + '})(action)', context);
}
describe('Login API routing', () => {
 it('uses supported API routes while retaining the server ID', () => {
  for (const action of ['getassertion', 'login', 'upkeep', 'logout', 'register', 'getteams']) {
   assert.equal(route(action), '/api/' + action + '?serverid=pokemonshowdownbeta');
  }
 });
 it('preserves the official-host test-client routing', () => {
  assert.equal(route('upkeep', true), 'https://play.pokemonshowdown.com/api/upkeep?serverid=pokemonshowdownbeta');
 });
 it('passes an action at every legacy client call site', () => {
  for (const file of ['client.js', 'client-chat.js', 'client-topbar.js', 'storage.js']) {
   assert(!fs.readFileSync(path.join(jsRoot,file),'utf8').includes('getActionPHP()'), file);
  }
 });
});

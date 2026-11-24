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

describe('Login request failures', () => {
 const body = /requestLogin: function \(action, data, success, silent\) \{([\s\S]*?)\n\t\t\},/.exec(source)[1];
 function setup() {
  let options, failure, successCalls = 0, popups = 0, updates = 0;
  const context = {
   $: {ajax: opts => {options = opts; return {done: () => ({fail: callback => {failure = callback;}})};}},
   app: {topbar: {updateUserbar: () => updates++}, addPopupMessage: () => popups++},
  };
  const request = vm.runInNewContext('(function(action, data, success, silent) {' + body + '})', context);
  const user = {loaded: false, getActionPHP: action => '/api/' + action};
  return {run: silent => request.call(user, 'login', {}, () => successCalls++, silent),
   fail: () => failure({status:522}, 'error'),
   get state() {return {options, successCalls, popups, updates, user};}};
 }
 it('caps login requests at 15 seconds and reports failure without accepting a login', () => {
  const request = setup(); request.run(false);
  assert.equal(request.state.options.timeout,15000);
  assert.equal(request.state.options.type,'POST');
  request.fail();
  assert.equal(request.state.popups,1);
  assert.equal(request.state.successCalls,0);
  assert.equal(request.state.user.loaded,true);
 });
 it('lets failed background session checks finish without an unsolicited popup', () => {
  const request = setup(); request.run(true); request.fail();
  assert.equal(request.state.popups,0);
  assert.equal(request.state.updates,1);
  assert.equal(request.state.user.loaded,true);
 });
});

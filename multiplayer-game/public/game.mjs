import Player from './Player.mjs';
import Collectible from './Collectible.mjs';
const socket = io();
const canvas = document.getElementById('game-window');
const context = canvas.getContext('2d');
const connection = document.getElementById('connection');
const toggle = document.getElementById('connection-toggle');
const input = { up: false, down: false, left: false, right: false };
const keyDirections = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
let myId;
let leaderboardKey = '';
let state = { players: [], items: [] };
function sendInput() { if (socket.connected) socket.emit('input', input); }
function clearInput() { Object.keys(input).forEach(key => { input[key] = false; }); sendInput(); }
window.addEventListener('keydown', event => {
  const direction = keyDirections[event.key];
  if (!direction || ['INPUT', 'TEXTAREA', 'BUTTON'].includes(event.target.tagName)) return;
  event.preventDefault();
  if (!input[direction]) { input[direction] = true; sendInput(); }
});
window.addEventListener('keyup', event => {
  const direction = keyDirections[event.key];
  if (direction) { event.preventDefault(); input[direction] = false; sendInput(); }
});
window.addEventListener('blur', clearInput);
document.addEventListener('visibilitychange', () => { if (document.hidden) clearInput(); });
document.querySelectorAll('[data-direction]').forEach(button => {
  const direction = button.dataset.direction;
  button.addEventListener('pointerdown', event => { event.preventDefault(); button.setPointerCapture(event.pointerId); input[direction] = true; sendInput(); });
  const release = () => { input[direction] = false; sendInput(); };
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
  button.addEventListener('keydown', event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); input[direction] = true; sendInput(); } });
  button.addEventListener('keyup', event => { if (event.key === ' ' || event.key === 'Enter') release(); });
  button.addEventListener('blur', release);
});
toggle.addEventListener('click', () => {
  if (socket.connected) { clearInput(); socket.disconnect(); } else { connection.textContent = 'Connecting to the arena…'; socket.connect(); }
});
socket.on('welcome', message => { myId = message.id; clearInput(); toggle.textContent = 'Disconnect'; });
socket.on('connect_error', () => { connection.textContent = 'Connection failed. Check that the game server is running, then reconnect.'; toggle.textContent = 'Reconnect'; });
socket.on('disconnect', () => { connection.textContent = 'Disconnected. Reconnect to rejoin the arena.'; toggle.textContent = 'Reconnect'; state.players = []; render(); });
socket.on('state', snapshot => {
  state = { players: snapshot.players.map(data => new Player(data)), items: snapshot.items.map(data => new Collectible(data)) };
  render();
});
function render() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#eef2ef'; context.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 40) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, canvas.height); context.stroke(); }
  for (let y = 0; y < canvas.height; y += 40) { context.beginPath(); context.moveTo(0, y); context.lineTo(canvas.width, y); context.stroke(); }
  for (const item of state.items) {
    context.fillStyle = '#23754c'; context.beginPath();
    context.moveTo(item.x + 6, item.y); context.lineTo(item.x + 12, item.y + 6); context.lineTo(item.x + 6, item.y + 12); context.lineTo(item.x, item.y + 6); context.closePath(); context.fill();
  }
  for (const player of state.players) {
    context.fillStyle = player.id === myId ? '#23754c' : '#697b70';
    context.fillRect(player.x, player.y, player.width, player.height);
    context.fillStyle = '#17251e'; context.font = '11px system-ui';
    context.fillText(player.id === myId ? 'You' : player.id.slice(-4), player.x, Math.max(12, player.y - 5));
  }
  const me = state.players.find(player => player.id === myId);
  document.getElementById('my-score').textContent = 'Score: ' + (me ? me.score : 0);
  document.getElementById('my-rank').textContent = me ? me.calculateRank(state.players) : 'Rank: —';
  if (socket.connected) { const status = 'Connected · ' + state.players.length + (state.players.length === 1 ? ' player' : ' players'); if (connection.textContent !== status) connection.textContent = status; }
  const nextKey = state.players.map(player => player.id + ':' + player.score).join('|');
  if (leaderboardKey === nextKey) return;
  leaderboardKey = nextKey;
  const leaderboard = document.getElementById('leaderboard');
  leaderboard.replaceChildren(...state.players.slice().sort((a, b) => b.score - a.score || String(a.id).localeCompare(String(b.id))).map(player => {
    const item = document.createElement('li');
    item.textContent = (player.id === myId ? 'You' : 'Player ' + player.id.slice(-4)) + ' · ' + player.score;
    return item;
  }));
}
render();


class Player {
  constructor({ x = 0, y = 0, score = 0, id = crypto.randomUUID() } = {}) {
    this.x = Number.isFinite(x) ? x : 0;
    this.y = Number.isFinite(y) ? y : 0;
    this.score = Number.isFinite(score) ? score : 0;
    this.id = id;
    this.width = 20;
    this.height = 20;
  }
  movePlayer(dir, speed) {
    if (!Number.isFinite(speed) || speed < 0) return;
    if (dir === 'up') this.y -= speed;
    if (dir === 'down') this.y += speed;
    if (dir === 'left') this.x -= speed;
    if (dir === 'right') this.x += speed;
  }
  collision(item) {
    if (!item || !Number.isFinite(item.x) || !Number.isFinite(item.y)) return false;
    return this.x < item.x + (item.width || 12) && this.x + this.width > item.x && this.y < item.y + (item.height || 12) && this.y + this.height > item.y;
  }
  calculateRank(arr) {
    return `Rank: ${1 + arr.filter(player => player.score > this.score).length}/${arr.length}`;
  }
}
export default Player;

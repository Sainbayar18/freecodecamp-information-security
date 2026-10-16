class Collectible {
  constructor({ x = 0, y = 0, value = 1, id = crypto.randomUUID() } = {}) {
    this.x = Number.isFinite(x) ? x : 0;
    this.y = Number.isFinite(y) ? y : 0;
    this.value = Number.isFinite(value) && value > 0 ? value : 1;
    this.id = id;
    this.width = 12;
    this.height = 12;
  }
}
export default Collectible;

export function randomItem<T extends defined>(items: readonly T[]): T {
  return items[math.random(0, items.size() - 1)];
}

export function randomItems<T extends defined>(items: readonly T[], count: number): T[] {
  const pool = [...items];
  const result: T[] = [];
  const pickCount = math.min(count, pool.size());

  for (let i = 0; i < pickCount; i++) {
    const index = math.random(0, pool.size() - 1);
    result.push(pool[index]);
    pool.remove(index);
  }

  return result;
}

export function shuffle<T extends defined>(items: readonly T[]): T[] {
  const result = [...items];

  for (let i = result.size() - 1; i > 0; i--) {
    const j = math.random(0, i);
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }

  return result;
}

export function randomPointInModel(model: Model, randomY = false, inset = 0): Vector3 {
  const [cframe, size] = model.GetBoundingBox();

  const halfX = math.max(0, (size.X - inset) / 2);
  const halfY = math.max(0, (size.Y - inset) / 2);
  const halfZ = math.max(0, (size.Z - inset) / 2);

  const x = randomFloat(-halfX, halfX);
  const y = randomY ? randomFloat(-halfY, halfY) : 0;
  const z = randomFloat(-halfZ, halfZ);

  return cframe.PointToWorldSpace(new Vector3(x, y, z));
}

export function randomFloat(min: number, max: number): number {
  return min + math.random() * (max - min);
}

export function randomBoolean(): boolean {
  return math.random() < 0.5;
}

export function rollChance(percentChance: number): boolean {
  return math.random() <= percentChance / 100;
}

export interface WeightedEntry<T> {
  readonly value: T;
  readonly weight: number;
}

export function weightedRandom<T extends defined>(entries: readonly WeightedEntry<T>[]): T {
  const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = randomFloat(0, totalWeight);

  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) return entry.value;
  }

  return entries[entries.size() - 1].value;
}

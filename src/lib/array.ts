export function shuffleArray(arr: any[], count = -1) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return count > -1 ? shuffled.slice(0, count) : shuffled;
}

export function arraysEqual(a: any[] = [], b: any[] = []) {
  return a.length === b.length && a.every((val, i) => JSON.stringify(val) === JSON.stringify(b[i]));
}

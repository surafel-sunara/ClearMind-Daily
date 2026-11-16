export function gridKeyTarget(key: string, index: number, size: number, wholeGrid = false): number | undefined {
  const column = index % size;
  const row = Math.floor(index / size);
  switch (key) {
    case "ArrowLeft": return column > 0 ? index - 1 : index;
    case "ArrowRight": return column < size - 1 ? index + 1 : index;
    case "ArrowUp": return row > 0 ? index - size : index;
    case "ArrowDown": return row < size - 1 ? index + size : index;
    case "Home": return wholeGrid ? 0 : row * size;
    case "End": return wholeGrid ? size * size - 1 : (row + 1) * size - 1;
  }
}

/**
 * Undo/redo history for OTP input values.
 * Stores snapshots of the values array.
 */
export class HistoryManager {
  constructor(maxSize = 50) {
    this._stack = [];
    this._pointer = -1;
    this._maxSize = maxSize;
  }

  push(snapshot) {
    // Drop any redo states when new action taken
    this._stack = this._stack.slice(0, this._pointer + 1);
    this._stack.push([...snapshot]);
    if (this._stack.length > this._maxSize) this._stack.shift();
    this._pointer = this._stack.length - 1;
  }

  undo() {
    if (this._pointer <= 0) return null;
    this._pointer--;
    return [...this._stack[this._pointer]];
  }

  redo() {
    if (this._pointer >= this._stack.length - 1) return null;
    this._pointer++;
    return [...this._stack[this._pointer]];
  }

  canUndo() {
    return this._pointer > 0;
  }

  canRedo() {
    return this._pointer < this._stack.length - 1;
  }

  clear() {
    this._stack = [];
    this._pointer = -1;
  }

  /** Push only if state changed */
  pushIfChanged(snapshot) {
    const current = this._stack[this._pointer];
    if (!current || !arraysEqual(current, snapshot)) {
      this.push(snapshot);
    }
  }
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

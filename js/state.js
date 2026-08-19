/*
 * state.js
 * Single source of truth for all answers the user has entered.
 * Nothing here ever leaves the browser - there is no server call
 * anywhere in this app.
 */

const AppState = (function () {
  let data = deepClone(DEFAULT_STATE);
  const listeners = [];

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function get() {
    return data;
  }

  function set(field, value) {
    data[field] = value;
    notify();
  }

  // For array fields
  function toggleArrayValue(field, value, checked) {
    const arr = new Set(data[field] || []);
    if (checked) arr.add(value);
    else arr.delete(value);
    data[field] = Array.from(arr);
    notify();
  }

  function addListRow(field, row) {
    if (!Array.isArray(data[field])) data[field] = [];
    data[field].push(row);
    notify();
  }

  function updateListRow(field, index, key, value) {
    if (!data[field] || !data[field][index]) return;
    data[field][index][key] = value;
    notify();
  }

  function removeListRow(field, index) {
    if (!data[field]) return;
    data[field].splice(index, 1);
    notify();
  }

  // For an object-valued field keyed by option value (e.g. free-text notes
  // attached to a ticked checkbox, keyed by that checkbox's value).
  function setDetail(field, key, value) {
    if (!data[field]) data[field] = {};
    data[field][key] = value;
    notify();
  }

  // True if anything has been changed from the blank defaults - used to
  // decide whether to warn the user before they navigate away.
  function isDirty() {
    return JSON.stringify(data) !== JSON.stringify(DEFAULT_STATE);
  }

  // Replaces the whole state at once (e.g. restored from a saved-progress
  // link). Missing fields fall back to the blank defaults.
  function loadState(newData) {
    data = Object.assign(deepClone(DEFAULT_STATE), newData);
    notify();
  }

  function onChange(fn) {
    listeners.push(fn);
  }

  function notify() {
    listeners.forEach((fn) => fn(data));
  }

  return {
    get,
    set,
    toggleArrayValue,
    addListRow,
    updateListRow,
    removeListRow,
    setDetail,
    isDirty,
    loadState,
    onChange,
  };
})();

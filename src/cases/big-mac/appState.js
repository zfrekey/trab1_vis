// Fábrica de estado (sem Redux/etc.): cada redesign chama createAppState()
// e recebe sua própria instância isolada — dois redesigns na mesma página
// não devem linkar seleção/hover um do outro.
export function createAppState() {
  const state = {
    selectedDate: null,
    hoveredCountry: null,
    selectedCountry: null,
  };

  const listeners = new Set();

  function getState() {
    return { ...state };
  }

  // Só notifica quando algo muda de fato, evitando re-render à toa.
  function setState(patch) {
    let changed = false;
    for (const key of Object.keys(patch)) {
      if (state[key] !== patch[key]) {
        state[key] = patch[key];
        changed = true;
      }
    }
    if (changed) {
      const snapshot = getState();
      listeners.forEach((listener) => listener(snapshot));
    }
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return { getState, setState, subscribe };
}

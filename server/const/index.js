export const CAPTURERS = {
  capturer1: 'capturer1',
  capturer2: 'capturer2',
  capturer3: 'capturer3',
  capturer4: 'capturer4',
}

export const capturerToDecklink = (capturerName) =>
  Number(String(capturerName).replace('capturer', ''))
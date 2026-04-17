export const convertDataToRows = (data) => {
  const rowsMap = {}

  for (const item of data) {
    const recordName = item?.name

    if (!rowsMap[recordName]) {
      rowsMap[recordName] = {
        id: recordName,
      }
    }

    rowsMap[recordName][`start${item.day}`] = item.start_at
    rowsMap[recordName][`end${item.day}`] = item.end_at
  }
  return Object.values(rowsMap)
}

export const days = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
}

export const daysOptions = [
  {
    label: 'Lunes',
    value: 'Monday',
  },

  {
    label: 'Martes',
    value: 'Tuesday',
  },

  {
    label: 'Miercoles',
    value: 'Wednesday',
  },

  {
    label: 'Jueves',
    value: 'Thursday',
  },

  {
    label: 'Viernes',
    value: 'Friday',
  },

  {
    label: 'Sábado',
    value: 'Saturday',
  },

  {
    label: 'Domingo',
    value: 'Sunday',
  },
]

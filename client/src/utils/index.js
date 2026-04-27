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
    label: 'Monday',
    value: 'Monday',
  },

  {
    label: 'Tuesday',
    value: 'Tuesday',
  },

  {
    label: 'Wednesday',
    value: 'Wednesday',
  },

  {
    label: 'Thursday',
    value: 'Thursday',
  },

  {
    label: 'Friday',
    value: 'Friday',
  },

  {
    label: 'Saturday',
    value: 'Saturday',
  },

  {
    label: 'Sunday',
    value: 'Sunday',
  },
]

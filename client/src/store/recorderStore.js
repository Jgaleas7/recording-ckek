import { create } from 'zustand'
import { days } from '../utils'
import { mountStoreDevtool } from 'simple-zustand-devtools'

const useRecordStore = create((set, get) => ({
  activeTabIndex: 0,
  capturer: 'capturer1',
  format: 'mp4',
  records: [],
  filteredRecords: [],
  nameOfVideoToSave: {
    capturer1: '',
    capturer2: '',
    capturer3: '',
    capturer4: ''
  },
  allRecords: (records) => set({
    records: [...records]
  }),
  addRecords: (records) => set((state) => ({
    records: [...state.records, ...records]
  })),
  updateRecord: (recordId, updatedData) =>
    set((state) => ({
      records: state.records.map((record) => (record.id === recordId ? { ...record, ...updatedData } : record)),
    })),
  deleteRecord: (recordId) =>
    set((state) => ({
      records: state.records.filter((record) => record.id !== recordId),
      filteredRecords: state.filteredRecords.filter((record) => record.id !== recordId),
    })),
  getCurrentDay: () => {
    return days[new Date().getDay()];
  },
  filterRecordsByCapturerAndDay: (capturer = 'capturer1') =>
    set((state) => {
      const todayDay = get().getCurrentDay();
      console.log(`Filtrando registros para: ${capturer}, día: ${todayDay}`);

      const filtered = state.records
        .filter((record) => record?.day === todayDay && record?.capturers?.name === capturer)
        .sort((a, b) => a.start_at.localeCompare(b.start_at));

      console.log(`Encontrados ${filtered.length} registros para el día actual`);

      return {
        capturer,
        filteredRecords: filtered
      }
    }),
  filterRecordsByCapturer: (capturer = 'capturer1') =>
    set((state) => {
      return {
        capturer,
        filteredRecords: [
          ...state.records
            .filter((record) => record?.capturers?.name === capturer)
            .sort(function (a, b) {
              return a.start_at.localeCompare(b.start_at);
            }),
        ],
      }
    }),
  changeActiveTabIndex: (tabIndex) => set(() => ({ activeTabIndex: tabIndex })),
  changeCapturer: (capturer = 'capturer1') => set(() => ({ capturer })),
  changeFormat: (format = 'mp4') => set(() => ({ format })),
  updateNameOfVideoToSave: (capturer = 'capturer1', name) => set((state) => ({
    nameOfVideoToSave: { ...state.nameOfVideoToSave, [capturer]: name }
  })),
}))

if (process.env.NODE_ENV === 'development') {
  mountStoreDevtool('Store', useRecordStore)
}

export default useRecordStore
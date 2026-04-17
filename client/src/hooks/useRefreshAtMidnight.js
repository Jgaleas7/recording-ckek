import { useEffect, useRef } from 'react';
import { supabase } from '../config/supabase';
import useRecordStore from '../store/recorderStore';

const useRefreshAtMidnight = () => {
  const allRecords = useRecordStore((state) => state.allRecords);
  const filterRecordsByCapturerAndDay = useRecordStore((state) => state.filterRecordsByCapturerAndDay);
  const capturer = useRecordStore((state) => state.capturer);
  const timerRef = useRef(null);

  // Función para calcular el tiempo hasta la medianoche
  const getTimeUntilMidnight = () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return midnight.getTime() - now.getTime();
  };

  // Función para recargar los datos desde la base de datos
  const reloadData = async () => {
    try {
      console.log('Recargando datos para el nuevo día:', new Date().toLocaleString());
      
      // Obtener todos los registros actualizados
      const { data, error } = await supabase.from('records').select('*, capturers(name)');
      
      if (error) {
        console.error('Error al cargar registros:', error);
        return;
      }
      
      // Actualizar el store con los nuevos datos
      allRecords(data);
      
      // Aplicar el filtro para el capturer actual
      const currentCapturer = useRecordStore.getState().capturer;
      filterRecordsByCapturerAndDay(currentCapturer);
   
      console.log('Datos actualizados con éxito para el nuevo día');
    } catch (err) {
      console.error('Error al recargar datos:', err);
    }
  };

  // Programar la próxima actualización a medianoche
  const scheduleNextUpdate = () => {
    // Limpiar cualquier temporizador existente
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    const timeUntilMidnight = getTimeUntilMidnight();
    console.log(`Próxima actualización en ${Math.floor(timeUntilMidnight / 1000 / 60)} minutos`);
    
    timerRef.current = setTimeout(async () => {
      await reloadData();
      // Programar la siguiente actualización
      scheduleNextUpdate();
    }, timeUntilMidnight);
  };

  useEffect(() => {
    // Iniciar el temporizador cuando se monta el componente
    scheduleNextUpdate();
    
    // Limpiar el temporizador cuando se desmonta
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [capturer]); // Reiniciar el timer cuando cambia el capturer
};

export default useRefreshAtMidnight;
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from '@mui/material';
import { CAPTURER_NAMES } from '../const';
import recordApi from '../api/recordApi';

const useBeforeUnload = () => {
  const [showModal, setShowModal] = useState(false);
  const [confirmedNavigation, setConfirmedNavigation] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Cancelar el evento para Chrome y otros navegadores
      e.preventDefault();
      // Para Chrome debemos establecer returnValue
      e.returnValue = '';
      // Mostrar nuestro modal personalizado
      setShowModal(true);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    if (confirmedNavigation) {
      // Si el usuario confirma, permitimos que la página se cierre
      window.onbeforeunload = null;
      window.close(); // Esto solo funciona si la ventana fue abierta por script
    }
  }, [confirmedNavigation]);

  const handleConfirm = async () => {
    setClearing(true);
    // Best-effort: clear every capturer so any in-flight recording gets
    // gracefully stopped and renamed to a Recovered-* file before exit.
    try {
      await Promise.allSettled(
        CAPTURER_NAMES.map((name) =>
          recordApi.post('/recordings/clear', { capturer: name })
        )
      );
    } catch (_) { /* best effort */ }
    setClearing(false);
    setConfirmedNavigation(true);
    setShowModal(false);
    // Forzar el cierre (puede no funcionar en todos los navegadores debido a políticas de seguridad)
    window.location.href = 'about:blank';
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  const Modal = () => (
    <Dialog
      open={showModal}
      onClose={handleCancel}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">
        ¡Espera!
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          ¿Estás seguro de que quieres salir?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} color="primary" disabled={clearing}>
          Cancelar
        </Button>
        <Button onClick={handleConfirm} color="error" autoFocus disabled={clearing}>
          {clearing ? 'Cerrando…' : 'Salir'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return { showModal, Modal };
};

export default useBeforeUnload;
import { Box, Dialog, DialogTitle} from '@mui/material'

const CustomDialog = ({ title, children, open, handleClose }) => {
  return (
    <Dialog open={open} onClose={handleClose} fullWidth={true} maxWidth='md' disableEscapeKeyDown  >
      <DialogTitle>{title}</DialogTitle>
      <Box sx={{ padding: '20px 24px' }}>{children}</Box>
    </Dialog>
  )
}

export default CustomDialog

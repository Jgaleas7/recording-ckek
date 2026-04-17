import { Box, Tabs, Tab } from '@mui/material'
import TabPanel from './TabPanel'
import TableNow from './Table'
import TablePeriodic from './TablePeriodic'

const TabsSection = ({ tabIndex, handleChangeTab, activeRecordRowId }) => {
  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'rgba(0, 0, 0, 0.12)' }}>
        <Tabs value={tabIndex} onChange={handleChangeTab} aria-label='basic tabs example'>
          <Tab label='Today' id='tab-0' />
          <Tab label='Periodic' id='tab-1' />
        </Tabs>
      </Box>
      <TabPanel value={tabIndex} index={0}>
        <TableNow activeRow={activeRecordRowId} />
      </TabPanel>
      <TabPanel value={tabIndex} index={1}>
        <TablePeriodic />
      </TabPanel>
    </Box>
  )
}

export default TabsSection

import { useEffect, useState } from 'react'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import { TfiClose } from 'react-icons/tfi'
import { Fade } from 'react-awesome-reveal'

export default function Legend() {
  const [showLegend, setShowLegend] = useState(false)

  // ON PAGE LOAD
  useEffect(() => {
    // Append Holidays/Search Cal Buttons
    const staticCalendar = document.querySelector('.MuiDialogActions-root')
    const legendButtonWrapper = document.getElementById('legend-wrapper')
    if (legendButtonWrapper) {
      staticCalendar.prepend(legendButtonWrapper)

      legendButtonWrapper.addEventListener('click', () => {
        setShowLegend(true)
      })
    }
  }, [])

  return (
    <Accordion expanded={showLegend} id={'calendar-legend'} className={showLegend ? 'open' : 'closed'}>
      <AccordionSummary className={showLegend ? 'open' : 'closed'}>
        {showLegend && <TfiClose onClick={() => setShowLegend(false)} />}
      </AccordionSummary>
      <AccordionDetails>
        <Fade direction={'up'} triggerOnce={true}>
          <p className="flex currentUser">Your Event</p>
          <p className="flex coparent">Shared Event</p>
          <p className="flex standard">Holiday</p>
        </Fade>
      </AccordionDetails>
    </Accordion>
  )
}
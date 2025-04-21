import React, {useEffect, useState} from 'react'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import {Fade} from 'react-awesome-reveal'
import {RiCloseCircleFill} from 'react-icons/ri'

export default function CalendarLegend() {
  const [showLegend, setShowLegend] = useState(false)

  // ON PAGE LOAD
  useEffect(() => {
    // Append Holidays/Search Cal Buttons
    const staticCalendar = document.querySelector('.MuiDialogActions-root')
    const legendButtonWrapper = document.getElementById('legend-button')
    if (legendButtonWrapper) {
      staticCalendar.prepend(legendButtonWrapper)

      legendButtonWrapper.addEventListener('click', () => {
        setShowLegend(true)
      })
    }
  }, [])

  return (
    <Accordion expanded={showLegend} id={'calendar-legend'}>
      <AccordionSummary className={showLegend ? 'open' : 'closed'}>
        {showLegend && <RiCloseCircleFill onClick={() => setShowLegend(false)} />}
      </AccordionSummary>
      <AccordionDetails>
        <Fade direction={'down'} triggerOnce={true} cascade={true} damping={0.2}>
          <p className="flex current-user">Your Event</p>
          <p className="flex coparent">Shared Event</p>
          <p className="flex holiday">Holiday</p>
          <p className="flex financial">Financial Event</p>
        </Fade>
      </AccordionDetails>
    </Accordion>
  )
}
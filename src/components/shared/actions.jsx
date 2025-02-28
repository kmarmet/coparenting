import React, { useContext, useEffect, useState } from 'react'
import { HiOutlineDotsVertical } from 'react-icons/hi'
import { IoClose } from 'react-icons/io5'
import globalState from '../../context'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
export default function Actions({ children, show }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state

  return (
      <Accordion expanded={show} className={"actions"}>
        <AccordionSummary></AccordionSummary>
        <AccordionDetails>{children}</AccordionDetails>
      </Accordion>
  )
}
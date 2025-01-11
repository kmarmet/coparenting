import Manager from 'managers/manager'
import globalState from '../../context'
import { useContext, useEffect, useState } from 'react'
import AccordionSummary from '@mui/material/AccordionSummary'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import { FaChevronUp } from 'react-icons/fa'

export default function InputSuggestionWrapper({ suggestions = [], onClick, onClear, setSuggestions, className }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, setTheme } = state
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (suggestions.length > 0) {
      setExpanded(true)
    } else {
      setExpanded(false)
    }
  }, [suggestions])
  return (
    <div id="title-suggestion-dropdown" className={`${className}`}>
      <Accordion expanded={expanded}>
        <AccordionSummary className={'invisible-accordion-header'}></AccordionSummary>
        <AccordionDetails>
          <div className="suggestions">
            {Manager.isValid(suggestions) &&
              suggestions.map((suggestion, index) => {
                return (
                  <p key={index} onClick={onClick}>
                    {suggestion.suggestion}
                  </p>
                )
              })}
          </div>
          <FaChevronUp onClick={setSuggestions} />
        </AccordionDetails>
      </Accordion>
    </div>
  )
}

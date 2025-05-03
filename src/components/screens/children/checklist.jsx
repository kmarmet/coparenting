import Manager from '/src/managers/manager'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import React, {useContext, useEffect, useState} from 'react'
import {FaMinus, FaPlus} from 'react-icons/fa6'
import {IoCheckmarkCircleSharp} from 'react-icons/io5'
import {PiListChecksFill, PiTrashSimpleDuotone} from 'react-icons/pi'
import globalState from '../../../context'
import DB from '../../../database/DB'
import useChildren from '../../../hooks/useChildren'
import useCurrentUser from '../../../hooks/useCurrentUser'
import DatasetManager from '../../../managers/datasetManager'
import DomManager from '../../../managers/domManager'
import StringManager from '../../../managers/stringManager'

export default function Checklist({fromOrTo, activeChild}) {
  const {state, setState} = useContext(globalState)
  const {theme, refreshKey} = state
  const {currentUser} = useCurrentUser()
  const [checklist, setChecklist] = useState([])
  const [activeItems, setActiveItems] = useState([])
  const {children, childrenAreLoading} = useChildren()
  const [showChecklist, setShowChecklist] = useState(false)
  const [accordionIsExpanded, setAccordionIsExpanded] = useState('')

  const ToggleActive = (el) => {
    const filtered = activeItems.filter((x) => x !== el.target.textContent.toLowerCase())
    if (el.target.classList.contains('active')) {
      setActiveItems(filtered)
    } else {
      setActiveItems([...activeItems, el.target.textContent.toLowerCase()])
    }
    DomManager.toggleActive(el.target)
  }

  const DeleteItem = async (el) => {
    const element = el.currentTarget
    const checklistItemWrapper = element.closest('.checklist-item-row')
    const childKey = DB.GetChildIndex(children, activeChild?.id)
    const path = `${DB.tables.users}/${currentUser?.key}/children/${childKey}/checklists`
    const childChecklists = children.find((x) => x.id === activeChild?.id)?.checklists
    const activeChecklist = childChecklists.filter((x) => x.fromOrTo === fromOrTo)[0]

    if (activeChecklist) {
      const items = activeChecklist.checklistItems
      const text = checklistItemWrapper.textContent.toLowerCase()
      const filteredText = items.filter((x) => x.toLowerCase() !== text.toLowerCase())
      const newChecklist = {...activeChecklist}
      newChecklist.checklistItems = filteredText
      const updated = {...activeChecklist, ...newChecklist}

      if (filteredText.length === 0) {
        await DB.delete(`${path}`, activeChecklist.id)
      } else {
        await DB.updateByPath(path, updated)
      }
      checklistItemWrapper.remove()
      element.remove()
    }
  }

  const SetSelectedChild = async () => {
    const validChecklists = DatasetManager.getValidArray(activeChild?.checklists)
    const activeChecklist = validChecklists?.find((x) => x?.fromOrTo === fromOrTo)
    if (Manager.isValid(activeChecklist)) {
      setShowChecklist(true)
    }
    setChecklist(activeChecklist)
    setActiveItems(activeChecklist?.checklistItems)
  }

  useEffect(() => {
    setShowChecklist(false)
    if (Manager.isValid(activeChild)) {
      SetSelectedChild().then((r) => r)
    }
  }, [activeChild])

  return (
    <div className={`info-section section checklist ${fromOrTo}`}>
      {showChecklist && (
        <Accordion className={`${theme} child-info`} expanded={accordionIsExpanded}>
          <AccordionSummary onClick={() => setAccordionIsExpanded(!accordionIsExpanded)} className={'header checklist'}>
            <PiListChecksFill className={`${fromOrTo} svg`} />
            <p id="toggle-button" className={accordionIsExpanded ? 'active' : ''}>
              Transfer Checklist<span className="smaller-text">({fromOrTo})</span>
              {accordionIsExpanded ? <FaMinus className={`plus-minus ${fromOrTo}`} /> : <FaPlus className={`plus-minus ${fromOrTo}`} />}
            </p>
          </AccordionSummary>
          <AccordionDetails className={'checklist-wrapper'}>
            {Manager.isValid(checklist) &&
              Manager.isValid(checklist?.checklistItems) &&
              checklist?.checklistItems?.map((item, index) => {
                return (
                  <div key={index} id="data-row" className="checklist-item-row">
                    <p onClick={ToggleActive} className="checklist-item">
                      {activeItems.includes(item.toLowerCase()) && <IoCheckmarkCircleSharp className={'checkmark'} />}
                      {StringManager.uppercaseFirstLetterOfAllWords(item)}
                    </p>
                    <PiTrashSimpleDuotone className={'delete-icon'} onClick={DeleteItem} />
                  </div>
                )
              })}
          </AccordionDetails>
        </Accordion>
      )}
    </div>
  )
}
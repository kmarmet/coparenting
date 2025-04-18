import React, {useContext, useEffect, useState} from 'react'
import StringManager from '../../../managers/stringManager'
import DomManager from '../../../managers/domManager'
import Manager from '/src/managers/manager'
import {IoCheckmarkCircleSharp} from 'react-icons/io5'
import {PiListChecksFill, PiTrashSimpleDuotone} from 'react-icons/pi'
import DB from '../../../database/DB'
import globalState from '../../../context'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Accordion from '@mui/material/Accordion'
import {FaMinus, FaPlus} from 'react-icons/fa6'
import useCurrentUser from '../../hooks/useCurrentUser'

export default function Checklist({fromOrTo, activeChild}) {
  const {state, setState} = useContext(globalState)
  const {theme, refreshKey} = state
  const {currentUser} = useCurrentUser()
  const [checklist, setChecklist] = useState([])
  const [activeItems, setActiveItems] = useState([])
  const [showChecklist, setShowChecklist] = useState(false)

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
    const childKey = await DB.getSnapshotKey(`${DB.tables.users}/${currentUser?.key}/children`, activeChild, 'id')
    const path = `${DB.tables.users}/${currentUser?.key}/children/${childKey}/checklists`
    const childChecklists = await DB.getTable(path)
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
        await DB.updateEntireRecord(`${path}`, updated, activeChecklist.id)
      }
      checklistItemWrapper.remove()
      element.remove()
    }
  }

  const SetSelectedChild = async () => {
    const activeChecklist = activeChild?.checklists?.find((x) => x?.fromOrTo === fromOrTo)
    setChecklist(activeChecklist)
    setActiveItems(activeChecklist?.checklistItems)
  }

  useEffect(() => {
    SetSelectedChild().then((r) => r)
  }, [])

  return (
    <div className={`info-section section checklist ${fromOrTo}`}>
      <Accordion className={`${theme} child-info`} expanded={showChecklist}>
        <AccordionSummary onClick={() => setShowChecklist(!showChecklist)} className={'header checklist'}>
          <PiListChecksFill className={`${fromOrTo} svg`} />
          <p id="toggle-button" className={showChecklist ? 'active' : ''}>
            Transfer Checklist<span className="smaller-text">({fromOrTo})</span>
            {showChecklist ? <FaMinus className={`plus-minus ${fromOrTo}`} /> : <FaPlus className={`plus-minus ${fromOrTo}`} />}
          </p>
        </AccordionSummary>
        <AccordionDetails className={'checklist-wrapper'}>
          {Manager.isValid(checklist) &&
            Manager.isValid(checklist?.checklistItems) &&
            checklist?.checklistItems?.map((item, index) => {
              return (
                <div key={index} className="flex checklist-item-row">
                  <p onClick={ToggleActive} className="checklist-item">
                    {activeItems.includes(item.toLowerCase()) && <IoCheckmarkCircleSharp className={'checkmark'} />}
                    {StringManager.uppercaseFirstLetterOfAllWords(item)}
                  </p>
                  <PiTrashSimpleDuotone className={'checklist-delete-icon'} onClick={DeleteItem} />
                </div>
              )
            })}
        </AccordionDetails>
      </Accordion>
    </div>
  )
}
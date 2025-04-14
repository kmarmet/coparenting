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
import {child, getDatabase, onValue, ref} from 'firebase/database'

export default function Checklist({fromOrTo, activeChild, onChildUpdate = (child) => {}}) {
  const {state, setState} = useContext(globalState)
  const {currentUser, theme, refreshKey} = state

  const [checklist, setChecklist] = useState([])
  const [activeItems, setActiveItems] = useState([])
  const [showChecklist, setShowChecklist] = useState(false)

  const toggleActive = (el) => {
    const filtered = activeItems.filter((x) => x !== el.target.textContent.toLowerCase())
    if (el.target.classList.contains('active')) {
      setActiveItems(filtered)
    } else {
      setActiveItems([...activeItems, el.target.textContent.toLowerCase()])
    }
    DomManager.toggleActive(el.target)
  }

  const deleteItem = async (el) => {
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
        const updatedChild = await DB.getTable(`${DB.tables.users}/${currentUser?.key}/children/${childKey}`, true)
        onChildUpdate(updatedChild)
      } else {
        await DB.updateEntireRecord(`${path}`, updated, activeChecklist.id)
      }
      checklistItemWrapper.remove()
      element.remove()
    }
  }

  const setActiveChildChecklist = async () => {
    if (Manager.isValid(activeChild)) {
      const checklists = activeChild?.checklists?.map((x) => x)
      if (Manager.isValid(checklists)) {
        const checklist = checklists?.find((x) => x?.fromOrTo === fromOrTo)
        setChecklist(checklist)
      }
    }
  }

  const onTableChange = async () => {
    const dbRef = ref(getDatabase())
    const childKey = await DB.getSnapshotKey(`${DB.tables.users}/${currentUser?.key}/children`, activeChild, 'id')

    if (childKey) {
      onValue(child(dbRef, `${DB.tables.users}/${currentUser?.key}/children/${childKey}`), async (snapshot) => {
        const updatedChild = snapshot.val()
        setState({...state, activeChild: updatedChild})
        setActiveChildChecklist().then((r) => r)
      })
    }
  }

  useEffect(() => {
    if (showChecklist) {
      onTableChange().then((r) => r)
    }
  }, [showChecklist])

  useEffect(() => {
    onTableChange().then((r) => r)
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
                  <p onClick={toggleActive} className="checklist-item">
                    {activeItems.includes(item.toLowerCase()) && <IoCheckmarkCircleSharp className={'checkmark'} />}
                    {StringManager.uppercaseFirstLetterOfAllWords(item)}
                  </p>
                  <PiTrashSimpleDuotone className={'checklist-delete-icon'} onClick={deleteItem} />
                </div>
              )
            })}
        </AccordionDetails>
      </Accordion>
    </div>
  )
}
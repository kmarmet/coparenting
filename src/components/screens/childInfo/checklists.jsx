import React, { useContext, useEffect, useState } from 'react'
// Path: src\components\screens\childInfo\checklists.jsx
import BottomCard from '../../shared/bottomCard'
import globalState from '../../../context'
import Spacer from '/src/components/shared/spacer'
import ViewSelector from '/src/components/shared/viewSelector'
import Manager from '/src/managers/manager'
import { MdOutlineChecklist } from 'react-icons/md'
import DB from '/src/database/DB'
import Checklist from '/src/models/checklist.js'
import { IoCheckmarkCircleSharp } from 'react-icons/io5'
import StringManager from '../../../managers/stringManager'
import DomManager from '../../../managers/domManager'
import { PiTrashSimpleDuotone } from 'react-icons/pi'

export default function Checklists({ showCard, hideCard }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, activeInfoChild } = state
  const [checkboxTextList, setCheckboxTextList] = useState([])
  const [view, setView] = useState('from')
  const [checklist, setChecklist] = useState(null)
  const [activeItems, setActiveItems] = useState([])
  const [destinationLabels, setDestinationLabels] = useState(['From Co-Parent', 'To Co-Parent'])

  const addToDb = async () => {
    const childKey = await DB.getSnapshotKey(`${DB.tables.users}/${currentUser?.key}/children`, activeInfoChild, 'id')
    const newChecklist = new Checklist()
    newChecklist.checklistItems = checkboxTextList
    newChecklist.ownerKey = currentUser?.key
    newChecklist.fromOrTo = view
    await DB.add(`${DB.tables.users}/${currentUser?.key}/children/${childKey}/checklists`, newChecklist)
    const updatedChild = await DB.getTable(`${DB.tables.users}/${currentUser?.key}/children/${childKey}`)
    setState({ ...state, activeInfoChild: updatedChild })
  }

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
    const checklistItem = element.previousElementSibling
    const childKey = await DB.getSnapshotKey(`${DB.tables.users}/${currentUser?.key}/children`, activeInfoChild, 'id')
    const path = `${DB.tables.users}/${currentUser?.key}/children/${childKey}/checklists`
    const childChecklists = await DB.getTable(path)
    const activeChecklist = childChecklists.filter((x) => x.fromOrTo === view)[0]

    if (activeChecklist) {
      const items = activeChecklist.checklistItems
      const text = checklistItem.textContent.toLowerCase()
      const filteredText = items.filter((x) => x.toLowerCase() !== text.toLowerCase())
      const newChecklist = { ...activeChecklist }
      newChecklist.checklistItems = filteredText
      const updated = { ...activeChecklist, ...newChecklist }
      if (filteredText.length === 0) {
        await DB.delete(`${path}`, activeChecklist.id)
        setState({ ...state, refreshKey: Manager.getUid() })
        hideCard()
      } else {
        await DB.updateEntireRecord(`${path}`, updated, activeChecklist.id)
      }
      checklistItem.remove()
      element.remove()
      const updatedChild = await DB.getTable(`${DB.tables.users}/${currentUser?.key}/children/${childKey}`)
      setState({ ...state, activeInfoChild: updatedChild })
    }
  }

  const setActiveChildChecklist = async () => {
    if (Manager.isValid(activeInfoChild?.checklists)) {
      const checklists = activeInfoChild?.checklists.map((x) => x)
      const fromDest = checklists?.find((x) => x?.fromOrTo === 'from')
      const toDest = checklists?.find((x) => x?.fromOrTo === 'to')

      // Set destination labels based on which checklists are present
      if (Manager.isValid(fromDest)) {
        setDestinationLabels(['To Co-Parent'])
      }
      if (Manager.isValid(toDest)) {
        setDestinationLabels(['From Co-Parent'])
      }

      if (Manager.isValid(fromDest) && Manager.isValid(toDest)) {
        setDestinationLabels(['From Co-Parent', 'To Co-Parent'])
      }

      // Set view based on which checklist is present
      if (Manager.isValid(toDest) && !Manager.isValid(fromDest)) {
        setView('to')
      }
      if (Manager.isValid(fromDest) && !Manager.isValid(toDest)) {
        setView('from')
      }

      // Set checklist based on view
      if (Manager.isValid(activeInfoChild?.checklists)) {
        const checklist = checklists.find((x) => x?.fromOrTo === view)
        if (checklist) {
          setCheckboxTextList(checklist.checklistItems)
          setChecklist(checklist)
        } else {
          setCheckboxTextList([])
          setChecklist(null)
        }
      }
    }
  }
  useEffect(() => {
    if (showCard) {
      setActiveChildChecklist().then((r) => r)
    }
  }, [showCard])

  useEffect(() => {
    setActiveChildChecklist().then((r) => r)
  }, [view])

  return (
    <BottomCard
      onSubmit={addToDb}
      wrapperClass="child-info-checklists"
      submitIcon={<MdOutlineChecklist />}
      showCard={showCard}
      hasSubmitButton={false}
      title={'Checklists'}
      subtitle={`Review transfer checklists to guarantee that all items are accounted for during transitions to or from a co-parent's home.  ${DomManager.tapOrClick(
        true
      )} each item to mark completed. ${DomManager.tapOrClick(true)} delete icon to remove the item from the checklist permanently.`}
      onClose={hideCard}>
      <Spacer height={5} />
      <ViewSelector
        shouldUpdateStateOnLoad={false}
        updateState={(text) => {
          const _view = text.toLowerCase()
          if (Manager.contains(_view, 'to')) {
            setView('to')
          } else {
            setView('from')
          }
        }}
        wrapperClasses={'child-info'}
        labels={destinationLabels}
      />

      {Manager.isValid(checklist) &&
        Manager.isValid(checklist?.checklistItems) &&
        checklist?.checklistItems?.map((item, index) => {
          return (
            <div key={index} id="checklist-item-wrapper" className="flex">
              <p onClick={toggleActive} className="row">
                {activeItems.includes(item.toLowerCase()) && <IoCheckmarkCircleSharp />}
                {StringManager.uppercaseFirstLetterOfAllWords(item)}
              </p>
              <PiTrashSimpleDuotone className={'delete-icon'} onClick={deleteItem} />
            </div>
          )
        })}
    </BottomCard>
  )
}
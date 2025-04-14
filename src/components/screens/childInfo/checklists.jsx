import React, {useContext, useEffect, useState} from 'react'
// Path: src\components\screens\childInfo\checklists.jsx
import Modal from '../../shared/modal'
import globalState from '../../../context'
import Spacer from '/src/components/shared/spacer'
import ViewSelector from '/src/components/shared/viewSelector'
import Manager from '/src/managers/manager'
import {MdOutlineChecklist} from 'react-icons/md'
import DB from '/src/database/DB'
import Checklist from '/src/models/checklist.js'
import {PiListChecksFill, PiTrashSimpleDuotone} from 'react-icons/pi'
import StringManager from '../../../managers/stringManager'
import DomManager from '../../../managers/domManager'

export default function Checklists({showCard, hideCard}) {
  const {state, setState} = useContext(globalState)
  const {currentUser, activeInfoChild} = state
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
    await DB.getTable(`${DB.tables.users}/${currentUser?.key}/children/${childKey}`)
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
      const newChecklist = {...activeChecklist}
      newChecklist.checklistItems = filteredText
      const updated = {...activeChecklist, ...newChecklist}

      if (filteredText.length === 0) {
        await DB.delete(`${path}`, activeChecklist.id)
        hideCard()
      } else {
        await DB.updateEntireRecord(`${path}`, updated, activeChecklist.id)
      }
      checklistItem.remove()
      element.remove()
    }
  }

  const setActiveChildChecklist = async () => {
    if (Manager.isValid(activeInfoChild)) {
      const childKey = await DB.getSnapshotKey(`${DB.tables.users}/${currentUser?.key}/children`, activeInfoChild, 'id')
      const updatedActiveChild = await DB.getTable(`${DB.tables.users}/${currentUser?.key}/children/${childKey}`)
      const checklists = updatedActiveChild?.checklists?.map((x) => x)
      if (Manager.isValid(checklists)) {
        const fromDest = checklists?.find((x) => x?.fromOrTo === 'from')
        const toDest = checklists?.find((x) => x?.fromOrTo === 'to')
        const checklistDestinations = checklists?.map((x) => x?.fromOrTo)
        let labels = []

        if (Manager.isValid(checklistDestinations)) {
          for (let destination of checklistDestinations) {
            if (destination === 'from') {
              labels.push('From Co-Parent')
            }
            if (destination === 'to') {
              labels.push('To Co-Parent')
            }
          }
          setDestinationLabels(labels)
        }
        // Set view based on which checklist is present
        if (Manager.isValid(toDest) && !Manager.isValid(fromDest)) {
          setView('to')
        }
        if (Manager.isValid(fromDest) && !Manager.isValid(toDest)) {
          setView('from')
        }

        // Set checklist based on view
        if (Manager.isValid(checklists)) {
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
  }
  useEffect(() => {
    setActiveChildChecklist().then((r) => r)
  }, [view])

  useEffect(() => {
    if (showCard) {
      setActiveChildChecklist().then((r) => r)
    }
  }, [showCard])

  return (
    <Modal
      onSubmit={addToDb}
      wrapperClass="child-info-checklists"
      submitIcon={<MdOutlineChecklist />}
      showCard={showCard}
      hasSubmitButton={false}
      title={'Checklists'}
      viewSelector={
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
      }
      subtitle={`Review transfer checklists to guarantee that all items are accounted for during transitions to or from a co-parent's home.  ${DomManager.tapOrClick(
        true
      )} each item to mark completed. ${DomManager.tapOrClick(true)} the delete icon to remove the item from the checklist permanently.`}
      onClose={hideCard}>
      <Spacer height={5} />

      {Manager.isValid(checklist) &&
        Manager.isValid(checklist?.checklistItems) &&
        checklist?.checklistItems?.map((item, index) => {
          return (
            <div key={index} id="checklist-item-row" className="flex">
              <p onClick={toggleActive} className="row">
                {activeItems.includes(item.toLowerCase()) && <PiListChecksFill />}
                {StringManager.uppercaseFirstLetterOfAllWords(item)}
              </p>
              <PiTrashSimpleDuotone className={'delete-icon'} onClick={deleteItem} />
            </div>
          )
        })}
    </Modal>
  )
}
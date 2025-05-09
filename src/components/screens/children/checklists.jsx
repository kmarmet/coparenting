import Spacer from '/src/components/shared/spacer'
import ViewSelector from '/src/components/shared/viewSelector'
import DB from '/src/database/DB'
import Manager from '/src/managers/manager'
import Checklist from '/src/models/checklist.js'
import React, {useContext, useEffect, useState} from 'react'
import {MdOutlineChecklist} from 'react-icons/md'
import {PiListChecksFill, PiTrashSimpleDuotone} from 'react-icons/pi'
import globalState from '../../../context'
import useCurrentUser from '../../../hooks/useCurrentUser'
import DomManager from '../../../managers/domManager'
import StringManager from '../../../managers/stringManager'
// Path: src\components\screens\childInfo\checklists.jsx
import Modal from '../../shared/modal'

export default function Checklists({showCard, hideCard}) {
  const {state, setState} = useContext(globalState)
  const {activeChild} = state
  const [checkboxTextList, setCheckboxTextList] = useState([])
  const [view, setView] = useState('from')
  const [checklist, setChecklist] = useState(null)
  const [activeItems, setActiveItems] = useState([])
  const [destinationLabels, setDestinationLabels] = useState(['From Co-Parent', 'To Co-Parent'])
  const {currentUser, currentUserIsLoading} = useCurrentUser()

  const AddToDb = async () => {
    const childKey = DB.GetChildIndex(currentUser?.children, activeChild?.id)

    const newChecklist = new Checklist()
    newChecklist.items = checkboxTextList
    newChecklist.ownerKey = currentUser?.key
    newChecklist.fromOrTo = view
    await DB.Add(`${DB.tables.users}/${currentUser?.key}/children/${childKey}/checklists`, newChecklist)
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
    const childKey = DB.GetChildIndex(currentUser?.children, activeChild?.id)
    const updatePath = `${DB.tables.users}/${currentUser?.key}/children/${childKey}/checklists`
    const childChecklists = activeChild?.checklists

    if (Manager.IsValid(childChecklists)) {
      const activeChecklist = childChecklists.filter((x) => x.fromOrTo === view)[0]

      if (activeChecklist) {
        const items = activeChecklist.items
        const text = checklistItem.textContent.toLowerCase()
        const filteredText = items.filter((x) => x.toLowerCase() !== text.toLowerCase())
        const newChecklist = {...activeChecklist}
        newChecklist.items = filteredText
        const updated = {...activeChecklist, ...newChecklist}

        if (filteredText.length === 0) {
          const deleteIndex = DB.GetTableIndexById(activeChild?.checklists, activeChecklist?.id)
          const deletePath = `${DB.tables.users}/${currentUser?.key}/children/${childKey}/checklists/${deleteIndex}`
          await DB.Delete(deletePath)
          hideCard()
        } else {
          await DB.updateEntireRecord(`${updatePath}`, updated, activeChecklist.id)
        }
      }
      checklistItem.remove()
      element.remove()
    }
  }

  const setActiveChildChecklist = async () => {
    if (Manager.IsValid(activeChild)) {
      const childKey = DB.GetChildIndex(currentUser?.children, activeChild?.id)
      const updatedActiveChild = await DB.getTable(`${DB.tables.users}/${currentUser?.key}/children/${childKey}`)
      const checklists = updatedActiveChild?.checklists?.map((x) => x)
      if (Manager.IsValid(checklists)) {
        const fromDest = checklists?.find((x) => x?.fromOrTo === 'from')
        const toDest = checklists?.find((x) => x?.fromOrTo === 'to')
        const checklistDestinations = checklists?.map((x) => x?.fromOrTo)
        let labels = []

        if (Manager.IsValid(checklistDestinations)) {
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
        if (Manager.IsValid(toDest) && !Manager.IsValid(fromDest)) {
          setView('to')
        }
        if (Manager.IsValid(fromDest) && !Manager.IsValid(toDest)) {
          setView('from')
        }

        // Set checklist based on view
        if (Manager.IsValid(checklists)) {
          const checklist = checklists.find((x) => x?.fromOrTo === view)
          if (checklist) {
            setCheckboxTextList(checklist.items)
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

  if (currentUserIsLoading) {
    return <img src={require('../../../img/loading.gif')} alt="Loading" className="data-loading-gif" />
  }

  return (
    <Modal
      onSubmit={AddToDb}
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
            if (Manager.Contains(_view, 'to')) {
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

      {Manager.IsValid(checklist) &&
        Manager.IsValid(checklist?.items) &&
        checklist?.items?.map((item, index) => {
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
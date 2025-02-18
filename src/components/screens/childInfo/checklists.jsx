// Path: src\components\screens\childInfo\checklists.jsx
import BottomCard from '../../shared/bottomCard'
import globalState from '../../../context'
import Spacer from '/src/components/shared/spacer'
import ViewSelector from '/src/components/shared/viewSelector'
import { useContext, useEffect, useState } from 'react'
import Manager from '/src/managers/manager'
import { MdOutlineChecklist } from 'react-icons/md'
import DB from '/src/database/DB'
import Checklist from '/src/models/checklist.js'
import { IoCheckmarkCircleSharp } from 'react-icons/io5'
import StringManager from '../../../managers/stringManager'
import DomManager from '../../../managers/domManager'
import { PiTrashSimpleDuotone } from 'react-icons/pi'

export default function Checklists({ showCard, hideCard, activeChild }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, refreshKey } = state
  const [checkboxTextList, setCheckboxTextList] = useState([])
  const [view, setView] = useState('from')
  const [checklist, setChecklist] = useState(null)
  const [activeItems, setActiveItems] = useState([])

  const addToDb = async () => {
    const childKey = await DB.getSnapshotKey(`${DB.tables.users}/${currentUser.phone}/children`, activeChild, 'id')
    const newChecklist = new Checklist()
    newChecklist.checklistItems = checkboxTextList
    newChecklist.ownerKey = currentUser.phone
    newChecklist.fromOrTo = view
    await DB.add(`${DB.tables.users}/${currentUser.phone}/children/${childKey}/checklists`, newChecklist)
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
    const childKey = await DB.getSnapshotKey(`${DB.tables.users}/${currentUser.phone}/children`, activeChild, 'id')
    const path = `${DB.tables.users}/${currentUser.phone}/children/${childKey}/checklists`
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
    }
  }

  const getActiveChildChecklists = async () => {
    if (activeChild) {
      const childKey = await DB.getSnapshotKey(`${DB.tables.users}/${currentUser.phone}/children`, activeChild, 'id')
      const path = `${DB.tables.users}/${currentUser.phone}/children/${childKey}/checklists`
      return await DB.getTable(path)
    } else {
      return {}
    }
  }

  const setActiveChildChecklist = async () => {
    const checklists = await getActiveChildChecklists()
    if (Manager.isValid(checklists)) {
      const checklist = checklists?.filter((x) => x.fromOrTo === view)[0]
      if (checklist) {
        setCheckboxTextList(checklist.checklistItems)
        setChecklist(checklist)
      } else {
        setCheckboxTextList([])
        setChecklist(null)
      }
    }
  }

  // Change list depending on view
  useEffect(() => {
    setActiveChildChecklist().then((r) => r)
  }, [view])

  useEffect(() => {
    setActiveChildChecklist().then((r) => r)
  }, [activeChild])

  return (
    <BottomCard
      onSubmit={addToDb}
      wrapperClass="child-info-checklists"
      submitIcon={<MdOutlineChecklist />}
      showCard={showCard}
      hasSubmitButton={false}
      title={'Checklists'}
      subtitle={`View transfer checklists to ensure nothing is left behind when transferring to or from a co-parent's home.  ${DomManager.tapOrClick(
        true
      )} each item to mark completed. ${DomManager.tapOrClick(true)} delete icon to remove the item from the checklist permanently.`}
      onClose={hideCard}>
      <Spacer height={5} />
      <ViewSelector
        updateState={(text) => {
          const _view = text.toLowerCase()
          if (Manager.contains(_view, 'to')) {
            setView('to')
          } else {
            setView('from')
          }
        }}
        wrapperClasses={'child-info'}
        labels={['From Co-Parent', 'To Co-Parent']}
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

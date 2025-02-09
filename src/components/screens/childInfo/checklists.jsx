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
    newChecklist.ownerPhone = currentUser.phone
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

  // On View Change
  useEffect(() => {
    const inputs = document.getElementById('inputs')
    inputs.innerHTML = ''
    setCheckboxTextList([])
  }, [view])

  // On Page Load
  useEffect(() => {
    if (activeChild && Manager.isValid(activeChild?.checklists)) {
      setChecklist(activeChild?.checklists?.filter((x) => x && x.fromOrTo === 'from')[0])
    }
  }, [activeChild])

  const deleteItem = async (el) => {
    const element = el.currentTarget
    const checklistItem = element.previousElementSibling
    const activeChecklist = activeChild?.checklists?.filter((x) => x && x.fromOrTo === view)[0]
    if (activeChecklist) {
      const items = activeChecklist.checklistItems
      const text = checklistItem.textContent.toLowerCase()
      const filteredText = items.filter((x) => x.toLowerCase() !== text.toLowerCase())
      const childKey = await DB.getSnapshotKey(`${DB.tables.users}/${currentUser.phone}/children`, activeChild, 'id')
      const path = `${DB.tables.users}/${currentUser.phone}/children/${childKey}/checklists`
      const checklistKey = await DB.getSnapshotKey(path, activeChecklist, 'id')
      const newChecklist = { ...activeChecklist }
      newChecklist.checklistItems = filteredText
      const updated = { ...activeChecklist, ...newChecklist }
      if (filteredText.length === 0) {
        await DB.delete(`${path}`, activeChecklist.id)
        hideCard()
      } else {
        await DB.updateEntireRecord(`${path}`, updated, activeChecklist.id)
      }
    }
  }

  // Change list depending on view
  useEffect(() => {
    if (view === 'from') {
      setChecklist(activeChild?.checklists?.filter((x) => x.fromOrTo === 'from')[0])
    }
    if (view === 'to') {
      setChecklist(activeChild?.checklists?.filter((x) => x.fromOrTo === 'to')[0])
    }
  }, [view])

  return (
    <BottomCard
      onSubmit={addToDb}
      wrapperClass="child-info-checklists"
      submitIcon={<MdOutlineChecklist />}
      showCard={showCard}
      hasSubmitButton={false}
      title={'Checklists'}
      subtitle={`View transfer checklists to ensure nothing is left behind when transferring to or from a co-parent's home.  ${DomManager.tapOrClick(true)} each item to mark completed. ${DomManager.tapOrClick(true)} delete icon to remove the item from the checklist permanently.`}
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
        labelOneText={'From Co-Parent'}
        labelTwoText={'To Co-Parent'}
      />

      {Manager.isValid(checklist) &&
        Manager.isValid(checklist?.checklistItems) &&
        checklist?.checklistItems?.map((item, index) => {
          return (
            <div key={index} id="checklist-item-wrapper" className="flex">
              <p id="row" onClick={toggleActive}>
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
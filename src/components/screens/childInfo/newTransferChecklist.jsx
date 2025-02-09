import BottomCard from '../../shared/bottomCard'
import globalState from '../../../context'
import Spacer from '/src/components/shared/spacer'
import ViewSelector from '/src/components/shared/viewSelector'
import { useContext, useEffect, useState } from 'react'
import Manager from '/src/managers/manager'
import { MdOutlineChecklist } from 'react-icons/md'
import DB from '/src/database/DB'
import Checklist from '/src/models/checklist.js'
import DatasetManager from '../../../managers/datasetManager'
export default function NewTransferChecklist({ showCard, hideCard, activeChild, visibleDestinations }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, refreshKey } = state
  const [checkboxTextList, setCheckboxTextList] = useState([])
  const [view, setView] = useState('from')
  const [currentChecklistDestinations, setCurrentChecklistDestinations] = useState([])
  const [visibleLabels, setVisibleLabels] = useState([])

  const addInput = () => {
    const inputs = document.getElementById('inputs')
    const newInput = document.createElement('input')
    newInput.type = 'text'
    newInput.classList.add('input')
    newInput.placeholder = 'Checklist Item'
    newInput.classList.add('dynamic-input')
    newInput.onchange = (e) => {
      setCheckboxTextList([...checkboxTextList, e.target.value])
    }
    inputs.appendChild(newInput)
    newInput.focus()
  }

  const addToDb = async () => {
    const childKey = await DB.getSnapshotKey(`${DB.tables.users}/${currentUser.phone}/children`, activeChild, 'id')
    const newChecklist = new Checklist()
    newChecklist.checklistItems = checkboxTextList
    newChecklist.ownerPhone = currentUser.phone
    newChecklist.fromOrTo = view
    await DB.add(`${DB.tables.users}/${currentUser.phone}/children/${childKey}/checklists`, newChecklist)
    hideCard()
  }

  // On View Change
  useEffect(() => {
    const inputs = document.getElementById('inputs')
    inputs.innerHTML = ''
    setCheckboxTextList([])
  }, [view])

  // On Page Load
  useEffect(() => {
    addInput()
  }, [])

  return (
    <BottomCard
      onSubmit={addToDb}
      wrapperClass="new-checklist"
      submitIcon={<MdOutlineChecklist />}
      submitText={'Create Checklist'}
      showCard={showCard}
      subtitle="A transfer checklist allows you and your child to ensure that nothing is left behind when transferring to or from your co-parent's home"
      title={'New Transfer Checklist'}
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
        visibleLabels={visibleDestinations}
        wrapperClasses={'child-info'}
        labelOneText={'From Co-Parent'}
        labelTwoText={'To Co-Parent'}
      />

      <div id="inputs" key={refreshKey}></div>
      <button className="button default center" onClick={addInput}>
        Add Item
      </button>
    </BottomCard>
  )
}
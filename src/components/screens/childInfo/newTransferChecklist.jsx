// Path: src\components\screens\childInfo\newTransferChecklist.jsx
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
import MyConfetti from '../../shared/myConfetti'
import AlertManager from '../../../managers/alertManager'
export default function NewTransferChecklist({ showCard, hideCard, activeChild, visibleDestinations }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, refreshKey } = state
  const [checkboxTextList, setCheckboxTextList] = useState([])
  const [view, setView] = useState('from')
  const [existingChecklists, setExistingChecklists] = useState([])

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
    newChecklist.checklistItems = DatasetManager.getUniqueArray(checkboxTextList, true)
    newChecklist.ownerKey = currentUser.phone
    newChecklist.fromOrTo = view
    await DB.add(`${DB.tables.users}/${currentUser.phone}/children/${childKey}/checklists`, newChecklist)
    hideCard()
    MyConfetti.fire()
    AlertManager.successAlert('Checklist Created!')
  }

  // On View Change
  useEffect(() => {
    const inputs = document.getElementById('inputs')
    inputs.innerHTML = ''
    setCheckboxTextList([])
    const fromDest = activeChild?.checklists?.filter((x) => x.fromOrTo === 'from')[0]
    const toDest = activeChild?.checklists?.filter((x) => x.fromOrTo === 'to')[0]
    let existingChecklistsArr = []
    if (fromDest) {
      existingChecklistsArr.push('from')
    }
    if (toDest) {
      existingChecklistsArr.push('to')
    }
    setExistingChecklists(existingChecklistsArr)
  }, [view])

  const checkForExisting = (_view) => {
    const fromDest = activeChild?.checklists?.filter((x) => x.fromOrTo === 'from')[0]
    const toDest = activeChild?.checklists?.filter((x) => x.fromOrTo === 'to')[0]
    if (_view.includes('from')) {
      if (fromDest) {
        AlertManager.throwError("Transfer Checklist when transferring from co-parent's home already exists")
        return false
      }
    }
    if (_view.includes('to')) {
      if (toDest) {
        AlertManager.throwError("Transfer Checklist when transferring to co-parent's home already exists")
        return false
      }
    }
  }

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
            checkForExisting(_view)
            setView('to')
          } else {
            checkForExisting(_view)
            setView('from')
          }
        }}
        wrapperClasses={'child-info'}
        labels={['From Co-Parent', 'To-Coparent']}
      />

      <div id="inputs" key={refreshKey}></div>
      {!existingChecklists.includes(view) && (
        <button className="button default center" onClick={addInput}>
          Add Item
        </button>
      )}
    </BottomCard>
  )
}

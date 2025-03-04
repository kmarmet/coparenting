// Path: src\components\screens\childInfo\newTransferChecklist.jsx
import React, { useContext, useEffect, useState } from 'react'
import BottomCard from '../../shared/bottomCard'
import globalState from '../../../context'
import Spacer from '/src/components/shared/spacer'
import ViewSelector from '/src/components/shared/viewSelector'
import Manager from '/src/managers/manager'
import { MdOutlineChecklist } from 'react-icons/md'
import DB from '/src/database/DB'
import Checklist from '/src/models/checklist.js'
import DatasetManager from '../../../managers/datasetManager'
import MyConfetti from '../../shared/myConfetti'
import AlertManager from '../../../managers/alertManager'
export default function NewTransferChecklist({ showCard, hideCard }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, activeInfoChild, refreshKey } = state
  const [checkboxTextList, setCheckboxTextList] = useState([])
  const [view, setView] = useState('from')
  const [destinationLabels, setDestinationLabels] = useState(['From Co-Parent', 'To Co-Parent'])

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
    const childKey = await DB.getSnapshotKey(`${DB.tables.users}/${currentUser?.key}/children`, activeInfoChild, 'id')
    const newChecklist = new Checklist()
    newChecklist.checklistItems = DatasetManager.getUniqueArray(checkboxTextList, true)
    newChecklist.ownerKey = currentUser?.key
    newChecklist.fromOrTo = view
    if (childKey) {
      await DB.add(`${DB.tables.users}/${currentUser?.key}/children/${childKey}/checklists`, newChecklist)
      const updatedChild = await DB.getTable(`${DB.tables.users}/${currentUser?.key}/children/${childKey}`)
      setState({ ...state, activeInfoChild: updatedChild })
      hideCard()
      MyConfetti.fire()
      AlertManager.successAlert('Checklist Created!')
    }
  }

  const checkForExisting = () => {
    const fromDest = activeInfoChild?.checklists?.find((x) => x?.fromOrTo === 'from')
    const toDest = activeInfoChild?.checklists?.find((x) => x?.fromOrTo === 'to')

    if (Manager.isValid(fromDest)) {
      setDestinationLabels(['To Co-Parent'])
    }
    if (Manager.isValid(toDest)) {
      setDestinationLabels(['From Co-Parent'])
    }
    if (!Manager.isValid(fromDest) && !Manager.isValid(toDest)) {
      setDestinationLabels(['From Co-Parent', 'To Co-Parent'])
    }
  }

  useEffect(() => {
    checkForExisting()
  }, [activeInfoChild])

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
        shouldUpdateStateOnLoad={false}
        updateState={(text) => {
          const _view = text.toLowerCase()

          if (Manager.contains(_view, 'to')) {
            console.log('to')
            setView('to')
          } else {
            setView('from')
          }
        }}
        wrapperClasses={'child-info'}
        labels={destinationLabels}
      />

      <div id="inputs" key={refreshKey}></div>
      <button className="button default center" onClick={addInput}>
        Add Item
      </button>
    </BottomCard>
  )
}
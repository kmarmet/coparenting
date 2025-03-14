// Path: src\components\screens\childInfo\addOrUpdateTransferChecklists.jsx
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
import { child, getDatabase, onValue, ref } from 'firebase/database'
import { CgMathPlus } from 'react-icons/cg'

export default function AddOrUpdateTransferChecklists({ showCard, hideCard }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, activeInfoChild, refreshKey } = state
  const [checkboxTextList, setCheckboxTextList] = useState([])
  const [view, setView] = useState('from')
  const [existingItems, setExistingItems] = useState([])

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
  }

  const addOrUpdate = async () => {
    const childKey = await DB.getSnapshotKey(`${DB.tables.users}/${currentUser?.key}/children`, activeInfoChild, 'id')
    const existingChecklist = activeInfoChild?.checklists?.find((x) => x?.fromOrTo === view)
    const newChecklist = new Checklist()
    newChecklist.checklistItems = DatasetManager.getUniqueArray(checkboxTextList, true)
    newChecklist.fromOrTo = view

    if (childKey) {
      if (Manager.isValid(existingChecklist)) {
        // Update
        if (existingChecklist) {
          const newItems = DatasetManager.getUniqueArray(checkboxTextList, true)
          existingChecklist.checklistItems = [...existingChecklist.checklistItems, ...newItems]

          const checklistKey = await DB.getSnapshotKey(
            `${DB.tables.users}/${currentUser?.key}/children/${childKey}/checklists`,
            existingChecklist,
            'id'
          )

          if (checklistKey) {
            // Update existing checklist
            await DB.updateEntireRecord(
              `${DB.tables.users}/${currentUser?.key}/children/${childKey}/checklists`,
              existingChecklist,
              existingChecklist.id
            )
          }
        }
      }
      // Add new
      else {
        await DB.add(`${DB.tables.users}/${currentUser?.key}/children/${childKey}/checklists`, newChecklist)
      }
      hideCard()
      MyConfetti.fire()
      AlertManager.successAlert('Done!')
    }
  }

  const setChecklists = async () => {
    if (activeInfoChild) {
      const fromChecklist = activeInfoChild?.checklists?.find((x) => x?.fromOrTo === 'from')
      const toChecklist = activeInfoChild?.checklists?.find((x) => x?.fromOrTo === 'to')
      if (view === 'from') {
        if (fromChecklist) {
          setExistingItems(fromChecklist?.checklistItems)
        } else {
          setExistingItems([])
        }
      }
      if (view === 'to') {
        if (toChecklist) {
          setExistingItems(toChecklist?.checklistItems)
        } else {
          setExistingItems([])
        }
      }
    }
  }

  const onTableChange = async () => {
    const dbRef = ref(getDatabase())
    const childKey = await DB.getSnapshotKey(`${DB.tables.users}/${currentUser?.key}/children`, activeInfoChild, 'id')

    if (childKey) {
      onValue(child(dbRef, `${DB.tables.users}/${currentUser?.key}/children/${childKey}`), async (snapshot) => {
        const updatedChild = snapshot.val()
        setState({ ...state, activeInfoChild: updatedChild })
        setTimeout(async () => {
          await setChecklists()
        }, 300)
      })
    }
  }

  // SET EXISTING ITEMS BASED ON VIEW
  useEffect(() => {
    setChecklists().then((r) => r)
  }, [view])

  // ON SHOW CARD
  useEffect(() => {
    onTableChange().then((r) => r)
    const inputs = document.getElementById('inputs')
    const dynamicInputs = document.querySelectorAll('.dynamic-input')
    if (inputs && Manager.isValid(dynamicInputs)) {
      dynamicInputs.forEach((input) => {
        input.remove()
      })
    }
    setCheckboxTextList([])
    setChecklists().then((r) => r)
  }, [showCard])

  return (
    <BottomCard
      onSubmit={addOrUpdate}
      wrapperClass="new-checklist"
      submitIcon={<MdOutlineChecklist />}
      submitText={'Create/Update Checklist'}
      showCard={showCard}
      subtitle="A transfer checklist allows you and your child to ensure that nothing is left behind when transferring to or from your co-parent's home"
      title={'Transfer Checklists'}
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
        labels={['From Co-Parent', 'To Co-Parent']}
      />

      <div id="inputs" key={refreshKey}></div>
      {Manager.isValid(existingItems) &&
        existingItems?.map((item, index) => {
          return (
            <p className="existing-checklist-item" key={index}>
              {item}
            </p>
          )
        })}
      <button className="button default center mt-15 new-item-button" onClick={addInput}>
        New Checklist Item <CgMathPlus />
      </button>
    </BottomCard>
  )
}
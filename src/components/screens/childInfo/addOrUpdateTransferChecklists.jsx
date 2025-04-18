// Path: src\components\screens\childInfo\addOrUpdateTransferChecklists.jsx
import React, {useContext, useEffect, useState} from 'react'
import Modal from '../../shared/modal'
import globalState from '../../../context'
import Manager from '/src/managers/manager'
import {MdOutlineChecklist} from 'react-icons/md'
import DB from '/src/database/DB'
import Checklist from '/src/models/checklist.js'
import DatasetManager from '../../../managers/datasetManager'
import MyConfetti from '../../shared/myConfetti'
import AlertManager from '../../../managers/alertManager'
import {child, getDatabase, onValue, ref} from 'firebase/database'
import {CgMathPlus} from 'react-icons/cg'
import Spacer from '../../shared/spacer'

export default function AddOrUpdateTransferChecklists({showCard, hideCard, activeChild}) {
  const {state, setState} = useContext(globalState)
  const {currentUser, refreshKey} = state
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
    const childKey = await DB.getSnapshotKey(`${DB.tables.users}/${currentUser?.key}/children`, activeChild, 'id')
    const existingChecklist = activeChild?.checklists?.find((x) => x?.fromOrTo === view)
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
          setState({...state, successAlertMessage: 'Checklist Updated', refreshKey: Manager.getUid()})
        }
      }
      // Add new
      else {
        if (Manager.isValid(newChecklist.checklistItems)) {
          await DB.add(`${DB.tables.users}/${currentUser?.key}/children/${childKey}/checklists`, newChecklist)
        } else {
          AlertManager.throwError('Please enter at least one item')
          return false
        }
        setState({...state, successAlertMessage: 'Checklist Created', refreshKey: Manager.getUid()})
      }
      hideCard()
      MyConfetti.fire()
    }
  }

  const setChecklists = async () => {
    if (activeChild) {
      const fromChecklist = activeChild?.checklists?.find((x) => x?.fromOrTo === 'from')
      const toChecklist = activeChild?.checklists?.find((x) => x?.fromOrTo === 'to')
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
    const childKey = await DB.getSnapshotKey(`${DB.tables.users}/${currentUser?.key}/children`, activeChild, 'id')

    if (childKey) {
      onValue(child(dbRef, `${DB.tables.users}/${currentUser?.key}/children/${childKey}`), async (snapshot) => {
        const updatedChild = snapshot.val()
        setState({...state, activeChild: updatedChild})
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

    if (showCard) {
      const threeButtonAlertConfig = AlertManager.ThreeButtonAlertConfig
      threeButtonAlertConfig.title = 'Choose Checklist Type'
      threeButtonAlertConfig.confirmButtonText = 'From Co-Parent'
      threeButtonAlertConfig.cancelButtonText = 'To Co-Parent'
      threeButtonAlertConfig.onConfirm = () => setView('from')
      threeButtonAlertConfig.onCancel = () => setView('to')

      AlertManager.threeButtonAlert(threeButtonAlertConfig)
    }
  }, [showCard])

  return (
    <Modal
      onSubmit={addOrUpdate}
      wrapperClass="new-checklist"
      submitIcon={<MdOutlineChecklist />}
      submitText={'DONE'}
      showCard={showCard}
      subtitle="Add a transfer checklist which will allow you and your child to ensure that nothing is left behind when transferring to or from your co-parent's home"
      title={'Transfer Checklists'}
      onClose={hideCard}>
      <Spacer height={10} />
      <div id="inputs" key={refreshKey}></div>
      {Manager.isValid(existingItems) &&
        existingItems?.map((item, index) => {
          return (
            <p className="existing-checklist-item" key={index}>
              {item}
            </p>
          )
        })}
      <button className="button default grey center" onClick={addInput}>
        Add Item <CgMathPlus />
      </button>
    </Modal>
  )
}
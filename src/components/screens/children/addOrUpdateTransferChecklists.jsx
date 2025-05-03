// Path: src\components\screens\childInfo\addOrUpdateTransferChecklists.jsx
import DB from '/src/database/DB'
import Manager from '/src/managers/manager'
import Checklist from '/src/models/checklist.js'
import React, {useContext, useEffect, useState} from 'react'
import {CgMathPlus} from 'react-icons/cg'
import {MdOutlineChecklist} from 'react-icons/md'
import globalState from '../../../context'
import useChildren from '../../../hooks/useChildren'
import useCurrentUser from '../../../hooks/useCurrentUser'
import AlertManager from '../../../managers/alertManager'
import DatasetManager from '../../../managers/datasetManager'
import Modal from '../../shared/modal'
import MyConfetti from '../../shared/myConfetti'
import Spacer from '../../shared/spacer'
import StandaloneLoadingGif from '../../shared/standaloneLoadingGif'

export default function AddOrUpdateTransferChecklists({showCard, hideCard, activeChild}) {
  const {state, setState} = useContext(globalState)
  const {refreshKey} = state
  const [checkboxTextList, setCheckboxTextList] = useState([])
  const [view, setView] = useState('from')
  const [existingItems, setExistingItems] = useState([])
  const {currentUser} = useCurrentUser()
  const {children, childrenAreLoading} = useChildren()

  const AddInput = () => {
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

  const AddOrUpdate = async () => {
    const childKey = DB.GetChildIndex(children, activeChild?.id)
    const existingChecklist = DatasetManager.getValidArray(activeChild?.checklists)?.find((x) => x?.fromOrTo === view)
    const newChecklist = new Checklist()
    newChecklist.checklistItems = DatasetManager.getUniqueArray(checkboxTextList, true)
    newChecklist.fromOrTo = view

    if (childKey) {
      // UPDATE
      if (Manager.isValid(existingChecklist)) {
        const newItems = DatasetManager.getUniqueArray(checkboxTextList, true)
        const existingIndex = DB.GetTableIndexById(activeChild?.checklists, existingChecklist?.id)

        if (!Manager.isValid(existingIndex)) {
          return false
        }

        existingChecklist.checklistItems = DatasetManager.getValidArray([...existingChecklist.checklistItems, ...newItems])
        await DB.updateByPath(`${DB.tables.users}/${currentUser?.key}/children/${childKey}/checklists/${existingIndex}`, existingChecklist)
        setState({...state, successAlertMessage: 'Checklist Updated', refreshKey: Manager.getUid()})
      }

      // CREATE
      else {
        if (Manager.isValid(newChecklist.checklistItems)) {
          await DB.Add(`${DB.tables.users}/${currentUser?.key}/children/${childKey}/checklists`, activeChild?.checklists, newChecklist)
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

  const SetChecklists = async () => {
    if (activeChild) {
      const checklists = DatasetManager.getValidArray(activeChild?.checklists)
      const fromChecklist = checklists?.find((x) => x?.fromOrTo === 'from')
      const toChecklist = checklists?.find((x) => x?.fromOrTo === 'to')
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

  // SET EXISTING ITEMS BASED ON VIEW
  useEffect(() => {
    SetChecklists().then((r) => r)
  }, [view])

  // ON SHOW CARD
  useEffect(() => {
    const inputs = document.getElementById('inputs')
    const dynamicInputs = document.querySelectorAll('.dynamic-input')
    if (inputs && Manager.isValid(dynamicInputs)) {
      dynamicInputs.forEach((input) => {
        input.remove()
      })
    }
    setCheckboxTextList([])
    SetChecklists().then((r) => r)

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

  if (childrenAreLoading || !Manager.isValid(activeChild)) {
    return <StandaloneLoadingGif />
  }

  return (
    <Modal
      onSubmit={AddOrUpdate}
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
      <button className="button default grey center" onClick={AddInput}>
        Add Item <CgMathPlus />
      </button>
    </Modal>
  )
}
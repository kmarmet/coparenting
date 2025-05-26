// Path: src\components\screens\childInfo\addOrUpdateTransferChecklists.jsx
import DB from '/src/database/DB'
import Manager from '/src/managers/manager'
import Checklist from '/src/models/new/checklist.js'
import React, {useContext, useEffect, useState} from 'react'
import {CgMathPlus} from 'react-icons/cg'
import globalState from '../../../context'
import DB_UserScoped from '../../../database/db_userScoped'
import useActiveChild from '../../../hooks/useActiveChild'
import useChildren from '../../../hooks/useChildren'
import useCurrentUser from '../../../hooks/useCurrentUser'
import AlertManager from '../../../managers/alertManager'
import DatasetManager from '../../../managers/datasetManager'
import DomManager from '../../../managers/domManager'
import Form from '../../shared/form'
import MyConfetti from '../../shared/myConfetti'
import Spacer from '../../shared/spacer'

export default function AddOrUpdateTransferChecklists({showCard, hideCard, activeChildId}) {
  const {state, setState} = useContext(globalState)
  const {refreshKey} = state
  const [checkboxTextList, setCheckboxTextList] = useState([])
  const [view, setView] = useState('from')
  const [existingItems, setExistingItems] = useState([])
  const {currentUser} = useCurrentUser()
  const {children, childrenAreLoading} = useChildren()
  const {activeChild, activeChildIsLoading} = useActiveChild(activeChildId)

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
    const childKey = DB.GetChildIndex(children, activeChildId)
    const existingChecklist = activeChild?.checklists?.find((x) => x?.fromOrTo === view)
    const newChecklist = new Checklist()
    newChecklist.items = DatasetManager.GetValidArray(checkboxTextList)
    newChecklist.fromOrTo = view

    if (childKey) {
      // UPDATE
      if (Manager.IsValid(existingChecklist)) {
        const newItems = DatasetManager.GetValidArray(checkboxTextList)
        const existingChecklistIndex = DB.GetTableIndexById(activeChild?.checklists, existingChecklist?.id)

        if (!Manager.IsValid(existingChecklistIndex)) {
          return false
        }
        existingChecklist.items = DatasetManager.CombineArrays(existingChecklist.items, newItems)
        await DB_UserScoped.AddItemsToChecklist(
          `${DB.tables.users}/${currentUser?.key}/children/${childKey}/checklists/${existingChecklistIndex}`,
          existingChecklist
        )
        setState({...state, successAlertMessage: 'Checklist Updated', refreshKey: Manager.GetUid()})
      }

      // CREATE
      else {
        if (Manager.IsValid(newChecklist.items)) {
          await DB_UserScoped.AddChecklist(
            `${DB.tables.users}/${currentUser?.key}/children/${childKey}/checklists`,
            activeChild?.checklists || [],
            newChecklist
          )
          setState({...state, successAlertMessage: 'Checklist Created', refreshKey: Manager.GetUid()})
        } else {
          AlertManager.throwError('Please enter at least one item')
          return false
        }
      }
      hideCard()
      MyConfetti.fire()
    }
  }

  const SetChecklists = async () => {
    if (activeChild) {
      const checklists = DatasetManager.GetValidArray(activeChild?.checklists)
      const fromChecklist = checklists?.find((x) => x?.fromOrTo === 'from')
      const toChecklist = checklists?.find((x) => x?.fromOrTo === 'to')
      if (view === 'from') {
        if (fromChecklist) {
          setExistingItems(fromChecklist?.items)
        } else {
          setExistingItems([])
        }
      }
      if (view === 'to') {
        if (toChecklist) {
          setExistingItems(toChecklist?.items)
        } else {
          setExistingItems([])
        }
      }
    }
  }

  // SET EXISTING ITEMS BASED ON VIEW
  useEffect(() => {
    if (Manager.IsValid(activeChild)) {
      SetChecklists().then((r) => r)
    }
  }, [view, activeChildId])

  // ON SHOW CARD
  useEffect(() => {
    const inputs = document.getElementById('inputs')
    const dynamicInputs = document.querySelectorAll('.dynamic-input')
    if (inputs && Manager.IsValid(dynamicInputs)) {
      dynamicInputs.forEach((input) => {
        input.remove()
      })
    }
    setCheckboxTextList([])

    if (showCard) {
      SetChecklists().then((r) => r)
      const threeButtonAlertConfig = AlertManager.ThreeButtonAlertConfig
      threeButtonAlertConfig.title = 'Choose Checklist Type'
      threeButtonAlertConfig.confirmButtonText = 'From Co-Parent'
      threeButtonAlertConfig.cancelButtonText = 'To Co-Parent'
      threeButtonAlertConfig.onConfirm = () => setView('from')
      threeButtonAlertConfig.onCancel = () => setView('to')

      AlertManager.threeButtonAlert(threeButtonAlertConfig)

      setTimeout(() => {
        DomManager.ToggleAnimation('add', 'existing-checklist-item', DomManager.AnimateClasses.names.fadeInUp, 100)
      }, 300)
    }
  }, [showCard])

  return (
    <Form
      onSubmit={AddOrUpdate}
      wrapperClass="new-checklist"
      submitText={'DONE'}
      showCard={showCard}
      subtitle="Add a transfer checklist which will allow you and your child to ensure that nothing is left behind when transferring to or from your co-parent's home"
      title={'Transfer Checklists'}
      onClose={hideCard}>
      <Spacer height={10} />
      <div id="inputs" key={refreshKey}></div>
      {Manager.IsValid(existingItems) &&
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
    </Form>
  )
}
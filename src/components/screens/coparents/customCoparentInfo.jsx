// Path: src\components\screens\coparents\customCoparentInfo.jsx
import React, {useContext, useState} from 'react'
import globalState from '../../../context'
import Manager from '../../../managers/manager'
import DB_UserScoped from '../../../database/db_userScoped'
import Modal from '../../shared/modal'
import {FaWandMagicSparkles} from 'react-icons/fa6'
import _ from 'lodash'
import AlertManager from '../../../managers/alertManager'
import InputWrapper from '../../shared/inputWrapper'
import StringManager from '../../../managers/stringManager.coffee'

export default function CustomCoparentInfo({hideCard, activeCoparent, showCard}) {
  const {state, setState} = useContext(globalState)
  const {currentUser, theme, refreshKey} = state
  const [title, setTitle] = useState('')
  const [value, setValue] = useState('')

  const resetForm = (hasMessage = false) => {
    Manager.resetForm('custom-coparent-info-wrapper')
    setTitle('')
    setValue('')
    setState({
      ...state,
      refreshKey: Manager.getUid(),
      successAlertMessage: hasMessage ? `${StringManager.uppercaseFirstLetterOfAllWords(title)} Property Added` : null,
    })
    hideCard()
  }

  const add = async () => {
    if (_.isEmpty(title) || _.isEmpty(value)) {
      AlertManager.throwError('Both fields are required')
      return false
    }
    await DB_UserScoped.addCoparentProp(currentUser, activeCoparent, title, value)
    resetForm(true)
  }

  return (
    <Modal
      submitIcon={<FaWandMagicSparkles />}
      submitText={'Add'}
      onSubmit={add}
      wrapperClass="custom-coparent-card"
      title={'Add Custom Info'}
      showCard={showCard}
      onClose={resetForm}>
      <div className="custom-coparent-info-wrapper">
        <InputWrapper inputType={'input'} labelText={'Title/Label*'} onChange={(e) => setTitle(StringManager.removeSpecialChars(e.target.value))} />
        <InputWrapper inputType={'input'} labelText={'Value*'} onChange={(e) => setValue(e.target.value)} />
      </div>
    </Modal>
  )
}
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
import InputTypes from '../../../constants/inputTypes'
import Spacer from '../../shared/spacer'
import useCurrentUser from '../../../hooks/useCurrentUser'

export default function CustomParentInfo({hideCard, activeCoparent, showCard}) {
  const {state, setState} = useContext(globalState)
  const {theme, refreshKey} = state
  const [title, setTitle] = useState('')
  const [value, setValue] = useState('')
  const {currentUser} = useCurrentUser()

  const ResetForm = (hasMessage = false) => {
    Manager.ResetForm('custom-coparent-info-wrapper')
    setTitle('')
    setValue('')
    setState({
      ...state,
      refreshKey: Manager.getUid(),
      successAlertMessage: hasMessage ? `${StringManager.uppercaseFirstLetterOfAllWords(title)} Property Added` : null,
    })
    hideCard()
  }

  const Add = async () => {
    if (_.isEmpty(title) || _.isEmpty(value)) {
      AlertManager.throwError('Both fields are required')
      return false
    }
    await DB_UserScoped.addParentProp(currentUser, activeCoparent, title, value)
    ResetForm(true)
  }

  return (
    <Modal
      submitIcon={<FaWandMagicSparkles />}
      submitText={'Add'}
      onSubmit={Add}
      wrapperClass="custom-coparent-card"
      title={'Add Custom Info'}
      showCard={showCard}
      onClose={ResetForm}>
      <Spacer height={8} />
      <div className="custom-coparent-info-wrapper">
        <InputWrapper
          hasBottomSpacer={true}
          inputType={InputTypes.text}
          required={true}
          labelText={'Title/Label'}
          onChange={(e) => setTitle(StringManager.removeSpecialChars(e.target.value))}
        />
        <InputWrapper inputType={InputTypes.text} required={true} labelText={'Value'} onChange={(e) => setValue(e.target.value)} />
      </div>
    </Modal>
  )
}
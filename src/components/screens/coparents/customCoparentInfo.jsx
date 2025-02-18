// Path: src\components\screens\coparents\customCoparentInfo.jsx
import React, { useContext, useState } from 'react'
import globalState from '../../../context'
import Manager from '../../../managers/manager'
import DB_UserScoped from '../../../database/db_userScoped'
import BottomCard from '../../shared/bottomCard'
import { FaWandMagicSparkles } from 'react-icons/fa6'
import _ from 'lodash'
import AlertManager from '../../../managers/alertManager'
import InputWrapper from '../../shared/inputWrapper'
import StringManager from '../../../managers/stringManager.coffee'

export default function CustomCoparentInfo({ hideCard, activeCoparent, showCard }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, refreshKey } = state
  const [title, setTitle] = useState('')
  const [value, setValue] = useState('')

  const resetForm = () => {
    Manager.resetForm('custom-coparent-info-wrapper')
    setTitle('')
    setValue('')
    hideCard()
  }

  const add = async () => {
    if (_.isEmpty(title) || _.isEmpty(value)) {
      AlertManager.throwError('Both fields are required')
      return false
    }
    await DB_UserScoped.addCoparentProp(currentUser, activeCoparent, title, value)
    AlertManager.successAlert(`${StringManager.uppercaseFirstLetterOfAllWords(title)} Added!`)
    resetForm()
  }

  return (
    <BottomCard
      submitIcon={<FaWandMagicSparkles />}
      submitText={'Add'}
      onSubmit={add}
      wrapperClass="custom-coparent-card"
      title={'Add Custom Info'}
      showCard={showCard}
      onClose={resetForm}>
      <div className="custom-coparent-info-wrapper">
        <div className={`${theme} form`}>
          <InputWrapper key={`${refreshKey}jdklskd`} inputType={'input'} labelText={'Title/Label*'} onChange={(e) => setTitle(e.target.value)} />
          <InputWrapper key={refreshKey} inputType={'input'} labelText={'Value*'} onChange={(e) => setValue(e.target.value)} />
        </div>
      </div>
    </BottomCard>
  )
}

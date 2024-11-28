import React, { useContext, useState } from 'react'
import globalState from '../../../context'
import Manager from '@manager'
import {
  contains,
  formatFileName,
  formatNameFirstNameOnly,
  getFileExtension,
  getFirstWord,
  hasClass,
  isAllUppercase,
  removeFileExtension,
  removeSpacesAndLowerCase,
  spaceBetweenWords,
  stringHasNumbers,
  toCamelCase,
  uniqueArray,
  uppercaseFirstLetterOfAllWords,
  wordCount,
} from '../../../globalFunctions'
import DB_UserScoped from '@userScoped'
import BottomCard from '../../shared/bottomCard'
import { FaWandMagicSparkles } from 'react-icons/fa6'
import _ from 'lodash'
import AlertManager from '../../../managers/alertManager'
import InputWrapper from '../../shared/inputWrapper'

export default function CustomCoparentInfo({ hideCard, setActiveCoparent, activeCoparent, showCard }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [title, setTitle] = useState('')
  const [value, setValue] = useState('')
  const [refreshKey, setRefreshKey] = useState(Manager.getUid())

  const resetForm = () => {
    Manager.resetForm('custom-coparent-info-wrapper')
    setTitle('')
    setValue('')
    hideCard()
    setRefreshKey(Manager.getUid())
  }

  const add = async () => {
    if (_.isEmpty(title) || _.isEmpty(value)) {
      AlertManager.throwError('Both fields are required')
      return false
    }
    await DB_UserScoped.addCoparentProp(currentUser, activeCoparent, title, value)
    AlertManager.successAlert(`${uppercaseFirstLetterOfAllWords(title)} Added!`)
    resetForm()
  }

  return (
    <BottomCard
      refreshKey={refreshKey}
      submitIcon={<FaWandMagicSparkles />}
      submitText={'Add'}
      onSubmit={add}
      title={'Add Custom Info'}
      showCard={showCard}
      onClose={resetForm}>
      <div className="custom-coparent-info-wrapper">
        <div className={`${theme} form`}>
          <InputWrapper inputType={'input'} labelText={'Title/Label*'} onChange={(e) => setTitle(e.target.value)} />
          <InputWrapper inputType={'input'} labelText={'Value*'} onChange={(e) => setValue(e.target.value)} />
        </div>
      </div>
    </BottomCard>
  )
}
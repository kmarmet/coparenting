import React, { useContext, useState } from 'react'
import globalState from '../../../context'
import Manager from '@manager'
import {
  contains,
  displayAlert,
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
  successAlert,
  throwError,
  toCamelCase,
  uniqueArray,
  uppercaseFirstLetterOfAllWords,
  wordCount,
} from '../../../globalFunctions'
import DB_UserScoped from '@userScoped'
import BottomCard from '../../shared/bottomCard'
import { FaWandMagicSparkles } from 'react-icons/fa6'
import _ from 'lodash'

export default function CustomCoparentInfo({ hideCard, setActiveCoparent, activeCoparent, showCard }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [title, setTitle] = useState('')
  const [value, setValue] = useState('')
  const [refreshKey, setRefreshKey] = useState(Manager.getUid())
  const resetForm = () => {
    successAlert(`${title} Added!`)
    Manager.resetForm('custom-coparent-info-wrapper')
    setTitle('')
    setValue('')
    hideCard()
    setRefreshKey(Manager.getUid())
  }

  const add = async () => {
    if (_.isEmpty(title) || _.isEmpty(value)) {
      throwError('Both fields are required')
      return false
    }
    const updatedCoparent = await DB_UserScoped.addCoparentProp(currentUser, activeCoparent, toCamelCase(title), value)
    resetForm()
    setActiveCoparent(updatedCoparent)
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
          <>
            <input className="mb-5" type="text" placeholder="Title/Label*" onChange={(e) => setTitle(e.target.value)} />
            <input className="mb-5" type="text" placeholder="Value*" onChange={(e) => setValue(e.target.value)} />
          </>
        </div>
      </div>
    </BottomCard>
  )
}
import { child, getDatabase, onValue, ref, remove, set } from 'firebase/database'
import React, { useContext, useEffect, useState } from 'react'
import { DebounceInput } from 'react-debounce-input'
import Autocomplete from 'react-google-autocomplete'
import globalState from '../../../context'
import DB from '@db'
import Manager from '@manager'
import ScreenNames from '@screenNames'
import { useSwipeable } from 'react-swipeable'
import EmailManager from 'managers/emailManager'
import BottomButton from 'components/shared/bottomButton'
import {
  toCamelCase,
  getFirstWord,
  formatFileName,
  isAllUppercase,
  removeSpacesAndLowerCase,
  stringHasNumbers,
  wordCount,
  uppercaseFirstLetterOfAllWords,
  spaceBetweenWords,
  formatNameFirstNameOnly,
  removeFileExtension,
  contains,
  displayAlert,
  uniqueArray,
  getFileExtension,
} from '../../../globalFunctions'

function FeatureRequest() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [featureName, setFeatureName] = useState('')
  const [featureDescription, setFeatureDescription] = useState('')

  const handlers = useSwipeable({
    onSwipedRight: (eventData) => {
      console.log('User Swiped!', eventData)
      setState({ ...state, currentScreen: ScreenNames.settings })
    },
  })

  const resetForm = () => {
    Manager.resetForm('feature-request-wrapper')
    setFeatureName('')
    setFeatureDescription('')
  }

  const submit = () => {
    if (featureDescription.length === 0) {
      displayAlert('error', 'Please enter a description of the feature you would like to add')
      return false
    }

    displayAlert('success', '', 'We have received your feature request!')
    EmailManager.SendFeatureRequest(currentUser.email)

    resetForm()
  }

  useEffect(() => {
    Manager.showPageContainer()
  }, [])

  return (
    <div className="feature-request-wrapper">
      <div {...handlers} id="feature-request-container" className={`${theme} page-container form`}>
        <div className="form">
          <label>
            Name of the feature <span className="asterisk">*</span>
          </label>
          <input onChange={(e) => setFeatureName(e.target.value)} type="text" className="mb-15" />
          <label>
            Request Details <span className="asterisk">*</span>
          </label>
          <textarea onChange={(e) => setFeatureDescription(e.target.value)} className="mb-20"></textarea>
          <button className="button green default center" onClick={submit}>
            Request Feature
          </button>
        </div>
      </div>
    </div>
  )
}

export default FeatureRequest

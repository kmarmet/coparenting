import { child, getDatabase, ref, set } from 'firebase/database'
import React, { useContext, useEffect, useState } from 'react'
import Autocomplete from 'react-google-autocomplete'
import globalState from '../../../context'
import Coparent from '../../../models/coparent'
import Manager from '@manager'
import CheckboxGroup from '@shared/checkboxGroup'
import {
  contains,
  formatFileName,
  formatNameFirstNameOnly,
  formatPhone,
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
import ModelNames from '../../../models/modelNames'
import ObjectManager from '../../../managers/objectManager'
import InputWrapper from '../../shared/inputWrapper'
import BottomCard from '../../shared/bottomCard'
import DatasetManager from '../../../managers/datasetManager'
import AlertManager from '../../../managers/alertManager'

const NewCoparentForm = ({ showCard, hideCard }) => {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state

  // State
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [parentType, setParentType] = useState('')
  const [refreshKey, setRefreshKey] = useState(Manager.getUid())

  const resetForm = () => {
    Manager.resetForm('new-coparent-wrapper')
    hideCard()
    setRefreshKey(Manager.getUid())
    AlertManager.successAlert(`${formatNameFirstNameOnly(name)} Added!`)
  }

  const submit = async () => {
    const dbRef = ref(getDatabase())
    if (!Manager.phoneNumberIsValid(phoneNumber)) {
      AlertManager.throwError('Phone number is not valid')
      return false
    }
    if (Manager.validation([phoneNumber, address, name, parentType]) > 0) {
      AlertManager.throwError('All fields are required')
    } else {
      const existingCoparents = currentUser?.coparents || []
      const newCoparent = new Coparent()
      newCoparent.id = Manager.getUid()
      newCoparent.address = address !== null ? address : ''
      newCoparent.phone = formatPhone(phoneNumber)
      newCoparent.name = name
      newCoparent.parentType = parentType

      const cleanCoparent = ObjectManager.cleanObject(newCoparent, ModelNames.coparent)

      // Has coparents already
      await set(child(dbRef, `users/${currentUser.phone}/coparents`), DatasetManager.mergeMultiple(currentUser.coparents, [cleanCoparent]))

      resetForm()
    }
  }

  const handleCoparentType = (e) => {
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        setParentType(e)
      },
      (e) => {
        setParentType('')
      }
    )
  }

  useEffect(() => {
    Manager.showPageContainer()
  }, [])

  return (
    <BottomCard
      refreshKey={refreshKey}
      onSubmit={submit}
      submitText={name.length > 0 ? `Add ${uppercaseFirstLetterOfAllWords(name)}` : 'Add'}
      title={'New Co-Parent'}
      showCard={showCard}
      onClose={resetForm}>
      <div className="new-coparent-wrapper">
        <div id="new-coparent-container" className={`${theme} form`}>
          <div className="form new-coparent-form">
            <InputWrapper inputType={'input'} required={true} labelText={'Name'} onChange={(e) => setName(e.target.value)} />
            <InputWrapper inputType={'input'} required={true} labelText={'Phone Number'} onChange={(e) => setPhoneNumber(e.target.value)} />
            <InputWrapper inputType={'location'} required={true} labelText={'Home Address'}>
              <Autocomplete
                placeholder="Home Address"
                apiKey={process.env.REACT_APP_AUTOCOMPLETE_ADDRESS_API_KEY}
                options={{
                  types: ['geocode', 'establishment'],
                  componentRestrictions: { country: 'usa' },
                }}
                onPlaceSelected={(place) => setAddress(place.formatted_address)}
              />
            </InputWrapper>

            {/* PARENT TYPE */}
            <CheckboxGroup
              parentLabel={'Parent Type'}
              className="coparent-type"
              skipNameFormatting={true}
              checkboxLabels={['Step-Parent', 'Biological Parent', "Spouse's Co-Parent"]}
              onCheck={handleCoparentType}
            />
          </div>
        </div>
      </div>
    </BottomCard>
  )
}

export default NewCoparentForm
import React, { useContext, useState } from 'react'
import globalState from '../../context'
import Manager from '@manager'
import DB_UserScoped from '@userScoped'
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
} from '.././../globalFunctions'
import CheckboxGroup from './checkboxGroup'
import Autocomplete from 'react-google-autocomplete'
import InputWrapper from './inputWrapper'
import Label from './label'
import BottomCard from './bottomCard'
import AlertManager from '../../managers/alertManager'

export default function CustomChildInfo({ hideCard, showCard, setActiveChild, activeChild }) {
  const { state, setState } = useContext(globalState)
  const { currentUser } = state
  const [title, setTitle] = useState('')
  const [value, setValue] = useState('')
  const [infoSection, setInfoSection] = useState('general')
  const [infoType, setInfoType] = useState('text')
  const [refreshKey, setRefreshKey] = useState(Manager.getUid())

  const add = async () => {
    if (title.length === 0 || value.length === 0) {
      AlertManager.throwError('Please fill/select required fields')
      return false
    }
    const updatedChild = await DB_UserScoped.addUserChildProp(currentUser, activeChild, infoSection, toCamelCase(title), value)
    AlertManager.successAlert(`${uppercaseFirstLetterOfAllWords(infoSection)} Info Added!`)
    resetForm()
    setActiveChild(updatedChild)
  }

  const handleInfoTypeSelection = (e) => {
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        setInfoType(e.toLowerCase())
      },
      (e) => {
        if (e === 'Text') setInfoType('location')
        else setInfoType('text')
      },
      false
    )
  }

  const resetForm = () => {
    Manager.resetForm('custom-child-info-wrapper')
    setTitle('')
    setValue('')
    setInfoSection('')
    hideCard()
    setRefreshKey(Manager.getUid())
  }

  return (
    <BottomCard
      refreshKey={refreshKey}
      onSubmit={add}
      submitText={'Add'}
      className="custom-child-info-wrapper"
      wrapperClass="custom-child-info-card"
      onClose={resetForm}
      title={'Add Custom Info'}
      showCard={showCard}>
      <div className="form">
        {/* INFO SECTIONS */}
        <Label text={'Section'} required={true} />
        <div className="flex" id="info-type">
          <p onClick={() => setInfoSection('general')} className={infoSection === 'general' ? 'active item' : 'item'}>
            General
          </p>
          <p onClick={() => setInfoSection('medical')} className={infoSection === 'medical' ? 'active item' : 'item'}>
            Medical
          </p>
          <p onClick={() => setInfoSection('schooling')} className={infoSection === 'schooling' ? 'active item' : 'item'}>
            Schooling
          </p>
          <p onClick={() => setInfoSection('behavior')} className={infoSection === 'behavior' ? 'active item' : 'item'}>
            Behavior
          </p>
        </div>

        {/* INFO TYPE */}
        <CheckboxGroup
          parentLabel="Type"
          required={true}
          defaultLabels={'Text'}
          checkboxLabels={['Text', 'Location']}
          onCheck={handleInfoTypeSelection}
        />

        {/* INPUTS */}
        {infoType === 'text' && (
          <>
            <InputWrapper inputType={'input'} labelText={'Title/Label'} required={true} onChange={(e) => setTitle(e.target.value)} />
            <InputWrapper inputType={'input'} labelText={'Value'} required={true} onChange={(e) => setValue(e.target.value)} />
          </>
        )}

        {infoType === 'location' && (
          <>
            <InputWrapper inputType={'input'} labelText={'Title/Label'} required={true} />
            <InputWrapper inputType={'location'} labelText={'Location'}>
              <Autocomplete
                apiKey={process.env.REACT_APP_AUTOCOMPLETE_ADDRESS_API_KEY}
                options={{
                  types: ['geocode', 'establishment'],
                  componentRestrictions: { country: 'usa' },
                }}
                onPlaceSelected={async (place) => {
                  setTitle('address')
                  setValue(place.formatted_address)
                }}
                placeholder={Manager.isValid(activeChild?.general?.address) ? activeChild?.general?.address : 'Location'}
              />
            </InputWrapper>
          </>
        )}
      </div>
    </BottomCard>
  )
}
import React, { useContext, useState } from 'react'
import globalState from '../../context'
import Manager from '@manager'
import DB_UserScoped from '@userScoped'
import { MobileDatePicker } from '@mui/x-date-pickers-pro'
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
import moment from 'moment'
import CheckboxGroup from './checkboxGroup'
import Autocomplete from 'react-google-autocomplete'
import InputWrapper from './inputWrapper'
import BottomCard from './bottomCard'
import AlertManager from '../../managers/alertManager'
import ShareWithCheckboxes from './shareWithCheckboxes'
import NotificationManager from '../../managers/notificationManager.js'
import DateFormats from '../../constants/dateFormats'

export default function CustomChildInfo({ hideCard, showCard, setActiveChild, activeChild }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [title, setTitle] = useState('')
  const [value, setValue] = useState('')
  const [infoSection, setInfoSection] = useState('general')
  const [infoType, setInfoType] = useState('text')
  const [refreshKey, setRefreshKey] = useState(Manager.getUid())
  const [shareWith, setShareWith] = useState([])

  const add = async () => {
    if (title.length === 0 || value.length === 0) {
      AlertManager.throwError('Please fill/select required fields')
      return false
    }
    const updatedChild = await DB_UserScoped.addUserChildProp(currentUser, activeChild, infoSection, toCamelCase(title), value, shareWith)

    if (Manager.isValid(shareWith, true)) {
      await NotificationManager.sendToShareWith(
        shareWith,
        currentUser,
        `${uppercaseFirstLetterOfAllWords(infoSection)} Info Updated for ${activeChild?.general?.name}`,
        `${title} - ${value}`,
        infoSection
      )
    }

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

  const handleShareWithSelection = (e) => {
    const shareWithNumbers = Manager.handleShareWithSelection(e, currentUser, shareWith)
    setShareWith(shareWithNumbers)
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
        <div className="flex views-wrapper" id="info-type">
          <p onClick={() => setInfoSection('general')} className={infoSection === 'general' ? 'active item view' : 'item view'}>
            General
          </p>
          <p onClick={() => setInfoSection('medical')} className={infoSection === 'medical' ? 'active item view' : 'item view'}>
            Medical
          </p>
          <p onClick={() => setInfoSection('schooling')} className={infoSection === 'schooling' ? 'active item view' : 'item view'}>
            Schooling
          </p>
          <p onClick={() => setInfoSection('behavior')} className={infoSection === 'behavior' ? 'active item view' : 'item view'}>
            Behavior
          </p>
        </div>

        <ShareWithCheckboxes onCheck={handleShareWithSelection} labelText="Share with (optional)" required={false} />

        {/* INFO TYPE */}
        <CheckboxGroup
          parentLabel="Type"
          required={true}
          defaultLabels={'Text'}
          checkboxLabels={['Text', 'Location', 'Date']}
          onCheck={handleInfoTypeSelection}
        />

        {/* INPUTS */}
        {infoType === 'text' && (
          <>
            <InputWrapper inputType={'input'} labelText={'Title/Label'} required={true} onChange={(e) => setTitle(e.target.value)} />
            <InputWrapper inputType={'input'} labelText={'Value'} required={true} onChange={(e) => setValue(e.target.value)} />
          </>
        )}

        {infoType === 'date' && (
          <div className="w-100">
            <InputWrapper inputType={'input'} labelText={'Title/Label'} required={true} onChange={(e) => setTitle(e.target.value)} />
            <InputWrapper labelText={'Date'} required={true} inputType={'date'}>
              <MobileDatePicker
                className={`${theme} m-0 w-100 event-from-date mui-input`}
                onAccept={(e) => {
                  setValue(moment(e).format(DateFormats.dateForDb))
                }}
              />
            </InputWrapper>
          </div>
        )}

        {infoType === 'location' && (
          <>
            <InputWrapper inputType={'input'} labelText={'Title/Label'} required={true} onChange={(e) => setTitle(e.target.value)} />
            <InputWrapper inputType={'location'} labelText={'Location'}>
              <Autocomplete
                apiKey={process.env.REACT_APP_AUTOCOMPLETE_ADDRESS_API_KEY}
                options={{
                  types: ['geocode', 'establishment'],
                  componentRestrictions: { country: 'usa' },
                }}
                onPlaceSelected={async (place) => {
                  setValue(place.formatted_address)
                }}
              />
            </InputWrapper>
          </>
        )}
      </div>
    </BottomCard>
  )
}
// Path: src\components\shared\customChildInfo.jsx
import React, { useContext, useState } from 'react'
import globalState from '../../context'
import Manager from '../../managers/manager'
import DB_UserScoped from '../../database/db_userScoped'
import { MobileDatePicker } from '@mui/x-date-pickers-pro'
import moment from 'moment'
import CheckboxGroup from './checkboxGroup'
import InputWrapper from './inputWrapper'
import Modal from './modal'
import AlertManager from '../../managers/alertManager'
import ShareWithCheckboxes from './shareWithCheckboxes'
import NotificationManager from '../../managers/notificationManager.js'
import DateFormats from '../../constants/dateFormats'
import StringManager from '../../managers/stringManager'
import Spacer from './spacer'
import ViewSelector from './viewSelector'
import AddressInput from './addressInput'
import validator from 'validator'
import DomManager from '../../managers/domManager'
import { FaPencilAlt } from 'react-icons/fa'

export default function CustomChildInfo({ hideCard, showCard }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, activeInfoChild } = state
  const [title, setTitle] = useState('')
  const [value, setValue] = useState('')
  const [infoSection, setInfoSection] = useState('general')
  const [infoType, setInfoType] = useState('text')
  const [shareWith, setShareWith] = useState([])

  const add = async () => {
    if (title.length === 0 || value.length === 0) {
      AlertManager.throwError('Please fill/select required fields')
      return false
    }
    if (infoType === 'phone' && !validator.isMobilePhone(value)) {
      AlertManager.throwError('Please enter a valid phone number')
      return false
    }
    const updatedChild = await DB_UserScoped.addUserChildProp(
      currentUser,
      activeInfoChild,
      infoSection,
      StringManager.toCamelCase(title),
      value,
      shareWith
    )

    if (Manager.isValid(shareWith)) {
      await NotificationManager.sendToShareWith(
        shareWith,
        currentUser,
        `${StringManager.uppercaseFirstLetterOfAllWords(infoSection)} Info Updated for ${activeInfoChild?.general?.name}`,
        `${title} - ${value}`,
        infoSection
      )
    }

    AlertManager.successAlert(`${StringManager.uppercaseFirstLetterOfAllWords(infoSection)} Info Added!`)
    resetForm()
    setState({ ...state, activeInfoChild: updatedChild, refreshKey: Manager.getUid() })
  }

  const handleInfoTypeSelection = (e) => {
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        console.log(e)
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
    setState({ ...state, refreshKey: Manager.getUid() })
  }

  return (
    <Modal
      onSubmit={add}
      submitText={'Add'}
      className="custom-child-info-wrapper"
      wrapperClass="custom-child-info-card"
      onClose={resetForm}
      title={'Add Your Own Info'}
      showCard={showCard}>
      <div className="form">
        {/* INFO SECTIONS */}
        <ViewSelector
          defaultView={'General'}
          labels={['General', 'Medical', 'Schooling', 'Behavior']}
          updateState={(e) => setInfoSection(e.toLowerCase())}
        />
        <Spacer height={5} />
        <ShareWithCheckboxes onCheck={handleShareWithSelection} labelText="Share with" required={false} />
        <Spacer height={5} />
        {/* INFO TYPE */}
        <CheckboxGroup
          parentLabel="Type"
          required={true}
          icon={<FaPencilAlt className={'type'} />}
          checkboxArray={Manager.buildCheckboxGroup({
            currentUser,
            defaultLabels: ['Text'],
            customLabelArray: ['Text', 'Location', 'Date', 'Phone'],
          })}
          onCheck={handleInfoTypeSelection}
        />
        <Spacer height={5} />

        {/* INPUTS */}
        {infoType === 'text' && (
          <>
            <InputWrapper inputType={'input'} labelText={'Title/Label'} required={true} onChange={(e) => setTitle(e.target.value)} />
            <InputWrapper inputType={'input'} labelText={'Value'} required={true} onChange={(e) => setValue(e.target.value)} />
          </>
        )}

        {infoType === 'phone' && (
          <>
            <InputWrapper inputType={'input'} labelText={'Title/Label'} required={true} onChange={(e) => setTitle(e.target.value)} />
            <InputWrapper
              inputValueType="tel"
              labelText={'Phone Number'}
              required={true}
              onChange={(e) => setValue(StringManager.formatPhone(e.target.value))}
            />
          </>
        )}

        {infoType === 'date' && (
          <div className="w-100">
            <InputWrapper inputType={'input'} labelText={'Title/Label'} required={true} onChange={(e) => setTitle(e.target.value)} />
            {!DomManager.isMobile() && (
              <InputWrapper labelText={'Date'} required={true} inputType={'date'}>
                <MobileDatePicker
                  className={`${theme} m-0 w-100 event-from-date mui-input`}
                  onAccept={(e) => {
                    setValue(moment(e).format(DateFormats.dateForDb))
                  }}
                />
              </InputWrapper>
            )}
            {DomManager.isMobile() && <InputWrapper useNativeDate={true} labelText={'Date'} required={true} inputType={'date'}></InputWrapper>}
          </div>
        )}

        {infoType === 'location' && (
          <>
            <InputWrapper inputType={'input'} labelText={'Title/Label'} required={true} onChange={(e) => setTitle(e.target.value)} />
            <InputWrapper inputType={'location'} labelText={'Location'}>
              <AddressInput
                onSelection={(place) => {
                  setValue(place)
                }}
              />
            </InputWrapper>
          </>
        )}
      </div>
    </Modal>
  )
}
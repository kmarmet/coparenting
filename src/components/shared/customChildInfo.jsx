// Path: src\components\shared\customChildInfo.jsx
import React, {useContext, useState} from 'react'
import globalState from '../../context'
import Manager from '../../managers/manager'
import DB_UserScoped from '../../database/db_userScoped'
import moment from 'moment'
import CheckboxGroup from './checkboxGroup'
import InputWrapper from './inputWrapper'
import Modal from './modal'
import AlertManager from '../../managers/alertManager'
import ShareWithCheckboxes from './shareWithCheckboxes'
import NotificationManager from '../../managers/notificationManager.js'
import DatetimeFormats from '../../constants/datetimeFormats'
import StringManager from '../../managers/stringManager'
import ViewSelector from './viewSelector'
import validator from 'validator'
import InputTypes from '../../constants/inputTypes'

export default function CustomChildInfo({hideCard, showCard}) {
  const {state, setState} = useContext(globalState)
  const {currentUser, theme, activeInfoChild} = state
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

    resetForm(`${StringManager.uppercaseFirstLetterOfAllWords(infoSection)} Info Added!`, updatedChild)
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

  const resetForm = (successMessage, updatedChild) => {
    Manager.resetForm('custom-child-info-wrapper')
    setTitle('')
    setValue('')
    setInfoSection('')
    hideCard()
    setState({...state, refreshKey: Manager.getUid(), successAlertMessage: successMessage, activeInfoChild: updatedChild})
  }

  return (
    <Modal
      onSubmit={add}
      submitText={'Add'}
      className="custom-child-info-wrapper"
      wrapperClass="custom-child-info-card"
      onClose={resetForm}
      title={'Add Your Own Info'}
      viewSelector={
        <ViewSelector
          defaultView={'General'}
          wrapperClasses="child-info"
          labels={['General', 'Medical', 'Schooling', 'Behavior']}
          updateState={(e) => setInfoSection(e.toLowerCase())}
        />
      }
      showCard={showCard}>
      <div className="form">
        <ShareWithCheckboxes onCheck={handleShareWithSelection} labelText="Share with" required={false} />

        {/* INFO TYPE */}
        <CheckboxGroup
          parentLabel="Type"
          required={true}
          checkboxArray={Manager.buildCheckboxGroup({
            currentUser,
            defaultLabels: ['Text'],
            customLabelArray: ['Text', 'Location', 'Date', 'Phone'],
          })}
          onCheck={handleInfoTypeSelection}
        />

        {/* INPUTS */}
        {infoType === 'text' && (
          <>
            <InputWrapper inputType={InputTypes.text} labelText={'Title/Label'} required={true} onChange={(e) => setTitle(e.target.value)} />
            <InputWrapper inputType={InputTypes.text} labelText={'Value'} required={true} onChange={(e) => setValue(e.target.value)} />
          </>
        )}

        {infoType === 'phone' && (
          <>
            <InputWrapper inputType={InputTypes.phone} labelText={'Title/Label'} required={true} onChange={(e) => setTitle(e.target.value)} />
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
            <InputWrapper inputType={InputTypes.text} labelText={'Title/Label'} required={true} onChange={(e) => setTitle(e.target.value)} />
            <InputWrapper
              labelText={'Date'}
              required={true}
              uidClass="child-info-custom-date"
              inputType={InputTypes.date}
              onDateOrTimeSelection={(e) => setValue(moment(e).format(DatetimeFormats.dateForDb))}
            />
          </div>
        )}

        {infoType === 'location' && (
          <>
            <InputWrapper inputType={InputTypes.text} labelText={'Title/Label'} required={true} onChange={(e) => setTitle(e.target.value)} />
            <InputWrapper
              inputType={InputTypes.address}
              labelText={'Address'}
              required={true}
              onChange={(address) => {
                setValue(address)
              }}
            />
          </>
        )}
      </div>
    </Modal>
  )
}
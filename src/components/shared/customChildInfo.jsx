// Path: src\components\shared\customChildInfo.jsx
import moment from 'moment'
import React, {useContext, useState} from 'react'
import {GrCheckmark} from 'react-icons/gr'
import validator from 'validator'
import DatetimeFormats from '../../constants/datetimeFormats'
import InputTypes from '../../constants/inputTypes'
import globalState from '../../context'
import DB_UserScoped from '../../database/db_userScoped'
import useCurrentUser from '../../hooks/useCurrentUser'
import AlertManager from '../../managers/alertManager'
import DomManager from '../../managers/domManager'
import Manager from '../../managers/manager'
import StringManager from '../../managers/stringManager'
import UpdateManager from '../../managers/updateManager.js'
import AddressInput from './addressInput'
import CheckboxGroup from './checkboxGroup'
import InputWrapper from './inputWrapper'
import Modal from './modal'
import ShareWithCheckboxes from './shareWithCheckboxes'
import Spacer from './spacer'
import ViewSelector from './viewSelector'

export default function CustomChildInfo({hideCard, showCard, activeChild}) {
  const {state, setState} = useContext(globalState)
  const {theme} = state
  const [title, setTitle] = useState('')
  const [value, setValue] = useState('')
  const [infoSection, setInfoSection] = useState('general')
  const [infoType, setInfoType] = useState('text')
  const [shareWith, setShareWith] = useState([])
  const {currentUser} = useCurrentUser()
  const Add = async () => {
    if (title.length === 0 || value.length === 0) {
      AlertManager.throwError('Please fill/select required fields')
      return false
    }
    if (infoType === 'phone' && !validator.isMobilePhone(value)) {
      AlertManager.throwError('Please enter a valid phone number')
      return false
    }

    await DB_UserScoped.addUserChildProp(currentUser, activeChild, infoSection, StringManager.toCamelCase(title), value, shareWith)

    if (Manager.IsValid(shareWith)) {
      await UpdateManager.sendToShareWith(
        shareWith,
        currentUser,
        `${StringManager.uppercaseFirstLetterOfAllWords(infoSection)} Info Updated for ${activeChild?.general?.name}`,
        `${title} - ${value}`,
        infoSection
      )
    }

    ResetForm(`${StringManager.uppercaseFirstLetterOfAllWords(infoSection)} Info Added`)
  }

  const HandleInfoTypeSelection = (e) => {
    DomManager.HandleCheckboxSelection(
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

  const HandleShareWithSelection = (e) => {
    const shareWithNumbers = DomManager.HandleShareWithSelection(e, currentUser, shareWith)
    setShareWith(shareWithNumbers)
  }

  const ResetForm = (successMessage = '') => {
    Manager.ResetForm('custom-child-info-wrapper')
    setTitle('')
    setValue('')
    setInfoSection('')
    hideCard()
    setState({...state, refreshKey: Manager.GetUid(), successAlertMessage: successMessage})
  }

  return (
    <Modal
      onSubmit={Add}
      submitText={'Done'}
      className="custom-child-info-wrapper"
      wrapperClass="custom-child-info-card"
      onClose={ResetForm}
      title={'Add Your Own Info'}
      submitIcon={<GrCheckmark />}
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
        <Spacer height={6} />

        {/* INFO TYPE */}
        <CheckboxGroup
          parentLabel="Information Type"
          required={true}
          checkboxArray={DomManager.BuildCheckboxGroup({
            currentUser,
            defaultLabels: ['Text'],
            customLabelArray: ['Text', 'Location', 'Date', 'Phone'],
          })}
          onCheck={HandleInfoTypeSelection}
        />
        <Spacer height={10} />

        {/* INPUTS */}
        {infoType === 'text' && (
          <>
            <InputWrapper inputType={InputTypes.text} placeholder={'Title/Label'} required={true} onChange={(e) => setTitle(e.target.value)} />
            <InputWrapper inputType={InputTypes.text} placeholder={'Value'} required={true} onChange={(e) => setValue(e.target.value)} />
          </>
        )}

        {infoType === 'phone' && (
          <>
            <InputWrapper inputType={InputTypes.text} placeholder={'Title/Label'} required={true} onChange={(e) => setTitle(e.target.value)} />
            <InputWrapper
              inputType={InputTypes.phone}
              placeholder={'Phone Number'}
              required={true}
              onChange={(e) => setValue(StringManager.FormatPhone(e.target.value))}
            />
          </>
        )}

        {infoType === 'date' && (
          <div className="w-100">
            <InputWrapper inputType={InputTypes.text} placeholder={'Title/Label'} required={true} onChange={(e) => setTitle(e.target.value)} />
            <InputWrapper
              placeholder={'Date'}
              required={true}
              uidClass="child-info-custom-date"
              inputType={InputTypes.date}
              onDateOrTimeSelection={(e) => setValue(moment(e).format(DatetimeFormats.dateForDb))}
            />
          </div>
        )}

        {infoType === 'location' && (
          <>
            <InputWrapper inputType={InputTypes.text} placeholder={'Title/Label'} required={true} onChange={(e) => setTitle(e.target.value)} />
            <AddressInput
              placeholder={'Address'}
              required={true}
              onChange={(address) => {
                setValue(address)
              }}
            />
          </>
        )}
        <Spacer height={6} />
        <ShareWithCheckboxes onCheck={HandleShareWithSelection} labelText="CONTACTS TO Share with" required={false} />
      </div>
    </Modal>
  )
}
// Path: src\components\shared\customChildInfo.jsx
import moment from 'moment'
import React, {useContext, useRef, useState} from 'react'
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
import UpdateManager from '../../managers/updateManager'
import AddressInput from './addressInput'
import CheckboxGroup from './checkboxGroup'
import Form from './form'
import InputField from './inputField'
import ShareWithDropdown from './shareWithDropdown'
import Spacer from './spacer'
import ViewSelector from './viewSelector'

export default function CustomChildInfo({hideCard, showCard, activeChild}) {
  const {state, setState} = useContext(globalState)
  const {theme} = state
  const [infoSection, setInfoSection] = useState('general')
  const [infoType, setInfoType] = useState('text')
  const {currentUser} = useCurrentUser()
  const info = useRef({title: '', value: '', shareWith: ''})

  const Add = async () => {
    if (info.current.title.length === 0 || info.current.value.length === 0) {
      AlertManager.throwError('Please fill/select required fields')
      return false
    }
    if (infoType === 'phone' && !validator.isMobilePhone(info.current.value)) {
      AlertManager.throwError('Please enter a valid phone number')
      return false
    }

    await DB_UserScoped.addUserChildProp(
      currentUser,
      activeChild,
      infoSection,
      StringManager.toCamelCase(info.current.title),
      info.current.value,
      info.current.shareWith
    )

    if (Manager.IsValid(info.current.shareWith)) {
      await UpdateManager.SendToShareWith(
        info.current.shareWith,
        currentUser,
        `${StringManager.uppercaseFirstLetterOfAllWords(infoSection)} Info Updated for ${activeChild?.general?.name}`,
        `${info.current.title} - ${info.current.value}`,
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
    info.current.shareWith = DomManager.HandleShareWithSelection(e, currentUser, info.current.shareWith, info)
  }

  const ResetForm = (successMessage = '') => {
    Manager.ResetForm('custom-child-info-wrapper')
    setInfoSection('')
    hideCard()
    setState({...state, refreshKey: Manager.GetUid(), successAlertMessage: successMessage})
  }

  return (
    <Form
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
          <InputField
            inputType={InputTypes.text}
            placeholder={'Title/Label'}
            required={true}
            onChange={(e) => (info.current.title = e.target.value)}
          />
          <InputField inputType={InputTypes.text} placeholder={'Value'} required={true} onChange={(e) => (info.current.value = e.target.value)} />
        </>
      )}

      {infoType === 'phone' && (
        <>
          <InputField
            inputType={InputTypes.text}
            placeholder={'Title/Label'}
            required={true}
            onChange={(e) => (info.current.title = e.target.value)}
          />
          <InputField
            inputType={InputTypes.phone}
            placeholder={'Phone Number'}
            required={true}
            onChange={(e) => (info.current.value = StringManager.FormatPhone(e.target.value))}
          />
        </>
      )}

      {infoType === 'date' && (
        <div className="w-100">
          <InputField
            inputType={InputTypes.text}
            placeholder={'Title/Label'}
            required={true}
            onChange={(e) => (info.current.title = e.target.value)}
          />
          <InputField
            placeholder={'Date'}
            required={true}
            uidClass="child-info-custom-date"
            inputType={InputTypes.date}
            onDateOrTimeSelection={(e) => (info.current.value = moment(e).format(DatetimeFormats.dateForDb))}
          />
        </div>
      )}

      {infoType === 'location' && (
        <>
          <InputField
            inputType={InputTypes.text}
            placeholder={'Title/Label'}
            required={true}
            onChange={(e) => (info.current.title = e.target.value)}
          />
          <AddressInput
            placeholder={'Address'}
            required={true}
            onChange={(address) => {
              info.current.value = address
            }}
          />
        </>
      )}
      <Spacer height={6} />
      <ShareWithDropdown onCheck={HandleShareWithSelection} labelText="CONTACTS TO Share with" required={false} />
    </Form>
  )
}
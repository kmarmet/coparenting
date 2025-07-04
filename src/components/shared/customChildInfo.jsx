// Path: src\components\shared\customChildInfo.jsx
import moment from 'moment'
import React, {useContext, useEffect, useRef, useState} from 'react'
import {GrCheckmark} from 'react-icons/gr'
import validator from 'validator'
import DatetimeFormats from '../../constants/datetimeFormats'
import InputTypes from '../../constants/inputTypes'
import globalState from '../../context'
import DB_UserScoped from '../../database/db_userScoped'
import useChildren from '../../hooks/useChildren'
import useCoParents from '../../hooks/useCoParents'
import useCurrentUser from '../../hooks/useCurrentUser'
import useUsers from '../../hooks/useUsers'
import AlertManager from '../../managers/alertManager'
import DropdownManager from '../../managers/dropdownManager'
import Manager from '../../managers/manager'
import StringManager from '../../managers/stringManager'
import UpdateManager from '../../managers/updateManager'
import AddressInput from './addressInput'
import Form from './form'
import FormDivider from './formDivider'
import InputField from './inputField'
import SelectDropdown from './selectDropdown'
import Spacer from './spacer'

export default function CustomChildInfo({hideCard, showCard, activeChild}) {
  const {state, setState} = useContext(globalState)
  const {theme} = state

  // STATE
  const [infoSection, setInfoSection] = useState('general')
  const [infoType, setInfoType] = useState('text')
  const [view, setView] = useState({label: 'Details', value: 'Details'})

  // HOOKS
  const {currentUser} = useCurrentUser()
  const {users} = useUsers()
  const {children} = useChildren()
  const {coParents} = useCoParents()

  // DROPDOWN STATE
  const [selectedInfoType, setSelectedInfoType] = useState([
    {label: 'Text', value: 'text'},
    {label: 'Phone', value: 'phone'},
    {label: 'Location', value: 'location'},
    {label: 'Email', value: 'email'},
  ])
  const [selectedChildrenOptions, setSelectedChildrenOptions] = useState([])
  const [selectedShareWithOptions, setSelectedShareWithOptions] = useState(DropdownManager.GetSelected.ShareWithFromKeys(event?.shareWith, users))
  const [defaultShareWithOptions, setDefaultShareWithOptions] = useState([])

  // Form Ref
  const formRef = useRef({title: '', value: '', shareWith: ''})

  const Add = async () => {
    if (formRef.current.title.length === 0 || formRef.current.value.length === 0) {
      AlertManager.throwError('Please fill/select required fields')
      return false
    }
    if (infoType === 'phone' && !validator.isMobilePhone(formRef.current.value)) {
      AlertManager.throwError('Please enter a valid phone number')
      return false
    }

    const shareWith = DropdownManager.MappedForDatabase.ShareWithFromArray(selectedShareWithOptions)

    await DB_UserScoped.addUserChildProp(
      currentUser,
      activeChild,
      infoSection,
      StringManager.toCamelCase(formRef.current.title),
      formRef.current.value,
      shareWith
    )

    if (Manager.IsValid(shareWith)) {
      await UpdateManager.SendToShareWith(
        shareWith,
        currentUser,
        `${StringManager.UppercaseFirstLetterOfAllWords(infoSection)} Info Updated for ${activeChild?.general?.name}`,
        `${formRef.current.title} - ${formRef.current.value}`,
        infoSection
      )
    }

    ResetForm(`${StringManager.UppercaseFirstLetterOfAllWords(infoSection)} Info Added`)
  }

  const ResetForm = (successMessage = '') => {
    Manager.ResetForm('custom-child-info-wrapper')
    setInfoSection('')
    hideCard()
    setState({...state, refreshKey: Manager.GetUid(), successAlertMessage: successMessage})
  }

  const SetDefaultDropdownOptions = () => {
    setSelectedShareWithOptions(DropdownManager.GetSelected.ShareWithFromKeys([], users))
    setDefaultShareWithOptions(DropdownManager.GetDefault.ShareWith([], coParents))
    setView({label: 'Single Day', value: 'Single Day'})
  }

  useEffect(() => {
    if (Manager.IsValid(children) || Manager.IsValid(users)) {
      SetDefaultDropdownOptions()
    }
  }, [children, coParents])

  useEffect(() => {
    if (showCard) {
      setSelectedShareWithOptions(DropdownManager.GetSelected.ShareWithFromKeys([], users))
    }
  }, [showCard])

  return (
    <Form
      onSubmit={Add}
      submitText={'Done'}
      className="custom-child-info-wrapper"
      wrapperClass="custom-child-info-card"
      onClose={() => ResetForm()}
      title={'Add Your Own Info'}
      submitIcon={<GrCheckmark />}
      showCard={showCard}>
      {/* INFO TYPE */}
      <FormDivider text={'Required'} />

      {/* INFO TYPE */}
      <SelectDropdown options={selectedInfoType} placeholder={'Select Information Type'} onSelect={setSelectedInfoType} />

      <Spacer height={3} />

      {/* INPUTS */}

      {infoType === 'text' && (
        <>
          {/* TEXT */}
          <InputField
            inputType={InputTypes.text}
            placeholder={'Title/Label'}
            required={true}
            onChange={(e) => (formRef.current.title = e.target.value)}
          />
          <Spacer height={3} />
          {/* VALUE */}
          <InputField inputType={InputTypes.text} placeholder={'Value'} required={true} onChange={(e) => (formRef.current.value = e.target.value)} />
        </>
      )}

      <Spacer height={3} />

      {/* PHONE */}
      {infoType === 'phone' && (
        <>
          <InputField
            inputType={InputTypes.text}
            placeholder={'Title/Label'}
            required={true}
            onChange={(e) => (formRef.current.title = e.target.value)}
          />
          <Spacer height={3} />
          <InputField
            inputType={InputTypes.phone}
            placeholder={'Phone Number'}
            required={true}
            onChange={(e) => (formRef.current.value = StringManager.FormatPhone(e.target.value))}
          />
        </>
      )}

      {infoType === 'date' && (
        <div className="w-100">
          <InputField
            inputType={InputTypes.text}
            placeholder={'Title/Label'}
            required={true}
            onChange={(e) => (formRef.current.title = e.target.value)}
          />
          <Spacer height={3} />
          <InputField
            placeholder={'Date'}
            required={true}
            uidClass="child-info-custom-date"
            inputType={InputTypes.date}
            onDateOrTimeSelection={(e) => (formRef.current.value = moment(e).format(DatetimeFormats.dateForDb))}
          />
        </div>
      )}

      {infoType === 'location' && (
        <>
          <InputField
            inputType={InputTypes.text}
            placeholder={'Title/Label'}
            required={true}
            onChange={(e) => (formRef.current.title = e.target.value)}
          />
          <Spacer height={3} />
          <AddressInput
            placeholder={'Address'}
            required={true}
            onChange={(address) => {
              formRef.current.value = address
            }}
          />
        </>
      )}

      <FormDivider text={'Optional'} />

      {/* SHARE WITH */}
      <SelectDropdown
        options={defaultShareWithOptions}
        selectMultiple={true}
        value={selectedShareWithOptions}
        placeholder={'Select Contacts to Share With'}
        onSelect={setSelectedShareWithOptions}
      />
    </Form>
  )
}
// Path: src\components\screens\childInfo\newChildForm.jsx
import moment from 'moment'
import React, {useContext, useRef, useState} from 'react'
import DatetimeFormats from '../../../constants/datetimeFormats'
import InputTypes from '../../../constants/inputTypes'
import globalState from '../../../context'
import DB_UserScoped from '../../../database/db_userScoped'
import FirebaseStorage from '../../../database/firebaseStorage'
import useCurrentUser from '../../../hooks/useCurrentUser'
import useUsers from '../../../hooks/useUsers'
import AlertManager from '../../../managers/alertManager'
import CalendarManager from '../../../managers/calendarManager'
import ImageManager from '../../../managers/imageManager'
import Manager from '../../../managers/manager'
import ObjectManager from '../../../managers/objectManager'
import StringManager from '../../../managers/stringManager.js'
import CalendarEvent from '../../../models/calendarEvent'
import Child from '../../../models/child/child'
import ModelNames from '../../../models/modelNames'
import AddressInput from '../../shared/addressInput'
import Form from '../../shared/form'
import InputWrapper from '../../shared/inputWrapper'
import Label from '../../shared/label'
import Spacer from '../../shared/spacer'
import ToggleButton from '../../shared/toggleButton'
import UploadInputs from '../../shared/uploadInputs'

const NewChildForm = ({hideCard, showCard}) => {
  const {state, setState} = useContext(globalState)
  const {theme} = state
  const {currentUser} = useCurrentUser()
  const {users} = useUsers()

  // State
  const [childHasAccount, setChildHasAccount] = useState(false)

  const newChild = useRef(new Child())

  const ResetForm = async (successMessage = '') => {
    Manager.ResetForm('new-child-wrapper')
    hideCard()
    setChildHasAccount(false)
    setState({...state, refreshKey: Manager.GetUid(), successAlertMessage: successMessage})
  }

  const Submit = async () => {
    console.log(newChild)
    const errorString = Manager.GetInvalidInputsErrorString([{name: "Child's Name", value: newChild.current.general.name}])

    if (Manager.IsValid(errorString, true)) {
      AlertManager.throwError(errorString)
      return false
    }

    if (childHasAccount && !Manager.IsValid(newChild.current.general.email)) {
      AlertManager.throwError('If the child has an account with us, their email is required')
      return false
    }
    let _profilePic = newChild.current.general.profilePic
    newChild.current.general.profilePic = ''

    if (childHasAccount) {
      newChild.current.userKey = Manager.GetUid()
    }

    const existingChildRecord = users.find((x) => x?.email === newChild.current.general.email)

    // Link to existing account
    if (Manager.IsValid(existingChildRecord) || childHasAccount || !ObjectManager.isEmpty(existingChildRecord)) {
      newChild.userKey = existingChildRecord.key
      await DB_UserScoped.addSharedDataUser(currentUser, existingChildRecord.key)
    } else {
      await DB_UserScoped.addSharedDataUser(currentUser, newChild.userKey)
    }

    // Add profile pic
    if (Manager.IsValid(_profilePic)) {
      _profilePic = await ImageManager.compressImage(newChild.current.general.profilePic)
      if (Manager.IsValid(_profilePic)) {
        await FirebaseStorage.upload(
          FirebaseStorage.directories.profilePics,
          `${currentUser?.key}/${newChild.current.id}`,
          _profilePic,
          'profilePic'
        ).then(async (url) => {
          if (!Manager.IsValid(url)) {
            return false
          }
          newChild.current.general.profilePic = url
        })
      }
    }

    // Get valid objected
    const cleanChild = ObjectManager.GetModelValidatedObject(newChild.current, ModelNames.child)

    // Add Child's Birthday to Calendar
    if (Manager.IsValid(newChild.current.general.dateOfBirth, true)) {
      const childBirthdayEvent = new CalendarEvent()
      childBirthdayEvent.title = `${cleanChild.general.name}'s Birthday`
      childBirthdayEvent.startDate = cleanChild.general.dateOfBirth
      childBirthdayEvent.ownerKey = currentUser.key
      await CalendarManager.addCalendarEvent(currentUser, childBirthdayEvent)
    }

    // Add child to DB
    await DB_UserScoped.AddChildToParentProfile(currentUser, cleanChild)

    await ResetForm(`${StringManager.GetFirstNameOnly(StringManager.FormatTitle(name, true))} Added to Your Profile`)
  }

  return (
    <Form
      submitText={`Add ${name.length > 0 ? name : 'Child'}`}
      onSubmit={Submit}
      className="new-child-wrapper"
      wrapperClass="new-child-card"
      title={`Create ${name.length > 0 ? StringManager.GetFirstNameOnly(name) : 'Child'} Contact`}
      showCard={showCard}
      onClose={ResetForm}>
      <div id="new-child-container" className={`${theme}  form`}>
        <Spacer height={5} />
        <div className="form new-child-form">
          {/* NAME */}
          <InputWrapper
            placeholder={'Name'}
            inputType={InputTypes.text}
            required={true}
            onChange={(e) => (newChild.current.general.name = StringManager.FormatTitle(e.target.value, true))}
          />

          {/* EMAIL */}
          <InputWrapper
            placeholder={'Email Address'}
            required={childHasAccount}
            inputType={InputTypes.email}
            onChange={(e) => (newChild.current.general.email = e.target.value)}
          />

          {/* DATE OF BIRTH */}
          <InputWrapper
            dateFormat={'MM/DD/YYYY'}
            placeholder={'Date of Birth'}
            dateViews={['year', 'month', 'day']}
            inputType={InputTypes.date}
            onDateOrTimeSelection={(e) => (newChild.current.general.dateOfBirth = moment(e).format(DatetimeFormats.monthDayYear))}
          />

          {/* ADDRESS */}
          <AddressInput placeholder={'Home Address'} onChange={(address) => (newChild.current.general.address = address)} />

          {/* PHONE NUMBER */}
          <InputWrapper
            placeholder={'Phone Number'}
            inputType={InputTypes.phone}
            required={false}
            onChange={(e) => (newChild.current.general.phone = e.target.value)}
          />

          {/* SHOULD LINK CHILD TOGGLE */}
          <div className="flex">
            <Label text={'Child has an Account with Us'} />
            <ToggleButton onCheck={() => setChildHasAccount(true)} onUncheck={() => setChildHasAccount(false)} />
          </div>

          <Spacer height={5} />

          <Label classes="standalone-label-wrapper" text={'Photo'} />
          {/* UPLOAD BUTTON */}
          <UploadInputs
            onClose={hideCard}
            containerClass={`${theme} new-child-card`}
            uploadType={'image'}
            actualUploadButtonText={'Upload'}
            getImages={(files) => {
              newChild.current.general.profilePic = files[0]
            }}
            uploadButtonText={`Choose`}
            upload={() => {}}
          />
        </div>
      </div>
    </Form>
  )
}

export default NewChildForm
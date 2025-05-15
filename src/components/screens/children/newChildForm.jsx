// Path: src\components\screens\childInfo\newChildForm.jsx
import moment from 'moment'
import React, {useContext, useState} from 'react'
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
import General from '../../../models/child/general'
import ModelNames from '../../../models/modelNames'
import AddressInput from '../../shared/addressInput'
import InputWrapper from '../../shared/inputWrapper'
import Label from '../../shared/label'
import Modal from '../../shared/modal'
import Spacer from '../../shared/spacer'
import ToggleButton from '../../shared/toggleButton'
import UploadInputs from '../../shared/uploadInputs'

const NewChildForm = ({hideCard, showCard}) => {
  const {state, setState} = useContext(globalState)
  const {theme} = state
  const {currentUser} = useCurrentUser()
  const {users} = useUsers()
  const [email, setEmail] = useState(false)
  // State
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [profilePic, setProfilePic] = useState(null)
  const [childHasAccount, setChildHasAccount] = useState(false)

  const ResetForm = async (successMessage = '') => {
    Manager.ResetForm('new-child-wrapper')
    hideCard()
    setDateOfBirth('')
    setProfilePic(null)
    setPhoneNumber('')
    setChildHasAccount(false)
    setAddress('')
    setName('')
    setState({...state, refreshKey: Manager.GetUid(), successAlertMessage: successMessage})
  }

  const Submit = async () => {
    const errorString = Manager.GetInvalidInputsErrorString([{name: "Child's Name", value: name}])

    if (Manager.IsValid(errorString, true)) {
      AlertManager.throwError(errorString)
      return false
    }

    if (childHasAccount && !Manager.IsValid(email)) {
      AlertManager.throwError('If the child has an account with us, their email is required')
      return false
    }
    let _profilePic = profilePic
    const newChild = new Child()
    const general = new General()
    general.address = address
    general.phone = phoneNumber
    general.name = StringManager.FormatTitle(name, true)
    general.dateOfBirth = dateOfBirth
    newChild.general = general
    newChild.general.profilePic = ''
    newChild.userKey = Manager.GetUid()
    const existingChildRecord = users.find((x) => x?.email === email)

    // Link to existing account
    if (Manager.IsValid(existingChildRecord) || childHasAccount || !ObjectManager.isEmpty(existingChildRecord)) {
      newChild.userKey = existingChildRecord.key
      await DB_UserScoped.addSharedDataUser(currentUser, existingChildRecord.key)
    } else {
      await DB_UserScoped.addSharedDataUser(currentUser, newChild.userKey)
    }

    // Add profile pic
    if (Manager.IsValid(_profilePic)) {
      _profilePic = await ImageManager.compressImage(profilePic)
      await FirebaseStorage.upload(
        FirebaseStorage.directories.profilePics,
        `${currentUser?.key}/${StringManager.GetFirstNameOnly(name)}`,
        _profilePic,
        'profilePic'
      ).then(async (url) => {
        newChild.general.profilePic = url
      })
    }
    const cleanChild = ObjectManager.GetModelValidatedObject(newChild, ModelNames.child)

    // Add Child's Birthday to Calendar
    if (Manager.IsValid(dateOfBirth, true)) {
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
    <Modal
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
          <InputWrapper labelText={'Name'} inputType={InputTypes.text} required={true} onChange={(e) => setName(e.target.value)} />

          {/* EMAIL */}
          <InputWrapper
            labelText={'Email Address'}
            required={childHasAccount}
            inputType={InputTypes.email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* DATE OF BIRTH */}
          <InputWrapper
            dateFormat={'MM/DD/YYYY'}
            labelText={'Date of Birth'}
            dateViews={['year', 'month', 'day']}
            inputType={InputTypes.date}
            onDateOrTimeSelection={(e) => setDateOfBirth(moment(e).format('MM/DD/YYYY'))}
          />

          {/* ADDRESS */}
          <AddressInput labelText={'Home Address'} onChange={(address) => setAddress(address)} />

          {/* PHONE NUMBER */}
          <InputWrapper labelText={'Phone Number'} inputType={InputTypes.phone} required={false} onChange={(e) => setPhoneNumber(e.target.value)} />

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
              setProfilePic(files[0])
            }}
            uploadButtonText={`Choose`}
            upload={() => {}}
          />
        </div>
      </div>
    </Modal>
  )
}

export default NewChildForm
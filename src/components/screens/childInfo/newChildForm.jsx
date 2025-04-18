// Path: src\components\screens\childInfo\newChildForm.jsx
import moment from 'moment'
import React, {useContext, useState} from 'react'
import globalState from '../../../context'
import Manager from '../../../managers/manager'
import General from '../../../models/child/general'
import Child from '../../../models/child/child'
import CheckboxGroup from '../../../components/shared/checkboxGroup'
import DB_UserScoped from '../../../database/db_userScoped'
import ModelNames from '../../../models/modelNames'
import InputWrapper from '../../shared/inputWrapper'
import Modal from '../../shared/modal'
import ObjectManager from '../../../managers/objectManager'
import UploadInputs from '../../shared/uploadInputs'
import ImageManager from '../../../managers/imageManager'
import FirebaseStorage from '../../../database/firebaseStorage'
import Label from '../../shared/label'
import StringManager from '../../../managers/stringManager.js'
import CalendarManager from '../../../managers/calendarManager'
import CalendarEvent from '../../../models/calendarEvent'
import InputTypes from '../../../constants/inputTypes'
import Spacer from '../../shared/spacer'
import ViewSelector from '../../shared/viewSelector'
import AlertManager from '../../../managers/alertManager'
import DB from '../../../database/DB'

const NewChildForm = ({hideCard, showCard}) => {
  const {state, setState} = useContext(globalState)
  const {currentUser, theme, authUser, refreshKey} = state
  const [linkOrNew, setLinkOrNew] = useState('new')
  const [email, setEmail] = useState(false)
  // State
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [gender, setGender] = useState('male')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [profilePic, setProfilePic] = useState(null)

  const ResetForm = async (successMessage = '') => {
    Manager.ResetForm('new-child-wrapper')
    hideCard()
    setGender('male')
    setDateOfBirth('')
    setProfilePic(null)
    setPhoneNumber('')
    setAddress('')
    setName('')
    setState({...state, refreshKey: Manager.getUid(), successAlertMessage: successMessage})
  }

  const Submit = async () => {
    const errorString = Manager.GetInvalidInputsErrorString([
      {name: 'Name', value: name},
      {name: 'Date of Birth', value: dateOfBirth},
    ])

    if (Manager.isValid(errorString, true)) {
      AlertManager.throwError(errorString)
      return false
    }
    let _profilePic = profilePic
    const newChild = new Child()
    const general = new General()
    general.address = address
    general.phone = phoneNumber
    general.name = StringManager.formatTitle(name, true)
    general.gender = gender
    general.dateOfBirth = dateOfBirth
    newChild.general = general
    newChild.general.profilePic = ''

    const users = await DB.getTable(DB.tables.users)
    const existingChildRecord = users.find((x) => x.email === email)

    // Link to existing account
    if (Manager.isValid(existingChildRecord)) {
      newChild.userKey = existingChildRecord.key
    }

    // Add profile pic
    if (Manager.isValid(_profilePic)) {
      _profilePic = await ImageManager.compressImage(profilePic)
      await FirebaseStorage.upload(
        FirebaseStorage.directories.profilePics,
        `${currentUser?.key}/${StringManager.getFirstNameOnly(name)}`,
        _profilePic,
        'profilePic'
      ).then(async (url) => {
        newChild.general.profilePic = url
      })
    }
    const cleanChild = ObjectManager.cleanObject(newChild, ModelNames.child)

    // Add Child's Birthday to Calendar
    const childBirthdayEvent = new CalendarEvent()
    childBirthdayEvent.title = `${cleanChild.general.name}'s Birthday`
    childBirthdayEvent.startDate = cleanChild.general.dateOfBirth
    childBirthdayEvent.ownerKey = currentUser.key
    await CalendarManager.addCalendarEvent(currentUser, childBirthdayEvent)

    // Add child to DB
    await DB_UserScoped.addUserChild(currentUser, cleanChild)

    await ResetForm(
      `${StringManager.getFirstNameOnly(StringManager.formatTitle(name, true))}${linkOrNew === 'link' ? ' Linked' : ' Added'} to Your Profile`
    )
  }

  const HandleGenderSelection = (e) => {
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        setGender(e)
      },
      () => {}
    )
  }

  return (
    <Modal
      submitText={`${linkOrNew === 'link' ? 'Link' : 'Add'} ${name.length > 0 ? name : 'Child'}`}
      onSubmit={Submit}
      className="new-child-wrapper"
      wrapperClass="new-child-card"
      title={`${linkOrNew === 'link' ? 'Link' : 'Add'} ${name.length > 0 ? StringManager.getFirstNameOnly(name) : 'Child'} to Your Profile`}
      showCard={showCard}
      viewSelector={
        <ViewSelector
          defaultView={'New'}
          labels={['New', 'Link Existing Account']}
          updateState={(labelText) => {
            if (Manager.contains(labelText, 'New')) {
              setLinkOrNew('new')
            } else {
              setLinkOrNew('link')
            }
          }}
        />
      }
      onClose={ResetForm}>
      <div id="new-child-container" className={`${theme}  form`}>
        <Spacer height={5} />
        <div className="form new-child-form">
          {/* NAME */}
          <InputWrapper labelText={'Name'} inputType={InputTypes.text} required={true} onChange={(e) => setName(e.target.value)} />

          {/* EMAIL */}
          {linkOrNew === 'link' && (
            <InputWrapper labelText={'Email Address'} inputType={InputTypes.email} required={true} onChange={(e) => setEmail(e.target.value)} />
          )}

          {/* DATE OF BIRTH */}
          <InputWrapper
            dateFormat={'MM/DD/YYYY'}
            labelText={'Date of Birth'}
            required={true}
            dateViews={['month', 'day', 'year']}
            inputType={InputTypes.date}
            onDateOrTimeSelection={(e) => setDateOfBirth(moment(e).format('MM/DD/YYYY'))}
          />

          {/* ADDRESS */}
          <InputWrapper labelText={'Home Address'} inputType={InputTypes.address} onChange={(address) => setAddress(address)} />

          {/* PHONE NUMBER */}
          <InputWrapper labelText={'Phone Number'} inputType={InputTypes.phone} required={false} onChange={(e) => setPhoneNumber(e.target.value)} />

          {/* GENDER */}
          <CheckboxGroup
            parentLabel={'Gender'}
            required={true}
            checkboxArray={Manager.buildCheckboxGroup({
              currentUser,
              customLabelArray: ['Male', 'Female'],
            })}
            onCheck={HandleGenderSelection}
          />
          <Label classes="standalone-label-wrapper" text={'Photo'}></Label>

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
// Path: src\components\screens\childInfo\newChildForm.jsx
import moment from 'moment'
import React, { useContext, useEffect, useRef, useState } from 'react'
import DB from '../../../database/DB'
import globalState from '../../../context'
import Manager from '../../../managers/manager'
import General from '../../../models/child/general'
import Child from '../../../models/child/child'
import CheckboxGroup from '../../../components/shared/checkboxGroup'
import { BsGenderAmbiguous } from 'react-icons/bs'
import DB_UserScoped from '../../../database/db_userScoped'
import { MobileDatePicker } from '@mui/x-date-pickers-pro'
import ModelNames from '../../../models/modelNames'
import InputWrapper from '../../shared/inputWrapper'
import Modal from '../../shared/modal'
import ObjectManager from '../../../managers/objectManager'
import AlertManager from '../../../managers/alertManager'
import UploadInputs from '../../shared/uploadInputs'
import ImageManager from '../../../managers/imageManager'
import FirebaseStorage from '../../../database/firebaseStorage'
import Label from '../../shared/label'
import Spacer from '../../shared/spacer'
import DomManager from '../../../managers/domManager.js'
import AddressInput from '/src/components/shared/addressInput.jsx'
import StringManager from '../../../managers/stringManager.js'
import CalendarManager from '../../../managers/calendarManager'
import CalendarEvent from '../../../models/calendarEvent'
import { FaChildren } from 'react-icons/fa6'
import { BsCameraFill } from 'react-icons/bs'
const NewChildForm = ({ hideCard, showCard }) => {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, authUser, refreshKey } = state

  // State
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [gender, setGender] = useState('male')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [profilePic, setProfilePic] = useState(null)

  const resetForm = async () => {
    Manager.resetForm('new-child-wrapper')
    hideCard()
    setGender('male')
    setDateOfBirth('')
    const updatedCurrentUser = await DB_UserScoped.getCurrentUser(authUser?.email)
    setState({ ...state, currentUser: updatedCurrentUser, refreshKey: Manager.getUid() })
  }

  const submit = async () => {
    if (Manager.invalidInputs([name, dateOfBirth]).length > 0) {
      AlertManager.throwError('Please fill out required fields')
      return false
    } else {
      let _profilePic = profilePic
      const newChild = new Child()
      const general = new General()
      general.address = address
      general.phone = phoneNumber
      general.name = name
      general.gender = gender
      general.dateOfBirth = dateOfBirth
      newChild.general = general
      newChild.general.profilePic = ''

      AlertManager.successAlert(`${StringManager.getFirstNameOnly(name)} Added!`)

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

      const childBirthdayEvent = new CalendarEvent()
      childBirthdayEvent.title = `${cleanChild.general.name}'s Birthday 🎂`
      childBirthdayEvent.startDate = cleanChild.general.dateOfBirth
      childBirthdayEvent.ownerKey = currentUser.key
      console.log(childBirthdayEvent)
      await CalendarManager.addCalendarEvent(currentUser, childBirthdayEvent)

      // Add child to DB
      await DB_UserScoped.addUserChild(currentUser, cleanChild)

      await resetForm()
    }
  }

  const getExistingChildren = async () => {
    await DB_UserScoped.getCurrentUserRecords(DB.tables.users, currentUser, theme, 'children')
  }

  const handleGenderSelect = (e) => {
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        setGender(e)
      },
      () => {}
    )
  }

  useEffect(() => {
    getExistingChildren().then((r) => r)
  }, [])

  return (
    <Modal
      submitText={`Add ${name.length > 0 ? name : 'Child'}`}
      onSubmit={submit}
      className="new-child-wrapper"
      wrapperClass="new-child-card"
      title={`Add ${name.length > 0 ? name : 'Child'}`}
      showCard={showCard}
      onClose={resetForm}>
      <div id="new-child-container" className={`${theme}  form`}>
        <div className="form new-child-form">
          {/* NAME */}
          <InputWrapper labelText={'Name'} required={true} onChange={(e) => setName(e.target.value)} />
          <InputWrapper labelText={'Phone Number'} required={false} onChange={(e) => setPhoneNumber(e.target.value)} />
          {!DomManager.isMobile() && (
            <InputWrapper labelText={'Date of Birth'} required={true} inputType={'date'}>
              <MobileDatePicker className="mt-0 w-100 event-from-date mui-input" onAccept={(e) => setDateOfBirth(moment(e).format('MM/DD/YYYY'))} />
            </InputWrapper>
          )}
          {DomManager.isMobile() && (
            <InputWrapper
              useNativeDate={true}
              labelText={'Date of Birth'}
              required={true}
              inputType={'date'}
              onChange={(e) => setDateOfBirth(moment(e).format('MM/DD/YYYY'))}
            />
          )}
          <InputWrapper labelText={'Home Address'} required={true} inputType={'location'}>
            <AddressInput
              onSelection={(place) => {
                setAddress(place)
              }}
            />
          </InputWrapper>

          {/* GENDER */}
          <CheckboxGroup
            parentLabel={'Gender'}
            required={true}
            icon={<FaChildren />}
            checkboxArray={Manager.buildCheckboxGroup({
              currentUser,
              customLabelArray: ['Male', 'Female'],
            })}
            onCheck={handleGenderSelect}
          />
          <Spacer height={5} />
          <Label classes="standalone-label-wrapper" text={'Photo'} icon={<BsCameraFill />}></Label>

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
import moment from 'moment'
import React, { useContext, useEffect, useRef, useState } from 'react'
import DB from '@db'
import globalState from '../../../context'
import Manager from '@manager'
import Autocomplete from 'react-google-autocomplete'
import General from '@models/child/general'
import Child from '@models/child/child'
import CheckboxGroup from '@shared/checkboxGroup'
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
} from '../../../globalFunctions'
import ModelNames from '../../../models/modelNames'
import InputWrapper from '../../shared/inputWrapper'
import BottomCard from '../../shared/bottomCard'
import ObjectManager from '../../../managers/objectManager'
import AlertManager from '../../../managers/alertManager'
import UploadInputs from '../../shared/uploadInputs'
import ImageManager from '../../../managers/imageManager'
import FirebaseStorage from '@firebaseStorage'
import Label from '../../shared/label'

const NewChildForm = ({ hideCard, showCard }) => {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state

  // State
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [existingChildren, setExistingChildren] = useState([])
  const [gender, setGender] = useState('male')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [refreshKey, setRefreshKey] = useState(Manager.getUid())
  const [profilePic, setProfilePic] = useState(null)
  const inputFile = useRef(null)

  const resetForm = async () => {
    Manager.resetForm('new-child-wrapper')
    hideCard()
    setExistingChildren([])
    setGender('male')
    setDateOfBirth('')
    const updatedCurrentUser = await DB_UserScoped.getCurrentUser(currentUser.phone)
    setState({ ...state, currentUser: updatedCurrentUser })
    setRefreshKey(Manager.getUid())
  }

  const submit = async () => {
    if (Manager.invalidInputs([name, dateOfBirth]).length > 0) {
      AlertManager.throwError('Please fill out required fields')
      return false
    } else {
      const id = Manager.getUid()
      const _profilePic = await ImageManager.compressImage(profilePic)
      const newChild = new Child()
      const general = new General()
      newChild.id = id
      general.address = address
      general.phone = phoneNumber
      general.name = name
      general.gender = gender
      general.dateOfBirth = dateOfBirth
      newChild.general = general
      newChild.general.profilePic = ''

      AlertManager.successAlert(`${formatNameFirstNameOnly(name)} Added!`)

      // Add profile pic
      if (Manager.isValid(_profilePic)) {
        await FirebaseStorage.upload(FirebaseStorage.directories.profilePics, `${currentUser?.id}/${id}`, _profilePic, 'profilePic').then(
          async (url) => {
            newChild.general.profilePic = url
          }
        )
      }
      const cleanChild = ObjectManager.cleanObject(newChild, ModelNames.child)

      // Add child to DB
      await DB_UserScoped.addUserChild(currentUser, cleanChild)

      await resetForm()
    }
  }

  const getExistingChildren = async () => {
    await DB_UserScoped.getCurrentUserRecords(DB.tables.users, currentUser, theme, 'children').then((children) => {
      setExistingChildren(children)
    })
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
    <BottomCard
      refreshKey={refreshKey}
      submitText={`Add ${name.length > 0 ? name : 'Child'}`}
      onSubmit={submit}
      className="new-child-wrapper"
      wrapperClass="new-child-card"
      title={'Add Child'}
      showCard={showCard}
      onClose={resetForm}>
      <div id="new-child-container" className={`${theme}  form`}>
        <div className="form new-child-form">
          {/* NAME */}
          <InputWrapper labelText={'Name'} required={true} onChange={(e) => setName(e.target.value)} />
          <InputWrapper labelText={'Phone Number'} required={false} onChange={(e) => setPhoneNumber(e.target.value)} />
          <InputWrapper labelText={'Date of Birth'} required={true} inputType={'date'}>
            <MobileDatePicker className="mt-0 w-100 event-from-date mui-input" onAccept={(e) => setDateOfBirth(moment(e).format('MM/DD/YYYY'))} />
          </InputWrapper>
          <InputWrapper labelText={'Home Address'} required={true} inputType={'location'}>
            <Autocomplete
              apiKey={process.env.REACT_APP_AUTOCOMPLETE_ADDRESS_API_KEY}
              options={{
                types: ['geocode', 'establishment'],
                componentRestrictions: { country: 'usa' },
              }}
              placeholder={'Home Address'}
              onPlaceSelected={(place) => {
                setAddress(place.formatted_address)
              }}
            />
          </InputWrapper>

          {/* GENDER */}
          <CheckboxGroup parentLabel={'Gender'} required={true} checkboxLabels={['Male', 'Female']} onCheck={handleGenderSelect} />

          <Label text={'Image of Child'}></Label>

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
    </BottomCard>
  )
}

export default NewChildForm
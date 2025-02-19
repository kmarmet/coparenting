// Path: src\components\screens\coparents\newCoparentForm.jsx
import React, { useContext, useState } from 'react'
import Autocomplete from 'react-google-autocomplete'
import globalState from '../../../context'
import Coparent from '/src/models/coparent'
import Manager from '/src/managers/manager'
import CheckboxGroup from '/src/components/shared/checkboxGroup'
import { RiUserAddLine } from 'react-icons/ri'
import ModelNames from '/src/models/modelNames'
import ObjectManager from '/src/managers/objectManager'
import InputWrapper from '/src/components/shared/inputWrapper'
import BottomCard from '/src/components/shared/bottomCard'
import AlertManager from '/src/managers/alertManager'
import LogManager from '/src/managers/logManager'
import DB_UserScoped from '../../../database/db_userScoped'
import validator from 'validator'
import StringManager from '../../../managers/stringManager'
import Spacer from '../../shared/spacer'

const NewCoparentForm = ({ showCard, hideCard }) => {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, authUser } = state

  // State
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [parentType, setParentType] = useState('')
  const [refreshKey, setRefreshKey] = useState(Manager.getUid())
  const [relationshipType, setRelationshipType] = useState('')
  const resetForm = async () => {
    Manager.resetForm('new-coparent-wrapper')
    setName('')
    setAddress('')
    setPhoneNumber('')
    setParentType('')
    setRefreshKey(Manager.getUid())
    hideCard()
    const updatedCurrentUser = await DB_UserScoped.getCurrentUser(authUser?.email)
    setState({ ...state, currentUser: updatedCurrentUser })
  }

  const submit = async () => {
    if (!validator.isMobilePhone(phoneNumber) || !Manager.phoneNumberIsValid(phoneNumber)) {
      AlertManager.throwError('Phone number is not valid')
      return false
    }
    const invalidInputs = Manager.invalidInputs([phoneNumber, address, name, parentType])
    if (!invalidInputs) {
      AlertManager.throwError('All fields are required')
    } else {
      const coparent = await DB_UserScoped.getCoparentByPhone(phoneNumber, currentUser)
      let key = Manager.getUid()

      if (coparent) {
        key = coparent.key
      }
      const newCoparent = new Coparent()
      newCoparent.id = Manager.getUid()
      newCoparent.key = key
      newCoparent.address = address
      newCoparent.phone = StringManager.formatPhone(phoneNumber)
      newCoparent.name = StringManager.uppercaseFirstLetterOfAllWords(name.trim())
      newCoparent.parentType = parentType
      newCoparent.relationshipToMe = relationshipType

      const cleanCoparent = ObjectManager.cleanObject(newCoparent, ModelNames.coparent)
      try {
        await DB_UserScoped.addCoparent(currentUser, cleanCoparent)
      } catch (error) {
        LogManager.log(error.message, LogManager.logTypes.error)
      }
      AlertManager.successAlert(`${StringManager.getFirstNameOnly(name)} Added!`)
      await resetForm()
    }
  }

  const handleCoparentType = (e) => {
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        setParentType(e)
      },
      () => {
        setParentType('')
      }
    )
  }

  const handleRelationshipType = (e) => {
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        setRelationshipType(e)
      },
      (e) => {
        setRelationshipType('')
      }
    )
  }

  return (
    <BottomCard
      refreshKey={refreshKey}
      onSubmit={submit}
      submitText={name.length > 0 ? `Add ${StringManager.uppercaseFirstLetterOfAllWords(name)}` : 'Add'}
      title={'New Co-Parent'}
      wrapperClass="new-coparent-card"
      showCard={showCard}
      submitIcon={<RiUserAddLine />}
      onClose={resetForm}>
      <div className="new-coparent-wrapper">
        <div id="new-coparent-container" className={`${theme} form`}>
          <div className="form new-coparent-form">
            <InputWrapper inputType={'input'} required={true} labelText={'Name'} onChange={(e) => setName(e.target.value)} />
            <InputWrapper inputType={'input'} required={true} labelText={'Phone Number'} onChange={(e) => setPhoneNumber(e.target.value)} />
            <InputWrapper inputType={'location'} required={true} labelText={'Home Address'}>
              <Autocomplete
                placeholder="Home Address"
                apiKey={process.env.REACT_APP_AUTOCOMPLETE_ADDRESS_API_KEY}
                options={{
                  types: ['geocode', 'establishment'],
                  componentRestrictions: { country: 'usa' },
                }}
                onPlaceSelected={(place) => setAddress(place.formatted_address)}
              />
            </InputWrapper>
            <Spacer height={10} />
            {/* PARENT TYPE */}
            <CheckboxGroup
              parentLabel={'Parent Type'}
              className="coparent-type"
              skipNameFormatting={true}
              checkboxArray={Manager.buildCheckboxGroup({
                currentUser,
                customLabelArray: ['Biological', 'Step-Parent', 'Guardian', 'Other'],
              })}
              onCheck={handleCoparentType}
            />

            {/* RELATIONSHIP */}
            <CheckboxGroup
              elClass={'mt-15'}
              parentLabel={'Relationship to Me'}
              className="relationship-to-me mt-15"
              skipNameFormatting={true}
              checkboxArray={Manager.buildCheckboxGroup({
                currentUser,
                customLabelArray: ['Spouse', 'Former Spouse', 'Former Partner of Spouse'],
              })}
              onCheck={handleRelationshipType}
            />
          </div>
        </div>
      </div>
    </BottomCard>
  )
}

export default NewCoparentForm
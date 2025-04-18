// Path: src\components\screens\parents\newParentForm.jsx
import React, {useContext, useState} from 'react'
import globalState from '../../../context'
import Manager from '/src/managers/manager'
import CheckboxGroup from '/src/components/shared/checkboxGroup'
import InputWrapper from '/src/components/shared/inputWrapper'
import Modal from '/src/components/shared/modal'
import AlertManager from '/src/managers/alertManager'
import validator from 'validator'
import StringManager from '../../../managers/stringManager'
import Spacer from '../../shared/spacer'
import DB from '../../../database/DB'
import ModelNames from '../../../models/modelNames'
import ObjectManager from '../../../managers/objectManager'
import ViewSelector from '../../shared/viewSelector'
import DB_UserScoped from '../../../database/db_userScoped'
import InputTypes from '../../../constants/inputTypes'
import Parent from '../../../models/parent'

const NewParentForm = ({showCard, hideCard}) => {
  const {state, setState} = useContext(globalState)
  const {currentUser, theme, authUser} = state
  const [linkOrNew, setLinkOrNew] = useState('new')

  // State
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [email, setEmail] = useState('')
  const [parentType, setParentType] = useState('')
  const [relationshipType, setRelationshipType] = useState('')

  const ResetForm = async (successMessage = '') => {
    Manager.ResetForm('new-parent-wrapper')
    setName('')
    setAddress('')
    setEmail('')
    setParentType('')
    setState({...state, refreshKey: Manager.getUid(), successAlertMessage: successMessage})
    hideCard()
  }

  const Submit = async () => {
    if (!validator.isEmail(email)) {
      AlertManager.throwError('Email address is not valid')
      return false
    }
    const errorString = Manager.GetInvalidInputsErrorString([
      {
        name: 'Name',
        value: name,
      },
      {
        name: 'Email',
        value: email,
      },
    ])
    if (Manager.isValid(errorString, true)) {
      AlertManager.throwError(errorString)
      return false
    }
    let newParent = new Parent()
    const users = await DB.getTable(`${DB.tables.users}`)
    const parent = users.find((x) => x.email === email)

    // Link parent with an existing user/profile
    if (Manager.isValid(parent)) {
      newParent.id = Manager.getUid()
      newParent.userKey = parent?.key
      newParent.address = address
      newParent.name = StringManager.uppercaseFirstLetterOfAllWords(parent?.name.trim())
      newParent.parentType = parentType
      newParent.relationshipToMe = relationshipType
      newParent.phone = parent?.phone
      newParent.email = parent?.email
    }
    // Create new parent
    else {
      newParent.email = email
      newParent.id = Manager.getUid()
      newParent.key = Manager.getUid()
      newParent.address = address
      newParent.name = StringManager.uppercaseFirstLetterOfAllWords(name.trim())
      newParent.parentType = parentType
      newParent.relationshipToMe = relationshipType
    }
    const cleanParent = ObjectManager.cleanObject(newParent, ModelNames.parent)
    try {
      await DB_UserScoped.addParent(currentUser, cleanParent)
    } catch (error) {
      console.log(error)
      // LogManager.log(error.message, LogManager.logTypes.error)
    }
    await ResetForm(`${StringManager.getFirstNameOnly(name)} Added!`)
  }

  const HandleParentType = (e) => {
    const type = e.dataset['key']
    Manager.handleCheckboxSelection(
      e,
      () => {
        setParentType(type)
      },
      () => {
        setParentType('')
      }
    )
  }

  return (
    <Modal
      onSubmit={Submit}
      submitText={name.length > 0 ? `Add ${StringManager.uppercaseFirstLetterOfAllWords(name)}` : 'Add'}
      title={`Add ${Manager.isValid(name, true) ? StringManager.uppercaseFirstLetterOfAllWords(name) : 'Co-Parent'} to Your Profile`}
      wrapperClass="new-parent-card"
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
      <div className="new-parent-wrapper">
        <Spacer height={5} />
        <div id="new-parent-container" className={`${theme} form`}>
          <div className="form new-parent-form">
            <InputWrapper inputType={InputTypes.text} required={true} labelText={'Name'} onChange={(e) => setName(e.target.value)} />
            <InputWrapper
              inputType={InputTypes.email}
              inputValueType="email"
              required={true}
              labelText={'Email Address'}
              onChange={(e) => setEmail(e.target.value)}
            />
            {linkOrNew === 'new' && (
              <InputWrapper
                inputType={InputTypes.address}
                labelText={'Home Address'}
                onChange={(place) => {
                  setAddress(place)
                }}
              />
            )}

            <Spacer height={5} />

            {/* PARENT TYPE */}
            <CheckboxGroup
              parentLabel={'Parent Type'}
              className="parent-type"
              skipNameFormatting={true}
              checkboxArray={Manager.buildCheckboxGroup({
                currentUser,
                customLabelArray: ['Biological', 'Step-Parent', 'Guardian', 'Other'],
              })}
              onCheck={HandleParentType}
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default NewParentForm
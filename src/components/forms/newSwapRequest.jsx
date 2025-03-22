// Path: src\components\forms\newSwapRequest.jsx
import moment from 'moment'
import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../context'
import SwapDurations from '/src/constants/swapDurations'
import DB from '/src/database/DB'
import SwapRequest from '/src/models/swapRequest'
import Manager from '/src/managers/manager'
import CheckboxGroup from '/src/components/shared/checkboxGroup'
import NotificationManager from '/src/managers/notificationManager'
import Modal from '/src/components/shared/modal'
import { MobileDatePicker, MobileDateRangePicker, MobileTimePicker, SingleInputDateRangeField } from '@mui/x-date-pickers-pro'
import Toggle from 'react-toggle'
import ModelNames from '/src/models/modelNames'
import InputWrapper from '/src/components/shared/inputWrapper'
import ShareWithCheckboxes from '/src/components/shared/shareWithCheckboxes'
import DateFormats from '/src/constants/dateFormats'
import ObjectManager from '/src/managers/objectManager'
import AlertManager from '/src/managers/alertManager'
import DB_UserScoped from '/src/database/db_userScoped'
import StringManager from '/src/managers/stringManager'
import ActivityCategory from '/src/models/activityCategory'
import { MdOutlineFace } from 'react-icons/md'
import ViewSelector from '../shared/viewSelector'
import Spacer from '../shared/spacer'
import DomManager from '../../managers/domManager'
import creationForms from '../../constants/creationForms'
import ToggleButton from '../shared/toggleButton'

export default function NewSwapRequest() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, authUser, refreshKey, creationFormToShow } = state
  const [requestReason, setRequestReason] = useState('')
  const [requestChildren, setRequestChildren] = useState([])
  const [shareWith, setShareWith] = useState([])
  const [requestFromHour, setRequestFromHour] = useState('')
  const [requestToHour, setRequestToHour] = useState('')
  const [swapDuration, setSwapDuration] = useState('single')
  const [includeChildren, setIncludeChildren] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [responseDueDate, setResponseDueDate] = useState('')
  const [recipientKey, setRecipientKey] = useState('')

  const resetForm = async () => {
    Manager.resetForm('swap-request-wrapper')
    setRequestReason('')
    setRequestChildren([])
    setShareWith([])
    setRequestFromHour('')
    setRequestToHour('')
    setSwapDuration('single')
    setIncludeChildren(false)
    setStartDate('')
    setEndDate('')
    const updatedCurrentUser = await DB_UserScoped.getCurrentUser(authUser?.email)
    setState({ ...state, currentUser: updatedCurrentUser, refreshKey: Manager.getUid(), isLoading: false, creationFormToShow: '' })
  }

  const submit = async () => {
    const invalidInputs = Manager.invalidInputs([startDate, recipientKey])
    const validAccounts = await DB_UserScoped.getValidAccountsForUser(currentUser)

    //#region VALIDATION
    if (validAccounts === 0) {
      AlertManager.throwError(
        'No co-parent to \n assign requests to',
        'It appears that you have not created any co-parents, or it is possible that they may have deactivated their account.'
      )
      return false
    }

    if (validAccounts > 0) {
      if (!Manager.isValid(shareWith)) {
        AlertManager.throwError('Please choose who you would like to share this request with')
        return false
      }
    }
    if (invalidInputs.length > 0) {
      AlertManager.throwError('Please fill out required fields')
      return false
    }
    //#endregion VALIDATION

    let newRequest = new SwapRequest()
    newRequest.children = requestChildren
    newRequest.startDate = startDate
    newRequest.endDate = endDate
    newRequest.reason = requestReason
    newRequest.duration = swapDuration
    newRequest.fromHour = requestFromHour
    newRequest.responseDueDate = responseDueDate
    newRequest.toHour = requestToHour
    newRequest.ownerKey = currentUser?.key
    newRequest.shareWith = Manager.getUniqueArray(shareWith).flat()
    newRequest.recipientKey = recipientKey

    const cleanObject = ObjectManager.cleanObject(newRequest, ModelNames.swapRequest)

    // Send Notification
    await DB.add(`${DB.tables.swapRequests}/${currentUser?.key}`, cleanObject).finally(() => {
      NotificationManager.sendToShareWith(
        shareWith,
        currentUser,
        'New Swap Request',
        `${StringManager.getFirstNameOnly(currentUser?.name)} has created a new Swap Request`,
        ActivityCategory.swapRequest
      )
      setSwapDuration(SwapDurations.single)
    })
    AlertManager.successAlert('Swap Request Sent')

    await resetForm()
  }

  const handleChildSelection = (e) => {
    const selectedValue = e.getAttribute('data-label')
    Manager.handleCheckboxSelection(
      e,
      () => {
        setRequestChildren([...requestChildren, selectedValue])
      },
      () => {
        let filtered = requestChildren.filter((x) => x !== selectedValue)
        setRequestChildren(filtered)
      },
      true
    )
  }

  const handleShareWithSelection = async (e) => {
    const updated = await Manager.handleShareWithSelection(e, currentUser, shareWith)
    setShareWith(updated)
  }

  const handleRecipientSelection = (e) => {
    const coparentKey = e.getAttribute('data-key')
    if (e.classList.contains('active')) {
      setRecipientKey(coparentKey)
    } else {
      setRecipientKey('')
    }
  }

  const changeSwapDuration = (duration) => setSwapDuration(duration)

  const addThemeToDatePickers = () => {
    setTimeout(() => {
      const datetimeParent = document.querySelector('.MuiDialog-root.MuiModal-root')
      datetimeParent.classList.add(currentUser?.settings?.theme)
    }, 100)
  }

  return (
    <Modal
      submitText={'Send Request'}
      refreshKey={refreshKey}
      onSubmit={submit}
      wrapperClass="new-swap-request"
      title={'Create Swap Request'}
      showCard={creationFormToShow === creationForms.swapRequest}
      onClose={resetForm}>
      <div id="new-swap-request-container" className={`${theme} form`}>
        {/* DURATION OPTIONS */}
        <ViewSelector
          labels={['Day', 'Days', 'Hours']}
          updateState={(e) => {
            if (e === 'Day') {
              changeSwapDuration(SwapDurations.single)
            }
            if (e === 'Days') {
              changeSwapDuration(SwapDurations.multiple)
            }
            if (e === 'Hours') {
              changeSwapDuration(SwapDurations.intra)
            }
          }}
        />
        {/* FORM */}
        <div id="request-form" className="form single">
          {/* SINGLE DATE */}
          {swapDuration === SwapDurations.single && (
            <>
              {!DomManager.isMobile() && (
                <InputWrapper wrapperClasses="swap-request" inputType={'date'} labelText={'Date'} required={true}>
                  <MobileDatePicker
                    onOpen={addThemeToDatePickers}
                    className={`${theme}`}
                    onChange={(day) => setStartDate(moment(day).format(DateFormats.dateForDb))}
                  />
                </InputWrapper>
              )}
              {DomManager.isMobile() && (
                <InputWrapper
                  useNativeDate={true}
                  wrapperClasses="swap-request"
                  inputType={'date'}
                  labelText={'Date'}
                  required={true}
                  onChange={(input) => {
                    const day = input.target.value
                    setStartDate(moment(day).format(DateFormats.dateForDb))
                  }}
                />
              )}
            </>
          )}

          {/* INTRADAY - HOURS */}
          {swapDuration === SwapDurations.intra && (
            <>
              {!DomManager.isMobile() && (
                <InputWrapper inputType={'date'} labelText={'Day'} required={true}>
                  <MobileDatePicker
                    onOpen={addThemeToDatePickers}
                    className={`${theme}`}
                    onChange={(day) => setStartDate(moment(day).format(DateFormats.dateForDb))}
                  />
                </InputWrapper>
              )}
              {DomManager.isMobile() && (
                <InputWrapper
                  onChange={(input) => {
                    const day = input.target.value
                    setStartDate(moment(day).format(DateFormats.dateForDb))
                  }}
                  useNativeDate={true}
                  inputType={'date'}
                  labelText={'Day'}
                  required={true}
                />
              )}

              {/* TIMES */}
              <div className="flex gap ">
                <InputWrapper inputType={'date'} labelText={'Start Time'} required={true}>
                  <MobileTimePicker
                    minutesStep={5}
                    slotProps={{
                      actionBar: {
                        actions: ['clear', 'accept'],
                      },
                    }}
                    wrapperClasses="swap-request"
                    onOpen={addThemeToDatePickers}
                    className={`${theme} from-hour`}
                    onChange={(e) => setRequestFromHour(moment(e).format('h a'))}
                  />
                </InputWrapper>
                <InputWrapper wrapperClasses="swap-request" inputType={'date'} labelText={'End Time'} required={true}>
                  <MobileTimePicker
                    slotProps={{
                      actionBar: {
                        actions: ['clear', 'accept'],
                      },
                    }}
                    minutesStep={5}
                    onOpen={addThemeToDatePickers}
                    className={`${theme} to-hour`}
                    onChange={(e) => setRequestToHour(moment(e).format('h a'))}
                  />
                </InputWrapper>
              </div>
            </>
          )}

          {/* MULTIPLE DAYS */}
          {swapDuration === SwapDurations.multiple && (
            <InputWrapper useNativeDate={true} labelText={'Date Range'} required={true} inputType={'date'}>
              <MobileDateRangePicker
                onOpen={addThemeToDatePickers}
                className={'w-100'}
                onAccept={(dateArray) => {
                  if (Manager.isValid(dateArray)) {
                    setStartDate(moment(dateArray[0]).format(DateFormats.dateForDb))
                    setEndDate(moment(dateArray[1]).format(DateFormats.dateForDb))
                  }
                }}
                slots={{ field: SingleInputDateRangeField }}
                name="allowedRange"
              />
            </InputWrapper>
          )}

          {/* RESPONSE DUE DATE */}
          {!DomManager.isMobile() && (
            <InputWrapper inputType={'date'} labelText={'Respond by'}>
              <MobileDatePicker
                onOpen={addThemeToDatePickers}
                className={`${theme}  w-100`}
                onChange={(day) => setResponseDueDate(moment(day).format(DateFormats.dateForDb))}
              />
            </InputWrapper>
          )}
          {DomManager.isMobile() && (
            <InputWrapper
              onChange={(input) => {
                const day = input.target.value
                setResponseDueDate(moment(day).format(DateFormats.dateForDb))
              }}
              useNativeDate={true}
              inputType={'date'}
              labelText={'Respond by'}
            />
          )}

          <Spacer height={5} />

          {/* SEND REQUEST TO */}
          <CheckboxGroup
            required={true}
            parentLabel={'Who are you sending the request to?'}
            checkboxArray={Manager.buildCheckboxGroup({
              currentUser,
              predefinedType: 'coparents',
            })}
            onCheck={(e) => {
              handleRecipientSelection(e)
            }}
          />

          <Spacer height={5} />

          {/* WHO SHOULD SEE IT? */}
          <ShareWithCheckboxes required={true} onCheck={handleShareWithSelection} labelText={'Share with'} containerClass={'share-with-coparents'} />
          <Spacer height={5} />

          {/* INCLUDE CHILDREN */}
          {Manager.isValid(currentUser?.children) && (
            <div className="share-with-container ">
              <div className="flex">
                <p>Include Child(ren)</p>
                <ToggleButton onCheck={() => setIncludeChildren(!includeChildren)} onUncheck={() => setIncludeChildren(!includeChildren)} />
              </div>
              {includeChildren && (
                <CheckboxGroup
                  checkboxArray={Manager.buildCheckboxGroup({
                    currentUser,
                    labelType: 'children',
                  })}
                  onCheck={handleChildSelection}
                />
              )}
            </div>
          )}

          <Spacer height={10} />

          {/* NOTES */}
          <InputWrapper inputType={'textarea'} labelText={'Reason'} onChange={(e) => setRequestReason(e.target.value)} />
        </div>
      </div>
    </Modal>
  )
}
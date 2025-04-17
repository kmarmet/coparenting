// Path: src\components\forms\newSwapRequest.jsx
import moment from 'moment'
import React, {useContext, useState} from 'react'
import globalState from '../../context'
import SwapDurations from '/src/constants/swapDurations'
import DB from '/src/database/DB'
import SwapRequest from '/src/models/swapRequest'
import Manager from '/src/managers/manager'
import CheckboxGroup from '/src/components/shared/checkboxGroup'
import NotificationManager from '/src/managers/notificationManager'
import Modal from '/src/components/shared/modal'
import {MobileDateRangePicker, SingleInputDateRangeField} from '@mui/x-date-pickers-pro'
import ModelNames from '/src/models/modelNames'
import InputWrapper from '/src/components/shared/inputWrapper'
import ShareWithCheckboxes from '/src/components/shared/shareWithCheckboxes'
import DatetimeFormats from '/src/constants/datetimeFormats'
import ObjectManager from '/src/managers/objectManager'
import AlertManager from '/src/managers/alertManager'
import DB_UserScoped from '/src/database/db_userScoped'
import StringManager from '/src/managers/stringManager'
import ActivityCategory from '/src/models/activityCategory'
import ViewSelector from '../shared/viewSelector'
import Spacer from '../shared/spacer'
import creationForms from '../../constants/creationForms'
import ToggleButton from '../shared/toggleButton'
import Label from '../shared/label'
import InputTypes from '../../constants/inputTypes'

export default function NewSwapRequest() {
  const {state, setState} = useContext(globalState)
  const {currentUser, theme, authUser, refreshKey, creationFormToShow} = state
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
  const [recipientName, setRecipientName] = useState()

  const ResetForm = async (showSuccessAlert = false) => {
    Manager.ResetForm('swap-request-wrapper')
    setRequestReason('')
    setRequestChildren([])
    setShareWith([])
    setRequestFromHour('')
    setRequestToHour('')
    setSwapDuration('single')
    setIncludeChildren(false)
    setStartDate('')
    setEndDate('')
    setState({
      ...state,
      refreshKey: Manager.getUid(),
      isLoading: false,
      creationFormToShow: '',
      successAlertMessage: showSuccessAlert ? 'Swap Request Sent' : null,
    })
  }

  const submit = async () => {
    const invalidInputs = Manager.GetInvalidInputsErrorString([startDate, recipientKey])
    const validAccounts = await DB_UserScoped.getValidAccountsForUser(currentUser)

    //#region VALIDATION
    if (validAccounts === 0) {
      AlertManager.throwError(
        'No co-parent to \n assign requests to',
        'It appears that you have not created any co-parents, or it is possible that they may have deactivated their profile.'
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
    newRequest.requestReason = requestReason
    newRequest.duration = swapDuration
    newRequest.ownerName = currentUser?.name
    newRequest.fromHour = requestFromHour
    newRequest.responseDueDate = responseDueDate
    newRequest.recipientName = recipientName
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

    await ResetForm(true)
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
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        setRecipientKey(coparentKey)
        setRecipientName(e)
      },
      () => {
        setRecipientName('')
        setRecipientKey('')
      },
      false
    )
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
      title={'Request Visitation Swap'}
      subtitle="Request for your child(ren) to remain with you during the designated visitation time of your co-parent."
      viewSelector={
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
      }
      showCard={creationFormToShow === creationForms.swapRequest}
      onClose={ResetForm}>
      <div id="new-swap-request-container" className={`${theme} form`}>
        <Spacer height={5} />
        {/* FORM */}
        <div id="request-form" className="form single">
          {/* SINGLE DATE */}
          {swapDuration === SwapDurations.single && (
            <InputWrapper
              uidClass="swap-single-date"
              inputType={InputTypes.date}
              labelText={'Date'}
              required={true}
              onDateOrTimeSelection={(day) => setStartDate(moment(day).format(DatetimeFormats.dateForDb))}
            />
          )}

          {/* INTRA DAY - HOURS */}
          {swapDuration === SwapDurations.intra && (
            <>
              <InputWrapper
                uidClass="swap-hours-date"
                inputType={InputTypes.date}
                labelText={'Day'}
                required={true}
                onDateOrTimeSelection={(day) => setStartDate(moment(day).format(DatetimeFormats.dateForDb))}
              />

              {/* TIMES */}
              <div className="flex gap">
                <InputWrapper
                  inputType={InputTypes.time}
                  uidClass="swap-request-from-hour"
                  labelText={'Start Time'}
                  onDateOrTimeSelection={(e) => setRequestFromHour(moment(e).format('ha'))}
                />

                <InputWrapper
                  inputType={InputTypes.time}
                  uidClass="swap-request-to-hour"
                  labelText={'End Time'}
                  onDateOrTimeSelection={(e) => setRequestToHour(moment(e).format('ha'))}
                />
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
                    setStartDate(moment(dateArray[0]).format(DatetimeFormats.dateForDb))
                    setEndDate(moment(dateArray[1]).format(DatetimeFormats.dateForDb))
                  }
                }}
                slots={{field: SingleInputDateRangeField}}
                name="allowedRange"
              />
            </InputWrapper>
          )}

          {/* RESPONSE DUE DATE */}
          <InputWrapper
            uidClass="swap-response-date"
            inputType={InputTypes.date}
            labelText={'Requested Response Date'}
            required={true}
            onDateOrTimeSelection={(day) => setResponseDueDate(moment(day).format(DatetimeFormats.dateForDb))}
          />

          <Spacer height={5} />

          {/* SEND REQUEST TO */}
          <CheckboxGroup
            required={true}
            parentLabel={'Request Recipient'}
            checkboxArray={Manager.buildCheckboxGroup({
              currentUser,
              predefinedType: 'coparents',
            })}
            onCheck={(e) => {
              handleRecipientSelection(e)
            }}
          />

          {/* WHO SHOULD SEE IT? */}
          <ShareWithCheckboxes required={true} onCheck={handleShareWithSelection} labelText={'Share with'} containerClass={'share-with-coparents'} />

          {/* INCLUDE CHILDREN */}
          {Manager.isValid(currentUser?.children) && (
            <div className="share-with-container ">
              <div className="flex">
                <Label text={'Include Child(ren)'} />
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

          <Spacer height={5} />

          {/* NOTES */}
          <InputWrapper inputType={'textarea'} labelText={'Reason'} onChange={(e) => setRequestReason(e.target.value)} />
        </div>
      </div>
    </Modal>
  )
}
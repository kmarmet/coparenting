// Path: src\components\forms\newSwapRequest.jsx
import CheckboxGroup from '/src/components/shared/checkboxGroup'
import Form from '/src/components/shared/form'
import InputWrapper from '/src/components/shared/inputWrapper'
import ShareWithCheckboxes from '/src/components/shared/shareWithCheckboxes'
import ActivityCategory from '/src/constants/activityCategory'
import DatetimeFormats from '/src/constants/datetimeFormats'
import ModelNames from '/src/constants/modelNames'
import SwapDurations from '/src/constants/swapDurations'
import DB from '/src/database/DB'
import AlertManager from '/src/managers/alertManager'
import Manager from '/src/managers/manager'
import ObjectManager from '/src/managers/objectManager'
import StringManager from '/src/managers/stringManager'
import UpdateManager from '/src/managers/updateManager'
import SwapRequest from '/src/models/new/swapRequest'
import moment from 'moment'
import React, {useContext, useState} from 'react'
import creationForms from '../../constants/creationForms'
import InputTypes from '../../constants/inputTypes'
import globalState from '../../context'
import useChildren from '../../hooks/useChildren'
import useCurrentUser from '../../hooks/useCurrentUser'
import DatasetManager from '../../managers/datasetManager'
import DomManager from '../../managers/domManager'
import Label from '../shared/label'
import Spacer from '../shared/spacer'
import ToggleButton from '../shared/toggleButton'
import ViewSelector from '../shared/viewSelector'

export default function NewSwapRequest() {
  const {state, setState} = useContext(globalState)
  const {theme, creationFormToShow} = state
  const [requestReason, setRequestReason] = useState('')
  const [requestChildren, setRequestChildren] = useState([])
  const [shareWith, setShareWith] = useState([])
  const [requestFromHour, setRequestFromHour] = useState('')
  const [requestToHour, setRequestToHour] = useState('')
  const [swapDuration, setSwapDuration] = useState('single')
  const [includeChildren, setIncludeChildren] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [requestedResponseDate, setResponseDueDate] = useState('')
  const [recipientKey, setRecipientKey] = useState('')
  const [recipientName, setRecipientName] = useState()
  const {currentUser} = useCurrentUser()
  const {children} = useChildren()

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
      refreshKey: Manager.GetUid(),
      isLoading: false,
      creationFormToShow: '',
      successAlertMessage: showSuccessAlert ? 'Swap Request Sent' : null,
    })
  }

  const Submit = async () => {
    const errorString = Manager.GetInvalidInputsErrorString([
      {
        value: requestReason,
        name: 'Request Reason',
      },
      {
        value: startDate,
        name: 'Date',
      },
      {
        value: requestedResponseDate,
        name: 'Requested Response  Date',
      },
      {
        value: recipientName,
        name: 'Request Recipient',
      },
    ])
    if (Manager.IsValid(errorString, true)) {
      AlertManager.throwError(errorString)
      return false
    }
    const validAccounts = currentUser?.sharedDataUsers

    //#region VALIDATION
    if (validAccounts.length === 0) {
      AlertManager.throwError(
        'No co-parent to \n assign requests to',
        'It appears that you have not created any co-parents, or it is possible that they may have deactivated their profile.'
      )
      return false
    }

    if (validAccounts.length > 0) {
      if (!Manager.IsValid(shareWith)) {
        AlertManager.throwError('Please choose who you would like to share this request with')
        return false
      }
    }
    //#endregion VALIDATION

    let newRequest = new SwapRequest()
    newRequest.children = requestChildren
    newRequest.startDate = startDate
    newRequest.endDate = endDate
    newRequest.reason = requestReason
    newRequest.duration = swapDuration
    newRequest.ownerName = currentUser?.name
    newRequest.fromHour = requestFromHour
    newRequest.requestedResponseDate = requestedResponseDate
    newRequest.recipient = {
      key: recipientKey,
      name: recipientName,
    }
    newRequest.toHour = requestToHour
    newRequest.ownerKey = currentUser?.key
    newRequest.shareWith = DatasetManager.getUniqueArray(shareWith).flat()

    const cleanObject = ObjectManager.GetModelValidatedObject(newRequest, ModelNames.swapRequest)

    // Send Notification
    await DB.Add(`${DB.tables.swapRequests}/${currentUser?.key}`, cleanObject).finally(() => {
      UpdateManager.SendToShareWith(
        shareWith,
        currentUser,
        'New Swap Request',
        `${StringManager.GetFirstNameOnly(currentUser?.name)} has created a new Swap Request`,
        ActivityCategory.swapRequest
      )
      setSwapDuration(SwapDurations.single)
    })

    await ResetForm(true)
  }

  const HandleChildSelection = (e) => {
    const selectedValue = e.getAttribute('data-label')
    DomManager.HandleCheckboxSelection(
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

  const HandleShareWithSelection = (e) => {
    const updated = DomManager.HandleShareWithSelection(e, currentUser, shareWith)
    setShareWith(updated)
  }

  const HandleRecipientSelection = (e) => {
    const coparentKey = e.getAttribute('data-key')
    DomManager.HandleCheckboxSelection(
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

  const ChangeSwapDuration = (duration) => setSwapDuration(duration)

  return (
    <Form
      submitText={'Send'}
      onSubmit={Submit}
      wrapperClass="new-swap-request"
      title={'Request Visitation Swap'}
      subtitle="Request for your child(ren) to remain with you during the designated visitation time of your co-parent."
      viewSelector={
        <ViewSelector
          labels={['Day', 'Days', 'Hours']}
          updateState={(e) => {
            if (e === 'Day') {
              ChangeSwapDuration(SwapDurations.single)
            }
            if (e === 'Days') {
              ChangeSwapDuration(SwapDurations.multiple)
            }
            if (e === 'Hours') {
              ChangeSwapDuration(SwapDurations.intra)
            }
          }}
        />
      }
      showCard={creationFormToShow === creationForms.swapRequest}
      onClose={ResetForm}>
      <div id="new-swap-request-container" className={`${theme} form`}>
        {/* FORM */}
        <div id="request-form" className="form single">
          {/* SINGLE DATE */}
          {swapDuration === SwapDurations.single && (
            <InputWrapper
              uidClass="swap-single-date"
              inputType={InputTypes.date}
              placeholder={'Date'}
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
                placeholder={'Day'}
                required={true}
                onDateOrTimeSelection={(day) => setStartDate(moment(day).format(DatetimeFormats.dateForDb))}
              />

              {/* TIMES */}
              <InputWrapper
                inputType={InputTypes.time}
                uidClass="swap-request-from-hour"
                placeholder={'Start Time'}
                onDateOrTimeSelection={(e) => setRequestFromHour(moment(e).format('ha'))}
              />

              <InputWrapper
                inputType={InputTypes.time}
                uidClass="swap-request-to-hour"
                placeholder={'End Time'}
                onDateOrTimeSelection={(e) => setRequestToHour(moment(e).format('ha'))}
              />
            </>
          )}

          {/* MULTIPLE DAYS */}
          {swapDuration === SwapDurations.multiple && (
            <InputWrapper
              onDateOrTimeSelection={(dateArray) => {
                if (Manager.IsValid(dateArray)) {
                  setStartDate(moment(dateArray[0]).format(DatetimeFormats.dateForDb))
                  setEndDate(moment(dateArray[1]).format(DatetimeFormats.dateForDb))
                }
              }}
              useNativeDate={true}
              placeholder={'Date Range'}
              required={true}
              inputType={InputTypes.dateRange}
            />
          )}

          {/* RESPONSE DUE DATE */}
          <InputWrapper
            uidClass="swap-response-date"
            inputType={InputTypes.date}
            placeholder={'Requested Response Date'}
            required={true}
            onDateOrTimeSelection={(day) => setResponseDueDate(moment(day).format(DatetimeFormats.dateForDb))}
          />

          <Spacer height={5} />

          {/* SEND REQUEST TO */}
          <CheckboxGroup
            required={true}
            parentLabel={'Request Recipient'}
            checkboxArray={DomManager.BuildCheckboxGroup({
              currentUser,
              predefinedType: 'coparents',
            })}
            onCheck={(e) => {
              HandleRecipientSelection(e)
            }}
          />

          <Spacer height={8} />

          {/* WHO SHOULD SEE IT? */}
          <ShareWithCheckboxes
            required={true}
            onCheck={HandleShareWithSelection}
            placeholder={'Share with'}
            containerClass={'share-with-coparents'}
          />

          <Spacer height={8} />

          {/* INCLUDE CHILDREN */}
          {Manager.IsValid(children) && (
            <div className="share-with-container ">
              <div className="flex">
                <Label text={'Include Child(ren)'} classes="always-show" />
                <ToggleButton onCheck={() => setIncludeChildren(!includeChildren)} onUncheck={() => setIncludeChildren(!includeChildren)} />
              </div>
              {includeChildren && (
                <CheckboxGroup
                  checkboxArray={DomManager.BuildCheckboxGroup({
                    currentUser,
                    labelType: 'children',
                  })}
                  onCheck={HandleChildSelection}
                />
              )}
            </div>
          )}

          <Spacer height={5} />

          {/* NOTES */}
          <InputWrapper inputType={'textarea'} placeholder={'Reason'} onChange={(e) => setRequestReason(e.target.value)} />
        </div>
      </div>
    </Form>
  )
}
import moment from 'moment'
import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../context'
import SwapDurations from '/src/constants/swapDurations'
import DB from '/src/database/DB'
import SwapRequest from '/src/models/swapRequest'
import Manager from '/src/managers/manager'
import CheckboxGroup from '/src/components/shared/checkboxGroup'
import NotificationManager from '/src/managers/notificationManager'
import BottomCard from '/src/components/shared/bottomCard'
import { MobileDatePicker, MobileDateRangePicker, MobileTimePicker, SingleInputDateRangeField } from '@mui/x-date-pickers-pro'
import Toggle from 'react-toggle'
import { ImEye } from 'react-icons/im'
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

export default function NewSwapRequest({ showCard, hideCard }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, formToShow } = state
  const [requestRange, setRequestRange] = useState([])
  const [requestReason, setRequestReason] = useState('')
  const [requestChildren, setRequestChildren] = useState([])
  const [shareWith, setShareWith] = useState([])
  const [recipientName, setRecipientName] = useState('')
  const [requestFromHour, setRequestFromHour] = useState('')
  const [requestToHour, setRequestToHour] = useState('')
  const [swapDuration, setSwapDuration] = useState('single')
  const [includeChildren, setIncludeChildren] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [refreshKey, setRefreshKey] = useState(Manager.getUid())
  const [responseDueDate, setResponseDueDate] = useState('')

  const resetForm = async () => {
    Manager.resetForm('swap-request-wrapper')
    setRequestRange([])
    setRequestReason('')
    setRequestChildren([])
    setShareWith([])
    setRecipientName('')
    setRequestFromHour('')
    setRequestToHour('')
    setSwapDuration('single')
    setIncludeChildren(false)
    setStartDate('')
    setEndDate('')
    hideCard()
    const updatedCurrentUser = await DB_UserScoped.getCurrentUser(currentUser.phone)
    setState({ ...state, currentUser: updatedCurrentUser })
    setRefreshKey(Manager.getUid())
  }

  const submit = async () => {
    console.log(startDate, recipientName)
    const invalidInputs = Manager.invalidInputs([startDate, recipientName])
    const validAccounts = await DB_UserScoped.getValidAccountsForUser(currentUser)

    //#region VALIDATION
    if (validAccounts === 0) {
      AlertManager.throwError(
        'No co-parent to \n assign requests to',
        'You have not added any co-parents. Or, it is also possible they have closed their account.'
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
    newRequest.ownerPhone = currentUser?.phone
    newRequest.shareWith = Manager.getUniqueArray(shareWith).flat()
    newRequest.recipientPhone = currentUser?.coparents?.filter((x) => Manager.contains(x?.name, recipientName))[0]?.phone || ''

    const cleanObject = ObjectManager.cleanObject(newRequest, ModelNames.swapRequest)

    // Send Notification
    await DB.add(`${DB.tables.swapRequests}/${currentUser.phone}`, cleanObject).finally(() => {
      NotificationManager.sendToShareWith(
        shareWith,
        currentUser,
        'New Swap Request',
        `${StringManager.formatNameFirstNameOnly(currentUser?.name)} has created a new Swap Request`,
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
      (e) => {
        setRequestChildren([...requestChildren, selectedValue])
      },
      (e) => {
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
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        setRecipientName(e)
      },
      (e) => {
        setRecipientName('')
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
    <div className="swap-request-wrapper">
      <BottomCard
        submitText={'Add Request'}
        refreshKey={refreshKey}
        onSubmit={submit}
        wrapperClass="new-swap-request"
        title={'New Swap Request'}
        showCard={showCard}
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
                <Spacer height={10} />
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
                <Spacer height={10} />

                {/* TIMES */}
                <div className="flex gap ">
                  <InputWrapper inputType={'date'} labelText={'Start Time'} required={true}>
                    <MobileTimePicker
                      minutesStep={5}
                      wrapperClasses="swap-request"
                      onOpen={addThemeToDatePickers}
                      className={`${theme} from-hour`}
                      onChange={(e) => setRequestFromHour(moment(e).format('h a'))}
                    />
                  </InputWrapper>
                  <InputWrapper wrapperClasses="swap-request" inputType={'date'} labelText={'End Time'} required={true}>
                    <MobileTimePicker
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

            <Spacer height={5} />

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

            <Spacer height={15} />

            {/* SEND REQUEST TO */}
            <CheckboxGroup
              required={true}
              parentLabel={'Who are you sending the request to?'}
              dataPhone={currentUser?.coparents?.map((x) => x.phone)}
              checkboxLabels={currentUser?.coparents?.map((x) => x.name)}
              onCheck={handleRecipientSelection}
            />

            <Spacer height={10} />

            {/* WHO SHOULD SEE IT? */}
            <ShareWithCheckboxes
              required={true}
              shareWith={currentUser?.coparents?.map((x) => x.phone)}
              onCheck={handleShareWithSelection}
              labelText={'Share with'}
              containerClass={'share-with-coparents'}
              dataPhone={currentUser?.coparents?.map((x) => x.phone)}
            />
            <Spacer height={10} />

            {/* INCLUDE CHILDREN */}
            {Manager.isValid(currentUser?.children) && (
              <div className="share-with-container ">
                <div className="flex">
                  <p>Include Child(ren)</p>
                  <Toggle
                    icons={{
                      checked: <MdOutlineFace />,
                      unchecked: null,
                    }}
                    className={'ml-auto reminder-toggle'}
                    onChange={(e) => setIncludeChildren(!includeChildren)}
                  />
                </div>
                {includeChildren && (
                  <CheckboxGroup checkboxLabels={currentUser?.children.map((x) => x['general'].name)} onCheck={handleChildSelection} />
                )}
              </div>
            )}

            <Spacer height={5} />

            {/* NOTES */}
            <InputWrapper inputType={'textarea'} labelText={'Reason'} onChange={(e) => setRequestReason(e.target.value)} />
          </div>
        </div>
      </BottomCard>
    </div>
  )
}
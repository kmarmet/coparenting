import moment from 'moment'
import React, { useContext, useEffect, useState } from 'react'
import SwapDurations from '@constants/swapDurations'
import globalState from '../../context'
import DB from '@db'
import SwapRequest from '../../models/swapRequest'
import Manager from '@manager'
import CheckboxGroup from '@shared/checkboxGroup'
import NotificationManager from '@managers/notificationManager.js'
import BottomCard from '../shared/bottomCard'
import { MobileDatePicker, MobileDateRangePicker, MobileTimePicker, SingleInputDateRangeField } from '@mui/x-date-pickers-pro'

import Toggle from 'react-toggle'
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
} from '../../globalFunctions'
import { ImEye } from 'react-icons/im'
import ModelNames from '../../models/modelNames'
import InputWrapper from '../shared/inputWrapper'
import ShareWithCheckboxes from '../shared/shareWithCheckboxes'
import DateFormats from '../../constants/dateFormats'
import ObjectManager from '../../managers/objectManager'
import AlertManager from '../../managers/alertManager'
import DB_UserScoped from '@userScoped'

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
    const invalidInputs = Manager.invalidInputs([startDate, shareWith, recipientName])
    if (invalidInputs.length > 0) {
      AlertManager.throwError('Please fill out required fields')
      return false
    } else {
      let newRequest = new SwapRequest()
      newRequest.id = Manager.getUid()
      newRequest.children = requestChildren
      newRequest.startDate = startDate
      newRequest.endDate = endDate
      newRequest.reason = requestReason
      newRequest.duration = swapDuration
      newRequest.fromHour = requestFromHour
      newRequest.toHour = requestToHour
      newRequest.ownerPhone = currentUser?.phone
      newRequest.createdBy = currentUser?.name
      newRequest.shareWith = Manager.getUniqueArray(shareWith).flat()
      newRequest.recipientPhone = currentUser?.coparents?.filter((x) => contains(x?.name, recipientName))[0]?.phone || ''

      const cleanObject = ObjectManager.cleanObject(newRequest, ModelNames.swapRequest)

      // Send Notification
      await DB.add(DB.tables.swapRequests, cleanObject).finally(() => {
        shareWith.forEach(async (coparentPhone) => {
          const subId = await NotificationManager.getUserSubId(coparentPhone, 'phone')
          NotificationManager.sendNotification(
            `New Swap Request`,
            `${formatNameFirstNameOnly(currentUser?.name)} has created a new Swap Request`,
            subId
          )
        })
        setSwapDuration(SwapDurations.single)
      })
      AlertManager.successAlert('Swap Request Sent')

      await resetForm()
    }
  }

  const handleChildSelection = (e) => {
    const clickedEl = e.currentTarget
    const checkbox = clickedEl.querySelector('.box')
    const selectedValue = clickedEl.getAttribute('data-label')
    if (checkbox.classList.contains('active')) {
      checkbox.classList.remove('active')
      if (requestChildren.length > 0) {
        setRequestChildren(requestChildren.filter((x) => x !== selectedValue))
      }
    } else {
      checkbox.classList.add('active')
      setRequestChildren([...requestChildren, selectedValue])
    }
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

  useEffect(() => {
    Manager.showPageContainer('show')
  }, [])

  return (
    <div className="swap-request-wrapper">
      <BottomCard
        submitText={'Add Request'}
        refreshKey={refreshKey}
        onSubmit={submit}
        title={'New Swap Request'}
        showCard={showCard}
        onClose={resetForm}>
        <div id="new-swap-request-container" className={`${theme} form`}>
          {/* DURATION OPTIONS */}
          <div id="duration-options" className="swap-request action-pills">
            <div className={`duration-option ${swapDuration === 'single' ? 'active' : ''}`} onClick={() => changeSwapDuration(SwapDurations.single)}>
              {swapDuration === 'single' && <span className="material-icons-round">event</span>}
              <p>Day</p>
            </div>
            <div
              className={`duration-option ${swapDuration === 'multiple' ? 'active' : ''}`}
              onClick={() => changeSwapDuration(SwapDurations.multiple)}>
              {swapDuration === 'multiple' && <span className="material-icons-round">date_range</span>}
              <p>Days</p>
            </div>
            <div className={`duration-option ${swapDuration === 'intraday' ? 'active' : ''}`} onClick={() => changeSwapDuration(SwapDurations.intra)}>
              {swapDuration === 'intraday' && <span className="material-icons-round ">schedule</span>}
              <p>Hours</p>
            </div>
          </div>
          {/* FORM */}
          <div id="request-form" className="form single">
            {/* SINGLE DATE */}
            {swapDuration === SwapDurations.single && (
              <InputWrapper inputType={'date'} labelText={'Date'} required={true}>
                <MobileDatePicker
                  onOpen={addThemeToDatePickers}
                  className={`${theme}  w-100`}
                  onChange={(day) => setStartDate(moment(day).format(DateFormats.dateForDb))}
                />
              </InputWrapper>
            )}

            {/* INTRADAY - HOURS */}
            {swapDuration === SwapDurations.intra && (
              <>
                <InputWrapper inputType={'date'} labelText={'Day'} required={true}>
                  <MobileDatePicker
                    onOpen={addThemeToDatePickers}
                    className={`${theme}  w-100`}
                    onChange={(day) => setStartDate(moment(day).format(DateFormats.dateForDb))}
                  />
                </InputWrapper>
                <div className="flex gap ">
                  <InputWrapper inputType={'date'} labelText={'Start Time'} required={true}>
                    <MobileTimePicker
                      onOpen={addThemeToDatePickers}
                      className={`${theme}  from-hour`}
                      onChange={(e) => setRequestFromHour(moment(e).format('h a'))}
                    />
                  </InputWrapper>
                  <InputWrapper inputType={'date'} labelText={'End Time'} required={true}>
                    <MobileTimePicker
                      onOpen={addThemeToDatePickers}
                      className={`${theme}  to-hour`}
                      onChange={(e) => setRequestToHour(moment(e).format('h a'))}
                    />
                  </InputWrapper>
                </div>
              </>
            )}

            {/* MULTIPLE DAYS */}
            {swapDuration === SwapDurations.multiple && (
              <InputWrapper labelText={'Date Range'} required={true} inputType={'date'}>
                <MobileDateRangePicker
                  onOpen={addThemeToDatePickers}
                  className={'w-100'}
                  onAccept={(dateArray) => {
                    if (Manager.isValid(dateArray, true)) {
                      setStartDate(moment(dateArray[0]).format(DateFormats.dateForDb))
                      setEndDate(moment(dateArray[1]).format(DateFormats.dateForDb))
                    }
                  }}
                  slots={{ field: SingleInputDateRangeField }}
                  name="allowedRange"
                />
              </InputWrapper>
            )}

            {currentUser && (
              <>
                {/* SEND REQUEST TO */}
                <CheckboxGroup
                  required={true}
                  parentLabel={'Who are you sending the request to?'}
                  dataPhone={currentUser?.coparents?.map((x) => x.phone)}
                  checkboxLabels={currentUser?.coparents?.map((x) => x.name)}
                  onCheck={handleRecipientSelection}
                />

                {/* WHO SHOULD SEE IT? */}
                <ShareWithCheckboxes
                  icon={<ImEye />}
                  required={true}
                  shareWith={currentUser?.coparents?.map((x) => x.phone)}
                  onCheck={handleShareWithSelection}
                  labelText={'Share with'}
                  containerClass={'share-with-coparents'}
                  dataPhone={currentUser?.coparents?.map((x) => x.phone)}
                />
              </>
            )}

            {/* INCLUDE CHILDREN */}
            {Manager.isValid(currentUser?.children, true) && (
              <div className="share-with-container ">
                <div className="flex">
                  <p>Include Child(ren)</p>
                  <Toggle
                    icons={{
                      checked: <span className="material-icons-round">face</span>,
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

            <InputWrapper inputType={'textarea'} labelText={'Reason'} onChange={(e) => setRequestReason(e.target.value)} />
          </div>
        </div>
      </BottomCard>
    </div>
  )
}
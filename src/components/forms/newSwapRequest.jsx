import moment from 'moment'
import React, { useContext, useEffect, useState } from 'react'
import { DatePicker, DateRangePicker } from 'rsuite'
import PushAlertApi from '@api/pushAlert'
import SwapDurations from '@constants/swapDurations'
import globalState from '../../context'
import DB from '@db'
import SwapRequest from '../../models/swapRequest'
import Manager from '@manager'
import CheckboxGroup from '@shared/checkboxGroup'
import NotificationManager from '@managers/notificationManager.js'
import BottomButton from 'components/shared/bottomButton'
import ScreenNames from 'constants/screenNames'
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker'
import { MobileTimePicker } from '@mui/x-date-pickers'
import BottomCard from '../shared/bottomCard'
import Toggle from 'react-toggle'
import {
  toCamelCase,
  getFirstWord,
  formatFileName,
  isAllUppercase,
  removeSpacesAndLowerCase,
  stringHasNumbers,
  wordCount,
  uppercaseFirstLetterOfAllWords,
  spaceBetweenWords,
  formatNameFirstNameOnly,
  removeFileExtension,
  contains,
  displayAlert,
  uniqueArray,
  getFileExtension,
} from '../../globalFunctions'

import Swal from 'sweetalert2'
import ModelNames from '../../models/modelNames'

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

  const resetForm = () => {
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
    hideCard()
  }

  const throwError = (title) => {
    Swal.fire({
      title: title,
      icon: 'error',
      showClass: {
        popup: `
            animate__animated
            animate__fadeInUp
            animate__faster
          `,
      },
      hideClass: {
        popup: `
            animate__animated
            animate__fadeOutDown
            animate__faster
          `,
      },
    })
  }

  const submit = async () => {
    if (requestRange.length === 0 || shareWith.length === 0 || recipientName.length === 0) {
      throwError('Please fill out required fields')
      return false
    } else {
      let newRequest = new SwapRequest()
      if (swapDuration === SwapDurations.multiple || swapDuration === SwapDurations.single) {
        newRequest.fromDate = requestRange[0]
        newRequest.toDate = requestRange.length > 1 ? requestRange[1] : requestRange[0]
      } else {
        newRequest.fromDate = requestRange[0]
        newRequest.toDate = requestRange[0]
      }
      newRequest.id = Manager.getUid()
      newRequest.children = requestChildren || ''
      newRequest.reason = requestReason || ''
      newRequest.duration = swapDuration || ''
      newRequest.fromHour = requestFromHour || ''
      newRequest.toHour = requestToHour || ''
      newRequest.phone = currentUser.phone || ''
      newRequest.createdBy = currentUser.name || ''
      newRequest.shareWith = Manager.getUniqueArray(shareWith).flat()
      newRequest.recipientPhone = currentUser?.coparents.filter((x) => x.name.contains(recipientName))[0].phone || ''

      const cleanObject = Manager.cleanObject(newRequest, ModelNames.swapRequest)

      // Send Notification
      await DB.add(DB.tables.swapRequests, cleanObject).finally(() => {
        shareWith.forEach(async (coparentPhone) => {
          const subId = await NotificationManager.getUserSubId(coparentPhone)
          PushAlertApi.sendMessage(`New Swap Request`, `${formatNameFirstNameOnly(currentUser.name)} has created a new Swap Request`, subId)
        })
        setSwapDuration(SwapDurations.single)
      })

      resetForm()
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
    await Manager.handleShareWithSelection(e, currentUser, shareWith).then((updated) => {
      setShareWith(updated)
    })
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

  useEffect(() => {
    Manager.showPageContainer('show')
  }, [])

  return (
    <div className="swap-request-wrapper">
      <BottomCard title={'Add Swap Request'} showCard={showCard} onClose={() => hideCard()}>
        <div id="new-swap-request-container" className={`${theme} form`}>
          <div id="duration-options" className="swap-request action-pills">
            <div className={`flex ${swapDuration === 'single' ? 'active' : ''}`} onClick={() => changeSwapDuration(SwapDurations.single)}>
              <span className="material-icons-round">event</span>
              <p>Day</p>
            </div>
            <div className={`flex ${swapDuration === 'multiple' ? 'active' : ''}`} onClick={() => changeSwapDuration(SwapDurations.multiple)}>
              <span className="material-icons-round">date_range</span>
              <p>Days</p>
            </div>
            <div className={`flex ${swapDuration === 'intraday' ? 'active' : ''}`} onClick={() => changeSwapDuration(SwapDurations.intra)}>
              <span className="material-icons-round ">schedule</span>
              <p>Hours</p>
            </div>
          </div>

          <div id="request-form" className="form single">
            {swapDuration === SwapDurations.single && (
              <>
                <label>
                  Date <span className="asterisk">*</span>
                </label>
                <MobileDatePicker
                  className={`${theme} mb-15 mt-0 w-100`}
                  onChange={(e) => {
                    setRequestRange([moment(e).format('MM/DD/YYYY')])
                  }}
                />
              </>
            )}

            {swapDuration === SwapDurations.intra && (
              <>
                <label>
                  Day <span className="asterisk">*</span>
                </label>
                <MobileDatePicker
                  className={`${theme} mb-15 mt-0 w-100`}
                  onAccept={(e) => setRequestRange([moment(e).format('MM/DD/YYYY').toString()])}
                />
                <div className="flex gap ">
                  <div>
                    <label>
                      Start time <span className="asterisk">*</span>
                    </label>
                    <MobileTimePicker className={`${theme} mb-15 mt-5 from-hour`} onChange={(e) => setRequestFromHour(moment(e).format('h a'))} />
                  </div>
                  <div>
                    <label>
                      End time <span className="asterisk">*</span>
                    </label>
                    <MobileTimePicker className={`${theme} mb-15 mt-5 to-hour`} onChange={(e) => setRequestToHour(moment(e).format('h a'))} />
                  </div>
                </div>
              </>
            )}

            {swapDuration === SwapDurations.multiple && (
              <>
                <label>
                  Date Range <span className="asterisk">*</span>
                </label>
                <DateRangePicker
                  showOneCalendar
                  className="mb-15 mt-0"
                  showHeader={false}
                  editable={false}
                  placement="auto"
                  character=" to "
                  format={'MM/dd/yyyy'}
                  onChange={(e) => {
                    let formattedDates = []

                    e.forEach((date) => {
                      formattedDates.push(moment(date).format('MM/DD/YYYY').toString())
                    })
                    setRequestRange(formattedDates)
                  }}
                />
              </>
            )}

            {currentUser && (
              <>
                {/* SEND REQUEST TO */}
                <label>
                  <span className="material-icons-round notifications">person</span>Who are you sending the request to?
                  <span className="asterisk">*</span>
                </label>
                <CheckboxGroup
                  dataPhone={currentUser?.coparents.map((x) => x.phone)}
                  labels={currentUser?.coparents.map((x) => x.name)}
                  onCheck={handleRecipientSelection}
                />

                {/* WHO SHOULD SEE IT? */}
                <div className="share-with-container">
                  <label>
                    <span className="material-icons-round">visibility</span> Who should see it?<span className="asterisk">*</span>
                  </label>
                  <CheckboxGroup
                    dataPhone={currentUser?.coparents.map((x) => x.phone)}
                    labels={currentUser?.coparents.map((x) => x.name)}
                    onCheck={handleShareWithSelection}
                  />
                </div>
              </>
            )}

            {/* INCLUDE CHILDREN */}
            {Manager.isValid(currentUser.children, true) && (
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
                {includeChildren && <CheckboxGroup labels={currentUser.children.map((x) => x['general'].name)} onCheck={handleChildSelection} />}
              </div>
            )}

            <label>Reason</label>
            <textarea id="rejection-reason-textarea" onChange={(e) => setRequestReason(e.target.value)}></textarea>
            {/* BUTTONS */}
            <div className="buttons gap">
              {requestRange.length > 0 && shareWith.length > 0 && recipientName.length > 0 && (
                <button className="button card-button" onClick={submit}>
                  Create Request
                </button>
              )}
              <button className="button card-button red" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </BottomCard>
    </div>
  )
}

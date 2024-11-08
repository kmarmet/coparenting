import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../context'
import Manager from '@manager'
import Autocomplete from 'react-google-autocomplete'
import CheckboxGroup from '@shared/checkboxGroup'
import TransferChangeRequest from '../../models/transferChangeRequest'
import moment from 'moment'
import DB from '@db'
import NotificationManager from '@managers/notificationManager.js'
import PushAlertApi from '@api/pushAlert'
import DB_UserScoped from '@userScoped'
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker'
import { MobileTimePicker } from '@mui/x-date-pickers'
import DateFormats from '../../constants/dateFormats'
import DateManager from '../../managers/dateManager'
import { FaRegEye } from 'react-icons/fa'
import { IoPersonCircleOutline } from 'react-icons/io5'

import {
  contains,
  displayAlert,
  formatFileName,
  formatNameFirstNameOnly,
  getFileExtension,
  getFirstWord,
  isAllUppercase,
  removeFileExtension,
  removeSpacesAndLowerCase,
  spaceBetweenWords,
  stringHasNumbers,
  successAlert,
  throwError,
  toCamelCase,
  uniqueArray,
  uppercaseFirstLetterOfAllWords,
  wordCount,
} from '../../globalFunctions'
import Label from '../shared/label'
import ActivitySet from '../../models/activitySet'

export default function NewTransferChangeRequest({ hideCard }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, formToShow } = state
  const [requestReason, setRequestReason] = useState('')
  const [shareWith, setShareWith] = useState([])
  const [requestTime, setRequestTime] = useState('')
  const [requestLocation, setRequestLocation] = useState('')
  const [requestDate, setRequestDate] = useState('')
  const [directionsLink, setDirectionsLink] = useState('')
  const [requestRecipientPhone, setRequestRecipientPhone] = useState('')
  const [preferredLocation, setPreferredLocation] = useState('')

  const resetForm = () => {
    Manager.resetForm('transfer-request-wrapper')
    setRequestReason('')
    setShareWith([])
    setRequestTime('')
    setRequestLocation('')
    setRequestDate('')
    setDirectionsLink('')
    setRequestRecipientPhone('')
    setPreferredLocation('')
    hideCard()
  }

  const submit = async () => {
    if (requestRecipientPhone.length === 0) {
      throwError('Please choose who to send the request to')
      return false
    } else if (requestLocation.length === 0 && requestTime.length === 0) {
      throwError('Please choose a new location or time')
      return false
    } else if (requestDate.length === 0) {
      throwError('Please choose the day of the requested transfer change')
      return false
    } else {
      let newRequest = new TransferChangeRequest()
      newRequest.id = Manager.getUid()
      newRequest.reason = requestReason
      newRequest.phone = currentUser.phone
      newRequest.createdBy = currentUser.name
      newRequest.shareWith = Manager.getUniqueArray(shareWith).flat()
      newRequest.time = DateManager.dateIsValid(moment(requestTime).format(DateFormats.timeForDb)) || ''
      newRequest.location = requestLocation
      newRequest.date = moment(requestDate).format(DateFormats.dateForDb)
      newRequest.directionsLink = directionsLink
      newRequest.recipientPhone = requestRecipientPhone
      newRequest.preferredTransferLocation = requestLocation

      if (preferredLocation.length > 0) {
        const coparent = currentUser?.coparents.filter((x) => x.phone === requestRecipientPhone)[0]
        const key = await DB.getNestedSnapshotKey(`users/${currentUser.phone}/coparents`, coparent, 'id')
        await DB_UserScoped.updateUserRecord(currentUser.phone, `coparents/${key}/preferredTransferLocation`, requestLocation)
      }

      await setActivitySets(requestRecipientPhone)

      // Notify
      const subId = await NotificationManager.getUserSubId(requestRecipientPhone)
      PushAlertApi.sendMessage(`Transfer Change Request`, `${formatNameFirstNameOnly(currentUser.name)} has created a Transfer Change request`, subId)

      // // Add record
      await DB.add(DB.tables.transferChangeRequests, newRequest)
      resetForm()
    }
  }

  const setActivitySets = async (userPhone) => {
    const existingActivitySet = await DB.getTable(`${DB.tables.activitySets}/${userPhone}`, true)
    let newActivitySet = new ActivitySet()
    let unreadMessageCount = existingActivitySet?.unreadMessageCount || 0
    if (Manager.isValid(existingActivitySet, false, true)) {
      newActivitySet = { ...existingActivitySet }
    }
    newActivitySet.unreadMessageCount = unreadMessageCount === 0 ? 1 : (unreadMessageCount += 1)
    await DB_UserScoped.addActivitySet(`${DB.tables.activitySets}/${userPhone}`, newActivitySet)
  }

  const handleShareWithSelection = async (e) => {
    await Manager.handleShareWithSelection(e, currentUser, shareWith).then((updated) => {
      setShareWith(updated)
    })
  }

  const handleRequestRecipient = (e) => {
    Manager.handleCheckboxSelection(
      e,
      async (e) => {
        const phone = await DB_UserScoped.getUserFromName(e)
        setRequestRecipientPhone(phone)
      },
      async (e) => {
        setRequestRecipientPhone('')
      },
      false
    )
  }

  const handlePreferredLocation = (e) => {
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        if (e.indexOf('Set') > -1) {
          setPreferredLocation(requestLocation)
        }
      },
      (e) => {
        setPreferredLocation('')
      },
      false
    )
  }

  useEffect(() => {
    Manager.showPageContainer('show')
  }, [])

  return (
    <div className="transfer-request-wrapper">
      <div id="transfer-change-container" className={`${theme} form`}>
        <div className="form transfer-change">
          <div className="flex gap">
            <div>
              <label className="mb-5">
                Day<span className="asterisk">*</span>
              </label>
              <MobileDatePicker className={`${theme} mb-15 mt-0 w-100`} onChange={(e) => setRequestDate(moment(e).format(DateFormats.dateForDb))} />
            </div>
            <div>
              <label className="mt-0">
                New Time <span>&nbsp;</span>
              </label>
              <MobileTimePicker minutesStep={5} className={`${theme} mb-15 mt-0 w-100`} onChange={(e) => setRequestTime(e)} />
            </div>
          </div>

          {/*  NEW LOCATION*/}
          <label>New Location</label>
          <Autocomplete
            placeholder={currentUser.defaultTransferLocation}
            apiKey={process.env.REACT_APP_AUTOCOMPLETE_ADDRESS_API_KEY}
            options={{
              types: ['geocode', 'establishment'],
              componentRestrictions: { country: 'usa' },
            }}
            className="mb-15"
            onPlaceSelected={(place) => {
              setDirectionsLink(`https://www.google.com/maps?daddr=7${encodeURIComponent(place.formatted_address)}`)
              setRequestLocation(place.formatted_address)
            }}
          />

          <CheckboxGroup
            boxWidth={100}
            skipNameFormatting={true}
            dataPhone={currentUser?.coparents.map((x) => x.phone)}
            checkboxLabels={['Set as Preferred Transfer Location']}
            onCheck={handlePreferredLocation}
          />

          {/* REASON */}
          <label>Reason</label>
          <textarea className="mb-15" onChange={(e) => setRequestReason(e.target.value)}></textarea>

          {/* SEND REQUEST TO */}
          {currentUser && (
            <Label icon={<IoPersonCircleOutline />} text={'Who is the request being sent to?'}>
              <CheckboxGroup
                dataPhone={currentUser?.coparents.map((x) => x.phone)}
                checkboxLabels={currentUser?.coparents.map((x) => x.name)}
                onCheck={handleRequestRecipient}
              />
            </Label>
          )}
          {currentUser && (
            <Label icon={<FaRegEye />} text={'Who is allowed to see it?'} required={true}>
              <CheckboxGroup
                dataPhone={currentUser?.coparents.map((x) => x.phone)}
                checkboxLabels={currentUser?.coparents.map((x) => x.name)}
                onCheck={handleShareWithSelection}
              />
            </Label>
          )}
          <div className="buttons gap">
            {moment(requestDate).format(DateFormats.dateForDb).replace('Invalid date', '').length > 0 && requestRecipientPhone.length > 0 && (
              <button className="button card-button" onClick={submit}>
                Create Request
              </button>
            )}
            <button className="button card-button cancel" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

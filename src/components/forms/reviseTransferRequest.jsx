import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../context'
import Manager from '@manager'
import Autocomplete from 'react-google-autocomplete'
import moment from 'moment'
import DB from '@db'
import NotificationManager from '@managers/notificationManager.js'
import PushAlertApi from '@api/pushAlert'
import { MobileDatePicker, MobileTimePicker } from '@mui/x-date-pickers-pro'
import DateFormats from '../../constants/dateFormats'
import DateManager from '../../managers/dateManager'

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
  toCamelCase,
  uniqueArray,
  uppercaseFirstLetterOfAllWords,
  wordCount,
} from '../../globalFunctions'
import ModelNames from '../../models/modelNames'

export default function ReviseChildTransferChangeRequest({ hideCard }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, transferRequestToRevise } = state
  const [requestTime, setRequestTime] = useState('')
  const [requestLocation, setRequestLocation] = useState('')
  const [requestDate, setRequestDate] = useState('')
  const [directionsLink, setDirectionsLink] = useState('')

  const resetForm = () => {
    Manager.resetForm('revise-transfer-wrapper')
    setRequestTime('')
    setRequestLocation('')
    setRequestDate('')
    setDirectionsLink('')
    hideCard()
  }

  const submit = async () => {
    if (requestLocation.length === 0 && requestTime.length === 0) {
      displayAlert('error', 'Please choose a new location or time')
      return false
    }
    if (requestDate.length === 0) {
      displayAlert('error', 'Please choose the day of the requested transfer change')
      return false
    }
    let revisedRequest
    revisedRequest = transferRequestToRevise
    if (DateManager.dateIsValid(requestTime)) {
      revisedRequest.time = moment(requestTime).format(DateFormats.timeForDb)
    }
    if (requestLocation.length > 0) {
      revisedRequest.location = requestLocation
    }
    if (requestLocation.directionsLink > 0) {
      revisedRequest.location = directionsLink
    }
    if (DateManager.dateIsValid(requestDate)) {
      revisedRequest.date = moment(requestDate).format(DateFormats.dateForDb)
    }

    const cleanRequest = Manager.cleanObject(revisedRequest, ModelNames.transferChangeRequest)

    // Notify
    if (transferRequestToRevise.recipientPhone) {
      const subId = await NotificationManager.getUserSubId(transferRequestToRevise.requestRecipientPhone)
      PushAlertApi.sendMessage(`Transfer Change Request`, `${formatNameFirstNameOnly(currentUser.name)} has created a Transfer Change request`, subId)
    }
    // Revise
    const updateKey = await DB.getSnapshotKey(DB.tables.transferChangeRequests, transferRequestToRevise, 'id')
    await DB.updateEntireRecord(`${DB.tables.transferChangeRequests}/${updateKey}`, cleanRequest)
    successAlert('Updated')
    resetForm()
  }

  const setDefaults = () => {
    setRequestTime(transferRequestToRevise?.time)
    setRequestDate(transferRequestToRevise?.date)
    const dayInputWrapper = document.querySelector('.day-input-wrapper')
    if (dayInputWrapper) {
      dayInputWrapper.querySelector('input').value = moment(transferRequestToRevise?.date)
    }
  }

  useEffect(() => {
    setDefaults()
  }, [transferRequestToRevise])

  useEffect(() => {
    Manager.showPageContainer('show')
  }, [])

  return (
    <div className="revise-transfer-wrapper">
      <div id="transfer-change-container" className={`${theme} form`}>
        <div className="form transfer-change">
          <div className="flex gap">
            <div>
              {/* DAY */}
              <label>
                Day<span className="asterisk">*</span>
              </label>
              <MobileDatePicker
                format={DateFormats.dateForDb}
                defaultValue={moment(transferRequestToRevise?.date, DateFormats.dateForDb)}
                className="mb-15 mt-0 w-100 day-input-wrapper"
                onChange={(e) => setRequestDate(e)}
              />
            </div>

            {/* TIME */}
            <div>
              <label className="mt-0">
                New Time <span>&nbsp;</span>
              </label>
              <MobileTimePicker
                defaultValue={moment(transferRequestToRevise?.time, DateFormats.timeForDb)}
                className="mb-15 mt-0 w-100"
                onAccept={(e) => setRequestTime(e)}
              />
            </div>
          </div>

          {/*  NEW LOCATION*/}
          <Autocomplete
            defaultValue={transferRequestToRevise?.location}
            placeholder="New Location"
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

          <div className="buttons gap">
            <button className="button card-button" onClick={submit}>
              Send Revision <span className="material-icons-round ml-10 fs-22">send</span>
            </button>
            <button className="button card-button cancel" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

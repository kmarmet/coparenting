import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../context'
import Manager from '@manager'
import Autocomplete from 'react-google-autocomplete'
import moment from 'moment'
import DB from '@db'
import NotificationManager from '@managers/notificationManager.js'
import { MobileDatePicker, MobileTimePicker } from '@mui/x-date-pickers-pro'
import DateFormats from '../../constants/dateFormats'
import DateManager from '../../managers/dateManager'
import ModelNames from '../../models/modelNames'
import BottomCard from '../shared/bottomCard'
import InputWrapper from '../shared/inputWrapper'
import {
  contains,
  formatFileName,
  formatNameFirstNameOnly,
  getFileExtension,
  getFirstWord,
  isAllUppercase,
  removeFileExtension,
  removeSpacesAndLowerCase,
  spaceBetweenWords,
  stringHasNumbers,
  toCamelCase,
  uniqueArray,
  uppercaseFirstLetterOfAllWords,
  wordCount,
} from 'globalFunctions'
import ObjectManager from '../../managers/objectManager'
import AlertManager from '../../managers/alertManager'

export default function ReviseChildTransferChangeRequest({ hideCard, showCard, revisionRequest }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [requestTime, setRequestTime] = useState('')
  const [requestLocation, setRequestLocation] = useState('')
  const [requestDate, setRequestDate] = useState('')
  const [directionsLink, setDirectionsLink] = useState('')
  const [refreshKey, setRefreshKey] = useState(Manager.getUid())

  const resetForm = () => {
    Manager.resetForm('revise-transfer-wrapper')
    setRequestTime('')
    setRequestLocation('')
    setRequestDate('')
    setDirectionsLink('')
    hideCard()
    setRefreshKey(Manager.getUid())
  }

  const submit = async () => {
    if (requestLocation.length === 0 && requestTime.length === 0) {
      AlertManager.throwError('Please choose a new location or time')
      return false
    }
    if (requestDate.length === 0) {
      AlertManager.throwError('Please choose the day of the requested transfer change')
      return false
    }
    let revisedRequest = { ...revisionRequest }
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

    const cleanRequest = ObjectManager.cleanObject(revisedRequest, ModelNames.transferChangeRequest)

    // Notify
    if (revisionRequest?.recipientPhone) {
      const subId = await NotificationManager.getUserSubId(revisionRequest?.recipientPhone, 'phone')
      NotificationManager.sendNotification(
        `Transfer Change Request`,
        `${formatNameFirstNameOnly(currentUser?.name)} has created a Transfer Change request`,
        subId
      )
    }
    // Revise
    const updateKey = await DB.getSnapshotKey(DB.tables.transferChangeRequests, revisionRequest, 'id')
    await DB.updateEntireRecord(`${DB.tables.transferChangeRequests}/${updateKey}`, cleanRequest)
    AlertManager.successAlert('Updated')
    resetForm()
  }

  const setDefaults = () => {
    setRequestTime(revisionRequest?.time)
    setRequestDate(revisionRequest?.date)
    setDirectionsLink(revisionRequest?.directionsLink)
    setRequestLocation(revisionRequest?.preferredTransferLocation)
  }

  useEffect(() => {
    console.log(revisionRequest)
    // setDefaults()
  }, [revisionRequest])

  useEffect(() => {
    setDefaults()
    Manager.showPageContainer()
  })

  return (
    <BottomCard
      onSubmit={submit}
      submitText={'Send Revision'}
      refreshKey={refreshKey}
      title={'Revise Request'}
      showCard={showCard}
      onClose={resetForm}>
      <div className="revise-transfer-wrapper">
        <div id="transfer-change-container" className={`${theme} form`}>
          <div className="form transfer-change">
            <div className="flex gap">
              <div>
                {/* DAY */}
                <InputWrapper inputType={'date'} labelText={'Day'} required={true}>
                  <MobileDatePicker
                    value={moment(requestDate, DateFormats.dateForDb)}
                    className="mb-15 mt-0 w-100 day-input-wrapper"
                    onChange={(e) => setRequestDate(e)}
                  />
                </InputWrapper>
              </div>

              {/* TIME */}
              <InputWrapper inputType={'date'} labelText={'New Time'}>
                <MobileTimePicker
                  value={moment(revisionRequest?.time, DateFormats.timeForDb)}
                  className="mb-15 mt-0 w-100"
                  onAccept={(e) => setRequestTime(e)}
                />
              </InputWrapper>
            </div>

            {/*  NEW LOCATION*/}
            <InputWrapper inputType={'location'} labelText={'New Location'}>
              <Autocomplete
                defaultValue={revisionRequest?.location}
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
            </InputWrapper>

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
    </BottomCard>
  )
}
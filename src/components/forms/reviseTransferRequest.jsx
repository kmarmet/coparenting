import React, { useState, useEffect, useContext } from 'react'
import globalState from '../../context'
import Manager from '@manager'
import Autocomplete from 'react-google-autocomplete'
import CheckboxGroup from '@shared/checkboxGroup'
import TransferChangeRequest from '../../models/transferChangeRequest'
import moment from 'moment'
import DB from '@db'
import NotificationManager from '@managers/notificationManager.js'
import PushAlertApi from '@api/pushAlert'
import ScreenNames from '@screenNames'
import BottomButton from 'components/shared/bottomButton'
import DB_UserScoped from '@userScoped'
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker'
import { MobileTimePicker } from '@mui/x-date-pickers'
import DateFormats from '../../constants/dateFormats'
import DateManager from '../../managers/dateManager'

export default function ReviseChildTransferChangeRequest() {
  const { state, setState } = useContext(globalState)
  const { currentUser, transferRequestToRevise } = state
  const [requestTime, setRequestTime] = useState('')
  const [requestLocation, setRequestLocation] = useState('')
  const [requestDate, setRequestDate] = useState('')
  const [directionsLink, setDirectionsLink] = useState('')

  const submit = async () => {
    if (requestLocation.length === 0 && requestTime.length === 0) {
      setState({ ...state, showAlert: true, alertMessage: 'Please choose a new location or time' })
      return false
    }
    if (requestDate.length === 0) {
      setState({ ...state, showAlert: true, alertMessage: 'Please choose the day of the requested transfer change' })
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

    // Notify
    if (transferRequestToRevise.recipientPhone) {
      const subId = await NotificationManager.getUserSubId(transferRequestToRevise.requestRecipientPhone)
      PushAlertApi.sendMessage(
        `Transfer Change Request`,
        `${currentUser.name.formatNameFirstNameOnly()} has created a Transfer Change request`,
        subId
      )
    }
    // Revise
    const updateKey = await DB.getSnapshotKey(DB.tables.transferChange, transferRequestToRevise, 'id')
    await DB.updateEntireRecord(`${DB.tables.transferChange}/${updateKey}`, revisedRequest).finally(() => {
      setState({ ...state, currentScreen: ScreenNames.transferRequests })
    })
  }

  useEffect(() => {
    setState({ ...state, previousScreen: ScreenNames.transferRequests, showMenuButton: false, showBackButton: true })
    Manager.toggleForModalOrNewForm('show')
    setRequestTime(transferRequestToRevise.time)
    setRequestDate(transferRequestToRevise.date)
  }, [])

  return (
    <>
      <p className="screen-title ">Revise Change Request</p>
      <div id="transfer-change-container" className={`${currentUser?.settings?.theme} page-container form`}>
        <div className="form transfer-change">
          <div className="flex gap">
            <div>
              {/* DAY */}
              <label>
                Day<span className="asterisk">*</span>
              </label>
              <MobileDatePicker
                format={DateFormats.dateForDb}
                defaultValue={moment(transferRequestToRevise.date, DateFormats.dateForDb)}
                className="mb-15 mt-0 w-100"
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
            defaultValue={transferRequestToRevise.location}
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

          {moment(requestDate).format(DateFormats.dateForDb).replace('Invalid date', '').length > 0 && (
            <BottomButton text="Request Change" iconName="send" onClick={submit} elClass={'active visible'} />
          )}
        </div>
      </div>
    </>
  )
}

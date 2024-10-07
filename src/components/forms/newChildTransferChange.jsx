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

export default function NewChildTransferChangeRequest() {
  const { state, setState } = useContext(globalState)
  const { currentUser, currentScreen } = state
  const [requestReason, setRequestReason] = useState('')
  const [shareWith, setShareWith] = useState([])
  const [requestTime, setRequestTime] = useState('')
  const [requestLocation, setRequestLocation] = useState('')
  const [requestDate, setRequestDate] = useState('')
  const [directionsLink, setDirectionsLink] = useState('')
  const [requestRecipientPhone, setRequestRecipientPhone] = useState('')
  const [preferredLocation, setPreferredLocation] = useState('')

  const submit = async () => {
    if (requestRecipientPhone.length === 0) {
      setState({ ...state, showAlert: true, alertMessage: 'Please choose who to send the request to' })
      return false
    } else if (requestLocation.length === 0 && requestTime.length === 0) {
      setState({ ...state, showAlert: true, alertMessage: 'Please choose a new location or time' })
      return false
    } else if (requestDate.length === 0) {
      setState({ ...state, showAlert: true, alertMessage: 'Please choose the day of the requested transfer change' })
      return false
    } else {
      let newRequest = new TransferChangeRequest()
      newRequest.id = Manager.getUid()
      newRequest.reason = requestReason
      newRequest.phone = currentUser.phone
      newRequest.createdBy = currentUser.name
      newRequest.shareWith = Manager.getUniqueArray(shareWith).flat()
      newRequest.time = moment(requestTime).format(DateFormats.timeForDb)
      newRequest.location = requestLocation
      newRequest.date = moment(requestDate).format(DateFormats.dateForDb)
      newRequest.directionsLink = directionsLink
      newRequest.recipientPhone = requestRecipientPhone
      newRequest.preferredTransferLocation = requestLocation

      if (preferredLocation.length > 0) {
        const coparent = currentUser.coparents.filter((x) => x.phone === requestRecipientPhone)[0]
        const key = await DB.getNestedSnapshotKey(`users/${currentUser.phone}/coparents`, coparent, 'id')
        await DB_UserScoped.updateUserRecord(currentUser.phone, `coparents/${key}/preferredTransferLocation`, requestLocation)
      }

      // Notify
      const subId = await NotificationManager.getUserSubId(requestRecipientPhone)
      PushAlertApi.sendMessage(
        `Transfer Change Request`,
        `${currentUser.name.formatNameFirstNameOnly()} has created a Transfer Change request`,
        subId
      )

      // // Add record
      await DB.add(DB.tables.transferChange, newRequest).finally(() => {
        setState({ ...state, currentScreen: ScreenNames.transferRequests })
      })
    }
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
      () => {
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
    setState({ ...state, previousScreen: ScreenNames.transferRequests, showMenuButton: false, showBackButton: true })
    Manager.toggleForModalOrNewForm('show')
  }, [])

  return (
    <>
      <p className="screen-title ">Transfer Change Request</p>
      <div id="transfer-change-container" className="page-container">
        <div className="form transfer-change">
          <div className="flex gap">
            <div>
              <label>
                Day<span className="asterisk">*</span>
              </label>
              <MobileDatePicker className="mb-15 mt-0 w-100" onChange={(e) => setRequestDate(e)} />
            </div>
            <div>
              <label className="mt-0">
                New Time <span>&nbsp;</span>
              </label>
              <MobileTimePicker className="mb-15 mt-0 w-100" onChange={(e) => setRequestTime(e)} />
            </div>
          </div>

          {/*  NEW LOCATION*/}
          <Autocomplete
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

          <CheckboxGroup
            boxWidth={100}
            skipNameFormatting={true}
            dataPhone={currentUser.coparents.map((x) => x.phone)}
            labels={['Set as Preferred Transfer Location']}
            onCheck={handlePreferredLocation}
          />

          {/* SEND REQUEST TO */}
          <textarea className="mb-15" placeholder="Reason" onChange={(e) => setRequestReason(e.target.value)}></textarea>
          {currentUser && (
            <div className="share-with-container">
              <label>
                <span className="material-icons-round notifications">notifications</span>Who is the request being sent to?
                <span className="asterisk">*</span>
              </label>
              <CheckboxGroup
                dataPhone={currentUser.coparents.map((x) => x.phone)}
                labels={currentUser.coparents.map((x) => x.name)}
                onCheck={handleRequestRecipient}
              />
            </div>
          )}
          {currentUser && (
            <div className="share-with-container">
              <label>
                <span className="material-icons-round">visibility</span> Who should see it?
              </label>
              <CheckboxGroup
                dataPhone={currentUser.coparents.map((x) => x.phone)}
                labels={currentUser.coparents.map((x) => x.name)}
                onCheck={handleShareWithSelection}
              />
            </div>
          )}
          {moment(requestDate).format(DateFormats.dateForDb).replace('Invalid date', '').length > 0 && requestRecipientPhone.length > 0 && (
            <BottomButton text="Request Change" iconName="send" onClick={submit} elClass={'active visible'} />
          )}
        </div>
      </div>
    </>
  )
}

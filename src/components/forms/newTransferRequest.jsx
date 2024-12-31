import React, { useContext, useState } from 'react'
import globalState from '../../context'
import Manager from '@manager'
import Autocomplete from 'react-google-autocomplete'
import CheckboxGroup from '@shared/checkboxGroup'
import TransferChangeRequest from '../../models/transferChangeRequest'
import moment from 'moment'
import DB from '@db'
import NotificationManager from '@managers/notificationManager.js'
import DB_UserScoped from '@userScoped'
import { MobileDatePicker, MobileTimePicker } from '@mui/x-date-pickers-pro'
import { ImEye } from 'react-icons/im'
import { formatNameFirstNameOnly } from '../../globalFunctions'
import DateFormats from '../../constants/dateFormats'
import DateManager from '../../managers/dateManager'
import BottomCard from '../shared/bottomCard'
import InputWrapper from '../shared/inputWrapper'
import ShareWithCheckboxes from '../shared/shareWithCheckboxes'
import AlertManager from '../../managers/alertManager'

export default function NewTransferChangeRequest({ hideCard, showCard }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [requestReason, setRequestReason] = useState('')
  const [shareWith, setShareWith] = useState([])
  const [requestTime, setRequestTime] = useState('')
  const [requestLocation, setRequestLocation] = useState('')
  const [requestDate, setRequestDate] = useState('')
  const [directionsLink, setDirectionsLink] = useState('')
  const [requestRecipientPhone, setRequestRecipientPhone] = useState('')
  const [preferredLocation, setPreferredLocation] = useState('')
  const [refreshKey, setRefreshKey] = useState(Manager.getUid())
  const [responseDueDate, setResponseDueDate] = useState('')

  const resetForm = async () => {
    Manager.resetForm('transfer-request-wrapper')
    hideCard()
    setRequestReason('')
    setShareWith([])
    setRequestTime('')
    setRequestLocation('')
    setRequestDate('')
    setDirectionsLink('')
    setRequestRecipientPhone('')
    setPreferredLocation('')
    const updatedCurrentUser = await DB_UserScoped.getCurrentUser(currentUser.phone)
    setState({ ...state, currentUser: updatedCurrentUser })
    setRefreshKey(Manager.getUid())
  }

  const submit = async () => {
    const validAccounts = await DB_UserScoped.getValidAccountsForUser(currentUser)
    if (validAccounts === 0) {
      AlertManager.throwError(
        'No co-parent to \n assign requests to',
        'You have not added any co-parents. Or, it is also possible they have closed their account.'
      )
      return false
    }
    if (!Manager.isValid(requestRecipientPhone)) {
      AlertManager.throwError('Please choose who to send the request to')
      return false
    }
    if (!Manager.isValid(requestLocation) && !Manager.isValid(requestTime)) {
      AlertManager.throwError('Please choose a new location or time')
      return false
    }
    if (!Manager.isValid(requestDate)) {
      AlertManager.throwError('Please choose the day of the requested transfer change')
      return false
    }
    if (validAccounts > 0) {
      if (!Manager.isValid(shareWith)) {
        AlertManager.throwError('Please choose who you would like to share this request with')
        return false
      }
    }
    const requestTimeIsValid = DateManager.dateIsValid(moment(requestTime, DateFormats.timeForDb).format(DateFormats.timeForDb))
    let newRequest = new TransferChangeRequest()
    newRequest.reason = requestReason
    newRequest.ownerPhone = currentUser?.phone
    newRequest.shareWith = Manager.getUniqueArray(shareWith).flat()
    newRequest.time = requestTimeIsValid ? requestTime : ''
    newRequest.location = requestLocation
    newRequest.date = moment(requestDate).format(DateFormats.dateForDb)
    newRequest.directionsLink = directionsLink
    newRequest.recipientPhone = requestRecipientPhone
    newRequest.status = 'pending'
    newRequest.preferredTransferLocation = requestLocation
    newRequest.responseDueDate = responseDueDate

    if (preferredLocation.length > 0) {
      const coparent = currentUser?.coparents.filter((x) => x.phone === requestRecipientPhone)[0]
      const key = await DB.getNestedSnapshotKey(`users/${currentUser?.phone}/coparents`, coparent, 'id')
      await DB_UserScoped.updateUserRecord(currentUser?.phone, `coparents/${key}/preferredTransferLocation`, requestLocation)
    }

    // Notify
    const subId = await NotificationManager.getUserSubId(requestRecipientPhone, 'phone')
    NotificationManager.sendNotification(
      `Transfer Change Request`,
      `${formatNameFirstNameOnly(currentUser?.name)} has created a Transfer Change request`,
      subId
    )

    // // Add record
    await DB.add(DB.tables.transferChangeRequests, newRequest)
    AlertManager.successAlert('Transfer Change Request Sent')

    await resetForm()
  }

  const handleShareWithSelection = async (e) => {
    const updated = await Manager.handleShareWithSelection(e, currentUser, shareWith)
    setShareWith(updated)
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

  const addThemeToDatePickers = () => {
    setTimeout(() => {
      const datetimeParent = document.querySelector('.MuiDialog-root.MuiModal-root')
      datetimeParent.classList.add(currentUser?.settings?.theme)
    }, 100)
  }

  return (
    <BottomCard
      onSubmit={submit}
      submitText={'Send Request'}
      refreshKey={refreshKey}
      wrapperClass="new-transfer-request"
      title={'New Request'}
      showCard={showCard}
      onClose={resetForm}>
      <div className="transfer-request-wrapper">
        <div id="transfer-change-container" className={`${theme} form`}>
          <div className="form transfer-change">
            <div className="flex gap">
              <InputWrapper inputType={'date'} labelText={'Day'} required={true}>
                <MobileDatePicker
                  onOpen={addThemeToDatePickers}
                  className={`${theme}  mt-0 w-100`}
                  onChange={(e) => setRequestDate(moment(e).format(DateFormats.dateForDb))}
                />
              </InputWrapper>
              <InputWrapper inputType={'date'} labelText={'New Time'}>
                <MobileTimePicker
                  onOpen={addThemeToDatePickers}
                  className={`${theme}  mt-0 w-100`}
                  onChange={(e) => setRequestTime(moment(e).format(DateFormats.timeForDb))}
                />
              </InputWrapper>
            </div>

            {/* RESPONSE DUE DATE */}
            <InputWrapper inputType={'date'} labelText={'Respond by'}>
              <MobileDatePicker
                onOpen={addThemeToDatePickers}
                className={`${theme}  w-100`}
                onChange={(day) => setResponseDueDate(moment(day).format(DateFormats.dateForDb))}
              />
            </InputWrapper>

            {/*  NEW LOCATION*/}
            <InputWrapper inputType={'location'} labelText={'New Location'}>
              <Autocomplete
                placeholder={currentUser?.defaultTransferLocation || 'New Location'}
                apiKey={process.env.REACT_APP_AUTOCOMPLETE_ADDRESS_API_KEY}
                options={{
                  types: ['geocode', 'establishment'],
                  componentRestrictions: { country: 'usa' },
                }}
                className=""
                onPlaceSelected={(place) => {
                  setDirectionsLink(`https://www.google.com/maps?daddr=7${encodeURIComponent(place.formatted_address)}`)
                  setRequestLocation(place.formatted_address)
                }}
              />
            </InputWrapper>

            <CheckboxGroup
              skipNameFormatting={true}
              containerClass={'mb-15'}
              dataPhone={currentUser?.coparents?.map((x) => x.phone)}
              checkboxLabels={['Set as Preferred Transfer Location']}
              onCheck={handlePreferredLocation}
            />

            {/* REASON */}
            <InputWrapper inputType={'textarea'} labelText={'Reason'} onChange={(e) => setRequestReason(e.target.value)} />

            {/* SEND REQUEST TO */}
            <CheckboxGroup
              parentLabel={'Who is the request being sent to?'}
              dataPhone={currentUser?.coparents?.map((x) => x.phone)}
              checkboxLabels={currentUser?.coparents?.map((x) => x.name)}
              onCheck={handleRequestRecipient}
              required={true}
            />
            <ShareWithCheckboxes
              icon={<ImEye />}
              shareWith={currentUser?.coparents?.map((x) => x.phone)}
              onCheck={handleShareWithSelection}
              labelText={'Share with'}
              containerClass={'share-with-coparents'}
              dataPhone={currentUser?.coparents?.map((x) => x.phone)}
              checkboxLabels={currentUser?.coparents?.map((x) => x.name)}
            />
          </div>
        </div>
      </div>
    </BottomCard>
  )
}
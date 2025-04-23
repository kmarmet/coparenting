// Path: src\components\screens\notifications?.jsx
import React, {useContext, useEffect, useState} from 'react'
import globalState from '../../context'
import {Fade} from 'react-awesome-reveal'
import {FaMinus, FaPlus} from 'react-icons/fa6'
import AccordionSummary from '@mui/material/AccordionSummary'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import {IoCheckmarkDoneOutline} from 'react-icons/io5'
import DB from '../../database/DB'
import Manager from '../../managers/manager'
import DatetimeFormats from '../../constants/datetimeFormats'
import moment from 'moment'
import NavBar from '../navBar'
import DatasetManager from '../../managers/datasetManager'
import ScreenNames from '../../constants/screenNames'
import ActivityCategory from '../../models/activityCategory'
import {PiSealWarningDuotone} from 'react-icons/pi'
import StringManager from '../../managers/stringManager'
import AppManager from '../../managers/appManager.coffee'
import {IoMdCheckmarkCircleOutline} from 'react-icons/io'
import Spacer from '../shared/spacer'
import Label from '../shared/label'
import NoDataFallbackText from '../shared/noDataFallbackText'
import useNotifications from '../../hooks/useNotifications'
import useCurrentUser from '../../hooks/useCurrentUser'

export default function Notifications() {
  const {state, setState} = useContext(globalState)
  const {theme, notificationCount} = state
  const [legendIsExpanded, setLegendIsExpanded] = useState(false)
  const {currentUser} = useCurrentUser()
  const {notifications} = useNotifications()
  const criticalCategories = [ActivityCategory.expenses, ActivityCategory.childInfo.medical]

  const GetActivities = async () => {
    const toReturn = DatasetManager.sortDates(notifications).reverse()
    await AppManager.setAppBadge(notificationCount)
    setState({...state, notificationCount: toReturn.length})
  }

  const ClearAll = async () => await DB.deleteByPath(`${DB.tables.notifications}/${currentUser?.key}`)

  const ClearActivity = async (activity) => {
    const key = await DB.getSnapshotKey(`${DB.tables.notifications}/${currentUser?.key}`, activity, 'id')
    if (Manager.isValid(key)) {
      await DB.deleteByPath(`${DB.tables.notifications}/${currentUser?.key}/${key}`)
    }
  }

  const GetCategory = (activity) => {
    const title = activity?.title?.toLowerCase()
    const message = activity?.message?.toLowerCase()
    switch (true) {
      case title?.indexOf('event') > -1 || message?.indexOf('event') > -1:
        return {
          screen: ScreenNames.calendar,
          className: 'calendar',
          category: ActivityCategory.calendar,
        }

      case title?.indexOf('message') > -1 || message?.indexOf('message') > -1:
        return {
          screen: ScreenNames.chats,
          className: 'chats',
          category: ActivityCategory.chats,
        }

      case title?.indexOf('medical') > -1:
        return {
          screen: ScreenNames.childInfo,
          className: 'medical',
          category: ActivityCategory.childInfo.medical,
        }

      case title?.indexOf('expense') > -1:
        return {
          screen: ScreenNames.expenseTracker,
          className: 'expenses',
          category: ActivityCategory.expenses,
        }

      case title?.indexOf('transfer') > -1:
        return {
          screen: ScreenNames.transferRequests,
          className: 'transfer',
          category: ActivityCategory.transferRequest,
        }

      case title?.indexOf('swap') > -1:
        return {
          screen: ScreenNames.swapRequests,
          className: 'swap',
          category: ActivityCategory.swapRequest,
        }

      default:
        return {
          screen: ScreenNames.notifications,
          className: 'normal',
          category: 'normal',
        }
    }
  }

  const ChangeScreen = (screenName, activity) => {
    ClearActivity(activity).then()
    setTimeout(() => {
      setState({...state, currentScreen: ScreenNames[screenName]})
    }, 500)
  }

  useEffect(() => {
    if (Manager.isValid(notifications)) {
      GetActivities().then()
    }
  }, [notifications])

  return (
    <>
      <div id="activity-wrapper" className={`${theme} page-container`}>
        <p className="screen-title">Notifications</p>
        <p className="screen-intro-text">Stay updated with all developments and notifications as they happen.</p>

        {/* LEGEND */}
        <Spacer height={5} />
        {Manager.isValid(currentUser?.accountType) && currentUser?.accountType === 'parent' && (
          <div className="flex">
            <Accordion id={'legend'} expanded={legendIsExpanded} className={`${theme} accordion`}>
              <AccordionSummary>
                <button className="button default grey" onClick={() => setLegendIsExpanded(!legendIsExpanded)}>
                  <Label text={'Legend'} /> {legendIsExpanded ? <FaMinus /> : <FaPlus />}
                </button>
              </AccordionSummary>
              <Spacer height={5} />
              <AccordionDetails>
                <div className="flex">
                  <div className="box medical"></div>
                  <p>Child Info - Medical</p>
                </div>

                <div className="flex">
                  <div className="box expenses"></div>
                  <p>Expenses</p>
                </div>
              </AccordionDetails>
            </Accordion>
          </div>
        )}

        <Spacer height={5} />

        {/* CLEAR ALL BUTTON */}
        {notifications?.length > 0 && (
          <button className="button default bottom-right" onClick={ClearAll}>
            Clear All <IoCheckmarkDoneOutline className={'ml-5'} />
          </button>
        )}
        <Fade direction={'up'} duration={1000} className={'activity-fade-wrapper'} triggerOnce={true}>
          {/* LOOP ACTIVITIES */}

          <div id="activity-cards">
            {Manager.isValid(notifications) &&
              notifications?.map((activity, index) => {
                const {text, title, creationDate} = activity
                const categoryObject = GetCategory(activity)
                const {screen, category, className} = categoryObject

                return (
                  <div key={index} className="flex" id="row-wrapper">
                    <div className={`activity-row row ${className}`} onClick={() => ChangeScreen(screen, activity)}>
                      <p className={`card-title ${className}`}>
                        {criticalCategories.includes(category) && <PiSealWarningDuotone />} {StringManager.uppercaseFirstLetterOfAllWords(title)}
                      </p>
                      <p className="text">{text}</p>
                      <p id="date">{moment(creationDate, DatetimeFormats.fullDatetime).format(DatetimeFormats.readableDatetime)}</p>
                    </div>
                    <IoMdCheckmarkCircleOutline className={'row-checkmark'} onClick={() => ClearActivity(activity)} />
                  </div>
                )
              })}
          </div>
        </Fade>
      </div>
      {notifications?.length === 0 && <NoDataFallbackText text={'You have no notifications awaiting your attention'} />}
      <NavBar navbarClass={'activity no-add-new-button'}></NavBar>
    </>
  )
}
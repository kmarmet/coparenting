// Path: src\components\screens\notifications?.jsx
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import moment from 'moment'
import React, {useContext, useEffect, useState} from 'react'
import {FaMinus, FaPlus} from 'react-icons/fa6'
import {IoMdCheckmarkCircleOutline} from 'react-icons/io'
import {MdClearAll} from 'react-icons/md'
import ActivityCategory from '../../constants/activityCategory'
import DatetimeFormats from '../../constants/datetimeFormats'
import ScreenNames from '../../constants/screenNames'
import globalState from '../../context'
import DB from '../../database/DB'
import useCurrentUser from '../../hooks/useCurrentUser'
import useUpdates from '../../hooks/useUpdates'
import AppManager from '../../managers/appManager.coffee'
import DomManager from '../../managers/domManager'
import Manager from '../../managers/manager'
import StringManager from '../../managers/stringManager'
import NavBar from '../navBar'
import Label from '../shared/label'
import NoDataFallbackText from '../shared/noDataFallbackText'
import ScreenHeader from '../shared/screenHeader'
import Spacer from '../shared/spacer'

export default function Updates() {
  const {state, setState} = useContext(globalState)
  const {theme} = state
  const [legendIsExpanded, setLegendIsExpanded] = useState(false)
  const {currentUser} = useCurrentUser()
  const {updates} = useUpdates()
  const criticalCategories = [ActivityCategory.expenses, ActivityCategory.childInfo.medical]

  const SetAppBadge = async () => await AppManager.setAppBadge(updates?.length)

  const ClearAll = async () => await DB.DeleteByPath(`${DB.tables.updates}/${currentUser?.key}`)

  const ClearNotification = async (activity) => {
    const recordIndex = DB.GetTableIndexById(updates, activity?.id)
    if (Manager.IsValid(recordIndex)) {
      await DB.DeleteByPath(`${DB.tables.updates}/${currentUser?.key}/${recordIndex}`)
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
          screen: ScreenNames.children,
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
          screen: ScreenNames.updates,
          className: 'normal',
          category: 'normal',
        }
    }
  }

  const ChangeScreen = (screenName, activity) => {
    ClearNotification(activity).then()
    setTimeout(() => {
      setState({...state, currentScreen: ScreenNames[screenName]})
    }, 500)
  }

  const GetCriticalCategoryColor = (category) => {
    switch (true) {
      case category === ActivityCategory.expenses:
        return 'yellow'
      case category === ActivityCategory.childInfo.medical:
        return 'red'
      default:
        return null
    }
  }

  useEffect(() => {
    if (Manager.IsValid(updates)) {
      setTimeout(() => {
        DomManager.ToggleAnimation('add', 'row', DomManager.AnimateClasses.names.fadeInRight)
      }, 300)
      SetAppBadge().then()
    }
  }, [updates])

  return (
    <>
      <div id="activity-wrapper" className={`${theme} page-container`}>
        <ScreenHeader
          screenName={ScreenNames.updates}
          screenDescription="Stay updated with all developments for your contacts, as they happen."
          title={'Updates'}
        />

        <div className="screen-content">
          {/* LEGEND */}
          <Spacer height={10} />
          {Manager.IsValid(currentUser?.accountType) && currentUser?.accountType === 'parent' && (
            <div className="flex">
              <Accordion id={'updates-legend'} expanded={legendIsExpanded} className={`${theme} accordion white-bg`}>
                <AccordionSummary>
                  <button className="button default grey" onClick={() => setLegendIsExpanded(!legendIsExpanded)}>
                    <Label text={'Legend'} classes="always-show" /> {legendIsExpanded ? <FaMinus /> : <FaPlus />}
                  </button>
                </AccordionSummary>
                <AccordionDetails>
                  <div className="flex">
                    <div className="box medical"></div>
                    <p>Medical (Child)</p>
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
          {updates?.length > 0 && (
            <button className="button default bottom-right" onClick={ClearAll}>
              Clear All <MdClearAll className={'ml-5 fs-25'} />
            </button>
          )}

          {/* LOOP ACTIVITIES */}
          <div id="activity-cards">
            {Manager.IsValid(updates) &&
              updates?.map((activity, index) => {
                const {text, title, timestamp} = activity
                const categoryObject = GetCategory(activity)
                const {screen, category, className} = categoryObject

                return (
                  <div key={index} className="flex" id="row-wrapper">
                    <div className={`activity-row row ${className}`} onClick={() => ChangeScreen(screen, activity)}>
                      <div className="row-content">
                        {criticalCategories.includes(category) && <span className={`dot ${GetCriticalCategoryColor(category)}`}></span>}
                        <div>
                          <p className={`card-title ${className}`}>{StringManager.uppercaseFirstLetterOfAllWords(title)}</p>
                          <p className="text">{text}</p>
                          <p id="date">{moment(timestamp, DatetimeFormats.timestamp).format(DatetimeFormats.readableDatetime)}</p>
                        </div>
                      </div>
                    </div>
                    <IoMdCheckmarkCircleOutline className={'row-checkmark'} onClick={() => ClearNotification(activity)} />
                  </div>
                )
              })}
          </div>
        </div>
        {updates?.length === 0 && <NoDataFallbackText text={'You have no updates awaiting your attention'} />}
      </div>
      <NavBar navbarClass={'activity no-Add-new-button'}></NavBar>
    </>
  )
}
import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../context'
import '@prototypes'
import { Fade } from 'react-awesome-reveal'
import { child, getDatabase, onValue, ref } from 'firebase/database'
import { FaCheck, FaChevronDown } from 'react-icons/fa6'
import AccordionSummary from '@mui/material/AccordionSummary'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'

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
} from '../../globalFunctions'
import { IoCheckmarkDoneOutline } from 'react-icons/io5'
import DB from '@db'
import Manager from '@manager'
import DateFormats from '../../constants/dateFormats'
import moment from 'moment'
import NoDataFallbackText from '../shared/noDataFallbackText'
import NavBar from '../navBar'
import DatasetManager from '../../managers/datasetManager'
import ScreenNames from '@screenNames'
import ActivityCategory from '../../models/activityCategory'
import { PiSealWarningDuotone } from 'react-icons/pi'

export default function Activity() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, activitySet } = state
  const [activities, setActivities] = useState([])
  const [legendIsExpanded, setLegendIsExpanded] = useState(false)
  const getActivities = async () => {
    const all = await DB.getTable(`${DB.tables.activities}/${currentUser.phone}`)
    const toReturn = DatasetManager.sortDates(all)
    setState({ ...state, activityCount: toReturn.length })
    setActivities(toReturn)
  }

  const clearAll = async () => await DB.deleteByPath(`${DB.tables.activities}/${currentUser.phone}`)

  const onTableChange = async () => {
    const dbRef = ref(getDatabase())
    onValue(child(dbRef, `${DB.tables.activities}/${currentUser.phone}`), async (snapshot) => {
      await getActivities().then((r) => r)
    })
  }

  const clearActivity = async (activity) => {
    const key = await DB.getSnapshotKey(`${DB.tables.activities}/${currentUser.phone}`, activity, 'id')
    await DB.deleteByPath(`${DB.tables.activities}/${currentUser.phone}/${key}`)
  }

  const getCategory = (activity) => {
    const title = activity?.title?.toLowerCase()
    const message = activity?.message?.toLowerCase()
    switch (true) {
      case title?.indexOf('event') > -1 || message?.indexOf('event') > -1:
        return {
          screen: ScreenNames.calendar,
          className: 'calendar',
          category: ActivityCategory.calendar,
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

      default:
        return {
          screen: ScreenNames.activity,
          className: 'normal',
          category: 'normal',
        }
    }
  }

  const changeScreen = (screenName) => setState({ ...state, currentScreen: ScreenNames[screenName] })

  useEffect(() => {
    onTableChange().then((r) => r)
  }, [])

  const criticalCategories = [ActivityCategory.expenses, ActivityCategory.childInfo.medical]

  return (
    <>
      <div id="activity-wrapper" className={`${theme} form page-container`}>
        {activities.length === 0 && <NoDataFallbackText text={'No current activity'} />}
        <p className="screen-title">Activity</p>
        <Fade direction={'up'} duration={1000} className={'activity-fade-wrapper'} triggerOnce={true}>
          <p className="intro-text mb-15">Stay informed with all co-parenting and child-related updates and activity.</p>

          <div className="flex">
            <Accordion id={'legend'} expanded={legendIsExpanded}>
              <AccordionSummary expandIcon={<FaChevronDown />}>
                <p id="legend-title" onClick={() => setLegendIsExpanded(!legendIsExpanded)}>
                  Legend
                </p>
              </AccordionSummary>
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

            {/* CLEAR ALL BUTTON */}
            {activities.length > 0 && (
              <button className="clear-all button green center default" onClick={clearAll}>
                Clear All <IoCheckmarkDoneOutline className={'ml-5'} />
              </button>
            )}
          </div>

          {/* LOOP ACTIVITIES */}
          <div id="activity-cards">
            {Manager.isValid(activities, true) &&
              activities.map((activity, index) => {
                const { text, title, dateCreated, creatorPhone, id } = activity
                const categoryObject = getCategory(activity)
                const { screen, category, className } = categoryObject

                return (
                  <div className="flex" id="row-wrapper">
                    <div className={`activity-row row ${className}`} onClick={() => changeScreen(screen)}>
                      <p className={`card-title ${className}`}>
                        {criticalCategories.includes(category) && <PiSealWarningDuotone />} {uppercaseFirstLetterOfAllWords(title)}{' '}
                      </p>
                      <p className="text">{text}</p>
                      <p id="date">{moment(dateCreated, DateFormats.fullDatetime).format(DateFormats.readableDatetime)}</p>
                    </div>
                    <div id="svg-wrapper" onClick={() => clearActivity(activity)}>
                      <FaCheck />
                    </div>
                  </div>
                )
              })}
          </div>
        </Fade>
      </div>
      <NavBar navbarClass={'activity no-add-new-button'}></NavBar>
    </>
  )
}
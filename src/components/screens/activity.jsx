import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../context'
import '@prototypes'
import { Fade } from 'react-awesome-reveal'
import { child, getDatabase, onValue, ref } from 'firebase/database'

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

export default function Activity() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, activitySet } = state
  const [activities, setActivities] = useState([])

  const getActivities = async () => {
    const all = await DB.getTable(`${DB.tables.activities}/${currentUser.phone}`)
    setActivities(all)
  }

  const clearAll = async () => {
    await DB.deleteByPath(`${DB.tables.activities}/${currentUser.phone}`)
  }

  const onTableChange = async () => {
    const dbRef = ref(getDatabase())
    onValue(child(dbRef, `${DB.tables.activities}/${currentUser.phone}`), async (snapshot) => {
      await getActivities().then((r) => r)
    })
  }

  useEffect(() => {
    onTableChange().then((r) => r)
  }, [])

  return (
    <>
      <div id="activity-wrapper" className={`${theme} form page-container`}>
        {activities.length === 0 && <NoDataFallbackText text={'No current activity'} />}
        <p className="screen-title">Activity</p>
        <Fade direction={'up'} duration={1000} className={'visitation-fade-wrapper'} triggerOnce={true} cascade={true}>
          <p className="intro-text mb-15">Stay informed with all co-parenting and child-related updates and activity.</p>
          <div id="activity-cards">
            {Manager.isValid(activities, true) &&
              activities.map((activity, index) => {
                const { text, title, priority, category, dateCreated, creatorPhone } = activity
                return (
                  <div key={index} className={`activity-row row ${category}`}>
                    <p className="card-title flex">
                      {uppercaseFirstLetterOfAllWords(title)}{' '}
                      <span className="date">{moment(dateCreated, DateFormats.fullDatetime).format(DateFormats.readableDatetime)}</span>
                    </p>

                    <p className="text">{text}</p>
                  </div>
                )
              })}
          </div>
          {activities.length > 0 && (
            <button className="clear-all button green center default p-5 mt-15" onClick={clearAll}>
              Clear All <IoCheckmarkDoneOutline className={'ml-5'} />
            </button>
          )}
        </Fade>
      </div>
      <NavBar navbarClass={'activity no-add-new-button'}></NavBar>
    </>
  )
}
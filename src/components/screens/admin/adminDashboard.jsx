import React, { useState, useEffect, useContext, Fragment } from 'react'
import CheckboxGroup from '@shared/checkboxGroup'
import globalState from '../../../context'
import {
  toCamelCase,
  getFirstWord,
  formatFileName,
  isAllUppercase,
  removeSpacesAndLowerCase,
  stringHasNumbers,
  wordCount,
  uppercaseFirstLetterOfAllWords,
  spaceBetweenWords,
  formatNameFirstNameOnly,
  removeFileExtension,
  contains,
  displayAlert,
  formatPhone,
  uniqueArray,
  getFileExtension,
  successAlert,
} from '../../../globalFunctions'
import AppManager from '../../../managers/appManager'

export default function AdminDashboard() {
  const { state, setState } = useContext(globalState)

  const setNewUpdate = async () => {
    AppManager.setUpdateAvailable()
    successAlert('Updated')
  }

  const deletedExpiredCalEvents = async () => AppManager.deleteExpiredCalendarEvents().then((r) => r)
  const deleteExpiredMemories = async () => AppManager.deleteExpiredMemories().then((r) => r)
  const setHolidays = async () => AppManager.setHolidays()

  return (
    <div id="admin-dashboard-wrapper" className="page-container form">
      <div className="flex grid gap-10">
        {/* SET UPDATE AVAILABLE */}
        <div className="box">
          <p className="box-title">Set Update Available</p>
          <button className="button default center green" onClick={setNewUpdate}>
            Update
          </button>
        </div>

        {/* DELETE EXPIRED STUFF */}
        <div className="box">
          <p className="box-title">Delete Expired</p>
          <div className="buttons flex gap-10">
            <button className="button white default" onClick={deleteExpiredMemories}>
              Memories
            </button>
            <button className="button white default" onClick={deletedExpiredCalEvents}>
              Events
            </button>
          </div>
        </div>

        {/* SET HOLIDAYS */}
        <div className="box">
          <p className="box-title">Set Holidays</p>
          <div className="buttons flex">
            <button className="button green default center" onClick={setHolidays}>
              Add to Cal
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

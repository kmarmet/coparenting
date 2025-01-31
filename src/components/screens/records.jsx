import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../context'
import { Fade } from 'react-awesome-reveal'
import Manager from '../../managers/manager'
import NavBar from '../navBar'
import CheckboxGroup from '../shared/checkboxGroup.jsx'
import SecurityManager from '../../managers/securityManager.coffee'
import DatasetManager from '../../managers/datasetManager.coffee'
import StringManager from '../../managers/stringManager.coffee'
import moment from 'moment'
import DateFormats from '../../constants/dateFormats.coffee'
export default function Records() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, activityCount } = state
  const [recordType, setRecordType] = useState('Expenses')
  const [expenses, setExpenses] = useState([])

  const getExpenses = async () => {
    let allExpenses = await SecurityManager.getExpenses(currentUser)
    allExpenses = DatasetManager.getUniqueArray(allExpenses, 'id')
    const categories = allExpenses.map((x) => x.category).filter((x) => x !== '')
    setExpenses(allExpenses)
    return allExpenses
  }

  const getCoparent = (phone) => {
    return currentUser?.coparents.filter((x) => x.phone === phone)[0]
  }

  const handleRecordTypeSelection = (e) => {
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        setRecordType(e)
      },
      (e) => {
        setRecordType('')
      },
      false
    )
  }

  useEffect(() => {
    getExpenses().then((r) => r)
  }, [])

  return (
    <>
      <div id="records-wrapper" className={`${theme} form page-container`}>
        <p className="screen-title">Records</p>
        <Fade direction={'up'} duration={1000} className={'activity-fade-wrapper'} triggerOnce={true}>
          <p className="intro-text mb-15">
            Access and/or export data that you or your co-parent have created. This data can be used for reference or court.
          </p>

          {/* RECORD TYPE */}
          <CheckboxGroup
            containerClass={'reminder-times'}
            elClass={`${theme}`}
            skipNameFormatting={true}
            defaultLabels={['Expenses']}
            checkboxLabels={['Expenses', 'Chats']}
            onCheck={handleRecordTypeSelection}
          />

          {/* FILTERS */}
          {/*todo Add Filters*/}

          {/* ITERATE DATA */}
          {recordType === 'Expenses' &&
            Manager.isValid(expenses) &&
            expenses.map((expense, index) => {
              return (
                <div id="row">
                  <div className="flex" id="title-row">
                    <p className="title">{expense.name}</p>
                    <p className="amount">${expense.amount}</p>
                  </div>
                  <p className="smaller-text low-opacity-text created-by">
                    Created by: <span>{StringManager.formatNameFirstNameOnly(getCoparent(expense.ownerPhone)?.name)}</span>
                  </p>
                  <p className="smaller-text low-opacity-text date">
                    Date Added: <span>{moment(expense.dateAdded).format(DateFormats.monthDayYear)}</span>
                  </p>
                </div>
              )
            })}
        </Fade>
      </div>
      <NavBar navbarClass={'activity no-add-new-button'}></NavBar>
    </>
  )
}
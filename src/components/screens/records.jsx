import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../context'
import { Fade } from 'react-awesome-reveal'
import Manager from '/src/managers/manager'
import NavBar from '../navBar'
import CheckboxGroup from '/src/components/shared/checkboxGroup.jsx'
import SecurityManager from '/src/managers/securityManager.coffee'
import DatasetManager from '/src/managers/datasetManager.coffee'
import StringManager from '/src/managers/stringManager.coffee'
import moment from 'moment'
import DateFormats from '/src/constants/dateFormats.coffee'
import MenuItem from '@mui/material/MenuItem'
import SelectDropdown from '/src/components/shared/selectDropdown.jsx'
import Label from '/src/components/shared/label.jsx'
import RecordsManager from '/src/managers/recordsManager.coffee'
import { RiFileExcel2Fill } from 'react-icons/ri'
const SortByTypes = {
  nearestDueDate: 'Nearest Due Date',
  recentlyAdded: 'Recently Added',
  amountDesc: 'Amount: High to Low',
  amountAsc: 'Amount: Low to High',
  nameAsc: 'Name (ascending)',
  nameDesc: 'Name (descending)',
}

const RecordTypes = {
  Expenses: 'Expenses',
  Chats: 'Chats',
}

export default function Records() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, activityCount } = state
  const [recordType, setRecordType] = useState(RecordTypes.Expenses)
  const [expenses, setExpenses] = useState([])
  const [sortMethod, setSortMethod] = useState(SortByTypes.recentlyAdded)

  const getExpenses = async () => {
    let allExpenses = await SecurityManager.getExpenses(currentUser)
    allExpenses = DatasetManager.getUniqueArray(allExpenses, 'id')
    setExpenses(allExpenses)

    return allExpenses
  }

  const getCoparent = (phone) => currentUser?.coparents.filter((x) => x.phone === phone)[0]

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

  const handlePayerSelection = (e) => {
    Manager.handleCheckboxSelection(
      e,
      async (e) => {
        let allExpenses = await SecurityManager.getExpenses(currentUser)
        let filteredExpenses = []
        if (e === 'Me') {
          filteredExpenses = allExpenses.filter((x) => x.payer.phone === currentUser.phone)
        } else {
          const coparent = currentUser?.coparents?.filter((x) => x.name.includes(e))[0]
          filteredExpenses = allExpenses.filter((x) => x.payer.phone === coparent.phone)
        }

        if (Manager.isValid(filteredExpenses)) {
          setExpenses(filteredExpenses)
        } else {
          setExpenses([])
        }
      },
      async (e) => {
        let allExpenses = await SecurityManager.getExpenses(currentUser)
        setExpenses(allExpenses)
      },
      false
    )
  }

  const handleSortBySelection = (e) => {
    const sortByName = e.target.value
    const expensesAsNumbers = expenses.map((expense) => {
      expense.amount = parseInt(expense?.amount)
      return expense
    })
    if (sortByName === SortByTypes.recentlyAdded) {
      setExpenses(expenses.sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded)).reverse())
      setSortMethod(SortByTypes.recentlyAdded)
    }
    // High -> Low
    if (sortByName === SortByTypes.amountDesc) {
      const sortByAmountDesc = DatasetManager.sortByProperty(expensesAsNumbers, 'amount', 'desc')
      setExpenses(sortByAmountDesc)
      setSortMethod(SortByTypes.amountDesc)
    }
    // Low -> High
    if (sortByName === SortByTypes.amountAsc) {
      const sortedByAmountAsc = DatasetManager.sortByProperty(expensesAsNumbers, 'amount', 'asc')
      setExpenses(sortedByAmountAsc)
      setSortMethod(SortByTypes.amountAsc)
    }
  }

  const exportExpenses = () => RecordsManager.createCSV(expenses, 'Peaceful_coParenting_Exported_Expenses')

  useEffect(() => {
    getExpenses().then((r) => r)
  }, [])

  return (
    <>
      <div id="records-wrapper" className={`${theme} form page-container`}>
        <p className="screen-title">Records</p>
        <Fade direction={'up'} duration={1000} className={'activity-fade-wrapper'} triggerOnce={true}>
          <p className="intro-text mb-15">
            Access and/or export data that you or your co-parent have created. This data can be used for your own personal reference, court or for any
            other reason you desire.
          </p>
          <p className="intro-text mb-15">You can export (.csv/Excel spreadsheet) with or without filters/sorting applied.</p>

          {/* RECORD TYPE */}
          <Label text={'Record Type'} />
          <CheckboxGroup
            containerClass={'reminder-times'}
            elClass={`${theme}`}
            skipNameFormatting={true}
            defaultLabels={['Expenses']}
            checkboxLabels={['Expenses', 'Chats']}
            onCheck={handleRecordTypeSelection}
          />

          {/* PAYERS */}
          {currentUser?.coparents.length > 1 && (
            <>
              <Label text={'Payer'} />
              <CheckboxGroup
                elClass={'payers'}
                skipNameFormatting={true}
                defaultLabels={currentUser?.coparents?.map((x) => x.name)[0]}
                checkboxLabels={[...currentUser?.coparents?.map((x) => x.name), 'Me']}
                onCheck={handlePayerSelection}
                dataPhone={[...currentUser?.coparents?.map((x) => x.phone), currentUser?.phone]}
              />
            </>
          )}

          {/* SORTING */}
          <div id="sorting-wrapper">
            <Label text={'Sorting'} />
            <SelectDropdown id={'sorting-dropdown'} wrapperClasses={'sorting-dropdown'} selectValue={sortMethod} onChange={handleSortBySelection}>
              <MenuItem value={SortByTypes.recentlyAdded}>{SortByTypes.recentlyAdded}</MenuItem>
              <MenuItem value={SortByTypes.amountDesc}>{SortByTypes.amountDesc}</MenuItem>
              <MenuItem value={SortByTypes.amountAsc}>{SortByTypes.amountAsc}</MenuItem>
            </SelectDropdown>
          </div>

          {recordType === RecordTypes.Expenses && Manager.isValid(expenses) && (
            <p id="export-button" onClick={exportExpenses}>
              Export <RiFileExcel2Fill />
            </p>
          )}

          {/* ITERATE DATA */}
          {recordType === 'Expenses' &&
            Manager.isValid(expenses) &&
            expenses.map((expense, index) => {
              return (
                <div id="row" className={recordType.toLowerCase()}>
                  <p className="title">
                    {expense.name} <span>${expense.amount}</span>
                  </p>
                  <table>
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Creator</th>
                        <th>Payer</th>
                        <th>Date Added</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{StringManager.uppercaseFirstLetterOfAllWords(expense?.paidStatus)}</td>
                        <td>{StringManager.formatNameFirstNameOnly(getCoparent(expense.ownerPhone)?.name)}</td>
                        <td>{StringManager.formatNameFirstNameOnly(expense.payer.name)}</td>
                        <td>{moment(expense.dateAdded).format(DateFormats.monthDayYear)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )
            })}
        </Fade>
      </div>
      <NavBar navbarClass={'activity no-add-new-button'}></NavBar>
    </>
  )
}
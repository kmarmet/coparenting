import React, {useContext, useEffect, useState} from 'react'
// Path: src\components\screens\archives.jsx
import CheckboxGroup from '/src/components/shared/checkboxGroup.jsx'
import Label from '/src/components/shared/label.jsx'
import SelectDropdown from '/src/components/shared/selectDropdown.jsx'
import DatetimeFormats from '/src/constants/datetimeFormats.coffee'
import DatasetManager from '/src/managers/datasetManager.coffee'
import Manager from '/src/managers/manager'
import ArchivesManager from '/src/managers/archivesManager.coffee'
import SecurityManager from '/src/managers/securityManager.coffee'
import StringManager from '/src/managers/stringManager.coffee'
import MenuItem from '@mui/material/MenuItem'
import moment from 'moment'
import {Fade} from 'react-awesome-reveal'
import {RiFileExcel2Fill} from 'react-icons/ri'
import globalState from '../../context'
import NavBar from '../navBar'
import Spacer from '../shared/spacer'
import useExpenses from '../../hooks/useExpenses'
import useCurrentUser from '../../hooks/useCurrentUser'
import useCoparents from '../../hooks/useCoparents'
import useChat from '../../hooks/useChat'

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

export default function Archives() {
  const {state, setState} = useContext(globalState)
  const {theme} = state
  const [recordType, setRecordType] = useState(RecordTypes.Expenses)
  const [sortMethod, setSortMethod] = useState(SortByTypes.recentlyAdded)
  const [activeChats, setActiveChats] = useState([])
  const [expensePayers, setExpensePayers] = useState([])
  const [sortedExpenses, setSortedExpenses] = useState(false)
  const [selectedChatId, setSelectedChatId] = useState()
  const {expenses} = useExpenses()
  const {currentUser} = useCurrentUser()
  const {coparents} = useCoparents()
  const {chats, chatMessages} = useChat(selectedChatId)

  const GetExpenses = async () => {
    let payers = []
    for (const expense of expenses) {
      if (expense.payer.key === currentUser.key) {
        payers.push('Me')
      } else {
        payers.push(expense.payer.key)
      }
    }
    let payerNames = []
    for (const payerKey of payers) {
      if (payerKey === 'Me') {
        payerNames.push('Me')
      } else {
        const coparent = coparents?.find((x) => x.userKey === payerKey)
        payerNames.push(coparent?.name)
      }
    }

    setExpensePayers(DatasetManager.getUniqueArray(payerNames, true))
    const _sortedExpenses = expenses.sort((a, b) => new Date(a.creationDate) - new Date(b.creationDate)).reverse()
    setSortedExpenses(_sortedExpenses)

    return expenses
  }

  const HandleRecordTypeSelection = (e) => {
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        setRecordType(e)
      },
      () => {
        setRecordType('')
      },
      false
    )
  }

  const HandlePayerSelection = (e) => {
    Manager.handleCheckboxSelection(
      e,
      async (e) => {
        let allExpenses = await SecurityManager.getExpenses(currentUser)
        let filteredExpenses = []
        if (e === 'Me') {
          filteredExpenses = allExpenses.filter((x) => x.payer?.key === currentUser?.key)
        } else {
          const coparent = currentUser?.coparents?.find((x) => x.name.includes(e))
          filteredExpenses = allExpenses.filter((x) => x.payer?.key === coparent?.key)
        }

        if (Manager.isValid(filteredExpenses)) {
          setSortedExpenses(filteredExpenses)
        } else {
          setSortedExpenses([])
        }
      },
      async () => {
        let allExpenses = await SecurityManager.getExpenses(currentUser)
        setSortedExpenses(allExpenses)
      },
      false
    )
  }

  const HandleSortBySelection = (e) => {
    const sortByName = e.target.value
    const expensesAsNumbers = expenses.map((expense) => {
      expense.amount = parseInt(expense?.amount)
      return expense
    })
    if (sortByName === SortByTypes.recentlyAdded) {
      setSortedExpenses(expenses.sort((a, b) => new Date(a.creationDate) - new Date(b.creationDate)).reverse())
      setSortMethod(SortByTypes.recentlyAdded)
    }
    // High -> Low
    if (sortByName === SortByTypes.amountDesc) {
      const sortByAmountDesc = DatasetManager.sortByProperty(expensesAsNumbers, 'amount', 'desc')
      setSortedExpenses(sortByAmountDesc)
      setSortMethod(SortByTypes.amountDesc)
    }
    // Low -> High
    if (sortByName === SortByTypes.amountAsc) {
      const sortedByAmountAsc = DatasetManager.sortByProperty(expensesAsNumbers, 'amount', 'asc')
      setSortedExpenses(sortedByAmountAsc)
      setSortMethod(SortByTypes.amountAsc)
    }
  }

  const ExportExpenses = () => ArchivesManager.createCSV(expenses, 'Peaceful_coParenting_Exported_Expenses', 'expenses')

  const ExportChat = () => ArchivesManager.createCSV(chatMessages, 'Peaceful_coParenting_Exported_Chat', 'chat')

  const DefineChatCheckboxes = async () => {
    let activeChats = []
    if (Manager.isValid(chats)) {
      for (const chat of chats) {
        let coparent = chat.members.find((x) => x.key !== currentUser?.key)
        activeChats.push({
          name: StringManager.getFirstNameOnly(coparent?.name),
          id: chat.id,
        })
      }
      setActiveChats(activeChats)
    }
  }

  useEffect(() => {
    if (Manager.isValid(expenses)) {
      GetExpenses().then((r) => r)
    }
    DefineChatCheckboxes().then((r) => r)
  }, [expenses])

  return (
    <>
      <div id="records-wrapper" className={`${theme} form page-container`}>
        <p className="screen-title">Archives</p>
        <p className="intro-text mb-15">
          In the archives you can access and export data generated by you or your co-parent. This information can be utilized for personal reference,
          legal proceedings, or any other purpose you may require.
        </p>
        <p className="intro-text mb-15">Data can be exported as an Excel spreadsheet format, with options to apply filters or sorting as needed.</p>

        {/* RECORD TYPE */}
        <CheckboxGroup
          containerClass={'reminder-times'}
          elClass={`${theme}`}
          parentLabel="Record Type"
          skipNameFormatting={true}
          checkboxArray={Manager.buildCheckboxGroup({
            currentUser,
            labelType: 'record-types',
            defaultLabels: ['Expenses'],
          })}
          onCheck={HandleRecordTypeSelection}
        />

        {/* PAYERS */}
        {coparents?.length > 1 && recordType === RecordTypes.Expenses && (
          <>
            <Spacer height={5} />
            <CheckboxGroup
              elClass={'payers'}
              skipNameFormatting={true}
              parentLabel="Payer"
              checkboxArray={Manager.buildCheckboxGroup({
                currentUser,
                customLabelArray: expensePayers,
              })}
              onCheck={HandlePayerSelection}
            />
          </>
        )}

        {/* SORTING */}
        {recordType === RecordTypes.Expenses && Manager.isValid(expenses) && (
          <div id="sorting-wrapper">
            <Label text={'Sorting'} />
            <SelectDropdown id={'sorting-dropdown'} wrapperClasses={'sorting-dropdown'} selectValue={sortMethod} onChange={HandleSortBySelection}>
              <MenuItem value={SortByTypes.recentlyAdded}>{SortByTypes.recentlyAdded}</MenuItem>
              <MenuItem value={SortByTypes.amountDesc}>{SortByTypes.amountDesc}</MenuItem>
              <MenuItem value={SortByTypes.amountAsc}>{SortByTypes.amountAsc}</MenuItem>
            </SelectDropdown>
          </div>
        )}

        <Spacer height={5} />

        {/* EXPENSES EXPORT BUTTON */}
        {recordType === RecordTypes.Expenses && Manager.isValid(expenses) && (
          <p id="export-button" onClick={ExportExpenses}>
            Export <RiFileExcel2Fill />
          </p>
        )}

        {/* CHATS EXPORT BUTTON */}
        {recordType === RecordTypes.Chats && Manager.isValid(chatMessages) && (
          <p id="export-button" onClick={ExportChat}>
            Export <RiFileExcel2Fill />
          </p>
        )}

        {/* EXPENSES */}
        {Manager.isValid(sortedExpenses) && recordType === RecordTypes.Expenses && (
          <Fade direction={'right'} duration={800} damping={0.2} cascade={true} className={'activity-fade-wrapper'} triggerOnce={true}>
            {Manager.isValid(sortedExpenses) &&
              sortedExpenses.map((expense, index) => {
                return (
                  <div key={index} className={`${recordType.toLowerCase()} record-row`}>
                    <p className="title">
                      {StringManager.FormatTitle(expense?.name)} <span>${expense?.amount}</span>
                    </p>
                    <p className="date">
                      Date Created <span>{moment(expense?.creationDate).format(DatetimeFormats.monthDayYear)}</span>
                    </p>
                  </div>
                )
              })}
          </Fade>
        )}
        {/* CHATS */}
        {recordType === RecordTypes.Chats && (
          <CheckboxGroup
            onCheck={(e) => {
              const chatKey = e.dataset.key
              // setSelectedChatId(chatKey)
              Manager.handleCheckboxSelection(
                e,
                (e) => setSelectedChatId(chatKey),
                (e) => {},
                false
              )
            }}
            parentLabel="Select which chat you would like to export"
            checkboxArray={Manager.buildCheckboxGroup({
              currentUser,
              customLabelArray: activeChats,
              labelProp: 'name',
              uidProp: 'id',
            })}
          />
        )}
      </div>
      <NavBar navbarClass={'activity no-add-new-button'}></NavBar>
    </>
  )
}
// Path: src\components\screens\archives.jsx
import CheckboxGroup from '/src/components/shared/checkboxGroup.jsx'
import Label from '/src/components/shared/label.jsx'
import SelectDropdown from '/src/components/shared/selectDropdown.jsx'
import DatetimeFormats from '/src/constants/datetimeFormats.coffee'
import DatasetManager from '/src/managers/datasetManager.coffee'
import Manager from '/src/managers/manager'
import StringManager from '/src/managers/stringManager.coffee'
import MenuItem from '@mui/material/MenuItem'
import moment from 'moment'
import React, {useContext, useEffect, useState} from 'react'
import {RiFileExcel2Fill} from 'react-icons/ri'
import ScreenNames from '../../constants/screenNames'
import globalState from '../../context'
import useChat from '../../hooks/useChat'
import useChatMessages from '../../hooks/useChatMessages'
import useCoparents from '../../hooks/useCoparents'
import useCurrentUser from '../../hooks/useCurrentUser'
import useExpenses from '../../hooks/useExpenses'
import DomManager from '../../managers/domManager'
import VaultManager from '../../managers/vaultManager'
import NavBar from '../navBar'
import ScreenHeader from '../shared/screenHeader'
import Spacer from '../shared/spacer'

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

export default function Vault() {
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
  const {chats} = useChat()
  const {chatMessages} = useChatMessages(selectedChatId)

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

    setExpensePayers(DatasetManager.GetValidArray(payerNames))
    const _sortedExpenses = expenses?.sort((a, b) => new Date(a.creationDate) - new Date(b.creationDate)).reverse()
    setSortedExpenses(_sortedExpenses)

    return expenses
  }

  const HandleRecordTypeSelection = (e) => {
    DomManager.HandleCheckboxSelection(
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
    DomManager.HandleCheckboxSelection(
      e,
      async (e) => {
        let filteredExpenses = []
        if (e === 'Me') {
          filteredExpenses = expenses?.filter((x) => x.payer?.key === currentUser?.key)
        } else {
          const coparent = currentUser?.coparents?.find((x) => x.name.includes(e))
          filteredExpenses = expenses?.filter((x) => x.payer?.key === coparent?.userKey)
        }

        if (Manager.IsValid(filteredExpenses)) {
          setSortedExpenses(filteredExpenses)
        } else {
          setSortedExpenses([])
        }
      },
      async () => {
        setSortedExpenses(expenses)
      },
      false
    )
  }

  const HandleSortBySelection = (e) => {
    const sortByName = e.target.value
    const expensesAsNumbers = expenses?.map((expense) => {
      expense.amount = parseInt(expense?.amount)
      return expense
    })
    if (sortByName === SortByTypes.recentlyAdded) {
      setSortedExpenses(expenses?.sort((a, b) => new Date(a.creationDate) - new Date(b.creationDate)).reverse())
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

  const ExportExpenses = () => VaultManager.createCSV(expenses, 'Peaceful_coParenting_Exported_Expenses', 'expenses')

  const ExportChat = () => VaultManager.createCSV(chatMessages, 'Peaceful_coParenting_Exported_Chat', 'chat')

  const DefineChatCheckboxes = async () => {
    let activeChats = []
    if (Manager.IsValid(chats)) {
      for (const chat of chats) {
        let coparent = chat.members.find((x) => x.key !== currentUser?.key)
        activeChats.push({
          name: StringManager.GetFirstNameOnly(coparent?.name),
          id: chat.id,
        })
      }
      setActiveChats(activeChats)
    }
  }

  useEffect(() => {
    if (Manager.IsValid(expenses)) {
      GetExpenses().then((r) => r)
      DomManager.ToggleAnimation('add', 'record-row', DomManager.AnimateClasses.names.fadeInRight, 85)
    }
    DefineChatCheckboxes().then((r) => r)
  }, [expenses])

  return (
    <>
      <div id="records-wrapper" className={`${theme} form page-container`}>
        <ScreenHeader
          title={'The Vault'}
          screenName={ScreenNames.vault}
          screenDescription="Inside the vault&#39;s storage you can access and export data generated by you or your co-parent. This information can be utilized for personal reference, legal proceedings, or any other purpose you may require."
        />

        <Spacer height={10} />
        <div className="screen-content">
          <p>Data can be exported as an Excel spreadsheet format, with options to apply filters or sorting as needed.</p>
          <Spacer height={10} />
          {/* RECORD TYPE */}
          <CheckboxGroup
            containerClass={'reminder-times'}
            elClass={`${theme}`}
            parentLabel="Record Type"
            skipNameFormatting={true}
            checkboxArray={DomManager.BuildCheckboxGroup({
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
                checkboxArray={DomManager.BuildCheckboxGroup({
                  currentUser,
                  customLabelArray: expensePayers,
                })}
                onCheck={HandlePayerSelection}
              />
            </>
          )}

          {/* SORTING */}
          {recordType === RecordTypes.Expenses && Manager.IsValid(expenses) && (
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
          {recordType === RecordTypes.Expenses && Manager.IsValid(expenses) && (
            <p id="export-button" onClick={ExportExpenses}>
              Export <RiFileExcel2Fill />
            </p>
          )}

          {/* CHATS EXPORT BUTTON */}
          {recordType === RecordTypes.Chats && Manager.IsValid(chatMessages) && (
            <p id="export-button" onClick={ExportChat}>
              Export <RiFileExcel2Fill />
            </p>
          )}

          {/* EXPENSES */}
          {Manager.IsValid(sortedExpenses) &&
            recordType === RecordTypes.Expenses &&
            sortedExpenses.map((expense, index) => {
              return (
                <div
                  key={index}
                  className={`${recordType.toLowerCase()} ${DomManager.Animate.FadeInRight(expense, '.record-row')} record-row`}
                  style={DomManager.AnimateDelayStyle(index)}>
                  <p className="title">
                    {StringManager.FormatTitle(expense?.name)} <span>${expense?.amount}</span>
                  </p>
                  <p className="date">
                    Date Created <span>{moment(expense?.creationDate).format(DatetimeFormats.monthDayYear)}</span>
                  </p>
                </div>
              )
            })}

          {/* CHATS */}
          {recordType === RecordTypes.Chats && (
            <CheckboxGroup
              onCheck={(e) => {
                const chatKey = e.dataset.key
                DomManager.HandleCheckboxSelection(
                  e,
                  () => {
                    setSelectedChatId(chatKey)
                  },
                  () => {},
                  false
                )
              }}
              parentLabel="Select which chat you would like to export"
              checkboxArray={DomManager.BuildCheckboxGroup({
                currentUser,
                customLabelArray: activeChats,
                labelProp: 'name',
                uidProp: 'id',
              })}
            />
          )}
        </div>
      </div>
      <NavBar navbarClass={'activity no-Add-new-button'}></NavBar>
    </>
  )
}
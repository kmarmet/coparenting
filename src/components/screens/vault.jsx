// Path: src\components\screens\archives.jsx
import moment from 'moment'
import React, {useContext, useEffect, useState} from 'react'
import {RiFileExcel2Fill} from 'react-icons/ri'
import CheckboxGroup from '../.../../shared/checkboxGroup.jsx'
import Label from '../.../../shared/label.jsx'
import DatetimeFormats from '../../constants/datetimeFormats.coffee'
import ExpenseSortByTypes from '../../constants/expenseSortByTypes'
import ScreenNames from '../../constants/screenNames'
import globalState from '../../context'
import useChatMessages from '../../hooks/useChatMessages'
import useChats from '../../hooks/useChats'
import useCoParents from '../../hooks/useCoParents'
import useCurrentUser from '../../hooks/useCurrentUser'
import useExpenses from '../../hooks/useExpenses'
import DatasetManager from '../../managers/datasetManager.coffee'
import DomManager from '../../managers/domManager'
import DropdownManager from '../../managers/dropdownManager'
import Manager from '../../managers/manager'
import StringManager from '../../managers/stringManager.coffee'
import VaultManager from '../../managers/vaultManager'
import NavBar from '../navBar'
import ScreenHeader from '../shared/screenHeader'
import SelectDropdown from '../shared/selectDropdown'
import Spacer from '../shared/spacer'

export default function Vault() {
  const {state, setState} = useContext(globalState)
  const {theme} = state

  // State
  const [recordType, setRecordType] = useState('Expenses')
  const [sortMethod, setSortMethod] = useState({label: 'Recently Added', value: 'recentlyAdded'})
  const [activeChats, setActiveChats] = useState([])
  const [payer, setPayer] = useState([])
  const [sortedExpenses, setSortedExpenses] = useState([])
  const [selectedChatId, setSelectedChatId] = useState()

  // Hooks
  const {coParents} = useCoParents()
  const {expenses} = useExpenses()
  const {currentUser} = useCurrentUser()
  const {chats} = useChats()
  const {chatMessages} = useChatMessages(selectedChatId)

  const GetExpenses = async () => {
    let payers = []

    for (const expense of expenses) {
      if (expense?.payer?.key === currentUser.key) {
        payers.push('Me')
      } else {
        payers.push(expense?.payer?.key)
      }
    }
    let payerNames = []
    for (const payerKey of payers) {
      if (payerKey === 'Me') {
        payerNames.push('Me')
      } else {
        const coParent = coParents?.find((x) => x?.userKey === payerKey)
        payerNames.push(coParent?.name)
      }
    }

    setPayer(DatasetManager.GetValidArray(payerNames))
    const _sortedExpenses = DatasetManager.SortByDate(expenses, 'desc', 'creationDate')
    setSortedExpenses(_sortedExpenses)

    return expenses
  }

  const HandleSortBySelection = (e) => {
    const expenseTypes = DatasetManager.ConvertToObject(ExpenseSortByTypes)
    const label = StringManager.RemoveLeadingAndTrailingSpaces(e.label)
    setSortMethod(e)

    if (label === expenseTypes.recentlyAdded) {
      setSortedExpenses(DatasetManager?.SortByDate(expenses, 'desc', 'creationDate'))
    }

    // Amount: High -> Low
    if (label === expenseTypes.amountDesc) {
      const sortByAmountDesc = DatasetManager.SortExpenses(expenses, 'int', 'desc')
      setSortedExpenses(sortByAmountDesc)
    }

    // Amount: Low -> High
    if (label === expenseTypes.amountAsc) {
      const sortedByAmountAsc = DatasetManager.SortExpenses(expenses, 'int', 'asc')
      setSortedExpenses(sortedByAmountAsc)
    }

    // Name Ascending
    if (label === expenseTypes.nameAsc) {
      const sortedByNameAsc = DatasetManager.SortExpenses(expenses, 'string', 'asc')
      setSortedExpenses(sortedByNameAsc)
    }

    // Name Descending
    if (label === expenseTypes.nameDesc) {
      const sortedByNameDesc = DatasetManager.SortExpenses(expenses, 'string', 'desc')
      setSortedExpenses(sortedByNameDesc)
    }

    if (label === expenseTypes.nearestDueDate) {
      const sortedByNearestDueDate = DatasetManager.SortExpenses(expenses, 'string', 'asc')
      setSortedExpenses(sortedByNearestDueDate)
    }
  }

  const HandlePayerSelection = (e) => {
    DomManager.HandleCheckboxSelection(
      e,
      async (e) => {
        let filteredExpenses = []
        if (e === 'Me') {
          filteredExpenses = expenses?.filter((x) => x.payer?.key === currentUser?.key)
        } else {
          const coParent = coParents?.find((x) => x.name.includes(e))
          filteredExpenses = expenses?.filter((x) => x.payer?.key === coParent?.userKey)
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
    if (Manager.IsValid(expenses) && Manager.IsValid(coParents)) {
      GetExpenses().then((r) => r)
      DomManager.ToggleAnimation('add', 'record-row', DomManager.AnimateClasses.names.fadeInRight, 85)
    }
    DefineChatCheckboxes().then((r) => r)
  }, [expenses, coParents])

  return (
    <>
      <div id="records-wrapper" className={`${theme} page-container`}>
        <ScreenHeader
          title={'The Vault'}
          screenName={ScreenNames.vault}
          screenDescription="Inside the vault&#39;s storage you can access and export data generated by you or your co-parent. This information can be utilized for personal reference, legal proceedings, or any other purpose you may require."
        />

        <Spacer height={10} />
        <div className="screen-content">
          {/* EXPORT TEXT */}
          <p className={'export-text'}>Data can be exported as an Excel spreadsheet format, with options to apply filters or sorting as needed.</p>
          <Spacer height={10} />

          {/* RECORD TYPE */}
          <SelectDropdown
            wrapperClasses={'white-bg'}
            options={DropdownManager.GetDefault.ValueRecordTypes()}
            placeholder={'Select Record Type'}
            onSelect={(e) => setRecordType(e.label)}
          />
          <Spacer height={3} />
          {/* PAYERS */}
          {recordType === 'Expenses' && (
            <SelectDropdown
              wrapperClasses={'white-bg'}
              options={DropdownManager.GetDefault.CoParents(coParents)}
              placeholder={'Select Payer'}
              onSelect={(e) => setPayer(e.value)}
            />
          )}

          <Spacer height={3} />

          {/* SORTING */}
          {recordType === 'Expenses' && Manager.IsValid(expenses) && (
            <div id="sorting-wrapper">
              <SelectDropdown
                wrapperClasses={'white-bg'}
                placeholder={'Select Sorting Method'}
                options={DropdownManager.GetDefault.ExpenseSortByTypes()}
                value={sortMethod}
                onSelect={(e) => HandleSortBySelection(e)}
              />
            </div>
          )}

          <Spacer height={8} />

          {/* EXPENSES EXPORT BUTTON */}
          {recordType === 'Expenses' && Manager.IsValid(expenses) && (
            <p id="export-button" onClick={ExportExpenses}>
              Export <RiFileExcel2Fill />
            </p>
          )}

          {/* CHATS EXPORT BUTTON */}
          {recordType === 'Chats' && Manager.IsValid(chatMessages) && (
            <p id="export-button" onClick={ExportChat}>
              Export <RiFileExcel2Fill />
            </p>
          )}

          <Spacer height={12} />

          {/* EXPENSES */}
          {Manager.IsValid(sortedExpenses) &&
            recordType === 'Expenses' &&
            sortedExpenses.map((expense, index) => {
              return (
                <div
                  key={index}
                  className={`${recordType.toLowerCase()} ${DomManager.Animate.FadeInUp(expense, '.record-row')} record-row`}
                  style={DomManager.AnimateDelayStyle(index)}>
                  <p className="title">
                    {StringManager.FormatTitle(expense?.name)}
                    <span className={`amount ${expense?.paidStatus === 'paid' ? 'paid' : 'unpaid'}`}>${expense?.amount}</span>
                  </p>
                  <p className="date">
                    Date Added <span>{moment(expense?.creationDate).format(DatetimeFormats.monthDayYear)}</span>
                  </p>
                </div>
              )
            })}

          {/* CHATS */}
          {recordType === 'Chats' && (
            <>
              <Label text={'Select Chat to Export'} classes={'always-show dark'} />
              <CheckboxGroup
                elClass={'white-bg'}
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
                checkboxArray={DomManager.BuildCheckboxGroup({
                  currentUser,
                  customLabelArray: activeChats,
                  labelProp: 'name',
                  uidProp: 'id',
                })}
              />
            </>
          )}
        </div>
      </div>
      <NavBar navbarClass={'activity no-Add-new-button'}></NavBar>
    </>
  )
}
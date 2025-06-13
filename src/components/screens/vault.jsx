// Path: src\components\screens\archives.jsx
import CheckboxGroup from '../.../../shared/checkboxGroup.jsx'
import Label from '../.../../shared/label.jsx'
import SelectDropdown from '../.../../shared/selectDropdown.jsx'
import DatetimeFormats from '../../constants/datetimeFormats.coffee'
import DatasetManager from '../../managers/datasetManager.coffee'
import Manager from '../../managers/manager'
import StringManager from '../../managers/stringManager.coffee'
import MenuItem from '@mui/material/MenuItem'
import moment from 'moment'
import React, {useContext, useEffect, useState} from 'react'
import {RiFileExcel2Fill} from 'react-icons/ri'
import ScreenNames from '../../constants/screenNames'
import globalState from '../../context'
import useChats from '../../hooks/useChats'
import useChatMessages from '../../hooks/useChatMessages'
import useCoParents from '../../hooks/useCoParents'
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
  const [sortedExpenses, setSortedExpenses] = useState([])
  const [selectedChatId, setSelectedChatId] = useState()
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
        const coParent = coParents?.find((x) => x.userKey === payerKey)
        payerNames.push(coParent?.name)
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
          const coParent = currentUser?.coParents?.find((x) => x.name.includes(e))
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

  const HandleSortBySelection = (e) => {
    const sortByName = e.value
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

    // Name Ascending
    if (sortByName === SortByTypes.nameAsc) {
      const sortedByNameAsc = DatasetManager.sortByProperty(expenses, 'name', 'asc')
      setSortedExpenses(sortedByNameAsc)
      setSortMethod(SortByTypes.nameAsc)
    }

    // Name Descending
    if (sortByName === SortByTypes.nameDesc) {
      const sortedByNameDesc = DatasetManager.sortByProperty(expenses, 'name', 'desc')
      setSortedExpenses(sortedByNameDesc)
      setSortMethod(SortByTypes.nameDesc)
    }

    if (sortByName === SortByTypes.nearestDueDate) {
      const sortedByNearestDueDate = DatasetManager.sortByProperty(expenses, 'dueDate', 'asc')
      setSortedExpenses(sortedByNearestDueDate)
      setSortMethod(SortByTypes.nearestDueDate)
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
          <p>Data can be exported as an Excel spreadsheet format, with options to apply filters or sorting as needed.</p>
          <Spacer height={10} />
          {/* RECORD TYPE */}
          <Label text={'Record Type'} classes={'always-show dark'} />
          <CheckboxGroup
            containerClass={'reminder-times'}
            elClass={`${theme}`}
            skipNameFormatting={true}
            checkboxArray={DomManager.BuildCheckboxGroup({
              currentUser,
              labelType: 'record-types',
              defaultLabels: ['Expenses'],
            })}
            onCheck={HandleRecordTypeSelection}
          />

          {/* PAYERS */}
          {coParents?.length > 1 && recordType === RecordTypes.Expenses && (
            <>
              <Spacer height={8} />
              <Label text={'Payers'} classes={'always-show dark'} />
              <CheckboxGroup
                elClass={'payers'}
                skipNameFormatting={true}
                checkboxArray={DomManager.BuildCheckboxGroup({
                  currentUser,
                  customLabelArray: expensePayers,
                })}
                onCheck={HandlePayerSelection}
              />
            </>
          )}

          <Spacer height={8} />

          {/* SORTING */}
          {recordType === RecordTypes.Expenses && Manager.IsValid(expenses) && (
            <div id="sorting-wrapper">
              <Label text={'Sorting'} />
              <SelectDropdown
                labelText={'Sort By'}
                id={'sorting-dropdown'}
                options={DomManager.GetSelectOptions(Object.values(SortByTypes))}
                wrapperClasses={'sorting-dropdown white'}
                selectValue={sortMethod}
                onChange={HandleSortBySelection}>
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
                  className={`${recordType.toLowerCase()} ${DomManager.Animate.FadeInUp(expense, '.record-row')} record-row`}
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
            <>
              <Label text={'Select chat to export'} classes={'always-show dark'} />
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
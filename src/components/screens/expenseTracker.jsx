import React, { useContext, useEffect, useRef, useState } from 'react'
import DB from '@db'
import Manager from '@manager'
import globalState from '../../context.js'
import { child, getDatabase, onValue, ref } from 'firebase/database'
import NotificationManager from '@managers/notificationManager.js'
import MyConfetti from '@shared/myConfetti.js'
import DateManager from 'managers/dateManager.js'
import DateFormats from 'constants/dateFormats.js'
import moment from 'moment'
import '../../prototypes.js'
import { TbCalendarDollar } from 'react-icons/tb'
import BottomCard from '../shared/bottomCard'
import { PiBellSimpleRinging, PiClockCountdownDuotone, PiConfettiDuotone, PiMoneyWavyDuotone, PiUserDuotone } from 'react-icons/pi'
import { AiOutlineFileAdd } from 'react-icons/ai'
import { MdOutlineFilterAltOff, MdOutlineNotes, MdPriceCheck } from 'react-icons/md'
import SecurityManager from '../../managers/securityManager'
import NewExpenseForm from '../forms/newExpenseForm'
import FirebaseStorage from '@firebaseStorage'
import LightGallery from 'lightgallery/react'
import MenuItem from '@mui/material/MenuItem'
import { FaChildren } from 'react-icons/fa6'
import { MobileDatePicker } from '@mui/x-date-pickers-pro'

import 'lightgallery/css/lightgallery.css'
//noinspection JSUnresolvedVariable
import {
  contains,
  displayAlert,
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
} from 'globalFunctions'
// ICONS
import { ImAppleinc } from 'react-icons/im'
import { IoLogoVenmo } from 'react-icons/io5'
import { SiCashapp, SiZelle } from 'react-icons/si'
import { LiaCcPaypal } from 'react-icons/lia'
import { BsFilter } from 'react-icons/bs'
import NavBar from '../navBar'
import Label from '../shared/label'
import ExpenseCategories from '../../constants/expenseCategories'
import DatasetManager from '../../managers/datasetManager'
import AlertManager from '../../managers/alertManager'
import SelectDropdown from '../shared/selectDropdown'
import InputWrapper from '../shared/inputWrapper'

const SortByTypes = {
  nearestDueDate: 'Nearest Due Date',
  recentlyAdded: 'Recently Added',
  amountDesc: 'Amount: High to Low',
  amountAsc: 'Amount: Low to High',
}

export default function ExpenseTracker() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [expenses, setExpenses] = useState([])
  const [showPaymentOptionsCard, setShowPaymentOptionsCard] = useState(false)
  const [showNewExpenseCard, setShowNewExpenseCard] = useState(false)
  const [showFilterCard, setShowFilterCard] = useState(false)
  const [refreshKey, setRefreshKey] = useState(Manager.getUid())
  const [sortByValue, setSortByValue] = useState('')
  const [filterApplied, setFilterApplied] = useState(false)
  const [categoriesInUse, setCategoriesInUse] = useState([])
  const [activeExpense, setActiveExpense] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  let contentEditable = useRef()

  const markAsPaid = async (expense) => {
    await DB.updateRecord(DB.tables.expenseTracker, expense, 'paidStatus', 'paid').then(async () => {
      const subId = await NotificationManager.getUserSubId(expense.payer.phone, 'phone')
      NotificationManager.sendNotification(
        `Expense Paid`,
        `An expense has been PAID by ${currentUser?.name} \nExpense Name: ${expense.name} \nYou can delete the expense now`,
        subId
      )
      setShowDetails(false)
      MyConfetti.fire()
    })
  }

  const deleteExpense = async (expense) => {
    let existing = await getSecuredExpenses()

    if (Manager.isValid(expense)) {
      existing = existing.filter((x) => x.name === expense.name)

      // Delete in Firebase Storage
      if (Manager.isValid(expense) && Manager.isValid(expense.imageName, null, null, true)) {
        await FirebaseStorage.delete(FirebaseStorage.directories.expenseImages, currentUser?.id, expense.imageName, expense)
      }

      // Delete Multiple
      if (existing.length > 1) {
        AlertManager.confirmAlert('Are you sure you would like to delete ALL expenses with the same details?', "I'm Sure", true, async () => {
          let existingMultipleExpenses = existing.filter((x) => x.name === expense.name && x.repeating === true)
          if (Manager.isValid(existingMultipleExpenses, true)) {
            await DB.deleteMultipleRows(DB.tables.expenseTracker, existingMultipleExpenses)
            AlertManager.successAlert(`All ${expense.name} expenses have been deleted`)
          }
        })
      }

      // Delete Single
      else {
        AlertManager.confirmAlert(`Are you sure you would like to delete the ${activeExpense?.name} expense?`, "I'm Sure", true, async () => {
          const deleteKey = await DB.getSnapshotKey(DB.tables.expenseTracker, expense, 'id')
          if (deleteKey) {
            await DB.deleteByPath(`${DB.tables.expenseTracker}/${deleteKey}`)
          }
        })
      }
    }
  }

  const getSecuredExpenses = async () => {
    let allExpenses = await SecurityManager.getExpenses(currentUser)
    allExpenses = DatasetManager.getUniqueArray(allExpenses, 'id')
    console.log(allExpenses)
    const categories = allExpenses.map((x) => x.category).filter((x) => x !== '')
    setCategoriesInUse(categories)
    setFilterApplied(false)
    setShowFilterCard(false)
    setExpenses(allExpenses)
    return allExpenses
  }

  const sendReminder = async (expense) => {
    const subId = await NotificationManager.getUserSubId(expense?.payer?.phone, 'phone')
    const message = `This is a reminder to pay the ${expense.name} expense.  ${
      Manager.isValid(expense.dueDate) ? 'Due date is: ' + expense.dueDate : ''
    }`
    NotificationManager.sendNotification(`Expense Reminder`, message, subId)
    AlertManager.successAlert('Reminder Sent')
  }

  const handleUpdates = async (e, recordToUpdate, propName, value) => {
    if (propName === 'dueDate') {
      let updatedDate = moment(value).format(DateFormats.dateForDb)
      value = moment(updatedDate).format(DateFormats.dateForDb)
    }
    await DB.updateRecord(DB.tables.expenseTracker, recordToUpdate, propName, value, 'id').finally(async () => {
      await getSecuredExpenses()
      const updatedExpense = await DB.find(DB.tables.expenseTracker, ['id', activeExpense.id], true)
      setActiveExpense(updatedExpense)
    })
  }

  const onTableChange = async () => {
    const dbRef = ref(getDatabase())

    onValue(child(dbRef, DB.tables.expenseTracker), async (snapshot) => {
      await getSecuredExpenses()
    })
  }

  const handleExpenseTypeSelection = async (type) => {
    const allExpenses = await getSecuredExpenses()
    if (type === 'single') {
      setExpenses(allExpenses.filter((x) => x.repeating === false))
    }
    if (type === 'repeating') {
      setExpenses(allExpenses.filter((x) => x.repeating === true))
    }
    if (type === 'all') {
      setExpenses(allExpenses)
    }
    setShowFilterCard(false)
    setFilterApplied(true)
  }

  const handlePaidStatusSelection = async (status) => {
    const allExpenses = await getSecuredExpenses()
    setExpenses(allExpenses.filter((x) => x.paidStatus === status))
    setShowFilterCard(false)
    setFilterApplied(true)
  }

  const handleSortBySelection = (e) => {
    const sortByName = e.target.value
    if (sortByName === SortByTypes.recentlyAdded) {
      const sortedByDateAsc = DatasetManager.sortByProperty(expenses, 'dateAdded', 'asc', true)
      setExpenses(sortedByDateAsc)
      setFilterApplied(true)
    }
    if (sortByName === SortByTypes.nearestDueDate) {
      const sortedByDueDateDesc = DatasetManager.sortByProperty(expenses, 'dueDate', 'desc', true)
      setExpenses(sortedByDueDateDesc)
      setFilterApplied(true)
    }
    if (sortByName === SortByTypes.amountDesc) {
      const sortByAmountDesc = DatasetManager.sortByProperty(expenses, 'amount', 'desc')
      setExpenses(sortByAmountDesc)
      setFilterApplied(true)
    }
    if (sortByName === SortByTypes.amountAsc) {
      const sortedByAmountAsc = DatasetManager.sortByProperty(expenses, 'amount', 'asc')
      setExpenses(sortedByAmountAsc)
      setFilterApplied(true)
    }
    setShowFilterCard(false)
  }

  const handleCategorySelection = async (category) => {
    const expensesByCategory = expenses.filter((x) => x.category === category)
    setExpenses(expensesByCategory)
    setFilterApplied(true)
    setShowFilterCard(false)
  }

  useEffect(() => {
    onTableChange().then((r) => r)
    Manager.showPageContainer()
  }, [])

  return (
    <>
      {/* NEW EXPENSE FORM */}
      <NewExpenseForm showCard={showNewExpenseCard} hideCard={(e) => setShowNewExpenseCard(false)} />

      {/* CARDS */}
      {/* FILTER CARD */}
      <BottomCard
        refreshKey={refreshKey}
        hasSubmitButton={false}
        className="filter-card"
        title={'Filter Expenses'}
        submitIcon={<BsFilter />}
        showCard={showFilterCard}
        onClose={() => {
          setShowFilterCard(false)
          setRefreshKey(Manager.getUid())
        }}
        submitText={'View Expenses'}>
        <>
          <div className="filter-row">
            <Label isBold={true} text={'Expense Type'} classes="mb-5"></Label>
            <div className="pills type">
              <div className="pill" onClick={() => handleExpenseTypeSelection('all')}>
                All
              </div>
              <div className="pill" onClick={() => handleExpenseTypeSelection('single')}>
                Single Date
              </div>
              <div className="pill" onClick={() => handleExpenseTypeSelection('repeating')}>
                Repeating
              </div>
            </div>
          </div>
          <div className="filter-row">
            <Label isBold={true} text={'Payment Status'} classes="mb-5"></Label>
            <div className="pills type">
              <div className="pill" onClick={() => handlePaidStatusSelection('unpaid')}>
                Unpaid
              </div>
              <div className="pill" onClick={() => handlePaidStatusSelection('paid')}>
                Paid
              </div>
            </div>
          </div>
          <Label isBold={true} text={'Expense Category'} classes="mb-5"></Label>
          <div className="filter-row">
            <div className="pills category">
              {ExpenseCategories.sort().map((cat, index) => {
                return (
                  <>
                    {categoriesInUse.includes(cat) && (
                      <div onClick={() => handleCategorySelection(cat)} key={index} className="pill">
                        {cat}
                      </div>
                    )}
                  </>
                )
              })}
            </div>
          </div>
          <SelectDropdown selectValue={SortByTypes.recentlyAdded} labelText={'Sort by'} onChange={handleSortBySelection}>
            <MenuItem value={SortByTypes.recentlyAdded}>{SortByTypes.recentlyAdded}</MenuItem>
            <MenuItem value={SortByTypes.nearestDueDate}>{SortByTypes.nearestDueDate}</MenuItem>
            <MenuItem value={SortByTypes.amountDesc}>{SortByTypes.amountDesc}</MenuItem>
            <MenuItem value={SortByTypes.amountAsc}>{SortByTypes.amountAsc}</MenuItem>
          </SelectDropdown>
        </>
      </BottomCard>

      {/* PAYMENT OPTIONS */}
      <>
        <BottomCard
          hasSubmitButton={false}
          subtitle="There are a multitude of simple and FREE ways to send money to a co-parent for expenses, or for any other reason. Please look below to
              see which option works best for you."
          title={'Payment/Transfer Options'}
          className="payment-options-card"
          onClose={() => setShowPaymentOptionsCard(false)}
          showCard={showPaymentOptionsCard}>
          <div id="payment-options-card">
            <div className="options">
              {/* ZELLE */}
              <div className="option zelle">
                <div className="flex brand-name-wrapper zelle">
                  <p className="brand-name accent mr-10">Zelle</p>
                  <SiZelle className={'zelle-icon'} />
                </div>
                <div className="flex">
                  <div className="text">
                    <p className={`${theme} description payment-options`}>Safely send money to co-parent, no matter where they bank.</p>
                    <a href="https://www.zellepay.com/how-it-works" target="_blank" className="setup-instructions mb-10">
                      Learn More <span className="material-icons">open_in_new</span>
                    </a>
                  </div>
                </div>
                <iframe
                  width="560"
                  height="315"
                  src="https://www.youtube.com/embed/FhL1HKUOStM?si=0xzdELJcIfnbHIRO"
                  title="Zelle® | How it Works"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen></iframe>
              </div>

              {/* VENMO */}
              <div className="option venmo">
                <div className="flex brand-name-wrapper venmo">
                  <p className="brand-name mr-10">Venmo</p>
                  <IoLogoVenmo className={'venmo-icon'} />
                </div>
                <div className="flex">
                  <div className="text">
                    <p className={`${theme} description payment-options`}>Fast, safe, social payments.</p>
                    <a
                      href="https://help.venmo.com/hc/en-us/articles/209690068-How-to-Sign-Up-for-a-Personal-Venmo-Account"
                      target="_blank"
                      className="setup-instructions mb-10">
                      Learn More <span className="material-icons">open_in_new</span>
                    </a>
                  </div>
                </div>
                <iframe
                  src="https://www.youtube.com/embed/zAqz0Kzootg"
                  title="Paying or Requesting Payment From Multiple Users in a Single Transaction"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen></iframe>
              </div>

              {/* APPLE PAY */}
              <div className="option apple-cash">
                <div className="flex brand-name-wrapper apple">
                  <p className="brand-name mr-10">Apple Cash</p>
                  <ImAppleinc className={'apple-icon'} />
                </div>
                <div className="flex ">
                  <div className="text">
                    <p className={`${theme} description payment-options`}>Use Apple Cash to send and receive money with people you know.</p>
                    <a href="https://support.apple.com/en-us/105013" target="_blank" className="setup-instructions mb-10">
                      Learn More <span className="material-icons">open_in_new</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* PAYPAL */}
              <div className="option paypal">
                <div className="flex brand-name-wrapper paypal">
                  <p className="brand-name mr-10">PayPal</p>
                  <LiaCcPaypal className={'paypal-icon'} />
                </div>
                <div className="flex">
                  <div className="text">
                    <p className={`${theme} description payment-options`}>Send and request money, quickly and securely.</p>
                    <a href="https://www.paypal.com/us/digital-wallet/send-receive-money" target="_blank" className="setup-instructions mb-10">
                      Learn More <span className="material-icons">open_in_new</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* CASHAPP */}
              <div className="option cashapp">
                <div className="flex brand-name-wrapper cashapp">
                  <p className="brand-name mr-10">CashApp</p>
                  <SiCashapp />
                </div>
                <div className="flex">
                  <div className="text">
                    <p className={`${theme} description payment-options`}>Pay anyone, instantly.</p>
                    <a href="https://cash.app/help/6485-getting-started-with-cash-app" target="_blank" className="setup-instructions mb-10">
                      Learn More <span className="material-icons">open_in_new</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </BottomCard>
      </>

      {/* DETAILS CARD */}
      <BottomCard
        submitText={'Paid'}
        title={`${uppercaseFirstLetterOfAllWords(activeExpense?.name || '')} Details`}
        submitIcon={<MdPriceCheck className={'fs-22'} />}
        onSubmit={async () => await markAsPaid(activeExpense)}
        className="expense-tracker form"
        onClose={() => {
          setActiveExpense(null)
          setShowDetails(false)
        }}
        showCard={showDetails}>
        <div id="details" className={`content ${activeExpense?.reason?.length > 20 ? 'long-text' : ''}`}>
          {/* AMOUNT */}
          <div id="row" className="flex-start mb-15">
            <div id="primary-icon-wrapper">
              <PiMoneyWavyDuotone id={'primary-row-icon'} />
            </div>
            <p id="title">Amount to pay is ${activeExpense?.amount}</p>
          </div>
          <div id="row" className="flex-start mb-15">
            <div id="primary-icon-wrapper">
              <PiUserDuotone id="primary-row-icon" />
            </div>
            {/* SENT TO */}
            <p id="title">
              Request Sent to {formatNameFirstNameOnly(currentUser?.coparents?.filter((x) => x?.phone === activeExpense?.payer?.phone)[0]?.name)}
            </p>
          </div>

          {/* PAY TO */}
          <div id="row" className="flex-start mb-15">
            <div id="primary-icon-wrapper">
              <PiUserDuotone id="primary-row-icon" />
            </div>
            <p id="title">Pay to {formatNameFirstNameOnly(activeExpense?.recipientName)}</p>
          </div>

          {/* DUE DATE */}
          {activeExpense?.dueDate && activeExpense?.dueDate?.length > 0 && (
            <div className="flex flex-start mb-15" id="row">
              <div id="primary-icon-wrapper">
                <PiClockCountdownDuotone id="primary-row-icon" />
              </div>
              <p id="title">
                Due Date is {DateManager.formatDate(activeExpense?.dueDate)} (
                {moment(moment(activeExpense?.dueDate).startOf('day')).fromNow().toString()})
              </p>
            </div>
          )}

          {/* CHILDREN */}
          {Manager.isValid(activeExpense?.children?.length, true) && (
            <div className="flex flex-start mb-15" id="row">
              <div id="primary-icon-wrapper">
                <FaChildren id={'primary-row-icon'} />
              </div>
              <p
                id="title"
                dangerouslySetInnerHTML={{
                  __html: `${activeExpense?.children?.join('|').replaceAll('|', '<span class="divider">|</span>')}`,
                }}></p>
            </div>
          )}

          {/* DATE ADDED */}
          <div id="row" className="flex-start flex mb-15">
            <div id="primary-icon-wrapper">
              <TbCalendarDollar id={'primary-row-icon'} />
            </div>
            <p id="title">Expense Created on {DateManager.formatDate(activeExpense?.dateAdded)}</p>
          </div>

          {/* NOTES */}
          {activeExpense?.notes && activeExpense?.notes?.length > 0 && (
            <div className="flex mb-15 wrap" id="row">
              <div id="primary-icon-wrapper">{<MdOutlineNotes id={'primary-row-icon'} />}</div>
              <p id="title" className="mr-auto neg-5">
                Notes
              </p>
              <p className="notes neg-10">{activeExpense?.notes}</p>
            </div>
          )}

          {/* EXPENSE IMAGE */}
          {Manager.isValid(activeExpense?.imageUrl) && (
            <>
              <Label text={'Expense Images'} classes="mb-5" />
              <div id="expense-image">
                <LightGallery elementClassNames={'light-gallery'} speed={500} selector={'#img-container'}>
                  <div
                    style={{ backgroundImage: `url(${activeExpense?.imageUrl})` }}
                    data-src={activeExpense?.imageUrl}
                    id="img-container"
                    className="flex"></div>
                </LightGallery>
              </div>
            </>
          )}

          {/* UPDATES */}
          <p id="medium-title" className="mt-25 mb-5 blue">
            Update this Expense
          </p>

          <InputWrapper
            inputType="input"
            labelText={'Name'}
            defaultValue={activeExpense?.name}
            onChange={(e) => handleUpdates(e, activeExpense, 'name', e.target.value)}
          />

          {/* DUE DATE */}
          <InputWrapper inputType={'date'} labelText={'Due Date'}>
            <MobileDatePicker
              value={moment(activeExpense?.dueDate)}
              className="mt-0 w-100"
              onAccept={(e) => handleUpdates(e, activeExpense, 'dueDate', moment(e).format('MM/DD/yyyy'))}
            />
          </InputWrapper>

          <InputWrapper
            defaultValue={activeExpense?.notes}
            onChange={(e) => handleUpdates(e, activeExpense, 'notes', e.target.value)}
            inputType={'textarea'}
            labelText={'Notes'}></InputWrapper>

          {/* BUTTONS */}
          <div className="action-buttons">
            {activeExpense?.paidStatus === 'unpaid' && activeExpense?.ownerPhone === currentUser?.phone && (
              <button className="green" onClick={() => sendReminder(activeExpense)}>
                Send Reminder <PiBellSimpleRinging className={'fs-18'} />
              </button>
            )}

            {/* DELETE */}
            {activeExpense?.ownerPhone === currentUser?.phone && (
              <button
                onClick={async () => {
                  await deleteExpense(activeExpense)
                  setShowDetails(false)
                }}
                className="red"
                id="delete-button">
                Delete
              </button>
            )}
          </div>
        </div>
      </BottomCard>

      {/* PAGE CONTAINER */}
      <div id="expense-tracker" className={`${theme} page-container form`}>
        <p className="screen-title">Expense Tracker</p>
        <p className={`${theme}  text-screen-intro`}>
          Add expenses to be paid by your co-parent. If a new expense is created for you to pay, you will have the opportunity to approve or reject
          it.
        </p>
        <p className="payment-options-link mb-15 mt-10" onClick={() => setShowPaymentOptionsCard(true)}>
          Bill Payment & Money Transfer Options
        </p>

        {/* FILTER BUTTON */}
        {!filterApplied && expenses.length > 0 && (
          <button onClick={() => setShowFilterCard(true)} id="filter-button">
            Filter <BsFilter />
          </button>
        )}

        {/* CLEAR FILTER BUTTON */}
        {filterApplied && (
          <button onClick={async () => await getSecuredExpenses()} id="filter-button">
            Clear Filter <MdOutlineFilterAltOff />
          </button>
        )}

        {/* INSTRUCTIONS */}
        {expenses.length === 0 && (
          <div id="instructions-wrapper">
            <p className="instructions center">
              There are currently no expenses <PiConfettiDuotone className={'fs-22'} />
            </p>
          </div>
        )}

        {/* LOOP EXPENSES */}
        <div id="expenses-container">
          {Manager.isValid(expenses, true) &&
            expenses.map((expense, index) => {
              return (
                <div
                  key={expense.id}
                  className="mt-20"
                  id="row"
                  onClick={() => {
                    setActiveExpense(expense)
                    setShowDetails(!showDetails)
                  }}>
                  <div id="primary-icon-wrapper">
                    {expense.paidStatus === 'unpaid' && <span className="amount">${expense.amount}</span>}
                    {expense.paidStatus === 'paid' && <PiMoneyWavyDuotone id={'primary-row-icon'} />}
                  </div>
                  <div id="content" data-expense-id={expense.id} className={`expense wrap`}>
                    {/* EXPENSE NAME */}
                    <div id="name-wrapper" className="flex align-center">
                      <p id="title" className="name row-title">
                        {uppercaseFirstLetterOfAllWords(expense.name)}
                      </p>
                      <span className={`${expense.paidStatus} status`} id="request-status">
                        {uppercaseFirstLetterOfAllWords(expense.paidStatus)}
                      </span>
                    </div>

                    {/* CATEGORY/AMOUNT */}
                    {expense?.category?.length > 0 && (
                      <p id="subtitle">
                        Category:
                        <span>{expense.category}</span>
                      </p>
                    )}
                    {(!expense.category || expense?.category?.length === 0) && <p id="subtitle">No Category Selected</p>}
                  </div>
                </div>
              )
            })}
        </div>
      </div>
      {!showNewExpenseCard && !showPaymentOptionsCard && !showFilterCard && !showDetails && (
        <NavBar navbarClass={'child-info'}>
          <AiOutlineFileAdd onClick={() => setShowNewExpenseCard(true)} id={'add-new-button'} />
        </NavBar>
      )}
    </>
  )
}
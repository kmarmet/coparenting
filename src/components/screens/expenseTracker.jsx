import React, { useContext, useEffect, useState } from 'react'
import DB from 'database/DB'
import Manager from 'managers/manager'
import globalState from '../../context.js'
import { child, getDatabase, onValue, ref } from 'firebase/database'
import NotificationManager from 'managers/notificationManager'
import MyConfetti from 'components/shared/myConfetti.js'
import DateManager from 'managers/dateManager.js'
import DateFormats from 'constants/dateFormats.js'
import moment from 'moment'

import BottomCard from '../shared/bottomCard'
import { PiBellSimpleRinging, PiMoneyWavyDuotone } from 'react-icons/pi'
import { AiOutlineFileAdd } from 'react-icons/ai'
import { MdOutlineFilterAltOff } from 'react-icons/md'
import SecurityManager from '../../managers/securityManager'
import NewExpenseForm from '../forms/newExpenseForm'
import FirebaseStorage from 'database/firebaseStorage'
import LightGallery from 'lightgallery/react'
import MenuItem from '@mui/material/MenuItem'
import { MobileDatePicker } from '@mui/x-date-pickers-pro'
import { Fade } from 'react-awesome-reveal'
import { RxUpdate } from 'react-icons/rx'
import 'lightgallery/css/lightgallery.css'

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
import DomManager from '../../managers/domManager'
import NoDataFallbackText from '../shared/noDataFallbackText'
import ActivityCategory from '../../models/activityCategory'
import ObjectManager from '../../managers/objectManager'
import ModelNames from '../../models/modelNames'
import StringManager from '../../managers/stringManager'

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
  const [filterApplied, setFilterApplied] = useState(false)
  const [categoriesInUse, setCategoriesInUse] = useState([])
  const [activeExpense, setActiveExpense] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [view, setView] = useState('details')
  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [payer, setPayer] = useState('')
  const [notes, setNotes] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [children, setChildren] = useState([])
  const [shareWith, setShareWith] = useState([])
  const [paidStatus, setPaidStatus] = useState('unpaid')
  const [imageName, setImageName] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [name, setName] = useState('')

  const update = async () => {
    // Fill/overwrite
    let updatedExpense = { ...activeExpense }
    updatedExpense.category = category
    updatedExpense.amount = amount.toString()
    updatedExpense.payer = payer
    updatedExpense.notes = notes
    updatedExpense.dueDate = dueDate
    updatedExpense.children = children
    updatedExpense.shareWith = shareWith
    updatedExpense.paidStatus = paidStatus
    updatedExpense.imageName = imageName
    updatedExpense.recipientName = recipientName
    updatedExpense.name = name
    updatedExpense.ownerPhone = currentUser?.phone

    if (!Manager.isValid(dueDate)) {
      updatedExpense.dueDate = moment(dueDate).format(DateFormats.dateForDb)
    }
    const cleanedExpense = ObjectManager.cleanObject(updatedExpense, ModelNames.expense)
    await DB.updateEntireRecord(`${DB.tables.expenseTracker}/${currentUser.phone}`, cleanedExpense, cleanedExpense.id)
    // await DB.delete(DB.tables.expenseTracker, activeExpense.id)
    // await DB.add(`${DB.tables.expenseTracker}`, cleanedExpense).then(async () => {
    await getSecuredExpenses()
    setActiveExpense(updatedExpense)
    setShowDetails(false)
    // })
  }

  const markAsPaid = async () => {
    await DB.updateRecord(DB.tables.expenseTracker, activeExpense, 'paidStatus', 'paid').then(async () => {
      NotificationManager.sendNotification(
        `Expense Paid`,
        `An expense has been PAID by ${currentUser?.name} \nExpense Name: ${activeExpense.name} \nYou can delete the expense now`,
        currentUser.coparents.filter((x) => (x.name = activeExpense.recipientName))[0].phone,
        currentUser,
        activeExpense.category
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
      if (Manager.isValid(expense) && Manager.isValid(expense.imageName)) {
        await FirebaseStorage.delete(FirebaseStorage.directories.expenseImages, currentUser?.id, expense.imageName, expense)
      }

      // Delete Multiple
      if (existing.length > 1) {
        AlertManager.confirmAlert('Are you sure you would like to delete ALL expenses with the same details?', "I'm Sure", true, async () => {
          let existingMultipleExpenses = existing.filter((x) => x.name === expense.name && x.repeating === true)
          if (Manager.isValid(existingMultipleExpenses)) {
            await DB.deleteMultipleRows(DB.tables.expenseTracker, existingMultipleExpenses)
            AlertManager.successAlert(`All ${expense.name} expenses have been deleted`)
          }
        })
      }

      // Delete Single
      else {
        AlertManager.confirmAlert(`Are you sure you would like to delete the ${activeExpense?.name} expense?`, "I'm Sure", true, async () => {
          await DB.deleteById(`${DB.tables.expenseTracker}/${currentUser.phone}`, expense.id)
        })
      }
    }
  }

  const getSecuredExpenses = async () => {
    let allExpenses = await SecurityManager.getExpenses(currentUser)
    allExpenses = DatasetManager.getUniqueArray(allExpenses, 'id')
    const categories = allExpenses.map((x) => x.category).filter((x) => x !== '')
    setCategoriesInUse(categories)
    setFilterApplied(false)
    setShowFilterCard(false)
    setExpenses(allExpenses)
    return allExpenses
  }

  const sendReminder = async (expense) => {
    const message = `This is a reminder to pay the ${expense.name} expense.  ${
      Manager.isValid(expense.dueDate) ? 'Due date is: ' + expense.dueDate : ''
    }`
    NotificationManager.sendNotification(`Expense Reminder`, message, expense?.payer?.phone, currentUser, ActivityCategory.expenses)
    AlertManager.successAlert('Reminder Sent')
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

  const setDefaults = () => {
    setCategory(activeExpense?.category)
    setAmount(activeExpense?.amount)
    setPayer(activeExpense?.payer)
    setNotes(activeExpense?.notes)
    setDueDate(activeExpense?.dueDate)
    setChildren(activeExpense?.children)
    setShareWith(activeExpense?.shareWith)
    setPaidStatus('unpaid')
    setImageName(activeExpense?.imageName)
    setRecipientName(activeExpense?.recipientName)
  }

  useEffect(() => {
    if (activeExpense) {
      setDefaults()
    }
  }, [activeExpense])

  useEffect(() => {
    onTableChange().then((r) => r)
    setView('details')
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
        wrapperClass="filter-card"
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
                UNPAID
              </div>
              <div className="pill" onClick={() => handlePaidStatusSelection('paid')}>
                PAID
              </div>
            </div>
          </div>
          <Label isBold={true} text={'Expense Category'} classes="mb-5"></Label>
          <div className="filter-row">
            <div className="pills category">
              {ExpenseCategories.sort().map((cat, index) => {
                return (
                  <div key={index}>
                    {categoriesInUse.includes(cat) && (
                      <div onClick={() => handleCategorySelection(cat)} key={index} className="pill">
                        {cat}
                      </div>
                    )}
                  </div>
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
          wrapperClass="payment-options-card"
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
        submitText={'Update'}
        title={`${StringManager.uppercaseFirstLetterOfAllWords(activeExpense?.name || '')}`}
        submitIcon={<RxUpdate className={'fs-16'} />}
        onSubmit={update}
        className="expense-tracker form"
        wrapperClass="expense-tracker"
        onClose={() => {
          setActiveExpense(null)
          setShowDetails(false)
        }}
        showCard={showDetails}>
        <div id="details" className={`content ${activeExpense?.reason?.length > 20 ? 'long-text' : ''}`}>
          <div className="flex views-wrapper mb-15" id="views">
            <p onClick={() => setView('details')} className={view === 'details' ? 'view active' : 'view'}>
              Details
            </p>
            <p onClick={() => setView('edit')} className={view === 'edit' ? 'view active' : 'view'}>
              Edit
            </p>
          </div>

          {/* DETAILS */}
          {view === 'details' && (
            <>
              {/* NAME */}
              <div id="row" className="flex-start">
                <p id="title">
                  <b>Name</b>: {StringManager.uppercaseFirstLetterOfAllWords(activeExpense?.name)}
                </p>
              </div>
              {/* AMOUNT */}
              <div id="row" className="flex-start">
                <p id="title">
                  <b>Amount</b>: ${activeExpense?.amount}
                </p>
              </div>
              <div id="row" className="flex-start">
                {/* SENT TO */}
                <p id="title">
                  <b>Sent to: </b>
                  {StringManager.formatNameFirstNameOnly(currentUser?.coparents?.filter((x) => x?.phone === activeExpense?.payer?.phone)[0]?.name)}
                </p>
              </div>

              {/* PAY TO */}
              <div id="row" className="flex-start">
                <p id="title">
                  <b>Pay to: </b>
                  {StringManager.formatNameFirstNameOnly(activeExpense?.recipientName)}
                </p>
              </div>

              {/* DUE DATE */}
              {activeExpense?.dueDate && activeExpense?.dueDate?.length > 0 && (
                <div className="flex flex-start" id="row">
                  <p id="title">
                    <b>Due Date: </b>
                    <span>
                      {DateManager.formatDate(activeExpense?.dueDate)} ({moment(moment(activeExpense?.dueDate).startOf('day')).fromNow().toString()})
                    </span>
                  </p>
                </div>
              )}

              {/* CHILDREN */}
              {Manager.isValid(activeExpense?.children) && (
                <div className="flex flex-start" id="row">
                  <p
                    id="title"
                    dangerouslySetInnerHTML={{
                      __html: `${activeExpense?.children?.join('|').replaceAll('|', '<span class="divider">|</span>')}`,
                    }}></p>
                </div>
              )}

              {/* DATE ADDED */}
              <div id="row" className="flex-start flex">
                <p id="title">
                  <b>Created on: </b> <span>{DateManager.formatDate(activeExpense?.dateAdded)}</span>
                </p>
              </div>

              {/* NOTES */}
              {activeExpense?.notes && activeExpense?.notes?.length > 0 && (
                <div className="flex wrap" id="row">
                  <p id="title" className="mr-auto mb-5">
                    <b>Notes: </b>
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
            </>
          )}

          {/* EDIT */}
          {view === 'edit' && (
            <>
              <InputWrapper
                isDebounced={false}
                inputType="input"
                labelText={'Name'}
                defaultValue={activeExpense?.name}
                onChange={(e) => setName(e.target.value)}
              />

              {/* AMOUNT */}
              <InputWrapper
                inputValueType="number"
                defaultValue={activeExpense?.amount}
                labelText={'Amount'}
                onChange={(e) => setAmount(e.target.value)}
              />

              {/* DUE DATE */}
              <InputWrapper inputType={'date'} labelText={'Due Date'}>
                <MobileDatePicker
                  value={moment(activeExpense?.dueDate)}
                  className="mt-0 w-100"
                  onAccept={(e) => setDueDate(moment(e).format('MM/DD/yyyy'))}
                />
              </InputWrapper>

              {/* EXPENSE TYPE */}
              <SelectDropdown wrapperClasses={'mb-15'} selectValue={category} onChange={(e) => setCategory(e.target.value)} labelText={'Category'}>
                {ExpenseCategories.map((cat, index) => {
                  return (
                    <MenuItem key={index} value={cat}>
                      {cat}
                    </MenuItem>
                  )
                })}
              </SelectDropdown>

              <InputWrapper
                defaultValue={activeExpense?.notes}
                onChange={(e) => setNotes(e.target.value)}
                inputType={'textarea'}
                labelText={'Notes'}></InputWrapper>

              {/* BUTTONS */}
              <div className="action-buttons">
                <button className="button default" onClick={() => markAsPaid()}>
                  Mark Paid
                </button>

                {/* DELETE */}
                {activeExpense?.ownerPhone === currentUser?.phone && (
                  <button
                    onClick={async () => {
                      await deleteExpense(activeExpense)
                      setShowDetails(false)
                    }}
                    className="default red"
                    id="delete-button">
                    Delete
                  </button>
                )}
              </div>
              {activeExpense?.paidStatus === 'unpaid' && activeExpense?.ownerPhone === currentUser?.phone && (
                <button className="button default submit green center mt-10" onClick={() => sendReminder(activeExpense)}>
                  Send Reminder <PiBellSimpleRinging className={'fs-18'} />
                </button>
              )}
            </>
          )}
        </div>
      </BottomCard>

      {/* PAGE CONTAINER */}
      <div id="expense-tracker" className={`${theme} page-container form`}>
        {expenses.length === 0 && <NoDataFallbackText text={'There are currently no expenses'} />}
        <Fade direction={'up'} duration={1000} triggerOnce={true} className={'expense-tracker-fade-wrapper'}>
          <div className="flex" id="screen-title-wrapper">
            <p className="screen-title">Expense Tracker </p>
            {!DomManager.isMobile() && <AiOutlineFileAdd onClick={() => setShowNewExpenseCard(true)} id={'add-new-button'} />}
          </div>
          <p className={`${theme} text-screen-intro`}>
            Add expenses to be paid by your co-parent. If a new expense is created for you to pay, you will have the opportunity to approve or reject
            it.
          </p>
          <p className="payment-options-link mt-10" onClick={() => setShowPaymentOptionsCard(true)}>
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

          {/* LOOP EXPENSES */}
          <div id="expenses-container">
            {Manager.isValid(expenses) &&
              expenses.map((expense, index) => {
                return (
                  <div
                    key={expense.id}
                    className="mt-20"
                    id="row"
                    onClick={() => {
                      setActiveExpense(expense)
                      setShowDetails(true)
                    }}>
                    <div id="primary-icon-wrapper">
                      {expense.paidStatus === 'unpaid' && <span className="amount">${expense.amount}</span>}
                      {expense.paidStatus === 'paid' && <PiMoneyWavyDuotone id={'primary-row-icon'} />}
                    </div>
                    <div id="content" data-expense-id={expense.id} className={`expense wrap`}>
                      {/* EXPENSE NAME */}
                      <div id="name-wrapper" className="flex align-center">
                        <p id="title" className="name row-title">
                          {StringManager.uppercaseFirstLetterOfAllWords(expense.name)}
                        </p>
                        <span className={`${expense.paidStatus} status`} id="request-status">
                          {StringManager.uppercaseFirstLetterOfAllWords(expense.paidStatus.toUpperCase())}
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
        </Fade>
      </div>
      {!showNewExpenseCard && !showPaymentOptionsCard && !showFilterCard && !showDetails && (
        <NavBar navbarClass={'child-info'}>
          <AiOutlineFileAdd onClick={() => setShowNewExpenseCard(true)} id={'add-new-button'} />
        </NavBar>
      )}
    </>
  )
}
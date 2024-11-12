import React, { useContext, useEffect, useRef, useState } from 'react'
import DB from '@db'
import Manager from '@manager'
import globalState from '../../context.js'
import { child, getDatabase, onValue, ref } from 'firebase/database'
import NotificationManager from '@managers/notificationManager.js'
import PushAlertApi from '@api/pushAlert'
import MyConfetti from '@shared/myConfetti.js'
import DateManager from 'managers/dateManager.js'
import DateFormats from 'constants/dateFormats.js'
import moment from 'moment'
import '../../prototypes.js'
import BottomCard from '../shared/bottomCard'
import { PiBellSimpleRinging, PiClockCountdownDuotone, PiConfettiDuotone, PiTrashSimpleDuotone } from 'react-icons/pi'
import { AiOutlineFileAdd } from 'react-icons/ai'
import SecurityManager from '../../managers/securityManager'
import NewExpenseForm from '../forms/newExpenseForm'
import FirebaseStorage from '@firebaseStorage'
import LightGallery from 'lightgallery/react'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import 'lightgallery/css/lightgallery.css'
import { MdEventRepeat, MdPriceCheck } from 'react-icons/md'
import {
  confirmAlert,
  contains,
  displayAlert,
  formatFileName,
  formatNameFirstNameOnly,
  getFileExtension,
  getFirstWord,
  hasClass,
  isAllUppercase,
  removeFileExtension,
  removeSpacesAndLowerCase,
  spaceBetweenWords,
  stringHasNumbers,
  successAlert,
  throwError,
  toCamelCase,
  uniqueArray,
  uppercaseFirstLetterOfAllWords,
  wordCount,
} from '../../globalFunctions'

// ICONS
import { ImAppleinc } from 'react-icons/im'
import { IoLogoVenmo } from 'react-icons/io5'
import { SiCashapp, SiZelle } from 'react-icons/si'
import { LiaCcPaypal } from 'react-icons/lia'
import { BsArrowsAngleExpand, BsFilter } from 'react-icons/bs'
import NavBar from '../navBar'
import Label from '../shared/label'
import ExpenseCategories from '../../constants/expenseCategories'

// VIEW TYPES
const ViewTypes = {
  all: 'All',
  repeating: 'Repeating',
  individual: 'Single Date',
}

export default function ExpenseTracker() {
  const { state, setState, theme, navbarButton } = useContext(globalState)
  const { currentUser } = state
  const [expenses, setExpenses] = useState([])
  const [currentExpense, setCurrentExpense] = useState(null)
  const [executePaid, setExecutePaid] = useState(false)
  const [showPaymentOptionsCard, setShowPaymentOptionsCard] = useState(false)
  const [viewType, setViewType] = useState(ViewTypes.all)
  const [showNewExpenseCard, setShowNewExpenseCard] = useState(false)
  const [showFullExpenseCard, setShowFullExpenseCard] = useState(false)
  const [showFilterCard, setShowFilterCard] = useState(false)
  const [refreshKey, setRefreshKey] = useState(Manager.getUid())
  const [sortByValue, setSortByValue] = useState('')
  let contentEditable = useRef()

  const markAsPaid = async () => {
    let arr = []
    expenses.forEach((expense) => {
      let thisExpense = expense
      if (thisExpense.id === currentExpense.id) {
        currentExpense.paidStatus = 'paid'
        expense = currentExpense
      }
      arr.push(expense)
    })
    setExpenses(arr)
    await DB.updateRecord(DB.tables.expenseTracker, currentExpense, 'paidStatus', 'paid').then(async () => {
      const subId = await NotificationManager.getUserSubId(currentExpense.phone)
      PushAlertApi.sendMessage(
        `Expense Paid`,
        `An expense has been PAID by ${currentUser.name} \nExpense Name: ${currentExpense.name} \nYou can delete the expense now`,
        subId
      )

      MyConfetti.fire()
    })
  }

  const deleteExpense = async (eventCount) => {
    console.log(eventCount)
    if (Manager.isValid(currentExpense)) {
      if (Manager.isValid(currentExpense) && Manager.isValid(currentExpense.imageName, null, null, true)) {
        await FirebaseStorage.delete(FirebaseStorage.directories.expenseImages, currentUser.id, currentExpense.imageName, currentExpense)
      }
      if (eventCount === 1) {
        const deleteKey = await DB.getSnapshotKey(DB.tables.expenseTracker, currentExpense, 'id')
        await DB.deleteByPath(`${DB.tables.expenseTracker}/${deleteKey}`)
        setCurrentExpense(false)
      } else {
        console.log(currentExpense)
        let existingExpenses = expenses.filter((x) => x.name === currentExpense.name && x.repeating === true)
        console.log(existingExpenses)
        if (Manager.isValid(existingExpenses, true)) {
          await DB.deleteMultipleRows(DB.tables.expenseTracker, existingExpenses)
          setCurrentExpense(false)
          successAlert(`All ${currentExpense.name} expenses have been deleted`)
        }
      }
    }
  }

  const getSecuredExpenses = async () => {
    let allExpenses = await SecurityManager.getExpenses(currentUser)
    allExpenses = Manager.getUniqueArrayOfObjects(allExpenses, 'id')

    setExpenses(allExpenses)
    return allExpenses
  }

  const sendReminder = async (expense) => {
    const coparents = currentUser.coparents
    const expenseCoparent = coparents.filter((x) => x.phone === expense.payer.phone)[0]
    const subId = await NotificationManager.getUserSubId(expenseCoparent.phone)
    const message = `This is a reminder to pay the ${expense.name} expense. Due date is: ${
      Manager.isValid(expense.dueDate) ? expense.dueDate : 'N/A'
    }`
    PushAlertApi.sendMessage(`Expense Reminder`, message, subId)
    successAlert('Reminder Sent')
  }

  const handleEditable = async (e, recordToUpdate, propName, value) => {
    if (propName === 'dueDate') {
      let updatedDate = moment(value).format(DateFormats.dateForDb)
      value = moment(updatedDate).format(DateFormats.dateForDb)
    }
    await DB.updateRecord(DB.tables.expenseTracker, recordToUpdate, propName, value, 'id').finally(async () => {
      await getSecuredExpenses()
    })
  }

  const handleFullExpenseToggle = async (e, expenseId) => {
    const expenseToShow = document.querySelector(`[data-expense-id='${expenseId}']`)

    if (expenseToShow) {
      setShowFullExpenseCard(true)
      expenseToShow.classList.add('active')
    }
  }

  const onTableChange = async () => {
    const dbRef = ref(getDatabase())

    onValue(child(dbRef, DB.tables.expenseTracker), async (snapshot) => {
      await getSecuredExpenses().then((r) => r)
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
  }

  const handleSortBySelection = async () => {}

  useEffect(() => {
    onTableChange().then((r) => r)
    Manager.showPageContainer()
  }, [])

  useEffect(() => {
    if (currentExpense) {
      if (executePaid) {
        markAsPaid().then((r) => r)
      }
    }
  }, [currentExpense])

  return (
    <div>
      {/* NEW EXPENSE FORM */}
      <NewExpenseForm showCard={showNewExpenseCard} hideCard={(e) => setShowNewExpenseCard(false)} />

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
          <hr />
          <Label isBold={true} text={'Expense Category'} classes="mb-5"></Label>
          <div className="pills category">
            {ExpenseCategories.sort().map((cat, index) => {
              return (
                <div key={index} className="pill">
                  {cat}
                </div>
              )
            })}
          </div>
          <hr />
          <Label isBold={true} text={'Sort by'} classes="mb-5 sort-by"></Label>
          <FormControl fullWidth>
            <Select className={'w-100'} value={sortByValue} onChange={handleSortBySelection}>
              <MenuItem value={'Recently Added'}>{'Recently Added'}</MenuItem>
              <MenuItem value={'Amount: High to Low'}>{'Amount: High to Low'}</MenuItem>
              <MenuItem value={'Amount: Low to High'}>{'Amount: Low to High'}</MenuItem>
            </Select>
          </FormControl>
        </>
      </BottomCard>

      {/* PAYMENT OPTIONS */}
      <>
        {showPaymentOptionsCard && (
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
                      <p className="description ">Safely send money to co-parent, no matter where they bank.</p>
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

                <hr />

                {/* VENMO */}
                <div className="option venmo">
                  <div className="flex brand-name-wrapper venmo">
                    <p className="brand-name mr-10">Venmo</p>
                    <IoLogoVenmo className={'venmo-icon'} />
                  </div>
                  <div className="flex">
                    <div className="text">
                      <p className="description ">Fast, safe, social payments.</p>
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

                <hr />

                {/* APPLE PAY */}
                <div className="option apple-cash">
                  <div className="flex brand-name-wrapper apple">
                    <p className="brand-name mr-10">Apple Cash</p>
                    <ImAppleinc className={'apple-icon'} />
                  </div>
                  <div className="flex ">
                    <div className="text">
                      <p className="description ">Use Apple Cash to send and receive money with people you know.</p>
                      <a href="https://support.apple.com/en-us/105013" target="_blank" className="setup-instructions mb-10">
                        Learn More <span className="material-icons">open_in_new</span>
                      </a>
                    </div>
                  </div>
                </div>

                <hr />

                {/* PAYPAL */}
                <div className="option paypal">
                  <div className="flex brand-name-wrapper paypal">
                    <p className="brand-name mr-10">PayPal</p>
                    <LiaCcPaypal className={'paypal-icon'} />
                  </div>
                  <div className="flex">
                    <div className="text">
                      <p className="description ">Send and request money, quickly and securely.</p>
                      <a href="https://www.paypal.com/us/digital-wallet/send-receive-money" target="_blank" className="setup-instructions mb-10">
                        Learn More <span className="material-icons">open_in_new</span>
                      </a>
                    </div>
                  </div>
                </div>

                <hr />

                {/* CASHAPP */}
                <div className="option cashapp">
                  <div className="flex brand-name-wrapper cashapp">
                    <p className="brand-name mr-10">CashApp</p>
                    <SiCashapp />
                  </div>
                  <div className="flex">
                    <div className="text">
                      <p className="description ">Pay anyone, instantly.</p>
                      <a href="https://cash.app/help/6485-getting-started-with-cash-app" target="_blank" className="setup-instructions mb-10">
                        Learn More <span className="material-icons">open_in_new</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </BottomCard>
        )}
      </>

      {/* PAGE CONTAINER */}
      <div id="expense-tracker" className={`${theme} page-container form`}>
        <p className="screen-title">Expense Tracker</p>
        <p className={`${theme}  text-screen-intro`}>
          Add expenses to be paid by your co-parent. If a new expense is created for you to pay, you will have the opportunity to approve or reject
          it.
        </p>
        <p className="payment-options-link mb-20 mt-10" onClick={() => setShowPaymentOptionsCard(true)}>
          Bill Payment & Money Transfer Options
        </p>

        {/* FILTER BUTTON */}
        <button onClick={() => setShowFilterCard(true)} id="filter-button">
          Filter <BsFilter />
        </button>

        {expenses.length === 0 && (
          <div id="instructions-wrapper">
            <p className="instructions center">
              There are currently no expenses <PiConfettiDuotone className={'fs-22'} />
            </p>
          </div>
        )}

        {/* LOOP EXPENSES */}
        <div id="expenses-container">
          <div id="expenses-card-container">
            {Manager.isValid(expenses, true) &&
              expenses.map((expense, index) => {
                return (
                  <div key={index}>
                    <div onClick={(e) => handleFullExpenseToggle(e, expense.id)} data-expense-id={expense.id} className={` expense`}>
                      <div className="content">
                        <div className="lower-details">
                          {/* LOWER DETAILS TEXT */}
                          <div className="lower-details-text">
                            {/* EXPENSE NAME */}
                            <div className="flex align-center">
                              <p
                                onBlur={(e) => {
                                  handleEditable(e, expense, 'name', e.currentTarget.innerHTML).then((r) => r)
                                }}
                                contentEditable
                                dangerouslySetInnerHTML={{ __html: uppercaseFirstLetterOfAllWords(expense.name).toString() }}
                                className="name"></p>

                              {/* AMOUNT */}
                              <span
                                className="amount"
                                onBlur={(e) => {
                                  handleEditable(e, expense, 'amount', e.currentTarget.innerHTML.replace('$', '')).then((r) => r)
                                }}
                                contentEditable
                                dangerouslySetInnerHTML={{ __html: `${expense.amount}`.replace(/^/, '$') }}></span>
                            </div>

                            {/* CATEGORY */}
                            {expense?.category?.length > 0 && (
                              <p id="expense-category" className="mt-5">
                                Category: <span>{expense.category}</span>
                              </p>
                            )}

                            {(!expense.category || expense?.category?.length === 0) && <p id="expense-category">Category: None</p>}
                            <span className={showFullExpenseCard ? 'active' : ''} id="hr">
                              <hr />
                            </span>
                            {/* EXPENSE CONTENT TO TOGGLE */}
                            <div id="content-to-toggle">
                              {/* PAY TO */}
                              <div className="flex editable">
                                <p className="recipient subtext">Pay to:</p>
                                <span
                                  onBlur={(e) => {
                                    handleEditable(e, expense, 'recipientName', e.currentTarget.innerHTML).then((r) => r)
                                  }}
                                  contentEditable
                                  dangerouslySetInnerHTML={{ __html: expense.recipientName }}
                                  className="recipient subtext"></span>
                              </div>

                              {/* CHILDREN */}
                              {expense && expense.children && expense.children.length > 0 && (
                                <div className="flex">
                                  <p>Children</p>
                                  <span>{expense.children.join(', ')}</span>
                                </div>
                              )}

                              {/* DATE ADDED */}
                              <div className="group flex">
                                <p id="date-added-text">Date Added:</p>
                                <span>{DateManager.formatDate(expense.dateAdded)}</span>
                              </div>

                              {/* REPEATING */}
                              {expense.repeating && (
                                <p>
                                  Repeating <MdEventRepeat id={'repeating-icon'} />{' '}
                                </p>
                              )}

                              {/* NOTES */}
                              {expense.notes && expense.notes.length > 0 && (
                                <div className="flex editable notes">
                                  <p>Notes:</p>
                                  <span
                                    onBlur={(e) => {
                                      handleEditable(e, expense, 'notes', e.currentTarget.innerHTML).then((r) => r)
                                    }}
                                    contentEditable
                                    dangerouslySetInnerHTML={{ __html: expense.notes }}></span>
                                </div>
                              )}

                              {/* DUE DATE */}
                              {expense.dueDate && expense.dueDate.length > 0 && (
                                <div className="flex editable">
                                  <p>Due Date:</p>

                                  <span
                                    onBlur={(e) => {
                                      handleEditable(e, expense, 'dueDate', e.currentTarget.innerHTML).then((r) => r)
                                    }}
                                    contentEditable
                                    dangerouslySetInnerHTML={{ __html: DateManager.formatDate(expense.dueDate) }}></span>
                                </div>
                              )}

                              {/* DUE IN... */}
                              {expense.dueDate.length > 0 && (
                                <div className="flex due-in">
                                  <p>Countdown:</p>
                                  <span>
                                    <PiClockCountdownDuotone className={'fs-24 mr-5'} />
                                    {moment(moment(expense.dueDate).startOf('day')).fromNow().toString()}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* EXPENSE IMAGE */}
                            {Manager.isValid(expense.imageUrl) && (
                              <div id="expense-image">
                                <LightGallery elementClassNames={'light-gallery'} speed={500} selector={'#img-container'}>
                                  <div
                                    style={{ backgroundImage: `url(${expense.imageUrl})` }}
                                    data-src={expense.imageUrl}
                                    id="img-container"
                                    className="flex"></div>
                                </LightGallery>
                                <BsArrowsAngleExpand />
                              </div>
                            )}

                            {/* BUTTONS */}
                            <div id="button-group" className="flex">
                              <button
                                onClick={() => {
                                  setCurrentExpense(expense)
                                  setExecutePaid(true)
                                }}
                                className="green-text">
                                Paid <MdPriceCheck className={'fs-22'} />
                              </button>
                              {expense.phone === currentUser.phone && (
                                <button className="send-reminder" onClick={() => sendReminder(expense)}>
                                  Send Reminder <PiBellSimpleRinging className={'fs-18'} />
                                </button>
                              )}
                            </div>

                            {/* DELETE */}
                            <PiTrashSimpleDuotone
                              className="delete-icon"
                              onClick={async () => {
                                setCurrentExpense(expense)
                                let existing = await getSecuredExpenses()
                                existing = existing.filter((x) => x.name === expense.name)
                                if (existing.length > 1) {
                                  confirmAlert('Are you sure you would like to delete ALL expenses with the same details?', "I'm Sure", true, () => {
                                    setTimeout(async () => {
                                      await deleteExpense(existing.length)
                                    }, 400)
                                  })
                                } else {
                                  setTimeout(() => {
                                    confirmAlert('Are you sure you would like to delete this expense?', "I'm Sure", true, async () => {
                                      await deleteExpense(existing.length)
                                    })
                                  }, 400)
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <hr />
                  </div>
                )
              })}
          </div>
        </div>
      </div>
      {!showNewExpenseCard && !showPaymentOptionsCard && !showFilterCard && (
        <NavBar navbarClass={'child-info'}>
          <AiOutlineFileAdd onClick={() => setShowNewExpenseCard(true)} id={'add-new-button'} />
        </NavBar>
      )}
    </div>
  )
}

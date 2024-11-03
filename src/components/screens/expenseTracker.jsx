import React, { useContext, useEffect, useRef, useState } from 'react'
import DB from '@db'
import Manager from '@manager'
import globalState from '../../context.js'
import { child, getDatabase, onValue, ref } from 'firebase/database'
import NotificationManager from '@managers/notificationManager.js'
import PushAlertApi from '@api/pushAlert'
import MyConfetti from '@shared/myConfetti.js'
import DateManager from 'managers/dateManager.js'
import CheckboxGroup from 'components/shared/checkboxGroup.jsx'
import DateFormats from 'constants/dateFormats.js'
import moment from 'moment'
import '../../prototypes.js'
import BottomCard from '../shared/bottomCard'
import { PiBellSimpleRinging, PiClockCountdownDuotone, PiConfettiDuotone, PiTrashDuotone } from 'react-icons/pi'
import SecurityManager from '../../managers/securityManager'
import NewExpenseForm from '../forms/newExpenseForm'
import FirebaseStorage from '@firebaseStorage'
import LightGallery from 'lightgallery/react'
import 'lightgallery/css/lightgallery.css'

import {
  confirmAlert,
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
import { BsArrowsAngleExpand } from 'react-icons/bs'
import { MdPriceCheck } from 'react-icons/md'

// VIEW TYPES
const ViewTypes = {
  all: 'All',
  repeating: 'Repeating',
  individual: 'Single Date',
}

export default function ExpenseTracker() {
  const [expenses, setExpenses] = useState([])
  const { state, setState, theme, navbarButton } = useContext(globalState)
  const { currentUser } = state
  const [currentExpense, setCurrentExpense] = useState(null)
  const [deleteConfirmTitle, setDeleteConfirmTitle] = useState('')
  const [confirmMessage, setConfirmMessage] = useState('')
  const [executePaid, setExecutePaid] = useState(false)
  const [showPaymentOptionsCard, setShowPaymentOptionsCard] = useState(false)
  const [viewType, setViewType] = useState(ViewTypes.all)
  const [showNewExpenseCard, setShowNewExpenseCard] = useState(false)
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
    if (Manager.isValid(currentExpense) && Manager.isValid(currentExpense.imageName, null, null, true)) {
      await FirebaseStorage.delete(FirebaseStorage.directories.expenseImages, currentUser.id, currentExpense.imageName, currentExpense)
    }
    if (eventCount === 'single') {
      const deleteKey = await DB.getSnapshotKey(DB.tables.expenseTracker, currentExpense, 'id')
      await DB.deleteByPath(`${DB.tables.expenseTracker}/${deleteKey}`)
      setCurrentExpense(false)
      setConfirmMessage('')
    } else {
      let existingExpenses = expenses.filter((x) => x.name === currentExpense.name && x.repeating === true)
      if (Manager.isValid(existingExpenses, true)) {
        for (let expense of existingExpenses) {
          await DB.delete(DB.tables.expenseTracker, expense.id).finally(async () => {
            setCurrentExpense(false)
            setDeleteConfirmTitle('')
            successAlert(`All ${currentExpense.name} expenses have been deleted`)
          })
        }
      }
    }
  }

  const getSecuredExpenses = async () => {
    let allExpenses = await SecurityManager.getExpenses(currentUser)
    allExpenses = Manager.getUniqueArrayOfObjects(allExpenses, 'id')
    if (viewType === ViewTypes.repeating) {
      allExpenses = allExpenses.filter((x) => x.repeating === true)
    } else if (viewType === ViewTypes.individual) {
      allExpenses = allExpenses.filter((x) => x.repeating === false)
    }

    setExpenses(allExpenses)
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

  const handleViewTypeSelection = async (e) => {
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        setViewType(e)
      },
      (e) => {
        // setViewType('')
      },
      false
    )
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

  const setNavbarButton = (action, icon = 'add', color = 'green') => {
    setTimeout(() => {
      setState({
        ...state,
        navbarButton: {
          ...navbarButton,
          action: () => action(),
          icon: icon,
          color: color,
        },
      })
    }, 500)
  }

  useEffect(() => {
    getSecuredExpenses().then((r) => r)
  }, [viewType])

  useEffect(() => {
    const dbRef = ref(getDatabase())

    onValue(child(dbRef, DB.tables.expenseTracker), async (snapshot) => {
      await getSecuredExpenses().then((r) => r)
    })
    Manager.showPageContainer('show')
    setNavbarButton(() => setShowNewExpenseCard(true))
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
      {/* CONFIRMS */}
      <>
        {/* CONFIRM DELETE - SINGLE */}
        <Confirm
          message={`Are you sure you would like to delete the ${currentExpense?.name?.uppercaseFirstLetterOfAllWords()} expense?`}
          title={deleteConfirmTitle}
          onAccept={() => {
            setDeleteConfirmTitle('')
            deleteExpense('single').then((r) => r)
          }}
          onReject={() => setDeleteConfirmTitle('')}
          onCancel={() => setDeleteConfirmTitle('')}
        />
        {/*  MULTIPLE CONFIRM - DELETE */}
        <Confirm
          onAccept={async () => {
            await deleteExpense('multiple')
            setDeleteConfirmTitle('')
          }}
          onCancel={() => setDeleteConfirmTitle('')}
          buttonsText={['All Expenses', 'Just this Expense']}
          onReject={() => {
            deleteExpense('single').then((r) => r)
          }}
          message={deleteConfirmTitle}
          subtitle={`Would you like to delete all expenses with this information or just this one?`}
        />
      </>

      {/* NEW EXPENSE FORM */}
      <NewExpenseForm showCard={showNewExpenseCard} hideCard={(e) => setShowNewExpenseCard(false)} />

      {/* PAYMENT OPTIONS */}
      <>
        {showPaymentOptionsCard && (
          <BottomCard
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
                    src="https://www.youtube.com/embed/OTZcPfLlq4w"
                    title="Zelle® | How it Works"
                    frameBorder="0"
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
        <p className={`${theme}  text-screen-intro`}>
          Add expenses to be paid by your co-parent. If a new expense is created for you to pay, you will have the opportunity to approve or reject
          it.
        </p>
        <p className="payment-options-link mb-20 mt-10" onClick={() => setShowPaymentOptionsCard(true)}>
          Bill Payment & Money Transfer Options
        </p>

        {/* SET VIEW TYPE */}
        <>
          {(expenses.length > 0 || viewType === ViewTypes.repeating) && (
            <>
              <label className="mb-10">Which type of expenses would you like to view?</label>
              <CheckboxGroup
                defaultLabel={'All'}
                skipNameFormatting={true}
                labels={['All', 'Single Date', 'Repeating']}
                onCheck={handleViewTypeSelection}
                elClass={'view-type'}
                dataPhone={[]}
              />
              <p className={`${theme} description`}>tap a field to edit - tap outside the field when you are done</p>
            </>
          )}
        </>
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
                  <div key={Manager.getUid()} data-expense-id={expense.id} className={`expense mb-20`}>
                    <div className="content">
                      <div className="lower-details">
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

                        {/* LOWER DETAILS TEXT */}
                        <div className="lower-details-text">
                          {/* DELETE */}
                          <div
                            className="flex delete"
                            onClick={async () => {
                              setCurrentExpense(expense)
                              let existing = await DB.getTable(DB.tables.expenseTracker)
                              if (!Array.isArray(existing)) {
                                existing = Manager.convertToArray(existing)
                              }
                              existing = existing.filter((x) => x.name === expense.name)
                              if (existing.length > 1) {
                                setDeleteConfirmTitle('DELETE REPEATING EXPENSES')
                              } else {
                                setDeleteConfirmTitle('DELETING EXPENSE')
                              }
                            }}>
                            <span>Delete</span> <PiTrashDuotone />
                          </div>
                          {/* EXPENSE NAME */}
                          <p
                            onBlur={(e) => {
                              handleEditable(e, expense, 'name', e.currentTarget.innerHTML).then((r) => r)
                            }}
                            contentEditable
                            dangerouslySetInnerHTML={{ __html: uppercaseFirstLetterOfAllWords(expense.name).toString() }}
                            className="name"></p>

                          {/* AMOUNT */}
                          <span
                            className="amount mb-10"
                            onBlur={(e) => {
                              handleEditable(e, expense, 'amount', e.currentTarget.innerHTML.replace('$', '')).then((r) => r)
                            }}
                            contentEditable
                            dangerouslySetInnerHTML={{ __html: `${expense.amount}`.replace(/^/, '$') }}></span>
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

                          {/* NOTES */}
                          {expense.notes && expense.notes.length > 0 && (
                            <div className="flex editable notes">
                              <p>Notes:</p>
                              <span
                                onBlur={(e) => {
                                  handleEditable(e, expense, 'notes', e.currentTarget.innerHTML)
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
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </div>
    </div>
  )
}

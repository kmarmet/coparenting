import React, { useState, useEffect, useContext, useRef, createRef } from 'react'
import DB from '@db'
import Manager from '@manager'
import globalState from '../../context.js'
import ScreenNames from '@screenNames'
import { getDatabase, ref, set, get, child, onValue } from 'firebase/database'
import NotificationManager from '@managers/notificationManager.js'
import AddNewButton from '@shared/addNewButton.jsx'
import PushAlertApi from '@api/pushAlert'
import MyConfetti from '@shared/myConfetti.js'
import Confirm from '@shared/confirm.jsx'
import DB_UserScoped from '@userScoped'
import DateManager from 'managers/dateManager.js'
import CheckboxGroup from 'components/shared/checkboxGroup.jsx'
import DateFormats from 'constants/dateFormats.js'
import moment from 'moment'
import '../../prototypes.js'
import BottomCard from '../shared/bottomCard'
import ImageTheater from '../shared/imageTheater'
import Expense from '../../models/expense'

const ViewTypes = {
  all: 'All',
  repeating: 'Repeating',
  individual: 'Single Date',
}

export default function ExpenseTracker() {
  const [expenseLog, setExpenseLog] = useState([])
  // @ts-ignore
  const { state, setState } = useContext(globalState)
  const { currentUser } = state
  const [currentExpense, setCurrentExpense] = useState(null)
  const [deleteConfirmTitle, setDeleteConfirmTitle] = useState('')
  const [confirmMessage, setConfirmMessage] = useState('')
  const [executePaid, setExecutePaid] = useState(false)
  const [showPaymentOptionsCard, setShowPaymentOptionsCard] = useState(false)
  const [viewType, setViewType] = useState(ViewTypes.all)
  const [showImageTheater, setShowImageTheater] = useState(false)
  const [imageName, setImageName] = useState('')
  const [dueDates, setDueDates] = useState([])
  const [theaterImages, setTheaterImages] = useState([])
  const imgRef = useRef()
  let contentEditable = useRef()

  const markAsPaid = async () => {
    let arr = []
    expenseLog.forEach((expense) => {
      let thisExpense = expense
      if (thisExpense.id === currentExpense.id) {
        currentExpense.paidStatus = 'paid'
        expense = currentExpense
      }
      arr.push(expense)
    })
    setExpenseLog(arr)
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

  const expandImage = (imageUrl, imageName) => {
    const newExpense = new Expense()
    newExpense.url = imageUrl
    setTheaterImages([newExpense])
    setShowImageTheater(true)
  }

  const deleteExpense = async (eventCount) => {
    // DELETE IMAGE //todo
    // TODO Delete Image
    // const expenseContainer = el.currentTarget.closest('.content')
    // const img = expenseContainer.querySelector('[data-img-id]')
    // // Do not attempt to delete image if it is the placeholder
    // if (img) {
    //   if (img.style.display !== 'none') {
    //     const imgId = img.dataset.imgId
    //     FirebaseStorage.delete(FirebaseStorage.directories.expenseImages, imgId)
    //   }
    // }
    const whenDone = () => {
      setTimeout(() => {
        setState({ ...state, alertMessage: ``, showAlert: false, alertType: 'error' })
      }, 1200)
    }
    if (eventCount === 'single') {
      await DB.delete(DB.tables.expenseTracker, currentExpense.id).finally(async () => {
        setCurrentExpense(false)
        setConfirmMessage('')
        await getExpensesFromDb().then((fromDb) => {
          updateLogFromDb(fromDb).finally(whenDone)
        })
      })
    } else {
      let existingExpenses = await DB.getTable(DB.tables.expenseTracker)
      existingExpenses = expenseLog.filter((x) => x.name === currentExpense.name && x.repeating === true)
      existingExpenses.forEach(async (expense) => {
        await DB.delete(DB.tables.expenseTracker, expense.id)
          .finally(async () => {
            setCurrentExpense(false)
            setDeleteConfirmTitle('')
            setState({ ...state, showAlert: true, alertMessage: `All ${currentExpense.name} expenses have been deleted`, alertType: 'success' })
            await getExpensesFromDb()
              .then((fromDb) => {
                updateLogFromDb(fromDb)
                setViewType(ViewTypes.all)
              })
              .finally(whenDone)
          })
          .then((r) => r)
      })
    }
  }

  const updateLogFromDb = async (expensesFromDb) => {
    let allExpenses = await DB.getFilteredRecords(expensesFromDb, currentUser).then((x) => x)
    allExpenses = Manager.getUniqueArrayOfObjects(allExpenses, 'id')

    if (viewType === ViewTypes.repeating) {
      allExpenses = allExpenses.filter((x) => x.repeating === true)
    } else if (viewType === ViewTypes.individual) {
      allExpenses = allExpenses.filter((x) => x.repeating === false)
    }

    setExpenseLog(allExpenses)
  }

  const sendReminder = async (expense) => {
    await DB_UserScoped.getCoparent(expense.recipientName, currentUser).then(async (coparent) => {
      const subId = await NotificationManager.getUserSubId(coparent.phone)
      const message = `This is a reminder to pay the ${expense.name} expense. Due date is: ${
        Manager.isValid(expense.dueDate) ? expense.dueDate : 'N/A'
      }`
      PushAlertApi.sendMessage(`Expense Reminder`, message, subId)
    })
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
      await getExpensesFromDb().then((fromDb) => {
        updateLogFromDb(fromDb)
      })
    })
  }

  const getExpensesFromDb = async () => {
    const promise = await DB.getTable(DB.tables.expenseTracker)
    return promise
  }

  useEffect(() => {
    getExpensesFromDb().then((expenses) => {
      let _expenses = expenses
      if (!Array.isArray(expenses)) {
        _expenses = DB.convertKeyObjectToArray(_expenses)
      }
      updateLogFromDb(_expenses).then((r) => r)
    })
  }, [viewType])

  useEffect(() => {
    const dbRef = ref(getDatabase())

    onValue(child(dbRef, DB.tables.expenseTracker), (snapshot) => {
      getExpensesFromDb().then((expenses) => {
        let _expenses = expenses
        if (!Array.isArray(expenses)) {
          _expenses = DB.convertKeyObjectToArray(_expenses)
        }
        updateLogFromDb(_expenses).then((r) => r)
      })
    })
    Manager.toggleForModalOrNewForm('show')

    setTimeout(() => {
      setState({ ...state, showMenuButton: true, showBackButton: false })
    }, 500)
    // setTimeout(() => {
    //   setImages()
    // }, 1000)
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

      {/* ADD NEW BUTTON */}
      <AddNewButton
        canClose={true}
        onClick={() => {
          setState({ ...state, currentScreen: ScreenNames.newExpense })
        }}
      />

      {/* EXPANDED IMAGE THEATER */}
      <ImageTheater
        showTheater={showImageTheater}
        elClass="image-modal"
        imgArray={theaterImages}
        onClose={(e) => {
          setShowImageTheater(false)
        }}
      />

      {/* PAYMENT OPTIONS */}
      <>
        {showPaymentOptionsCard && (
          <BottomCard
            subtitle="There are a multitude of simple and FREE ways to send money to a coparent for expenses, or for any other reason. Please look below to
              see which option works best for you."
            title={'Payment/Transfer Options'}
            className="payment-options-card"
            onClose={() => setShowPaymentOptionsCard(false)}
            showCard={showPaymentOptionsCard}>
            <div id="payment-options-card">
              <div className="options">
                {/* ZELLE */}
                <div className="option zelle">
                  <p className="brand-date accent">Zelle</p>
                  <div className="flex">
                    <img className="active" src={require('../../img/brandLogos/zelle.png')} alt="" />
                    <div className="text">
                      <p className="description ">Safely send money to coparent, no matter where they bank.</p>
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

                {/* VENMO */}
                <div className="option venmo">
                  <p className="brand-date">Venmo</p>
                  <div className="flex">
                    <img className="active" src={require('../../img/brandLogos/venmo.png')} alt="" />
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
                {/* APPLE PAY */}
                <div className="option apple-cash">
                  <p className="brand-date">Apple Cash</p>
                  <div className="flex ">
                    <img className="active" src={require('../../img/brandLogos/applepay.png')} alt="" />
                    <div className="text">
                      <p className="description ">Use Apple Cash to send and receive money with people you know.</p>
                      <a href="https://support.apple.com/en-us/105013" target="_blank" className="setup-instructions mb-10">
                        Learn More <span className="material-icons">open_in_new</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* PAYPAL */}
                <div className="option paypal">
                  <p className="brand-date">PayPal</p>
                  <div className="flex">
                    <img className="active" src={require('../../img/brandLogos/paypal.png')} alt="" />
                    <div className="text">
                      <p className="description ">Send and request money, quickly and securely.</p>
                      <a href="https://www.paypal.com/us/digital-wallet/send-receive-money" target="_blank" className="setup-instructions mb-10">
                        Learn More <span className="material-icons">open_in_new</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* CASHAPP */}
                <div className="option cashapp">
                  <p className="brand-date">CashApp</p>
                  <div className="flex">
                    <img className="active" src={require('../../img/brandLogos/cashapp.png')} alt="" />
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

      {/* SCREEN TITLE */}
      <p className="screen-title ">Expense Tracker</p>

      {/* PAGE CONTAINER */}
      <div id="expense-tracker" className={`${currentUser?.settings?.theme} page-container form`}>
        <p className={`${currentUser?.settings?.theme}  text-screen-intro`}>
          Add expenses to be paid by your coparent. If a new expense is created for you, you will have the opportunity to approve or reject it.
        </p>
        <p className="payment-options-link mb-20 mt-10" onClick={() => setShowPaymentOptionsCard(true)}>
          Bill Payment & Money Transfer Options
        </p>

        {/* SET VIEW TYPE */}
        <>
          {(expenseLog.length > 0 || viewType === ViewTypes.repeating) && (
            <>
              <label className="mb-10">Which type of expenses would you like to view?</label>
              <CheckboxGroup
                boxWidth={'auto'}
                defaultLabel={'All'}
                skipNameFormatting={true}
                labels={['All', 'Single Date', 'Repeating']}
                onCheck={handleViewTypeSelection}
                elClass={'view-type'}
                dataPhone={[]}
              />
              <p className={`${currentUser?.settings?.theme} description`}>tap a field to edit - tap outside the field when you are done</p>
            </>
          )}
        </>
        {expenseLog.length === 0 && <p className="instructions center">There are currently no expenses</p>}

        {/* LOOP EXPENSES */}
        <div id="expenses-container">
          <div id="expenses-card-container">
            {Manager.isValid(expenseLog, true) &&
              expenseLog.map((expense, index) => {
                return (
                  <div key={Manager.getUid()} data-expense-id={expense.id} className={`expense mb-10`}>
                    <div className="content">
                      <div className="flex top-details">
                        {/* EXPENSE NAME */}
                        <div className="flex">
                          <p
                            onBlur={(e) => {
                              handleEditable(e, expense, 'date', e.currentTarget.innerHTML).then((r) => r)
                            }}
                            contentEditable
                            dangerouslySetInnerHTML={{ __html: expense.name.uppercaseFirstLetterOfAllWords() }}
                            className="date"></p>
                          <div className="flex amount-flex">
                            <span
                              className="amount"
                              onBlur={(e) => {
                                handleEditable(e, expense, 'amount', e.currentTarget.innerHTML.replace('$', '')).then((r) => r)
                              }}
                              contentEditable
                              dangerouslySetInnerHTML={{ __html: `${expense.amount}`.replace(/^/, '$') }}></span>
                          </div>
                        </div>
                      </div>
                      <div className="lower-details">
                        <div className="lower-details-text">
                          {/* PAY TO */}
                          <div className="flex editable h-40">
                            <p className="recipient subtext">
                              <b>Pay to:</b>
                            </p>
                            <span
                              onBlur={(e) => {
                                handleEditable(e, expense, 'recipientName', e.currentTarget.innerHTML).then((r) => r)
                              }}
                              contentEditable
                              dangerouslySetInnerHTML={{ __html: expense.recipientName }}
                              className="recipient subtext"></span>
                          </div>
                          <div className="text">
                            {/* CHILDREN */}
                            {expense && expense.children && expense.children.length > 0 && (
                              <div className="group">
                                <p>
                                  <b>Relevant Children</b>
                                </p>
                                <p>{expense.children.join(', ')}</p>
                              </div>
                            )}

                            {/* DATE ADDED */}
                            <div className="group flex">
                              <p id="date-added-text">
                                <b>Date Added:</b> {DateManager.formatDate(expense.dateAdded)}
                              </p>
                            </div>

                            {/* NOTES */}
                            {expense.notes && expense.notes.length > 0 && (
                              <div className="flex editable notes">
                                <p>
                                  <b>Notes:</b>
                                </p>
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
                              <div className="flex editable h-40">
                                <p>
                                  <b>Due Date:</b>
                                </p>
                                <span
                                  onBlur={(e) => {
                                    handleEditable(e, expense, 'dueDate', e.currentTarget.innerHTML).then((r) => r)
                                  }}
                                  contentEditable
                                  dangerouslySetInnerHTML={{ __html: moment(expense.dueDate).format(DateFormats.dateForDb) }}></span>
                              </div>
                            )}
                          </div>
                          {expense.dueDate.length > 0 && (
                            <div className="flex group red h-40">
                              <p className="due-date-text flex">
                                <span className="flex  ml-0 pl-0 pr-0 material-icons-round">hourglass_top</span> Due&nbsp;
                                {moment(moment(expense.dueDate).startOf('day')).fromNow().toString()}
                              </p>
                            </div>
                          )}

                          {/* EXPENSE IMAGE */}
                          <>
                            {Manager.isValid(expense.imageUrl) && (
                              <div id="img-container" className="flex" onClick={() => Manager.toggleForModalOrNewForm('hide')}>
                                <img
                                  src={expense.imageUrl || ''}
                                  data-img-id={expense.id}
                                  id="expense-image"
                                  onClick={(e) => expandImage(expense.imageUrl, expense.imageName)}
                                />
                              </div>
                            )}
                            {Manager.isValid(expense.imageUrl) && <p id="img-expand-text">tap image to expand</p>}
                          </>
                        </div>

                        {/* BUTTONS */}
                        <div id="button-group" className="flex">
                          <button
                            onClick={() => {
                              setCurrentExpense(expense)
                              setExecutePaid(true)
                            }}
                            className="button no-radius default green-text">
                            Paid
                          </button>
                          {expense.phone === currentUser.phone && (
                            <button className="button no-radius default send-reminder" onClick={() => sendReminder(expense)}>
                              Send Reminder
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              setCurrentExpense(expense)
                              let existing = await DB.getTable(DB.tables.expenseTracker)
                              if (!Array.isArray(existing)) {
                                existing = DB.convertKeyObjectToArray(existing)
                              }
                              existing = existing.filter((x) => x.name === expense.name)
                              if (existing.length > 1) {
                                setDeleteConfirmTitle('DELETE REPEATING EXPENSES')
                              } else {
                                setDeleteConfirmTitle('DELETING EXPENSE')
                              }
                            }}
                            className="delete no-radius button default red-text">
                            Delete
                          </button>
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

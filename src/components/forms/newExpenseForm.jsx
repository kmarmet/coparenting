import React, { useEffect, useState, useContext, useRef } from 'react'
import DB from '@db'
import tables from '@screenNames'
import Manager from '@manager'
import globalState from '../../context'
import { Accordion } from 'rsuite'
import moment from 'moment'
import CheckboxGroup from '@shared/checkboxGroup'
import Expense from '@models/expense'
import PushAlertApi from '@api/pushAlert'
import FirebaseStorage from '@firebaseStorage'
import ScreenNames from '@screenNames'
import NotificationManager from '@managers/notificationManager.js'
import DB_UserScoped from '@userScoped'
import { useSwipeable } from 'react-swipeable'
import CalendarMapper from 'mappers/calMapper'
import DateFormats from 'constants/dateFormats'
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker'
import { MobileTimePicker } from '@mui/x-date-pickers'
import DatetimePickerViews from '../../constants/datetimePickerViews'
import BottomButton from '../shared/bottomButton'
import Numpad from '../shared/numpad'
import Toggle from 'react-toggle'
import {
  toCamelCase,
  getFirstWord,
  formatFileName,
  isAllUppercase,
  removeSpacesAndLowerCase,
  stringHasNumbers,
  wordCount,
  uppercaseFirstLetterOfAllWords,
  spaceBetweenWords,
  formatNameFirstNameOnly,
  removeFileExtension,
  contains,
  throwError,
  displayAlert,
  uniqueArray,
  getFileExtension,
} from '../../globalFunctions'
import BottomCard from '../shared/bottomCard'
import UploadInputs from '../shared/uploadInputs'
import DateManager from '../../managers/dateManager'
import ModelNames from '../../models/modelNames'
import Swal from 'sweetalert2'

function NewExpenseForm({ showCard, hideCard }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, formToShow } = state
  const [expenseName, setExpenseName] = useState('')
  const [expenseChildren, setExpenseChildren] = useState([])
  const [expenseDueDate, setExpenseDueDate] = useState('')
  const [expenseNotes, setExpenseNotes] = useState('')
  const [expenseImage, setExpenseImage] = useState('')
  const [includeChildren, setIncludeChildren] = useState(false)
  const [repeating, setRepeating] = useState(false)
  const [payer, setPayer] = useState({
    phone: '',
    name: '',
  })
  const [shareWith, setShareWith] = useState([])
  const [repeatInterval, setRepeatInterval] = useState('')
  const [repeatingEndDate, setRepeatingEndDate] = useState('')
  const [showNumpad, setShowNumpad] = useState(false)
  const [expenseAmount, setExpenseAmount] = useState('')
  const imgRef = useRef()

  const resetForm = () => {
    Manager.resetForm('expenses-wrapper')
    setExpenseName('')
    setExpenseChildren([])
    setExpenseDueDate('')
    setExpenseNotes('')
    setExpenseImage('')
    setIncludeChildren(false)
    setRepeating(false)
    setPayer({
      phone: '',
      name: '',
    })
    setShareWith([])
    setRepeatInterval('')
    setRepeatingEndDate('')
    setShowNumpad(false)
    setExpenseAmount('')
    hideCard()
  }

  const submitNewExpense = async () => {
    if (payer.name.length === 0) {
      throwError('Please select will be paying the expense')
      return false
    }
    if (expenseName.length === 0) {
      throwError('Please add an expense name')
      return false
    }
    if (expenseAmount.length === 0) {
      throwError('Please add an expense expenseAmount')
      return false
    }
    if (shareWith.length === 0) {
      throwError('Please select who can view this expense')
      return false
    }
    const newExpense = new Expense()
    newExpense.id = Manager.getUid()
    newExpense.name = expenseName
    newExpense.children = expenseChildren
    newExpense.amount = expenseAmount
    newExpense.phone = currentUser.phone
    newExpense.dueDate = DateManager.dateIsValid(expenseDueDate) ? moment(expenseDueDate).format(DateFormats.dateForDb) : ''
    newExpense.dateAdded = Manager.getCurrentDate()
    newExpense.notes = expenseNotes
    newExpense.paidStatus = 'unpaid'
    newExpense.imageName = expenseImage.name || ''
    newExpense.payer = payer
    newExpense.createdBy = currentUser.name
    newExpense.shareWith = Manager.getUniqueArray(shareWith).flat()
    newExpense.repeating = false

    if (expenseImage) {
      newExpense.imageName = expenseImage.name
    }

    // Get coparent name
    newExpense.recipientName = formatNameFirstNameOnly(currentUser.name)

    const activeRepeatIntervals = document.querySelectorAll('.repeat-interval .box.active')

    if (activeRepeatIntervals.length > 0 && !expenseDueDate) {
      throwError('If you have chosen a repeat interval, you must also set a due date')
      return false
    }

    // IMAGE UPLOAD
    if (Manager.isValid(expenseImage?.name)) {
      await FirebaseStorage.upload(FirebaseStorage.directories.expenseImages, currentUser.id, expenseImage, expenseImage.name).then((url) => {
        newExpense.imageUrl = url
      })
    }

    const cleanObject = Manager.cleanObject(newExpense, ModelNames.expense)

    // Add to DB
    await DB.add(tables.expenseTracker, cleanObject).finally(async () => {
      // Add repeating expense to DB
      if (repeatInterval.length > 0 && repeatingEndDate.length > 0) {
        await addRepeatingExpensesToDb()
      }

      // Send notification
      const subId = await NotificationManager.getUserSubId(payer.phone)
      if (subId) {
        PushAlertApi.sendMessage(`New Expense`, `${formatNameFirstNameOnly(currentUser.name)} has created a new expense`, subId)
      }

      // Go back to expense screen
      resetForm()
    })
  }

  const addRepeatingExpensesToDb = async () => {
    let expensesToPush = []
    let datesToRepeat = CalendarMapper.repeatingEvents(repeatInterval, expenseDueDate, repeatingEndDate)

    if (Manager.isValid(datesToRepeat, true)) {
      datesToRepeat.forEach((date) => {
        const newExpense = new Expense()
        newExpense.id = Manager.getUid()
        newExpense.name = expenseName
        newExpense.children = expenseChildren
        newExpense.amount = expenseAmount
        newExpense.imageName = ''
        newExpense.phone = currentUser.phone
        newExpense.dueDate = DateManager.dateIsValid(date) ? moment(date).format(DateFormats.dateForDb) : ''
        newExpense.dateAdded = Manager.getCurrentDate()
        newExpense.notes = expenseNotes
        newExpense.paidStatus = 'unpaid'
        newExpense.createdBy = currentUser.name
        newExpense.shareWith = Manager.getUniqueArray(shareWith).flat()
        newExpense.recipientName = formatNameFirstNameOnly(currentUser.name)
        newExpense.repeating = true
        expensesToPush.push(newExpense)
      })
      await DB_UserScoped.addMultipleExpenses(expensesToPush)
    }
  }

  const handleChildSelection = (e) => {
    const clickedEl = e.currentTarget
    const checkbox = clickedEl.querySelector('.box')
    const selectedValue = clickedEl.getAttribute('data-label')
    if (checkbox.classList.contains('active')) {
      checkbox.classList.remove('active')
      if (expenseChildren.length > 0) {
        setExpenseChildren(expenseChildren.filter((x) => x !== selectedValue))
      }
    } else {
      checkbox.classList.add('active')
      setExpenseChildren([...expenseChildren, selectedValue])
    }
  }

  const handleShareWithSelection = async (e) => {
    await Manager.handleShareWithSelection(e, currentUser, shareWith).then((updated) => {
      setShareWith(updated)
    })
  }

  const handlePayerSelection = async (e) => {
    Manager.handleCheckboxSelection(
      e,
      async (e) => {
        const activeCoparentEl = document.querySelector('#checkbox-container.active')
        const coparentPhone = activeCoparentEl.getAttribute('data-phone')
        const coparent = await DB_UserScoped.getCoparentByPhone(coparentPhone, currentUser)
        const coparentName = coparent.name
        setPayer({
          phone: coparentPhone,
          name: coparentName,
        })
      },
      async (e) => {
        setPayer({
          phone: '',
          name: '',
        })
      },
      false
    )
    // setChildren(childrenArr)
  }

  const handleRepeatingSelection = async (e) => {
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        let selection = ''
        if (e.toLowerCase().indexOf('week') > -1) {
          selection = 'weekly'
        }
        if (e.toLowerCase().indexOf('bi') > -1) {
          selection = 'biweekly'
        }
        if (e.toLowerCase().indexOf('daily') > -1) {
          selection = 'daily'
        }
        if (e.toLowerCase().indexOf('monthly') > -1) {
          selection = 'monthly'
        }
        setRepeatInterval(selection)
      },
      (e) => {
        if (repeatInterval.toLowerCase() === e.toLowerCase()) {
          setRepeatInterval(null)
        }
      },
      false
    )
  }

  const deleteLastNumber = () => {
    setExpenseAmount(expenseAmount.substring(0, expenseAmount.length - 1))
  }

  const onNumpadPress = (e) => {
    const numberButton = e.target
    const number = e.target.textContent
    setExpenseAmount((amount) => (amount += number))
    numberButton.classList.add('pressed', 'animate', 'active')
    setTimeout(() => {
      numberButton.classList.remove('pressed')
    }, 50)
  }

  const onDefaultAmountPress = (e) => {
    const numberButton = e.target
    const number = parseInt(e.target.textContent.replace('$', ''))
    const currentNumber = parseInt(expenseAmount || 0)
    const total = number + currentNumber
    setExpenseAmount((amount) => total.toString())
    numberButton.classList.add('pressed', 'animate', 'active')
    setTimeout(() => {
      numberButton.classList.remove('pressed')
    }, 50)
  }

  useEffect(() => {
    Manager.showPageContainer('show')
  }, [])

  return (
    <div className="expenses-wrapper">
      {/* PAGE CONTAINER */}
      <BottomCard title={'Add Expense'} showCard={showCard} onClose={hideCard}>
        <div id="add-expense-form" className={`${theme} form`}>
          {/* AMOUNT */}
          <div id="amount-input-wrapper" onClick={() => setShowNumpad(true)}>
            <p id="amount-input">
              <span className="flex defaults">
                <span id="dollar-sign" className="pr-5">
                  <sup>$</sup>
                </span>
                <span id="zero" className={expenseAmount.length > 0 ? 'active' : ''}>
                  {expenseAmount.length > 0 ? expenseAmount : '0'}
                </span>
              </span>
            </p>
          </div>

          {/* NUMPAD */}
          <Numpad
            onSubmit={() => setShowNumpad(false)}
            onNumClick={(e) => onNumpadPress(e)}
            onBackspace={deleteLastNumber}
            className={showNumpad ? 'active mt-10' : ''}
          />

          {/* DEFAULT EXPENSE AMOUNTS */}
          <>
            <div className="flex mb-15" id="default-expense-amounts">
              <button className="default-amount-button" onClick={(e) => onDefaultAmountPress(e)}>
                $10
              </button>
              <button className="default-amount-button" onClick={(e) => onDefaultAmountPress(e)}>
                $20
              </button>
              <button className="default-amount-button" onClick={(e) => onDefaultAmountPress(e)}>
                $30
              </button>
              <button className="default-amount-button" onClick={(e) => onDefaultAmountPress(e)}>
                $40
              </button>
              <button className="default-amount-button" onClick={(e) => onDefaultAmountPress(e)}>
                $50
              </button>
              <button className="default-amount-button" onClick={(e) => onDefaultAmountPress(e)}>
                $60
              </button>
              <button className="default-amount-button" onClick={(e) => onDefaultAmountPress(e)}>
                $70
              </button>
              <button className="default-amount-button" onClick={(e) => onDefaultAmountPress(e)}>
                $80
              </button>
              <button className="default-amount-button" onClick={(e) => onDefaultAmountPress(e)}>
                $90
              </button>
              <button className="default-amount-button reset" onClick={() => setExpenseAmount('')}>
                RESET
              </button>
              <button className="default-amount-button" onClick={(e) => onDefaultAmountPress(e)}>
                $100
              </button>
            </div>
          </>

          {/* EXPENSE NAME */}
          <div className="w-100">
            <label>
              Name<span className="asterisk">*</span>
            </label>
            <input type="text" className="mb-15 mt-0" onChange={(e) => setExpenseName(e.target.value)} />
          </div>

          {/* DUE DATE */}
          <label>Due Date</label>
          <MobileDatePicker
            className="mb-15 mt-0 w-100"
            onChange={(e) => {
              setExpenseDueDate(moment(e).format('MM/DD/yyyy'))
            }}
          />

          {/* UPLOAD INPUTS */}
          <UploadInputs
            uploadType="image"
            getImages={(files) => {
              if (files.length === 0) {
                throwError('Please choose an image first')
              } else {
                setExpenseImage(files[0])
              }
            }}
            containerClass={theme}
            actualUploadButtonText={'Upload'}
            uploadButtonText="Choose Image"
            upload={() => {}}
          />
          <textarea name="expense-notes" placeholder="Notes" className="mb-15" onChange={(e) => setExpenseNotes(e.target.value)}></textarea>
          {currentUser && (
            <div className="share-with-container">
              <label>
                <span className="material-icons">request_quote</span>Who will be paying the expense?
                <span className="asterisk">*</span>
              </label>
              <CheckboxGroup
                dataPhone={currentUser?.coparents.map((x) => x.phone)}
                labels={currentUser?.coparents.map((x) => x.name)}
                onCheck={(e) => {
                  const checkbox = e.target.closest('#checkbox-container')
                  document.querySelectorAll('#checkbox-container').forEach((x) => x.classList.remove('active'))
                  checkbox.classList.add('active')
                  handlePayerSelection(e).then((r) => r)
                }}
              />
            </div>
          )}

          {/* SHARE WITH */}
          {currentUser && (
            <div className="share-with-container">
              <label>
                <span className="material-icons-round">visibility</span> Who should see it?<span className="asterisk">*</span>
              </label>
              <CheckboxGroup
                dataPhone={currentUser?.coparents.map((x) => x.phone)}
                labels={currentUser?.coparents.map((x) => x.name)}
                onCheck={handleShareWithSelection}
              />
            </div>
          )}

          {/* INCLUDING WHICH CHILDREN */}
          {currentUser && currentUser.children !== undefined && (
            <div className="share-with-container ">
              <div className="flex">
                <p>Include Child(ren)</p>
                <Toggle
                  icons={{
                    checked: <span className="material-icons-round">face</span>,
                    unchecked: null,
                  }}
                  className={'ml-auto reminder-toggle'}
                  onChange={(e) => setIncludeChildren(!includeChildren)}
                />
              </div>
              {includeChildren && <CheckboxGroup labels={currentUser.children.map((x) => x['general'].name)} onCheck={handleChildSelection} />}
            </div>
          )}

          {/* REPEATING? */}
          <div className="share-with-container" id="repeating-container">
            <div className="share-with-container ">
              <div className="flex">
                <p>Repeating</p>
                <Toggle
                  icons={{
                    checked: <span className="material-icons-round">event_repeat</span>,
                    unchecked: null,
                  }}
                  className={'ml-auto reminder-toggle'}
                  onChange={(e) => setRepeating(!repeating)}
                />
              </div>
              {repeating && (
                <>
                  <CheckboxGroup onCheck={handleRepeatingSelection} labels={['Daily', 'Weekly', 'Biweekly', 'Monthly']} />
                  <label className="mb-5">Month to end repeating expense</label>
                  {repeatInterval && (
                    <MobileDatePicker
                      className={'mt-0 w-100'}
                      format={DateFormats.readableMonth}
                      views={DatetimePickerViews.monthAndYear}
                      hasAmPm={false}
                      onAccept={(e) => setRepeatingEndDate(moment(e).format('MM-DD-yyyy'))}
                    />
                  )}
                </>
              )}
            </div>
          </div>

          {/* BUTTONS */}
          <div className="buttons gap">
            {/*{showSubmitButton && (*/}
            {expenseAmount.length > 0 && expenseName.length > 0 && shareWith.length > 0 && Manager.isValid(payer, false, true) && (
              <button className="button card-button" onClick={submitNewExpense}>
                Create Expense <span className="material-icons-round ml-10 fs-22">attach_money</span>
              </button>
            )}
            {/*)}*/}
            <button className="button card-button red" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </div>
      </BottomCard>
    </div>
  )
}

export default NewExpenseForm

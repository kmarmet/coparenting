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

function NewExpenseForm() {
  const { state, setState } = useContext(globalState)
  const { currentUser } = state
  const [expenseName, setExpenseName] = useState('')
  const [expenseChildren, setExpenseChildren] = useState([])
  const [expenseDueDate, setExpenseDueDate] = useState('')
  const [expenseNotes, setExpenseNotes] = useState('')
  const [expenseImage, setExpenseImage] = useState('')
  const [payer, setPayer] = useState({
    phone: '',
    name: '',
  })
  const [shareWith, setShareWith] = useState([])
  const [repeatInterval, setRepeatInterval] = useState('')
  const [repeatingEndDate, setRepeatingEndDate] = useState('')
  const [childrenAccIsExpanded, setChildrenAccIsExpanded] = useState(false)
  const [repeatAccIsExpanded, setRepeatAccIsExpanded] = useState(false)
  const [showNumpad, setShowNumpad] = useState(false)
  const [expenseAmount, setExpenseAmount] = useState('')
  const imgRef = useRef()

  const handlers = useSwipeable({
    onSwipedRight: (eventData) => {
      console.log('User Swiped!', eventData)
      setState({ ...state, currentScreen: ScreenNames.expenseTracker })
    },
  })

  const resetScreenAndGoBack = () => {
    resetNewExpense()
    setState({
      ...state,
      currentScreen: ScreenNames.expenseTracker,
      alertMessage: '',
      showAlert: false,
    })
  }

  const submitNewExpense = async () => {
    if (payer.name.length === 0) {
      setState({ ...state, alertMessage: 'Please select will be paying the expense', showAlert: true })
      return false
    }
    if (!expenseDueDate || expenseDueDate.length === 0) {
      setState({ ...state, alertMessage: 'Please choose a due date', showAlert: true })
      return false
    }
    if (expenseName.length === 0) {
      setState({ ...state, alertMessage: 'Please add an expense name', showAlert: true })
      return false
    }
    if (expenseAmount.length === 0) {
      setState({ ...state, alertMessage: 'Please add an expense expenseAmount', showAlert: true })
      return false
    }
    if (shareWith.length === 0) {
      setState({ ...state, alertMessage: 'Please select who can view this expense', showAlert: true })
      return false
    }
    const newExpense = new Expense()
    newExpense.id = Manager.getUid()
    newExpense.name = expenseName
    newExpense.children = expenseChildren
    newExpense.amount = expenseAmount
    newExpense.phone = currentUser.phone
    newExpense.dueDate = moment(expenseDueDate).format(DateFormats.dateForDb) || ''
    newExpense.dateAdded = Manager.getCurrentDate()
    newExpense.notes = expenseNotes
    newExpense.paidStatus = 'unpaid'
    newExpense.imageName = ''
    newExpense.payer = payer
    newExpense.createdBy = currentUser.name
    newExpense.shareWith = Manager.getUniqueArray(shareWith).flat()
    newExpense.repeating = false

    if (expenseImage) {
      newExpense.imageName = expenseImage.name
    }

    // Get coparent name
    newExpense.recipientName = currentUser.name.formatNameFirstNameOnly()

    const activeRepeatIntervals = document.querySelectorAll('.repeat-interval .box.active')

    if (activeRepeatIntervals.length > 0 && !expenseDueDate) {
      setState({ ...state, alertMessage: 'If you have chosen a repeat interval, you must also set a due date', showAlert: true })
      return false
    }

    // Upload Image
    if (Manager.isValid(expenseImage?.name)) {
      await FirebaseStorage.upload(FirebaseStorage.directories.expenseImages, newExpense.id, expenseImage, expenseImage.name).then((url) => {
        newExpense.imageUrl = url
      })
    }

    // Add to DB
    await DB.add(tables.expenseTracker, newExpense).finally(async () => {
      await addRepeatingExpensesToDb()
      const subId = await NotificationManager.getUserSubId(payer.phone)
      PushAlertApi.sendMessage(`New Expense`, `${currentUser.name.formatNameFirstNameOnly()} has created a new expense`, subId)

      resetScreenAndGoBack()
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
        newExpense.dueDate = moment(date).format('MM/DD/yyyy')
        newExpense.dateAdded = Manager.getCurrentDate()
        newExpense.notes = expenseNotes
        newExpense.paidStatus = 'unpaid'
        newExpense.createdBy = currentUser.name
        newExpense.shareWith = Manager.getUniqueArray(shareWith).flat()
        newExpense.recipientName = currentUser.name.formatNameFirstNameOnly()
        newExpense.repeating = true
        expensesToPush.push(newExpense)
      })
      await DB_UserScoped.addMultipleExpenses(expensesToPush)
      // Upload to DB
    }
  }

  const resetNewExpense = () => {
    setExpenseAmount('')
    setExpenseName('')
    setExpenseChildren([])
    setExpenseNotes('')
    setExpenseDueDate('')
    setExpenseImage('')
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
        const coparent = await DB_UserScoped.getCoparent(coparentPhone, currentUser)
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

  const chooseImage = (e) => {
    const img = document.querySelector('#upload-input').files[0]
    const blobText = FirebaseStorage.imageToBlob(img)
    if (blobText && img) {
      blobText.then((base64Image) => {
        setExpenseImage(img)
      })
    }
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
    Manager.toggleForModalOrNewForm('show')
    setState({ ...state, previousScreen: ScreenNames.expenseTracker, showMenuButton: false, showBackButton: true })
  }, [])

  return (
    <>
      <p className="screen-title ">New Expense</p>
      {expenseAmount.length > 0 &&
        expenseName.length > 0 &&
        moment(expenseDueDate).format(DateFormats.dateForDb).length > 0 &&
        shareWith.length > 0 &&
        payer.name.length > 0 && <BottomButton elClass={'active visible'} type="submit" onClick={submitNewExpense} />}
      <div {...handlers} id="add-expense-form" className={`${currentUser?.settings?.theme} form page-container`}>
        {/* AMOUNT */}
        <label className="caption center-text">click below to add a custom amount</label>
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

        <p className="mt-10 mb-10" id="or">
          -or-
        </p>

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

        <div className="w-100">
          <label>
            Name<span className="asterisk">*</span>
          </label>
          <input type="text" className="mb-15 mt-0" onChange={(e) => setExpenseName(e.target.value)} />
        </div>

        {/* DUE DATE */}
        <label>
          Due Date<span className="asterisk">*</span>
        </label>
        <MobileDatePicker
          className="mb-15 mt-0 w-100"
          onChange={(e) => {
            setExpenseDueDate(moment(e).format('MM/DD/yyyy'))
          }}
        />
        <div className="flex mb-20" id="upload-inputs">
          <label htmlFor="upload-input" className="custom-file-upload w-50 button default">
            Choose Image
          </label>
          <input ref={imgRef} type="file" id="upload-input" accept="image/*" onChange={(e) => chooseImage(e)} />
          <button id="upload-button" className="button default green w-50">
            Upload <span className="material-icons-round">file_upload</span>
          </button>
        </div>
        <textarea name="expense-notes" placeholder="Notes" className="mb-15" onChange={(e) => setExpenseNotes(e.target.value)}></textarea>
        {currentUser && (
          <div className="share-with-container">
            <label>
              <span className="material-icons">request_quote</span>Who will be paying the expense?
              <span className="asterisk">*</span>
            </label>
            <CheckboxGroup
              dataPhone={currentUser.coparents.map((x) => x.phone)}
              labels={currentUser.coparents.map((x) => x.name)}
              onCheck={(e) => {
                const checkbox = e.target.closest('#checkbox-container')
                document.querySelectorAll('#checkbox-container').forEach((x) => x.classList.remove('active'))
                checkbox.classList.add('active')
                handlePayerSelection(e).then((r) => r)
              }}
            />
          </div>
        )}
        {currentUser && (
          <div className="share-with-container">
            <label>
              <span className="material-icons-round">visibility</span> Who should see it?<span className="asterisk">*</span>
            </label>
            <CheckboxGroup
              dataPhone={currentUser.coparents.map((x) => x.phone)}
              labels={currentUser.coparents.map((x) => x.name)}
              onCheck={handleShareWithSelection}
            />
          </div>
        )}
        {/* INCLUDING WHICH CHILDREN */}
        {currentUser && currentUser.children !== undefined && (
          <div className="share-with-container ">
            <Accordion>
              <label onClick={() => setChildrenAccIsExpanded(!childrenAccIsExpanded)}>
                <span className="material-icons mr-10">face</span> Set Applicable Child(ren)
                <span className={'material-icons-round plus-minus-symbol ml-auto'}>{childrenAccIsExpanded ? 'remove' : 'add'}</span>
              </label>
              <Accordion.Panel expanded={childrenAccIsExpanded}>
                <CheckboxGroup labels={currentUser.children.map((x) => x['general'].name)} onCheck={handleChildSelection} />
              </Accordion.Panel>
            </Accordion>
          </div>
        )}

        {/* REPEATING? */}
        <div className="share-with-container" id="repeating-container">
          <Accordion className={'p-0'}>
            <label onClick={() => setRepeatAccIsExpanded(!repeatAccIsExpanded)}>
              <span className="material-icons mr-10">event_repeat</span> Set Repeat Interval
              <span className={'material-icons-round plus-minus-symbol ml-auto'}>{repeatAccIsExpanded ? 'remove' : 'add'}</span>
            </label>
            <Accordion.Panel className={'p-0'} expanded={repeatAccIsExpanded}>
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
            </Accordion.Panel>
          </Accordion>
        </div>
      </div>
    </>
  )
}

export default NewExpenseForm
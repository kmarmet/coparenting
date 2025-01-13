import React, { useContext, useRef, useState } from 'react'
import DB from '../../database/DB'
import Manager from '../../managers/manager'
import globalState from '../../context'
import moment from 'moment'
import CheckboxGroup from '../../components/shared/checkboxGroup'
import Expense from '../../models/expense'
import FirebaseStorage from '../../database/firebaseStorage'
import NotificationManager from '../../managers/notificationManager'
import DB_UserScoped from '../../database/db_userScoped'
import CalendarMapper from '../../mappers/calMapper'
import DateFormats from '../../constants/dateFormats'
import { MobileDatePicker } from '@mui/x-date-pickers-pro'
import DatetimePickerViews from '../../constants/datetimePickerViews'
import Numpad from '../../components/shared/numpad'
import Toggle from 'react-toggle'
import { PiMoneyWavyDuotone } from 'react-icons/pi'
import MenuItem from '@mui/material/MenuItem'
import { formatNameFirstNameOnly } from '../../globalFunctions'
import UploadInputs from '../../components/shared/uploadInputs'
import DateManager from '../../managers/dateManager'
import ModelNames from '../../models/modelNames'
import ShareWithCheckboxes from '../../components/shared/shareWithCheckboxes'
import BottomCard from '../shared/bottomCard'
import InputWrapper from '../shared/inputWrapper'
import ExpenseCategories from '../../constants/expenseCategories'
import ObjectManager from '../../managers/objectManager'
import AlertManager from '../../managers/alertManager'
import ImageManager from '../../managers/imageManager'
import SelectDropdown from '../shared/selectDropdown'
import ActivityCategory from '../../models/activityCategory'
import { MdEventRepeat, MdOutlineFaceUnlock } from 'react-icons/md'

export default function NewExpenseForm({ hideCard, showCard }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, formToShow } = state
  const [expenseName, setExpenseName] = useState('')
  const [expenseChildren, setExpenseChildren] = useState([])
  const [expenseDueDate, setExpenseDueDate] = useState('')
  const [expenseNotes, setExpenseNotes] = useState('')
  const [expenseImage, setExpenseImage] = useState('')
  const [includeChildren, setIncludeChildren] = useState(false)
  const [repeating, setRepeating] = useState(false)
  const [expenseCategory, setExpenseCategory] = useState('')
  const [payer, setPayer] = useState({
    phone: '',
    name: '',
  })
  const [shareWith, setShareWith] = useState([])
  const [repeatInterval, setRepeatInterval] = useState('')
  const [repeatingEndDate, setRepeatingEndDate] = useState('')
  const [showNumpad, setShowNumpad] = useState(false)
  const [expenseAmount, setExpenseAmount] = useState('')
  const [refreshKey, setRefreshKey] = useState(Manager.getUid())
  const imgRef = useRef()

  const resetForm = async () => {
    Manager.resetForm('expenses-wrapper')
    setRefreshKey(Manager.getUid())
    setExpenseName('')
    setExpenseChildren([])
    setExpenseDueDate('')
    setExpenseNotes('')
    setExpenseImage('')
    setIncludeChildren(false)
    setRepeating(false)
    setExpenseCategory('')
    setPayer({
      phone: '',
      name: '',
    })
    setShareWith([])
    setRepeatInterval('')
    setRepeatingEndDate('')
    setShowNumpad(false)
    setExpenseAmount('')
    const updatedCurrentUser = await DB_UserScoped.getCurrentUser(currentUser.phone)
    setState({ ...state, currentUser: updatedCurrentUser })
    hideCard()
  }

  const submitNewExpense = async () => {
    const validAccounts = await DB_UserScoped.getValidAccountsForUser(currentUser)
    console.log(validAccounts)
    if (validAccounts === 0) {
      AlertManager.throwError(
        'No co-parent to \n assign expenses to',
        'You have not added any co-parents. Or, it is also possible they have closed their account.'
      )
      return false
    }
    if (payer.name.length === 0) {
      AlertManager.throwError('Please select will be paying the expense')
      return false
    }
    if (expenseName.length === 0) {
      AlertManager.throwError('Please add an expense name')
      return false
    }
    if (expenseAmount.length === 0) {
      AlertManager.throwError('Please add an expense expenseAmount')
      return false
    }

    if (validAccounts > 0) {
      if (shareWith.length === 0) {
        AlertManager.throwError('Please choose who you would like to share this expense with')
        return false
      }
    }

    const newExpense = new Expense()
    newExpense.id = Manager.getUid()
    newExpense.name = expenseName
    newExpense.children = expenseChildren
    newExpense.amount = parseInt(expenseAmount)
    newExpense.category = expenseCategory
    newExpense.dueDate = DateManager.dateIsValid(expenseDueDate) ? moment(expenseDueDate).format(DateFormats.dateForDb) : ''
    newExpense.dateAdded = Manager.getCurrentDate()
    newExpense.notes = expenseNotes
    newExpense.paidStatus = 'unpaid'
    newExpense.imageName = expenseImage.name || ''
    newExpense.payer = payer
    newExpense.ownerPhone = currentUser?.phone
    newExpense.shareWith = Manager.getUniqueArray(shareWith).flat()
    newExpense.repeating = repeating

    // If expense has image
    if (expenseImage) {
      newExpense.imageName = expenseImage.name
      setExpenseImage(await ImageManager.compressImage(expenseImage))
    }

    // Get coparent name
    newExpense.recipientName = formatNameFirstNameOnly(currentUser?.name)

    const activeRepeatIntervals = document.querySelectorAll('.repeat-interval .box.active')

    if (activeRepeatIntervals.length > 0 && !expenseDueDate) {
      AlertManager.throwError('If you have chosen a repeat interval, you must also set a due date')
      return false
    }

    // IMAGE UPLOAD
    if (Manager.isValid(expenseImage?.name)) {
      await FirebaseStorage.upload(FirebaseStorage.directories.expenseImages, currentUser?.id, expenseImage, expenseImage.name).then((url) => {
        newExpense.imageUrl = url
      })
    }

    const cleanObject = ObjectManager.cleanObject(newExpense, ModelNames.expense)

    // Add to DB
    await DB.add(`${DB.tables.expenseTracker}/${currentUser.phone}`, cleanObject).finally(async () => {
      // Add repeating expense to DB
      if (repeatInterval.length > 0 && repeatingEndDate.length > 0) {
        await addRepeatingExpensesToDb()
      }

      // Send notification
      if (Manager.isValid(shareWith)) {
        await NotificationManager.sendToShareWith(
          shareWith,
          currentUser,
          `${formatNameFirstNameOnly(currentUser?.name)} has created a new expense`,
          `${expenseName} - $${expenseAmount}`,
          ActivityCategory.expenses
        )
      }

      // Go back to expense screen
      await resetForm()
    })
    AlertManager.successAlert(`${expenseName} Added`)
  }

  const addRepeatingExpensesToDb = async () => {
    let expensesToPush = []
    let datesToRepeat = CalendarMapper.repeatingEvents(repeatInterval, expenseDueDate, repeatingEndDate)

    if (Manager.isValid(datesToRepeat)) {
      datesToRepeat.forEach((date) => {
        const newExpense = new Expense()
        newExpense.id = Manager.getUid()
        newExpense.name = expenseName
        newExpense.children = expenseChildren
        newExpense.amount = expenseAmount
        newExpense.imageName = ''
        newExpense.phone = currentUser?.phone
        newExpense.dueDate = DateManager.dateIsValid(date) ? moment(date).format(DateFormats.dateForDb) : ''
        newExpense.dateAdded = Manager.getCurrentDate()
        newExpense.notes = expenseNotes
        newExpense.paidStatus = 'unpaid'
        newExpense.createdBy = currentUser?.name
        newExpense.shareWith = Manager.getUniqueArray(shareWith).flat()
        newExpense.recipientName = formatNameFirstNameOnly(currentUser?.name)
        newExpense.repeating = true
        expensesToPush.push(newExpense)
      })
      await DB_UserScoped.addMultipleExpenses(currentUser, expensesToPush)
    }
  }

  const handleChildSelection = (e) => {
    const checkbox = e.currentTarget
    const selectedValue = checkbox.getAttribute('data-label')
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
    const updated = await Manager.handleShareWithSelection(e, currentUser, shareWith)
    setShareWith(updated)
  }

  const handlePayerSelection = async (e) => {
    const checkboxContainer = e.target.closest('#checkbox-container')
    Manager.handleCheckboxSelection(
      e,
      async (e) => {
        const coparentPhone = checkboxContainer.getAttribute('data-phone')
        const coparent = currentUser?.coparents?.filter((x) => x.phone === coparentPhone)[0]
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

  const handleCategorySelection = async (category) => {
    setExpenseCategory(category.target.value)
  }

  const addThemeToDatePickers = () => {
    setTimeout(() => {
      const datetimeParent = document.querySelector('.MuiDialog-root.MuiModal-root')
      datetimeParent.classList.add(currentUser?.settings?.theme)
    }, 100)
  }

  return (
    <BottomCard
      refreshKey={refreshKey}
      hasDelete={false}
      onSubmit={submitNewExpense}
      submitIcon={<PiMoneyWavyDuotone />}
      submitText={'Create Expense'}
      title={'Add Expense'}
      className="new-expense-card"
      wrapperClass="new-expense-card"
      showCard={showCard}
      onClose={resetForm}>
      <div className="expenses-wrapper">
        {/* PAGE CONTAINER */}
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

          {/* EXPENSE TYPE */}
          <SelectDropdown wrapperClasses={'mb-15'} selectValue={expenseCategory} onChange={handleCategorySelection} labelText={'Category'}>
            {ExpenseCategories.map((type, index) => {
              return (
                <MenuItem key={index} value={type}>
                  {type}
                </MenuItem>
              )
            })}
          </SelectDropdown>

          {/* EXPENSE NAME */}
          <InputWrapper onChange={(e) => setExpenseName(e.target.value)} inputType={'input'} labelText={'Name'} required={true}></InputWrapper>

          {/* DUE DATE */}
          <InputWrapper inputType={'date'} labelText={'Due Date'}>
            <MobileDatePicker
              onOpen={addThemeToDatePickers}
              className="mt-0 w-100"
              yearsPerRow={4}
              onChange={(e) => {
                setExpenseDueDate(moment(e).format('MM/DD/yyyy'))
              }}
            />
          </InputWrapper>

          <InputWrapper onChange={(e) => setExpenseNotes(e.target.value)} inputType={'textarea'} labelText={'Notes'}></InputWrapper>

          <CheckboxGroup
            required={true}
            parentLabel={'Who will be paying the expense?'}
            dataPhone={currentUser?.coparents?.map((x) => x.phone)}
            checkboxLabels={currentUser?.coparents?.map((x) => x.name)}
            onCheck={(e) => {
              const checkbox = e.target
              document.querySelectorAll('#checkbox-container').forEach((x) => x.classList.remove('active'))
              checkbox.classList.add('active')
              handlePayerSelection(e).then((r) => r)
            }}
          />

          {/* SHARE WITH */}
          <ShareWithCheckboxes
            shareWith={currentUser?.coparents?.map((x) => x.phone)}
            onCheck={handleShareWithSelection}
            labelText={'Share with'}
            containerClass={'share-with-coparents'}
            dataPhone={currentUser?.coparents?.map((x) => x.phone)}
            checkboxLabels={currentUser?.coparents?.map((x) => x.name)}
          />

          {/* INCLUDING WHICH CHILDREN */}
          {currentUser && currentUser?.children !== undefined && (
            <div className="share-with-container ">
              <div className="flex">
                <p>Applicable Child(ren)</p>
                <Toggle
                  icons={{
                    checked: <MdOutlineFaceUnlock />,
                    unchecked: null,
                  }}
                  className={'ml-auto reminder-toggle'}
                  onChange={(e) => setIncludeChildren(!includeChildren)}
                />
              </div>
              {includeChildren && (
                <CheckboxGroup checkboxLabels={currentUser?.children.map((x) => x['general'].name)} onCheck={handleChildSelection} />
              )}
            </div>
          )}

          {/* REPEATING? */}
          <div className="share-with-container" id="repeating-container">
            <div className="share-with-container ">
              <div className="flex">
                <p>Repeating</p>
                <Toggle
                  icons={{
                    checked: <MdEventRepeat />,
                    unchecked: null,
                  }}
                  className={'ml-auto reminder-toggle'}
                  onChange={(e) => setRepeating(!repeating)}
                />
              </div>
              {repeating && (
                <>
                  <CheckboxGroup onCheck={handleRepeatingSelection} checkboxLabels={['Daily', 'Weekly', 'Biweekly', 'Monthly']} />
                  <label className="mb-5">Month to end repeating expense</label>
                  {repeatInterval && (
                    <MobileDatePicker
                      onOpen={addThemeToDatePickers}
                      yearsPerRow={4}
                      className={'mt-0 w-100'}
                      format={DateFormats.readableMonth}
                      closeOnSelect={true}
                      views={DatetimePickerViews.monthAndYear}
                      hasAmPm={false}
                      onAccept={(e) => setRepeatingEndDate(moment(e).format('MM-DD-yyyy'))}
                    />
                  )}
                </>
              )}
            </div>
          </div>

          {/* UPLOAD INPUTS */}
          {shareWith.length > 0 && payer.name.length > 0 && expenseName.length > 0 && expenseAmount.length > 0 && (
            <UploadInputs
              uploadType="image"
              getImages={(files) => {
                if (files.length === 0) {
                  AlertManager.throwError('Please choose an image first')
                } else {
                  setExpenseImage(files[0])
                }
              }}
              onClose={hideCard}
              containerClass={`${theme} new-expense-card`}
              actualUploadButtonText={'Upload'}
              uploadButtonText="Choose"
              upload={() => {}}
            />
          )}
        </div>
      </div>
    </BottomCard>
  )
}
// Path: src\components\forms\newExpenseForm.jsx
import React, {useContext, useState} from 'react'
import MenuItem from '@mui/material/MenuItem'
import moment from 'moment'
import globalState from '../../context'
import CheckboxGroup from '/src/components/shared/checkboxGroup'
import ShareWithCheckboxes from '/src/components/shared/shareWithCheckboxes'
import UploadInputs from '/src/components/shared/uploadInputs'
import ExpenseCategories from '/src/constants/expenseCategories.js'
import DB from '../../database/DB'
import DB_UserScoped from '../../database/db_userScoped'
import FirebaseStorage from '/src/database/firebaseStorage'
import AlertManager from '/src/managers/alertManager'
import DateManager from '/src/managers/dateManager'
import ImageManager from '/src/managers/imageManager'
import {GrPowerReset} from 'react-icons/gr'
import NotificationManager from '/src/managers/notificationManager'
import Manager from '../../managers/manager'
import ObjectManager from '/src/managers/objectManager'
import StringManager from '/src/managers/stringManager.coffee'
import CalendarMapper from '/src/mappers/calMapper'
import ActivityCategory from '/src/models/activityCategory'
import Expense from '/src/models/expense.js'
import ModelNames from '/src/models/modelNames'
import Modal from '/src/components/shared/modal'
import InputWrapper from '/src/components/shared/inputWrapper'
import SelectDropdown from '/src/components/shared/selectDropdown'
import Spacer from '/src/components/shared/spacer.jsx'
import DatasetManager from '../../managers/datasetManager.coffee'
import CreationForms from '../../constants/creationForms'
import ToggleButton from '../shared/toggleButton'
import Label from '../shared/label'
import InputTypes from '../../constants/inputTypes'
import DatetimeFormats from '../../constants/datetimeFormats'

export default function NewExpenseForm() {
  const {state, setState} = useContext(globalState)
  const {currentUser, theme, refreshKey, authUser, creationFormToShow} = state
  const [expenseName, setExpenseName] = useState('')
  const [expenseChildren, setExpenseChildren] = useState([])
  const [expenseDueDate, setExpenseDueDate] = useState('')
  const [expenseNotes, setExpenseNotes] = useState('')
  const [expenseImage, setExpenseImage] = useState('')
  const [includeChildren, setIncludeChildren] = useState(false)
  const [isRecurring, setIsRecurring] = useState(false)
  const [expenseCategory, setExpenseCategory] = useState(ExpenseCategories.General)
  const [payer, setPayer] = useState({
    phone: '',
    name: '',
  })
  const [shareWith, setShareWith] = useState([])
  const [recurringFrequency, setRecurringFrequency] = useState('')
  const [repeatingEndDate, setRepeatingEndDate] = useState('')
  const [expenseAmount, setExpenseAmount] = useState(0)

  const ResetForm = async (showAlert) => {
    Manager.ResetForm('expenses-wrapper')
    setExpenseName('')
    setExpenseChildren([])
    setExpenseDueDate('')
    setExpenseNotes('')
    setExpenseImage('')
    setIncludeChildren(false)
    setIsRecurring(false)
    setExpenseCategory('')
    setPayer({
      phone: '',
      name: '',
    })
    setShareWith([])
    setRecurringFrequency('')
    setRepeatingEndDate('')
    setExpenseAmount('')
    const updatedCurrentUser = await DB_UserScoped.getCurrentUser(authUser?.email)
    setState({
      ...state,
      currentUser: updatedCurrentUser,
      refreshKey: Manager.getUid(),
      creationFormToShow: '',
      successAlertMessage: showAlert ? `${StringManager.formatTitle(expenseName)} Added` : null,
    })
  }

  const SubmitNewExpense = async () => {
    //#region VALIDATION
    const validAccounts = await DB_UserScoped.getValidAccountsCountForUser(currentUser)
    if (validAccounts === 0) {
      AlertManager.throwError(
        'No co-parent to \n assign expenses to',
        'You have not added any co-parents. Or, it is also possible they have closed their profile.'
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
    //#endregion VALIDATIONconst newExpense = new Expense()

    const newExpense = new Expense()
    newExpense.name = expenseName
    newExpense.children = expenseChildren
    newExpense.amount = StringManager.FormatAsWholeNumber(expenseAmount)
    newExpense.category = expenseCategory
    newExpense.dueDate = Manager.isValid(expenseDueDate) ? moment(expenseDueDate).format(DatetimeFormats.dateForDb) : ''
    newExpense.creationDate = Manager.getCurrentDate()
    newExpense.notes = expenseNotes
    newExpense.paidStatus = 'unpaid'
    newExpense.imageName = expenseImage.name ?? ''
    newExpense.payer = payer
    newExpense.recurringFrequency = recurringFrequency
    newExpense.ownerKey = currentUser?.key
    newExpense.shareWith = DatasetManager.getUniqueArray(shareWith, true)
    newExpense.isRecurring = isRecurring

    // If expense has image
    if (expenseImage) {
      newExpense.imageName = expenseImage.name
      setExpenseImage(await ImageManager.compressImage(expenseImage))
    }

    // Get coparent name
    newExpense.recipientName = StringManager.getFirstNameOnly(currentUser?.name)

    const activeRepeatIntervals = document.querySelectorAll('.repeat-interval .box.active')

    if (Manager.isValid(activeRepeatIntervals) && activeRepeatIntervals.length > 0 && !expenseDueDate) {
      AlertManager.throwError('When selecting a recurring frequency, you must also set a due date')
      return false
    }

    // IMAGE UPLOAD
    if (Manager.isValid(expenseImage?.name)) {
      await FirebaseStorage.upload(FirebaseStorage.directories.expenseImages, currentUser?.key, expenseImage, expenseImage.name).then((url) => {
        newExpense.imageUrl = url
      })
    }

    const cleanObject = ObjectManager.cleanObject(newExpense, ModelNames.expense)

    // Add to DB
    await DB.add(`${DB.tables.expenses}/${currentUser?.key}`, cleanObject).finally(async () => {
      // Add repeating expense to DB
      if (recurringFrequency.length > 0 && repeatingEndDate.length > 0) {
        await AddRepeatingExpensesToDb()
      }

      // Send notification
      if (Manager.isValid(shareWith)) {
        await NotificationManager.sendToShareWith(
          shareWith,
          currentUser,
          `${StringManager.getFirstNameOnly(currentUser?.name)} has created a new expense`,
          `${expenseName} - $${expenseAmount}`,
          ActivityCategory.expenses
        )
      }

      // Go back to expense screen
      await ResetForm(true)
    })
  }

  const AddRepeatingExpensesToDb = async () => {
    let expensesToPush = []
    let datesToRepeat = CalendarMapper.recurringEvents(recurringFrequency, expenseDueDate, repeatingEndDate)

    if (Manager.isValid(datesToRepeat)) {
      datesToRepeat.forEach((date) => {
        const newExpense = new Expense()
        newExpense.id = Manager.getUid()
        newExpense.name = expenseName
        newExpense.children = expenseChildren
        newExpense.amount = expenseAmount
        newExpense.imageName = ''
        newExpense.phone = currentUser?.key
        newExpense.dueDate = DateManager.dateIsValid(date) ? moment(date).format(DatetimeFormats.dateForDb) : ''
        newExpense.creationDate = Manager.getCurrentDate()
        newExpense.notes = expenseNotes
        newExpense.paidStatus = 'unpaid'
        newExpense.createdBy = currentUser?.name
        newExpense.shareWith = Manager.getUniqueArray(shareWith).flat()
        newExpense.recipientName = StringManager.getFirstNameOnly(currentUser?.name)
        newExpense.isRecurring = true
        expensesToPush.push(newExpense)
      })
      await DB_UserScoped.addMultipleExpenses(currentUser, expensesToPush)
    }
  }

  const HandleChildSelection = (e) => {
    const childName = e.getAttribute('data-label')
    Manager.handleCheckboxSelection(
      e,
      async () => {
        setExpenseChildren([...expenseChildren, childName])
      },
      async () => {
        setExpenseChildren(expenseChildren.filter((x) => x !== childName))
      },
      true
    )
  }

  const HandleShareWithSelection = async (e) => {
    const updated = await Manager.handleShareWithSelection(e, currentUser, shareWith)
    setShareWith(updated)
  }

  const HandlePayerSelection = async (e) => {
    Manager.handleCheckboxSelection(
      e,
      async () => {
        const coparentKey = e.getAttribute('data-key')

        const coparent = currentUser?.coparents?.filter((x) => x.key === coparentKey)[0]
        const coparentName = coparent.name
        setPayer({
          key: coparentKey,
          name: coparentName,
        })
      },
      async () => {
        setPayer({
          phone: '',
          name: '',
        })
      },
      false
    )
  }

  const HandleRecurringSelection = async (e) => {
    const repeatingWrapper = document.getElementById('repeating-container')
    const checkboxWrappers = repeatingWrapper.querySelectorAll('#checkbox-wrapper, #label-wrapper')
    checkboxWrappers.forEach((wrapper) => {
      wrapper.classList.remove('active')
    })
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
        setRecurringFrequency(selection)
      },
      (e) => {
        if (recurringFrequency.toLowerCase() === e.toLowerCase()) {
          setRecurringFrequency(null)
        }
      },
      false
    )
  }

  const OnDefaultAmountPress = (e) => {
    const numberButton = e.target
    const asNumber = parseInt(e.target.textContent.replace('$', ''))
    const currentNumber = parseInt(expenseAmount || 0)
    const total = asNumber + currentNumber
    setExpenseAmount(() => total)
    const inputWrapper = document.querySelector('.input-wrapper')
    const amountInput = inputWrapper.querySelector('input')
    amountInput.value = total
    numberButton.classList.add('pressed', 'animate', 'active')
    setTimeout(() => {
      numberButton.classList.remove('pressed')
    }, 50)
  }

  const HandleCategorySelection = async (category) => {
    setExpenseCategory(category.target.value)
  }

  return (
    <Modal
      refreshKey={refreshKey}
      hasDelete={false}
      onSubmit={SubmitNewExpense}
      submitText={'Create'}
      title={'Create Expense'}
      className="new-expense-card"
      wrapperClass="new-expense-card"
      showCard={creationFormToShow === CreationForms.expense}
      onClose={ResetForm}>
      <div className="expenses-wrapper">
        <Spacer height={5} />
        {/* PAGE CONTAINER */}
        <div id="add-expense-form" className={`${theme} form`}>
          {/* AMOUNT */}
          <div id="amount-input-wrapper">
            <span className="flex input-wrapper">
              <span id="dollar-sign">$</span>
              <InputWrapper
                id="amount-input"
                hasBottomSpacer={false}
                inputType={InputTypes.number}
                onChange={(e) => {
                  const numbersOnly = StringManager.RemoveAllLetters(e.target.value).replaceAll('.', '')
                  e.target.value = numbersOnly
                  setExpenseAmount(numbersOnly)
                }}
                defaultValue={0}
              />
            </span>
          </div>

          {/* DEFAULT EXPENSE AMOUNTS */}
          <div id="default-expense-amounts">
            <button className="default-amount-button default grey button" onClick={OnDefaultAmountPress}>
              $5
            </button>
            <button className="default-amount-button default grey button" onClick={OnDefaultAmountPress}>
              $10
            </button>
            <button className="default-amount-button default grey button" onClick={OnDefaultAmountPress}>
              $20
            </button>
            <button className="default-amount-button default grey button" onClick={OnDefaultAmountPress}>
              $30
            </button>
            <button className="default-amount-button default grey button" onClick={OnDefaultAmountPress}>
              $40
            </button>
            <button className="default-amount-button default grey button" onClick={OnDefaultAmountPress}>
              $50
            </button>
            <button className="default-amount-button default grey button" onClick={OnDefaultAmountPress}>
              $60
            </button>
            <button className="default-amount-button default grey button" onClick={OnDefaultAmountPress}>
              $70
            </button>
            <button className="default-amount-button default grey button" onClick={OnDefaultAmountPress}>
              $80
            </button>
            <button className="default-amount-button default grey button" onClick={OnDefaultAmountPress}>
              $90
            </button>
            <button className="default-amount-button default grey button" onClick={OnDefaultAmountPress}>
              $100
            </button>
            <button
              className="default-amount-button reset"
              onClick={() => {
                const inputWrapper = document.getElementById('amount-input-wrapper')
                const amountInput = inputWrapper.querySelector('input')
                amountInput.value = 0
                setExpenseAmount(0)
              }}>
              Reset <GrPowerReset />
            </button>
          </div>

          {/* CATEGORY */}
          <SelectDropdown selectValue={expenseCategory} onChange={HandleCategorySelection} labelText={'Category'}>
            {Object.keys(ExpenseCategories).map((type, index) => {
              return (
                <MenuItem key={index} value={type}>
                  {type}
                </MenuItem>
              )
            })}
          </SelectDropdown>

          <Spacer height={5} />

          {/* EXPENSE NAME */}
          <InputWrapper onChange={(e) => setExpenseName(e.target.value)} inputType={InputTypes.text} labelText={'Name'} required={true} />

          {/* DUE DATE */}
          <InputWrapper
            inputType={InputTypes.date}
            uidClass="new-expense-date"
            labelText={'Due Date'}
            onDateOrTimeSelection={(date) => setExpenseDueDate(date)}
          />

          {/* NOTES */}
          <InputWrapper onChange={(e) => setExpenseNotes(e.target.value)} inputType={'textarea'} labelText={'Notes'} />
          <Spacer height={5} />

          {/* PAYER */}
          <CheckboxGroup
            required={true}
            parentLabel={'Who will be paying the expense?'}
            checkboxArray={Manager.buildCheckboxGroup({
              currentUser,
              predefinedType: 'coparents',
            })}
            onCheck={HandlePayerSelection}
          />

          {/* SHARE WITH */}
          <ShareWithCheckboxes onCheck={HandleShareWithSelection} labelText={'Share with'} containerClass={'share-with-coparents'} />

          {/* INCLUDING WHICH CHILDREN */}
          {currentUser && currentUser?.children !== undefined && (
            <div className="share-with-container ">
              <div className="flex">
                <Label text={'Applicable Child(ren)'} />
                <ToggleButton onCheck={() => setIncludeChildren(!includeChildren)} onUncheck={() => setIncludeChildren(!includeChildren)} />
              </div>
              {includeChildren && (
                <CheckboxGroup
                  checkboxArray={Manager.buildCheckboxGroup({
                    currentUser,
                    labelType: 'children',
                  })}
                  onCheck={HandleChildSelection}
                />
              )}
            </div>
          )}

          {/* RECURRING? */}
          <div className="flex">
            <Label text={'Recurring'} />
            <ToggleButton onCheck={() => setIsRecurring(true)} onUncheck={() => setIsRecurring(false)} />
          </div>
          {isRecurring && (
            <CheckboxGroup
              onCheck={HandleRecurringSelection}
              checkboxArray={Manager.buildCheckboxGroup({
                currentUser,
                labelType: 'recurring-intervals',
              })}
            />
          )}

          {/* UPLOAD INPUTS */}
          {shareWith.length > 0 && payer.name.length > 0 && expenseName.length > 0 && expenseAmount.length > 0 && (
            <UploadInputs
              uploadType="image"
              getImages={(input) => {
                if (input.target.files.length === 0) {
                  AlertManager.throwError('Please choose an image first')
                } else {
                  setExpenseImage(input.target.files[0])
                }
              }}
              containerClass={`${theme} new-expense-card`}
              actualUploadButtonText={'Upload'}
              uploadButtonText="Choose"
            />
          )}

          <Spacer height={20} />
        </div>
      </div>
    </Modal>
  )
}
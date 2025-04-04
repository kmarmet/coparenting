// Path: src\components\forms\newExpenseForm.jsx
import React, {useContext, useState} from 'react'
import MenuItem from '@mui/material/MenuItem'
import {MobileDatePicker} from '@mui/x-date-pickers-pro'
import moment from 'moment'
import globalState from '../../context'
import {MdEventRepeat} from 'react-icons/md'
import Toggle from 'react-toggle'
import CheckboxGroup from '/src/components/shared/checkboxGroup'
import ShareWithCheckboxes from '/src/components/shared/shareWithCheckboxes'
import UploadInputs from '/src/components/shared/uploadInputs'
import DateFormats from '/src/constants/dateFormats'
import ExpenseCategories from '/src/constants/expenseCategories.js'
import DB from '../../database/DB'
import DB_UserScoped from '../../database/db_userScoped'
import {RiMoneyDollarCircleLine} from 'react-icons/ri'
import FirebaseStorage from '/src/database/firebaseStorage'
import AlertManager from '/src/managers/alertManager'
import DateManager from '/src/managers/dateManager'
import ImageManager from '/src/managers/imageManager'
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

export default function NewExpenseForm({hideCard, showCard}) {
  const {state, setState} = useContext(globalState)
  const {currentUser, theme, refreshKey, authUser, creationFormToShow} = state
  const [expenseName, setExpenseName] = useState('')
  const [expenseChildren, setExpenseChildren] = useState([])
  const [expenseDueDate, setExpenseDueDate] = useState('')
  const [expenseNotes, setExpenseNotes] = useState('')
  const [expenseImage, setExpenseImage] = useState('')
  const [includeChildren, setIncludeChildren] = useState(false)
  const [isRepeating, setIsRepeating] = useState(false)
  const [expenseCategory, setExpenseCategory] = useState(ExpenseCategories.General)
  const [payer, setPayer] = useState({
    phone: '',
    name: '',
  })
  const [shareWith, setShareWith] = useState([])
  const [repeatInterval, setRepeatInterval] = useState('')
  const [repeatingEndDate, setRepeatingEndDate] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')

  const resetForm = async () => {
    Manager.resetForm('expenses-wrapper')
    setExpenseName('')
    setExpenseChildren([])
    setExpenseDueDate('')
    setExpenseNotes('')
    setExpenseImage('')
    setIncludeChildren(false)
    setIsRepeating(false)
    setExpenseCategory('')
    setPayer({
      phone: '',
      name: '',
    })
    setShareWith([])
    setRepeatInterval('')
    setRepeatingEndDate('')
    setExpenseAmount('')
    const updatedCurrentUser = await DB_UserScoped.getCurrentUser(authUser?.email)
    setState({...state, currentUser: updatedCurrentUser, refreshKey: Manager.getUid(), creationFormToShow: ''})
  }

  const submitNewExpense = async () => {
    //#region VALIDATION
    const validAccounts = await DB_UserScoped.getValidAccountsForUser(currentUser)
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
    //#endregion VALIDATIONconst newExpense = new Expense()

    const newExpense = new Expense()
    newExpense.name = expenseName
    newExpense.children = expenseChildren
    newExpense.amount = parseInt(expenseAmount)
    newExpense.category = expenseCategory
    newExpense.dueDate = Manager.isValid(expenseDueDate) ? moment(expenseDueDate).format(DateFormats.dateForDb) : ''
    newExpense.dateAdded = Manager.getCurrentDate()
    newExpense.notes = expenseNotes
    newExpense.paidStatus = 'unpaid'
    newExpense.imageName = expenseImage.name ?? ''
    newExpense.payer = payer
    newExpense.repeatInterval = repeatInterval
    newExpense.ownerKey = currentUser?.key
    newExpense.shareWith = DatasetManager.getUniqueArray(shareWith, true)
    newExpense.isRepeating = isRepeating

    // If expense has image
    if (expenseImage) {
      newExpense.imageName = expenseImage.name
      setExpenseImage(await ImageManager.compressImage(expenseImage))
    }

    // Get coparent name
    newExpense.recipientName = StringManager.getFirstNameOnly(currentUser?.name)

    const activeRepeatIntervals = document.querySelectorAll('.repeat-interval .box.active')

    if (Manager.isValid(activeRepeatIntervals) && activeRepeatIntervals.length > 0 && !expenseDueDate) {
      AlertManager.throwError('If you have chosen a repeat interval, you must also set a due date')
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
      if (repeatInterval.length > 0 && repeatingEndDate.length > 0) {
        await addRepeatingExpensesToDb()
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
      await resetForm()
    })
    AlertManager.successAlert(`${StringManager.formatTitle(expenseName)} Added`)
  }

  const addRepeatingExpensesToDb = async () => {
    let expensesToPush = []
    let datesToRepeat = CalendarMapper.recurringEvents(repeatInterval, expenseDueDate, repeatingEndDate)

    if (Manager.isValid(datesToRepeat)) {
      datesToRepeat.forEach((date) => {
        const newExpense = new Expense()
        newExpense.id = Manager.getUid()
        newExpense.name = expenseName
        newExpense.children = expenseChildren
        newExpense.amount = expenseAmount
        newExpense.imageName = ''
        newExpense.phone = currentUser?.key
        newExpense.dueDate = DateManager.dateIsValid(date) ? moment(date).format(DateFormats.dateForDb) : ''
        newExpense.dateAdded = Manager.getCurrentDate()
        newExpense.notes = expenseNotes
        newExpense.paidStatus = 'unpaid'
        newExpense.createdBy = currentUser?.name
        newExpense.shareWith = Manager.getUniqueArray(shareWith).flat()
        newExpense.recipientName = StringManager.getFirstNameOnly(currentUser?.name)
        newExpense.repeating = true
        expensesToPush.push(newExpense)
      })
      await DB_UserScoped.addMultipleExpenses(currentUser, expensesToPush)
    }
  }

  const handleChildSelection = (e) => {
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

  const handleShareWithSelection = async (e) => {
    const updated = await Manager.handleShareWithSelection(e, currentUser, shareWith)
    setShareWith(updated)
  }

  const handlePayerSelection = async (e) => {
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

  const handleRepeatingSelection = async (e) => {
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

  const onDefaultAmountPress = (e) => {
    const numberButton = e.target
    const number = parseInt(e.target.textContent.replace('$', ''))
    const currentNumber = parseInt(expenseAmount || 0)
    const total = number + currentNumber
    setExpenseAmount(() => total.toString())
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
    <Modal
      refreshKey={refreshKey}
      hasDelete={false}
      onSubmit={submitNewExpense}
      submitText={'Submit'}
      titleIcon={<RiMoneyDollarCircleLine />}
      title={'Create Expense'}
      className="new-expense-card"
      wrapperClass="new-expense-card"
      showCard={creationFormToShow === CreationForms.expense}
      onClose={resetForm}>
      <div className="expenses-wrapper">
        {/* PAGE CONTAINER */}
        <div id="add-expense-form" className={`${theme} form`}>
          {/* AMOUNT */}
          <div id="amount-input-wrapper">
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

          {/* DEFAULT EXPENSE AMOUNTS */}
          <>
            <div id="default-expense-amounts">
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
              <button className="default-amount-button" onClick={(e) => onDefaultAmountPress(e)}>
                $100
              </button>
              <button className="default button reset" onClick={() => setExpenseAmount('')}>
                Reset
              </button>
            </div>
          </>

          {/* EXPENSE TYPE */}
          <SelectDropdown selectValue={expenseCategory} onChange={handleCategorySelection} labelText={'Category'}>
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
            onCheck={handlePayerSelection}
          />

          {/* SHARE WITH */}
          <ShareWithCheckboxes onCheck={handleShareWithSelection} labelText={'Share with'} containerClass={'share-with-coparents'} />

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
                  onCheck={handleChildSelection}
                />
              )}
            </div>
          )}

          {/* REPEATING? */}
          <div className="share-with-container" id="repeating-container">
            <div className="share-with-container ">
              {Manager.isValid(expenseDueDate, true) && (
                <div className="flex">
                  <p>Recurring</p>
                  <Toggle
                    icons={{
                      checked: <MdEventRepeat />,
                      unchecked: null,
                    }}
                    className={'ml-auto reminder-toggle'}
                    onChange={() => setIsRepeating(!isRepeating)}
                  />
                </div>
              )}
              {isRepeating && (
                <>
                  <CheckboxGroup
                    onCheck={handleRepeatingSelection}
                    checkboxArray={Manager.buildCheckboxGroup({
                      currentUser,
                      labelType: 'recurring-interval',
                    })}
                  />
                  <Spacer height={5} />
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
    </Modal>
  )
}
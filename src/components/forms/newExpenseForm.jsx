// Path: src\components\forms\newExpenseForm.jsx
import moment from 'moment'
import React, {useContext, useRef, useState} from 'react'
import {GrPowerReset} from 'react-icons/gr'
import CheckboxGroup from '../../components/shared/checkboxGroup'
import Form from '../../components/shared/form'
import SelectDropdown from '../../components/shared/selectDropdown'
import Spacer from '../../components/shared/spacer.jsx'
import ActivityCategory from '../../constants/activityCategory'
import CreationForms from '../../constants/creationForms'
import DatetimeFormats from '../../constants/datetimeFormats'
import ExpenseCategories from '../../constants/expenseCategories.js'
import InputTypes from '../../constants/inputTypes'
import ModelNames from '../../constants/modelNames'
import globalState from '../../context'
import DB from '../../database/DB'
import DB_UserScoped from '../../database/db_userScoped'
import Storage from '../../database/storage'
import useChildren from '../../hooks/useChildren'
import useCoParents from '../../hooks/useCoParents'
import useCurrentUser from '../../hooks/useCurrentUser'
import useExpenses from '../../hooks/useExpenses'
import AlertManager from '../../managers/alertManager'
import DatasetManager from '../../managers/datasetManager.coffee'
import DateManager from '../../managers/dateManager'
import DomManager from '../../managers/domManager'
import ImageManager from '../../managers/imageManager'
import Manager from '../../managers/manager'
import ObjectManager from '../../managers/objectManager'
import StringManager from '../../managers/stringManager.coffee'
import UpdateManager from '../../managers/updateManager'
import CalendarMapper from '../../mappers/calMapper'
import Expense from '../../models/new/expense.js'
import InputField from '../shared/inputField'
import Label from '../shared/label'
import ShareWithDropdown from '../shared/shareWithDropdown'
import ToggleButton from '../shared/toggleButton'
import UploadButton from '../shared/uploadButton'

export default function NewExpenseForm() {
  const {state, setState} = useContext(globalState)
  const {theme, refreshKey, authUser, creationFormToShow} = state
  const [expenseName, setExpenseName] = useState('')
  const [expenseImage, setExpenseImage] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringFrequency, setRecurringFrequency] = useState('')
  const [repeatingEndDate, setRepeatingEndDate] = useState('')
  const {currentUser} = useCurrentUser()
  const {children, childrenDropdownOptions} = useChildren()
  const {coParents} = useCoParents()
  const {expenses} = useExpenses()

  const formRef = useRef(new Expense())

  const ResetForm = async (showAlert) => {
    Manager.ResetForm('expenses-wrapper')
    setExpenseName('')
    setExpenseImage('')
    setIsRecurring(false)
    setRecurringFrequency('')
    setRepeatingEndDate('')
    setState({
      ...state,
      refreshKey: Manager.GetUid(),
      creationFormToShow: '',
      successAlertMessage: showAlert ? `${StringManager.FormatTitle(expenseName)} Added` : null,
    })
  }

  const SubmitNewExpense = async () => {
    //#region VALIDATION
    const validAccounts = currentUser?.sharedDataUsers
    if (validAccounts === 0) {
      AlertManager.throwError(
        'No co-parent to \n assign expenses to',
        'You have not added any co-parents. Or, it is also possible they have closed their profile.'
      )
      return false
    }
    if (!Manager.IsValid(formRef.current.payer.name, true)) {
      AlertManager.throwError('Please select will be paying the expense')
      return false
    }
    if (!Manager.IsValid(formRef.current.name, true)) {
      AlertManager.throwError('Please add an expense name')
      return false
    }
    if (formRef.current.amount <= 0) {
      AlertManager.throwError('Please add an expense amount')
      return false
    }

    if (validAccounts > 0) {
      if (!Manager.IsValid(formRef.current.shareWith)) {
        AlertManager.throwError('Please choose who you would like to share this expense with')
        return false
      }
    }
    //#endregion VALIDATION

    const newExpense = {...formRef.current}
    newExpense.dueDate = Manager.IsValid(formRef.current.dueDate) ? moment(formRef.current.dueDate).format(DatetimeFormats.dateForDb) : ''
    newExpense.paidStatus = 'unpaid'
    newExpense.imageName = expenseImage.name ?? ''
    newExpense.recurringFrequency = recurringFrequency
    newExpense.ownerKey = currentUser?.key
    newExpense.isRecurring = isRecurring
    newExpense.recipient = {
      key: currentUser?.key,
      name: currentUser?.name,
    }

    // If expense has image
    if (expenseImage) {
      newExpense.imageName = expenseImage.name
      setExpenseImage(await ImageManager.compressImage(expenseImage))
    }

    // Get coparent name
    newExpense.recipientName = StringManager.GetFirstNameOnly(currentUser?.name)

    const activeRepeatIntervals = document.querySelectorAll('.repeat-interval .box.active')

    if (Manager.IsValid(activeRepeatIntervals) && activeRepeatIntervals.length > 0 && !expenseDueDate) {
      AlertManager.throwError('When selecting a recurring frequency, you must also set a due date')
      return false
    }

    // IMAGE UPLOAD
    if (Manager.IsValid(expenseImage?.name)) {
      await Storage.upload(Storage.directories.expenseImages, currentUser?.key, expenseImage, expenseImage.name).then((url) => {
        newExpense.imageUrl = url
      })
    }

    const cleanObject = ObjectManager.GetModelValidatedObject(newExpense, ModelNames.expense)
    console.log(cleanObject)

    // Add to DB
    await DB.Add(`${DB.tables.expenses}/${currentUser?.key}`, expenses, cleanObject).finally(async () => {
      // Add repeating expense to DB
      if (recurringFrequency.length > 0 && repeatingEndDate.length > 0) {
        await AddRepeatingExpensesToDb()
      }

      // Send notification
      if (Manager.IsValid(formRef.current.shareWith)) {
        UpdateManager.SendToShareWith(
          formRef.current.shareWith,
          currentUser,
          `${StringManager.GetFirstNameOnly(currentUser?.name)} has created a new expense`,
          `${expenseName} - $${formRef.current.amount}`,
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

    if (Manager.IsValid(datesToRepeat)) {
      datesToRepeat.forEach((date) => {
        const newExpense = new Expense()
        newExpense.id = Manager.GetUid()
        newExpense.name = expenseName
        newExpense.children = expenseChildren
        newExpense.amount = expenseAmount
        newExpense.imageName = ''
        newExpense.phone = currentUser?.key
        newExpense.dueDate = DateManager.DateIsValid(date) ? moment(date).format(DatetimeFormats.dateForDb) : ''
        newExpense.creationDate = DateManager.GetCurrentJavascriptDate()
        newExpense.notes = expenseNotes
        newExpense.paidStatus = 'unpaid'
        newExpense.createdBy = currentUser?.name
        newExpense.shareWith = DatasetManager.getUniqueArray(shareWith).flat()
        newExpense.recipientName = StringManager.GetFirstNameOnly(currentUser?.name)
        newExpense.isRecurring = true
        expensesToPush.push(newExpense)
      })
      await DB_UserScoped.addMultipleExpenses(currentUser, expensesToPush)
    }
  }

  const HandleChildSelection = (e) => (formRef.current.children = e.map((x) => x.label))

  const HandleShareWithSelection = (e) => (formRef.current.shareWith = e.map((x) => x.value))

  const HandlePayerSelection = (e) => {
    const payerUser = coParents?.find((x) => x?.userKey === e?.value)
    formRef.current.payer = {
      name: payerUser?.name,
      key: payerUser?.userKey,
      phone: payerUser?.phone,
    }
  }

  const HandleRecurringSelection = async (e) => {
    const repeatingWrapper = document.getElementById('repeating-container')
    const checkboxWrappers = repeatingWrapper.querySelectorAll('#checkbox-wrapper, #label-wrapper')
    checkboxWrappers.forEach((wrapper) => {
      wrapper.classList.remove('active')
    })
    DomManager.HandleCheckboxSelection(
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
    const currentNumber = parseInt(formRef.current.amount || 0)
    const total = asNumber + currentNumber
    formRef.current.amount = total
    const activeForm = document.querySelector('.form.active')
    const inputField = activeForm.querySelector('.input-field')
    const amountInput = inputField.querySelector('input')
    amountInput.value = total
    numberButton.classList.add('pressed', 'animate', 'active')
    setTimeout(() => {
      numberButton.classList.remove('pressed')
    }, 50)
  }

  const HandleCategorySelection = (category) => (formRef.current.category = category.label)

  return (
    <Form
      refreshKey={refreshKey}
      hasDelete={false}
      onSubmit={SubmitNewExpense}
      submitText={'Done'}
      title={'Create Expense'}
      className="new-expense-card"
      wrapperClass="new-expense-card form at-top"
      showCard={creationFormToShow === CreationForms.expense}
      extraButtons={[
        <UploadButton
          useAttachmentIcon={true}
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
        />,
      ]}
      onClose={ResetForm}>
      <div className="expenses-wrapper">
        {/* PAGE CONTAINER */}
        <div id="add-expense-form" className={`${theme} at-top`}>
          {/* AMOUNT */}
          <div id="amount-input-field">
            <span className="flex">
              <InputField
                wrapperClass="currency"
                isCurrency={true}
                id="amount-input"
                hasBottomSpacer={false}
                inputType={InputTypes.number}
                onChange={(e) => {
                  const numbersOnly = StringManager.RemoveAllLetters(e.target.value).replaceAll('.', '')
                  e.target.value = numbersOnly
                  formRef.current.amount = numbersOnly
                }}
                placeholder={'0'}
              />
            </span>
          </div>

          {/* DEFAULT EXPENSE AMOUNTS */}
          <div id="default-expense-amounts">
            <button className="default-amount-button default button" onClick={OnDefaultAmountPress}>
              $5
            </button>
            <button className="default-amount-button default button" onClick={OnDefaultAmountPress}>
              $10
            </button>
            <button className="default-amount-button default button" onClick={OnDefaultAmountPress}>
              $20
            </button>
            <button className="default-amount-button default button" onClick={OnDefaultAmountPress}>
              $30
            </button>
            <button className="default-amount-button default button" onClick={OnDefaultAmountPress}>
              $40
            </button>
            <button className="default-amount-button default button" onClick={OnDefaultAmountPress}>
              $50
            </button>
            <button className="default-amount-button default button" onClick={OnDefaultAmountPress}>
              $60
            </button>
            <button className="default-amount-button default button" onClick={OnDefaultAmountPress}>
              $70
            </button>
            <button className="default-amount-button default button" onClick={OnDefaultAmountPress}>
              $80
            </button>
            <button className="default-amount-button default button" onClick={OnDefaultAmountPress}>
              $90
            </button>
            <button className="default-amount-button default button" onClick={OnDefaultAmountPress}>
              $100
            </button>
            <button
              className="default-amount-button reset"
              onClick={() => {
                const inputField = document.getElementById('amount-input-field')
                const amountInput = inputField.querySelector('input')
                amountInput.value = null
                setExpenseAmount(0)
              }}>
              Reset <GrPowerReset />
            </button>
          </div>

          {/* CATEGORY */}
          <SelectDropdown
            options={DomManager.GetSelectOptions(Object.values(ExpenseCategories))}
            selectValue={Object.keys(ExpenseCategories)[0]}
            onChange={HandleCategorySelection}
            labelText={'Select a Category'}
            required={true}
            show={true}
          />
          <Spacer height={5} />

          {/* EXPENSE NAME */}
          <InputField
            onChange={(e) => (formRef.current.name = e.target.value)}
            inputType={InputTypes.text}
            placeholder={'Expense Title'}
            required={true}
          />

          {/* DUE DATE */}
          <InputField
            inputType={InputTypes.date}
            uidClass="new-expense-date"
            placeholder={'Due Date'}
            onDateOrTimeSelection={(date) => (formRef.current.dueDate = moment(date).format(DatetimeFormats.dateForDb))}
          />

          {/* NOTES */}
          <InputField onChange={(e) => (formRef.current.notes = e.target.value)} inputType={'textarea'} placeholder={'Notes'} />
          <hr />

          {/* PAYER */}
          {Manager.IsValid(coParents) && (
            <SelectDropdown
              options={DomManager.GetSelectOptions(coParents, true)}
              labelText={'Select Expense Payer'}
              onChange={HandlePayerSelection}
            />
          )}

          {/* SHARE WITH */}
          <ShareWithDropdown onCheck={HandleShareWithSelection} placeholder={'Share with'} containerClass={'share-with-coParents'} />

          {/* INCLUDING WHICH CHILDREN */}
          {Manager.IsValid(children) && (
            <SelectDropdown
              options={DomManager.GetSelectOptions(children, true)}
              labelText={'Select Children to Include'}
              onChange={HandleChildSelection}
              isMultiple={true}
            />
          )}
          <Spacer height={8} />
          {/* RECURRING? */}
          <div className="flex">
            <Label text={'Recurring'} classes="always-show" />
            <ToggleButton onCheck={() => setIsRecurring(true)} onUncheck={() => setIsRecurring(false)} />
          </div>
          {isRecurring && (
            <CheckboxGroup
              onCheck={HandleRecurringSelection}
              checkboxArray={DomManager.BuildCheckboxGroup({
                currentUser,
                labelType: 'recurring-intervals',
              })}
            />
          )}
        </div>
      </div>
    </Form>
  )
}
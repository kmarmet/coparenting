import MyConfetti from '/src/components/shared/myConfetti.js'
import DatetimeFormats from '/src/constants/datetimeFormats.js'
import ExpenseCategories from '/src/constants/expenseCategories'
import globalState from '/src/context.js'
import DatasetManager from '/src/managers/datasetManager'
import DateManager from '/src/managers/dateManager.js'
import DomManager from '/src/managers/domManager'
import ExpenseManager from '/src/managers/expenseManager.js'
import Manager from '/src/managers/manager'
import NotificationManager from '/src/managers/notificationManager'
import ObjectManager from '/src/managers/objectManager'
import StringManager from '/src/managers/stringManager'
import ActivityCategory from '/src/models/activityCategory'
import ModelNames from '/src/models/modelNames'
// Path: src\components\screens\expenses\expenseTracker.jsx
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import MenuItem from '@mui/material/MenuItem'
import 'lightgallery/css/lightgallery.css'
import LightGallery from 'lightgallery/react'
import moment from 'moment'
import React, {useContext, useEffect, useState} from 'react'
import {Fade} from 'react-awesome-reveal'
import {AiOutlineFileAdd} from 'react-icons/ai'
import {MdOutlineEventRepeat} from 'react-icons/md'
import {RxUpdate} from 'react-icons/rx'
import InputTypes from '../../../constants/inputTypes'
import DB from '../../../database/DB.js'
import useCurrentUser from '../../../hooks/useCurrentUser'
import useExpenses from '../../../hooks/useExpenses'
import NewExpenseForm from '../../forms/newExpenseForm.jsx'
import NavBar from '../../navBar.jsx'
import AccordionTitle from '../../shared/accordionTitle'
import DetailBlock from '../../shared/detailBlock'
import InputWrapper from '../../shared/inputWrapper.jsx'
import Label from '../../shared/label.jsx'
import Modal from '../../shared/modal.jsx'
import NoDataFallbackText from '../../shared/noDataFallbackText.jsx'
import SelectDropdown from '../../shared/selectDropdown.jsx'
import Spacer from '../../shared/spacer'
import ViewSelector from '../../shared/viewSelector.jsx'
import PaymentOptions from './paymentOptions.jsx'

const SortByTypes = {
  nearestDueDate: 'Nearest Due Date',
  recentlyAdded: 'Recently Added',
  amountDesc: 'Amount: High to Low',
  amountAsc: 'Amount: Low to High',
}

export default function ExpenseTracker() {
  const {state, setState} = useContext(globalState)
  const {theme} = state
  const [showPaymentOptionsCard, setShowPaymentOptionsCard] = useState(false)
  const [showNewExpenseCard, setShowNewExpenseCard] = useState(false)
  const [categoriesInUse, setCategoriesInUse] = useState([])
  const [activeExpense, setActiveExpense] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [view, setView] = useState('details')
  const [category, setCategory] = useState(activeExpense?.category)
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
  const [sortMethod, setSortMethod] = useState(SortByTypes.recentlyAdded)
  const [categoriesAsArray, setCategoriesAsArray] = useState([])
  const [expenseDateType, setExpenseDateType] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [sortedExpenses, setSortedExpenses] = useState([])
  const {expenses, expensesAreLoading} = useExpenses()
  const {currentUser, currentUserIsLoading} = useCurrentUser()

  const Update = async () => {
    // Fill/overwrite
    let updatedExpense = {...activeExpense}
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

    if (!Manager.isValid(dueDate)) {
      updatedExpense.dueDate = moment(dueDate).format(DatetimeFormats.dateForDb)
    }
    const cleanedExpense = ObjectManager.cleanObject(updatedExpense, ModelNames.expense)
    cleanedExpense.ownerKey = activeExpense.ownerKey
    const updateIndex = DB.GetTableIndexById(expenses, activeExpense?.id)
    await ExpenseManager.UpdateExpense(currentUser?.key, updateIndex, cleanedExpense)
    await GetSecuredExpenses()
    setActiveExpense(updatedExpense)
    setShowDetails(false)
  }

  const TogglePaidStatus = async () => {
    const updatedStatus = activeExpense.paidStatus === 'paid' ? 'unpaid' : 'paid'
    setPaidStatus(updatedStatus)
    activeExpense.paidStatus = updatedStatus
    const updateIndex = DB.GetTableIndexById(expenses, activeExpense?.id)
    await ExpenseManager.UpdateExpense(currentUser?.key, updateIndex, activeExpense).then(async () => {
      NotificationManager.SendNotification(
        `Expense Paid`,
        `An expense has been marked ${updatedStatus.toUpperCase()} by ${currentUser?.name} \nExpense Name: ${activeExpense?.name}`,
        payer?.key,
        currentUser,
        activeExpense.category
      )
      setShowDetails(false)
      if (updatedStatus === 'paid') {
        MyConfetti.fire()
      }
    })
  }

  const GetSecuredExpenses = async () => {
    let categories = expenses.map((x) => x.category).filter((x) => x !== '')
    categories.unshift('None')
    setCategoriesInUse(categories)
    setSortedExpenses(expenses)
    return expenses
  }

  const SendReminder = async (expense) => {
    const message = `This is a reminder to pay the ${expense?.name} expense?.  ${
      Manager.isValid(expense?.dueDate) ? 'Due date is: ' + expense?.dueDate : ''
    }`
    NotificationManager.SendNotification(`Expense Reminder`, message, expense?.payer?.phone, currentUser, ActivityCategory.expenses)
    setState({...state, successAlertMessage: 'Reminder Sent'})
    setShowDetails(false)
  }

  const HandleExpenseTypeSelection = async (selectionType) => {
    if (selectionType === 'single') {
      setSortedExpenses(expenses.filter((x) => x.isRecurring === false))
      setExpenseDateType('single')
    }
    if (selectionType === 'recurring') {
      setSortedExpenses(expenses.filter((x) => x.isRecurring === true))
      setExpenseDateType('recurring')
    }
    if (selectionType === 'all') {
      setSortedExpenses(expenses)
      setExpenseDateType('all')
    }
  }

  const HandlePaidStatusSelection = async (status) => {
    if (status === 'all') {
      setSortedExpenses(expenses)
      setPaidStatus('all')
    } else {
      setPaidStatus(status)
      setSortedExpenses(expenses.filter((x) => x.paidStatus === status))
    }
  }

  const HandleSortBySelection = (e) => {
    const sortByName = e.target.value
    const expensesAsNumbers = expenses.map((expense) => {
      expense.amount = parseInt(expense?.amount)
      return expense
    })
    if (sortByName === SortByTypes.recentlyAdded) {
      setSortedExpenses(expenses.sort((a, b) => new Date(a.creationDate) - new Date(b.creationDate)).reverse())
      setSortMethod(SortByTypes.recentlyAdded)
    }
    if (sortByName === SortByTypes.recentlyAdded) {
      const sortedByDateAsc = DatasetManager.sortByProperty(expenses, 'creationDate', 'asc', true)
      setSortedExpenses(sortedByDateAsc)
    }
    if (sortByName === SortByTypes.nearestDueDate) {
      const sortedByDueDateDesc = DatasetManager.sortByProperty(expenses, 'dueDate', 'desc', true)
      setSortedExpenses(sortedByDueDateDesc)
    }
    // High -> Low
    if (sortByName === SortByTypes.amountDesc) {
      const sortByAmountDesc = DatasetManager.sortByProperty(expensesAsNumbers, 'amount', 'desc')
      setSortedExpenses(sortByAmountDesc)
      setSortMethod(SortByTypes.amountDesc)
    }
    // Low -> High
    if (sortByName === SortByTypes.amountAsc) {
      const sortedByAmountAsc = DatasetManager.sortByProperty(expensesAsNumbers, 'amount', 'asc')
      setSortedExpenses(sortedByAmountAsc)
      setSortMethod(SortByTypes.amountAsc)
    }
  }

  const HandleCategorySelection = async (element) => {
    const allExpenses = await GetSecuredExpenses()
    const category = element.target.textContent
    let expensesByCategory = allExpenses.filter((x) => x.category === category)
    if (element.target.classList.contains('active')) {
      expensesByCategory = allExpenses.filter((x) => x.category !== category)
    }
    DomManager.toggleActive(element.target)
    if (category === 'None') {
      setSortedExpenses(allExpenses)
    } else {
      setSortedExpenses(expensesByCategory)
    }
    setCategory(category)
  }

  const SetDefaults = () => {
    setCategory(activeExpense?.category)
    setAmount(activeExpense?.amount)
    setName(activeExpense?.name)
    setPayer(activeExpense?.payer)
    setNotes(activeExpense?.notes)
    setDueDate(activeExpense?.dueDate)
    setChildren(activeExpense?.children)
    setShareWith(activeExpense?.shareWith)
    setPaidStatus(activeExpense?.paidStatus)
    setImageName(activeExpense?.imageName)
    setRecipientName(activeExpense?.recipientName)
    setView('details')
  }

  const DeleteExpense = async () => await DB.deleteById(`${DB.tables.expenses}/${currentUser?.key}`, activeExpense?.id)

  const GetRecurringDateText = (expense) => {
    switch (expense?.recurringFrequency) {
      case 'daily':
        return 'Every Day'
      case 'weekly':
        return `Every Week on the ${moment(expense?.dueDate).format('Do')}`
      case 'monthly':
        return `Every Month on the ${moment(expense?.dueDate).format('Do')}`
      case 'biweekly':
        return `Every Two Weeks on the ${moment(expense?.dueDate).format('Do')}`
    }
  }

  const GetShortRecurringDateText = () => {
    switch (activeExpense?.recurringFrequency) {
      case 'daily':
        return 'Every Day'
      case 'weekly':
        return `Every Week`
      case 'monthly':
        return `Every Month`
      case 'biweekly':
        return `Every 2 Weeks`
    }
  }

  const GetDetailsDueDate = () => {
    if (activeExpense?.dueDate) {
      const text = GetShortRecurringDateText(activeExpense)

      switch (text) {
        case 'Every Day':
          return 'Daily'
        case 'Every Week':
          return moment(activeExpense?.dueDate).format('dddd')
        case 'Every Month':
          return moment(activeExpense?.dueDate).format('Do')
        case 'Every 2 Weeks':
          return moment(activeExpense?.dueDate).format('Do')
      }
    }
  }

  useEffect(() => {
    setView('details')
    const catsAsArray = Object.keys(ExpenseCategories)
    catsAsArray.unshift('None')
    setCategoriesAsArray(catsAsArray)
    SetDefaults()
  }, [])

  useEffect(() => {
    if (Manager.isValid(expenses)) {
      setSortedExpenses(expenses)
    }
  }, [expenses])

  if (expensesAreLoading || currentUserIsLoading) {
    return <img className="data-loading-gif" src={require('../../../img/loading.gif')} alt="Loading" />
  }

  return (
    <>
      {/* NEW EXPENSE FORM */}
      <NewExpenseForm showCard={showNewExpenseCard} hideCard={() => setShowNewExpenseCard(false)} />

      {/* PAYMENT OPTIONS */}
      <PaymentOptions onClose={() => setShowPaymentOptionsCard(false)} showPaymentOptionsCard={showPaymentOptionsCard} />

      {/* DETAILS CARD */}
      <Modal
        submitText={'Update'}
        title={`${StringManager.uppercaseFirstLetterOfAllWords(activeExpense?.name || '')}`}
        submitIcon={<RxUpdate className={'fs-16'} />}
        onSubmit={Update}
        hasSubmitButton={view === 'edit'}
        className="expense-tracker form"
        wrapperClass="expense-tracker"
        onClose={() => {
          setActiveExpense(null)
          setShowDetails(false)
          setState({...state, refreshKey: Manager.getUid()})
        }}
        onDelete={DeleteExpense}
        viewSelector={<ViewSelector labels={['details', 'edit']} updateState={(e) => setView(e.toLowerCase())} />}
        showCard={showDetails}>
        <div id="details" className={`content ${activeExpense?.reason?.length > 20 ? 'long-text' : ''}`}>
          <hr />
          <Spacer height={5} />
          {/* DETAILS */}
          {view === 'details' && (
            <>
              <div className="blocks">
                {/*  Amount */}
                <DetailBlock title={'Amount'} text={`$${activeExpense?.amount}`} valueToValidate={activeExpense?.amount} />

                {/*  Due Date */}
                {!activeExpense?.isRecurring && (
                  <DetailBlock
                    title={'Due Date'}
                    text={moment(activeExpense?.dueDate).format(DatetimeFormats.readableMonthAndDayWithDayDigitOnly)}
                    valueToValidate={moment(activeExpense?.dueDate).format(DatetimeFormats.readableMonthAndDayWithDayDigitOnly)}
                  />
                )}
                {activeExpense?.isRecurring && (
                  <DetailBlock
                    title={'Due Date'}
                    text={GetDetailsDueDate(activeExpense)}
                    valueToValidate={moment(activeExpense?.dueDate).format(DatetimeFormats.readableMonthAndDayWithDayDigitOnly)}
                  />
                )}

                {/*  Date Added */}
                <DetailBlock
                  title={'Date Added'}
                  text={moment(activeExpense?.creationDate).format(DatetimeFormats.readableMonthAndDayWithDayDigitOnly)}
                  valueToValidate={moment(activeExpense?.creationDate).format(DatetimeFormats.readableMonthAndDayWithDayDigitOnly)}
                />

                {/*  Frequency */}
                <DetailBlock
                  title={'Frequency'}
                  text={GetShortRecurringDateText(activeExpense)}
                  valueToValidate={activeExpense?.recurringFrequency}
                />

                {/*  Time Remaining */}
                {!activeExpense?.isRecurring && (
                  <DetailBlock
                    classes={moment(moment(activeExpense?.dueDate).startOf('day')).fromNow().toString().includes('ago') ? 'red' : 'green'}
                    title={'Time Remaining'}
                    text={`${moment(moment(activeExpense?.dueDate).startOf('day')).fromNow().toString()}`}
                    valueToValidate={moment(moment(activeExpense?.dueDate).startOf('day')).fromNow().toString()}
                  />
                )}

                {/*  Pay To */}
                <DetailBlock
                  title={'Pay To'}
                  text={StringManager.getFirstNameOnly(activeExpense?.recipientName)}
                  valueToValidate={StringManager.getFirstNameOnly(activeExpense?.recipientName)}
                />

                {/*  Payer */}
                <DetailBlock
                  title={'Payer'}
                  text={StringManager.getFirstNameOnly(payer?.name)}
                  valueToValidate={StringManager.getFirstNameOnly(payer?.name)}
                />

                {/*  Recurring */}
                <DetailBlock title={'Recurring'} text={activeExpense?.isRecurring ? 'Yes' : 'No'} valueToValidate={activeExpense?.isRecurring} />

                {/*  Category */}
                <DetailBlock title={'Category'} text={activeExpense?.category} valueToValidate={activeExpense?.category} />

                {/*  Recurring Frequency */}
                <DetailBlock
                  title={'Recurring Frequency'}
                  text={StringManager.uppercaseFirstLetterOfAllWords(activeExpense?.recurringFrequency)}
                  valueToValidate={activeExpense?.frequency}
                />

                {/* CHILDREN */}
                {Manager.isValid(activeExpense?.children) && (
                  <div className="block">
                    {Manager.isValid(activeExpense?.children) &&
                      activeExpense?.children?.map((child, index) => {
                        return (
                          <p className="block-text" key={index}>
                            {child}
                          </p>
                        )
                      })}
                    <p className="block-title">Children</p>
                  </div>
                )}

                {/*  Notes */}
                <DetailBlock title={'Notes'} text={activeExpense?.notes} isFullWidth={true} valueToValidate={activeExpense?.notes} />

                {/* EXPENSE IMAGE */}
                {Manager.isValid(activeExpense?.imageUrl) && (
                  <>
                    <div id="expense-image" className="block">
                      <LightGallery elementClassNames={'light-gallery'} speed={500} selector={'#img-container'}>
                        <div
                          style={{backgroundImage: `url(${activeExpense?.imageUrl})`}}
                          data-src={activeExpense?.imageUrl}
                          id="img-container"
                          className="flex"></div>
                      </LightGallery>
                      <p className="block-text">Image</p>
                    </div>
                  </>
                )}

                <Spacer height={5} />
              </div>
              <hr className="bottom" />
            </>
          )}

          {/* EDIT */}
          {view === 'edit' && (
            <>
              <InputWrapper
                inputType={InputTypes.text}
                labelText={'Name'}
                defaultValue={activeExpense?.name}
                onChange={(e) => setName(e.target.value)}
              />

              {/* AMOUNT */}
              <InputWrapper
                labelText={'Amount'}
                defaultValue={activeExpense?.amount}
                inputType={InputTypes.number}
                onChange={(e) => setAmount(e.target.value)}
              />

              {/* DUE DATE */}
              <InputWrapper
                defaultValue={moment(activeExpense?.dueDate)}
                inputType={'date'}
                labelText={'Due Date'}
                uidClass="expense-tracker-due-date"
                onDateOrTimeSelection={(e) => setDueDate(moment(e).format('MM/DD/yyyy'))}
              />

              {/* CATEGORY */}
              <SelectDropdown
                wrapperClasses={'expense-tracker'}
                selectValue={category}
                onChange={(e) => setCategory(e.target.value)}
                labelText={'Category'}>
                {categoriesAsArray.map((cat, index) => {
                  return (
                    <MenuItem key={index} value={cat}>
                      {cat}
                    </MenuItem>
                  )
                })}
              </SelectDropdown>

              <Spacer height={5} />

              {/* NOTES */}
              <InputWrapper
                defaultValue={activeExpense?.notes}
                onChange={(e) => setNotes(e.target.value)}
                inputType={InputTypes.textarea}
                labelText={'Notes'}
              />

              {/* BUTTONS */}
              <div className="action-buttons">
                {activeExpense?.paidStatus === 'unpaid' && (
                  <button className="button green default" onClick={TogglePaidStatus}>
                    Mark Paid
                  </button>
                )}

                {activeExpense?.paidStatus === 'paid' && (
                  <button className="button red default" onClick={TogglePaidStatus}>
                    Mark Unpaid
                  </button>
                )}

                <button className="button default grey center" onClick={SendReminder}>
                  Send Reminder
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* PAGE CONTAINER */}
      <div id="expense-tracker" className={`${theme} page-container form`}>
        <div className="flex" id="screen-title-wrapper">
          <p className="screen-title">Expense Tracker </p>
          {!DomManager.isMobile() && <AiOutlineFileAdd onClick={() => setShowNewExpenseCard(true)} id={'add-new-button'} />}
        </div>
        <p className={`${theme} text-screen-intro`}>
          Incorporate expenses that your co-parent is responsible for. Should a new expense arise that requires your payment, you will have the option
          to either approve or decline it.
        </p>
        <Spacer height={8} />

        {/* PAYMENT OPTIONS */}
        <p className="payment-options-link" onClick={() => setShowPaymentOptionsCard(true)}>
          Bill Payment & Money Transfer Options
        </p>
        <Spacer height={8} />

        {/* FILTERS */}
        <Accordion expanded={showFilters} id={'expenses-accordion'} className={`${showFilters ? 'open' : 'closed'} ${theme}`}>
          <AccordionSummary onClick={() => setShowFilters(!showFilters)} className={showFilters ? 'open' : 'closed'}>
            <AccordionTitle titleText={'Filters'} toggleState={showFilters} onClick={() => setShowFilters(!showFilters)} />
          </AccordionSummary>
          <AccordionDetails>
            <div id="filters">
              <div className="filter-row">
                <Label isBold={true} text={'Type'} classes="mb-5"></Label>
                <div className="buttons flex type">
                  <button className={`${expenseDateType === 'all' ? 'active' : ''} button default`} onClick={() => HandleExpenseTypeSelection('all')}>
                    All
                  </button>
                  <button
                    className={`${expenseDateType === 'single' ? 'active' : ''} button default`}
                    onClick={() => HandleExpenseTypeSelection('single')}>
                    One-time
                  </button>
                  <button
                    className={`${expenseDateType === 'recurring' ? 'active' : ''} button default`}
                    onClick={() => HandleExpenseTypeSelection('recurring')}>
                    Recurring
                  </button>
                </div>
              </div>
              <div className="filter-row">
                <Label isBold={true} text={'Payment Status'} classes="mb-5"></Label>
                <div className="buttons type flex">
                  <button
                    className={paidStatus === 'all' ? 'active button default' : 'button default'}
                    onClick={() => HandlePaidStatusSelection('all')}>
                    All
                  </button>
                  <button
                    className={paidStatus === 'unpaid' ? 'active button default' : 'button default'}
                    onClick={() => HandlePaidStatusSelection('unpaid')}>
                    Unpaid
                  </button>
                  <button
                    className={paidStatus === 'paid' ? 'active button default' : 'button default'}
                    onClick={() => HandlePaidStatusSelection('paid')}>
                    Paid
                  </button>
                </div>
              </div>
              {categoriesInUse.length > 0 && <Label isBold={true} text={'Category'} classes="mb-5"></Label>}

              {/* CATEGORIES */}
              {Manager.isValid(categoriesInUse) && (
                <div className="filter-row">
                  <div className="buttons category">
                    {categoriesAsArray.map((cat, index) => {
                      return (
                        <>
                          {categoriesInUse.includes(cat) && Manager.isValid(cat, true) && (
                            <button
                              key={index}
                              onClick={HandleCategorySelection}
                              className={category === cat ? 'button default active' : 'button default'}>
                              {cat}
                            </button>
                          )}
                        </>
                      )
                    })}
                  </div>
                </div>
              )}
              <Label text={''} classes="sorting" />
              <SelectDropdown wrapperClasses={'sorting-accordion'} selectValue={sortMethod} labelText={'Sort by'} onChange={HandleSortBySelection}>
                <MenuItem value={SortByTypes.recentlyAdded}>{SortByTypes.recentlyAdded}</MenuItem>
                <MenuItem value={SortByTypes.nearestDueDate}>{SortByTypes.nearestDueDate}</MenuItem>
                <MenuItem value={SortByTypes.amountDesc}>{SortByTypes.amountDesc}</MenuItem>
                <MenuItem value={SortByTypes.amountAsc}>{SortByTypes.amountAsc}</MenuItem>
              </SelectDropdown>
            </div>
          </AccordionDetails>
        </Accordion>
        {/* FILTERS */}

        {/* LOOP EXPENSES */}
        <div id="expenses-container">
          {Manager.isValid(sortedExpenses) && (
            <Fade direction={'right'} duration={800} triggerOnce={true} className={'expense-tracker-fade-wrapper'} cascade={true} damping={0.2}>
              {Manager.isValid(sortedExpenses) &&
                sortedExpenses.map((expense, index) => {
                  let dueDate = moment(expense?.dueDate).format(DatetimeFormats.readableMonthAndDay) ?? ''
                  const readableDueDate = moment(moment(expense?.dueDate).startOf('day')).fromNow().toString()
                  const isPastDue = readableDueDate.toString().includes('ago')
                  const dueInADay = readableDueDate.toString().includes('in a day')
                  const dueInHours = readableDueDate.toString().includes('hours')

                  if (!Manager.isValid(dueDate)) {
                    dueDate = ''
                  }
                  return (
                    <div
                      key={index}
                      className="row"
                      onClick={() => {
                        setActiveExpense(expense)
                        setShowDetails(true)
                      }}>
                      <div id="primary-icon-wrapper">
                        <span className="amount">${expense?.amount}</span>
                      </div>

                      <div id="content" data-expense-id={expense?.id} className={`expense wrap`}>
                        {/* EXPENSE NAME */}
                        <div id="name-wrapper" className="flex align-center">
                          <p className="name row-title">
                            {StringManager.uppercaseFirstLetterOfAllWords(expense?.name)}
                            {expense?.isRecurring && <MdOutlineEventRepeat />}
                          </p>

                          {/*  STATUS */}
                          {!expense?.isRecurring && (
                            <>
                              {!dueInADay && !dueInHours && (
                                <span className={`${expense?.paidStatus} status`} id="request-status">
                                  {isPastDue ? 'PAST DUE' : StringManager.uppercaseFirstLetterOfAllWords(expense?.paidStatus.toUpperCase())}
                                </span>
                              )}
                              {dueInADay ||
                                (dueInHours && (
                                  <span className={`status soon`} id="request-status">
                                    Soon
                                  </span>
                                ))}
                            </>
                          )}
                        </div>

                        {/* DATE */}
                        <div className="flex" id="below-title">
                          {Manager.isValid(dueDate, true) && (
                            <>
                              {!expense?.isRecurring && (
                                <p className={`due-date`}>
                                  {DateManager.formatDate(expense?.dueDate)} ({readableDueDate.toString()})
                                </p>
                              )}
                              {expense?.isRecurring && <p className={`due-date`}>{GetRecurringDateText(expense)}</p>}
                            </>
                          )}
                          {!Manager.isValid(dueDate, true) && <p className="due-date no-due-date">no due date</p>}
                        </div>
                      </div>
                    </div>
                  )
                })}
            </Fade>
          )}
        </div>
      </div>
      <NavBar navbarClass={'expenses'} />
      {expenses?.length === 0 && <NoDataFallbackText text={'There are currently no expenses'} />}
    </>
  )
}
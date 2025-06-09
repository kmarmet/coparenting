import MyConfetti from '../../shared/myConfetti.js'
import ActivityCategory from '../../../constants/activityCategory'
import DatetimeFormats from '../../../constants/datetimeFormats.js'
import ExpenseCategories from '../../../constants/expenseCategories'
import ModelNames from '../../../constants/modelNames'
import globalState from '../../../context.js'
import DatasetManager from '../../../managers/datasetManager'
import DomManager from '../../../managers/domManager'
import ExpenseManager from '../../../managers/expenseManager.js'
import Manager from '../../../managers/manager'
import ObjectManager from '../../../managers/objectManager'
import StringManager from '../../../managers/stringManager'
import UpdateManager from '../../../managers/updateManager'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import moment from 'moment'
import React, {useContext, useEffect, useState} from 'react'
import {BsCardImage} from 'react-icons/bs'
import {MdOutlineEventRepeat} from 'react-icons/md'
import {LazyLoadImage} from 'react-lazy-load-image-component'
import InputTypes from '../../../constants/inputTypes'
import DB from '../../../database/DB.js'
import ButtonThemes from '../../../constants/buttonThemes'
import useCurrentUser from '../../../hooks/useCurrentUser'
import useExpenses from '../../../hooks/useExpenses'
import NewExpenseForm from '../../forms/newExpenseForm.jsx'
import NavBar from '../../navBar.jsx'
import AccordionTitle from '../../shared/accordionTitle'
import DetailBlock from '../../shared/detailBlock'
import Form from '../../shared/form.jsx'
import InputField from '../../shared/inputField.jsx'
import Label from '../../shared/label.jsx'
import NoDataFallbackText from '../../shared/noDataFallbackText.jsx'
import ScreenHeader from '../../shared/screenHeader'
import SelectDropdown from '../../shared/selectDropdown.jsx'
import Slideshow from '../../shared/slideshow'
import Spacer from '../../shared/spacer'
import ViewSelector from '../../shared/viewSelector.jsx'
import PaymentOptions from './paymentOptions.jsx'
import Button from '../../shared/button'
import CardButton from '../../shared/cardButton'

const SortByTypes = {
  nearestDueDate: 'Nearest Due Date',
  recentlyAdded: 'Recently Added',
  amountDesc: 'Amount: High to Low',
  amountAsc: 'Amount: Low to High',
  nameAsc: 'Name (ascending)',
  nameDesc: 'Name (descending)',
}

export default function ExpenseTracker() {
  const {state, setState} = useContext(globalState)
  const {theme} = state
  const [showPaymentOptionsCard, setShowPaymentOptionsCard] = useState(false)
  const [showNewExpenseCard, setShowNewExpenseCard] = useState(false)
  const [categoriesInUse, setCategoriesInUse] = useState([])
  const [activeExpense, setActiveExpense] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [view, setView] = useState('Details')
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
  const {expenses} = useExpenses()
  const {currentUser} = useCurrentUser()
  const [showSlideshow, setShowSlideshow] = useState(false)

  const Update = async () => {
    // Fill/overwrite
    let updatedExpense = {...activeExpense}
    updatedExpense.category = category
    updatedExpense.amount = amount?.toString()
    updatedExpense.payer = payer
    updatedExpense.notes = notes
    updatedExpense.dueDate = dueDate
    updatedExpense.children = children
    updatedExpense.shareWith = shareWith
    updatedExpense.paidStatus = paidStatus
    updatedExpense.imageName = imageName
    updatedExpense.recipientName = recipientName
    updatedExpense.name = name

    if (!Manager.IsValid(dueDate)) {
      updatedExpense.dueDate = moment(dueDate).format(DatetimeFormats.dateForDb)
    }
    const cleanedExpense = ObjectManager.GetModelValidatedObject(updatedExpense, ModelNames.expense)
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
      UpdateManager.SendUpdate(
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
      Manager.IsValid(expense?.dueDate) ? 'Due date is: ' + expense?.dueDate : ''
    }`
    UpdateManager.SendUpdate(`Expense Reminder`, message, expense?.payer?.phone, currentUser, ActivityCategory.expenses)
    setState({...state, successAlertMessage: 'Reminder Sent'})
    setShowDetails(false)
  }

  const HandleExpenseTypeSelection = async (element, selectionType) => {
    DomManager.toggleActive(element.target, '.filter-button.expense-type', true)
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

  const HandlePaidStatusSelection = async (element, status) => {
    DomManager.toggleActive(element.target, '.filter-button.paid-status', true)
    if (status === 'all') {
      setSortedExpenses(expenses)
      setPaidStatus('all')
    } else {
      setPaidStatus(status)
      setSortedExpenses(expenses.filter((x) => x.paidStatus === status))
    }
  }

  const HandleSortBySelection = (e) => {
    const sortByName = e.value
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

    // Name Ascending
    if (sortByName === SortByTypes.nameAsc) {
      const sortedByNameAsc = DatasetManager.sortByProperty(expenses, 'name', 'asc')
      setSortedExpenses(sortedByNameAsc)
      setSortMethod(SortByTypes.nameAsc)
    }

    // Name Descending
    if (sortByName === SortByTypes.nameDesc) {
      const sortedByNameDesc = DatasetManager.sortByProperty(expenses, 'name', 'desc')
      setSortedExpenses(sortedByNameDesc)
      setSortMethod(SortByTypes.nameDesc)
    }

    if (sortByName === SortByTypes.nearestDueDate) {
      const sortedByNearestDueDate = DatasetManager.sortByProperty(expenses, 'dueDate', 'asc')
      setSortedExpenses(sortedByNearestDueDate)
      setSortMethod(SortByTypes.nearestDueDate)
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
    setView('Details')
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
    setView('Details')
    const catsAsArray = Object.keys(ExpenseCategories)
    catsAsArray.unshift('None')
    setCategoriesAsArray(catsAsArray)
    SetDefaults()
  }, [])

  useEffect(() => {
    if (Manager.IsValid(expenses)) {
      setSortedExpenses(expenses)
    }
  }, [expenses])

  return (
    <>
      {/* NEW EXPENSE FORM */}
      <NewExpenseForm showCard={showNewExpenseCard} hideCard={() => setShowNewExpenseCard(false)} />

      {/* PAYMENT OPTIONS */}
      <PaymentOptions onClose={() => setShowPaymentOptionsCard(false)} showPaymentOptionsCard={showPaymentOptionsCard} />

      {/* SLIDESHOW  */}
      <Slideshow
        show={showSlideshow}
        hide={() => setShowSlideshow(false)}
        activeIndex={0}
        wrapperClasses="expense-slideshow"
        images={[{url: activeExpense?.imageUrl}]}
      />

      {/* DETAILS CARD */}
      <Form
        submitText={'Update'}
        title={`${StringManager.uppercaseFirstLetterOfAllWords(activeExpense?.name || '')}`}
        onSubmit={Update}
        hasSubmitButton={view === 'Edit'}
        className="expense-tracker form"
        wrapperClass="expense-tracker"
        onClose={() => {
          setActiveExpense(null)
          setShowDetails(false)
          setState({...state, refreshKey: Manager.GetUid()})
        }}
        onDelete={DeleteExpense}
        viewSelector={
          <ViewSelector
            wrapperClasses="full-width"
            show={showDetails}
            dropdownPlaceholder="Details"
            labels={['Details', 'Edit']}
            updateState={(e) => {
              setView(e)
            }}
          />
        }
        extraButtons={[
          <>
            {activeExpense?.paidStatus === 'unpaid' && (
              <CardButton buttonType={ButtonThemes.green} classes=" default" onClick={TogglePaidStatus}>
                Paid
              </CardButton>
            )}

            {activeExpense?.paidStatus === 'paid' && (
              <CardButton classes=" default" onClick={TogglePaidStatus}>
                Mark Unpaid
              </CardButton>
            )}

            <CardButton classes=" grey center lh-1_3" onClick={SendReminder}>
              Send <br /> Reminder
            </CardButton>
          </>,
        ]}
        showCard={showDetails}>
        <div className={`details content ${activeExpense?.reason?.length > 20 ? 'long-text' : ''}`}>
          {/* DETAILS */}
          {view === 'Details' && (
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
                  text={StringManager.GetFirstNameOnly(activeExpense?.recipientName)}
                  valueToValidate={StringManager.GetFirstNameOnly(activeExpense?.recipientName)}
                />

                {/*  Payer */}
                <DetailBlock
                  title={'Payer'}
                  text={StringManager.GetFirstNameOnly(payer?.name)}
                  valueToValidate={StringManager.GetFirstNameOnly(payer?.name)}
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
                {Manager.IsValid(activeExpense?.children) && (
                  <div className="block">
                    {Manager.IsValid(activeExpense?.children) &&
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
                {Manager.IsValid(activeExpense?.imageUrl) && (
                  <>
                    <div id="expense-image" className="block">
                      <LazyLoadImage
                        style={{backgroundImage: `url(${activeExpense?.imageUrl})`}}
                        src={activeExpense?.imageUrl}
                        id="img-container"
                        className="flex"
                        onClick={() => {
                          setShowDetails(false)
                          setShowSlideshow(true)
                        }}
                      />
                      <p className="block-text">Image</p>
                    </div>
                  </>
                )}

                <Spacer height={5} />
              </div>
            </>
          )}

          {/* EDIT */}
          {view === 'Edit' && (
            <>
              <InputField
                inputType={InputTypes.text}
                placeholder={'Name'}
                defaultValue={activeExpense?.name}
                onChange={(e) => setName(e.target.value)}
              />

              {/* AMOUNT */}
              <InputField
                placeholder={'Amount'}
                defaultValue={activeExpense?.amount}
                inputType={InputTypes.number}
                onChange={(e) => setAmount(e.target.value)}
              />

              {/* DUE DATE */}
              <InputField
                defaultValue={moment(activeExpense?.dueDate)}
                inputType={'date'}
                placeholder={'Due Date'}
                uidClass="expense-tracker-due-date"
                onDateOrTimeSelection={(e) => setDueDate(moment(e).format('MM/DD/yyyy'))}
              />

              {/* CATEGORY */}
              <SelectDropdown
                wrapperClasses={'expense-tracker in-form'}
                selectValue={category}
                onChange={(e) => setCategory(e.target.value)}
                options={categoriesAsArray}
                placeholder={'Category'}
              />

              <Spacer height={5} />

              {/* NOTES */}
              <InputField
                defaultValue={activeExpense?.notes}
                onChange={(e) => setNotes(e.target.value)}
                inputType={InputTypes.textarea}
                placeholder={'Notes'}
              />
            </>
          )}
        </div>
      </Form>

      {/* PAGE CONTAINER */}
      <div id="expense-tracker" className={`${theme} page-container`}>
        <ScreenHeader
          title={'Expense Tracker'}
          screenDescription="Incorporate expenses that your co-parent is responsible for. Should a new expense arise that requires your payment, you will have the option
          to either approve or decline it"
        />
        <Spacer height={8} />

        <div className="screen-content">
          {/* PAYMENT OPTIONS LINK */}
          <p className="payment-options-link" onClick={() => setShowPaymentOptionsCard(true)}>
            Expense Payment & Money Transfer Options
          </p>
          <Spacer height={8} />

          {/* FILTERS */}
          <Accordion expanded={showFilters} id={'expenses-accordion'} className={`${showFilters ? 'open' : 'closed'} ${theme} white-bg`}>
            <AccordionSummary onClick={() => setShowFilters(!showFilters)} className={showFilters ? 'open' : 'closed'}>
              <AccordionTitle titleText={'Filters'} toggleState={showFilters} onClick={() => setShowFilters(!showFilters)} />
            </AccordionSummary>
            <AccordionDetails>
              <div id="filters">
                <div className="filter-row">
                  <Label isBold={true} text={'Type'} classes="mb-5 toggle always-show"></Label>
                  <div className="buttons flex type">
                    <Button classes={`filter-button expense-type`} onClick={(e) => HandleExpenseTypeSelection(e, 'all')} text={'All'} />
                    <Button
                      buttonType={ButtonThemes.blend}
                      text={'One-time'}
                      classes={`filter-button expense-type`}
                      onClick={(e) => HandleExpenseTypeSelection(e, 'single')}
                    />
                    <Button text={'Recurring'} classes={`filter-button expense-type`} onClick={(e) => HandleExpenseTypeSelection(e, 'recurring')} />
                  </div>
                </div>
                <div className="filter-row">
                  <Label isBold={true} text={'Payment Status'} classes="mb-5 toggle always-show" />
                  <div className="buttons type flex">
                    <Button classes={'button filter-button paid-status'} onClick={(e) => HandlePaidStatusSelection(e, 'all')} text={'All'} />
                    <Button classes={'button filter-button paid-status'} onClick={(e) => HandlePaidStatusSelection(e, 'unpaid')} text={'Unpaid'} />
                    <Button classes={'button filter-button paid-status'} onClick={(e) => HandlePaidStatusSelection(e, 'paid')} text={'Paid'} />
                  </div>
                </div>

                {categoriesInUse.length > 0 && <Label isBold={true} text={'Category'} classes="mb-5" />}

                {/* CATEGORIES */}
                {Manager.IsValid(categoriesInUse) && (
                  <div className="filter-row">
                    <div className="buttons category">
                      {categoriesAsArray.map((cat, index) => {
                        return (
                          <>
                            {categoriesInUse.includes(cat) && Manager.IsValid(cat, true) && (
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
                <SelectDropdown
                  wrapperClasses={'sorting-accordion white-bg'}
                  selectValue={sortMethod}
                  labelText={'Sort by'}
                  options={DomManager.GetSelectOptions(Object.values(SortByTypes))}
                  onChange={HandleSortBySelection}></SelectDropdown>
              </div>
            </AccordionDetails>
          </Accordion>

          {/* LOOP EXPENSES */}
          <div id="expenses-container">
            {Manager.IsValid(sortedExpenses) &&
              sortedExpenses.map((expense, index) => {
                let dueDate = moment(expense?.dueDate).format(DatetimeFormats.readableMonthAndDay) ?? ''
                const readableDueDate = moment(moment(expense?.dueDate).startOf('day')).fromNow().toString()
                const isPastDue = readableDueDate.toString().includes('ago')
                const dueInADay = readableDueDate.toString().includes('in a day')
                const dueInHours = readableDueDate.toString().includes('hours')

                if (!Manager.IsValid(dueDate)) {
                  dueDate = ''
                }
                return (
                  <div
                    key={index}
                    style={DomManager.AnimateDelayStyle(index)}
                    className={`row ${DomManager.Animate.FadeInRight(sortedExpenses, '.row')}`}
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
                          {Manager.IsValid(expense?.imageName) && <BsCardImage />}
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
                        {Manager.IsValid(dueDate, true) && (
                          <>
                            {!expense?.isRecurring && (
                              <p className={`due-date`}>
                                {moment(expense?.dueDate).format(DatetimeFormats.readableMonthAndDay)} ({readableDueDate.toString()})
                              </p>
                            )}
                            {expense?.isRecurring && <p className={`due-date`}>{GetRecurringDateText(expense)}</p>}
                          </>
                        )}
                        {!Manager.IsValid(dueDate, true) && <p className="due-date no-due-date">no due date</p>}
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </div>
      <NavBar navbarClass={'expenses'} />
      {expenses?.length === 0 && <NoDataFallbackText text={'There are currently no expenses'} />}
    </>
  )
}
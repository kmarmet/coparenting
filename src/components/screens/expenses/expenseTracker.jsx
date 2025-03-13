import React, { useContext, useEffect, useState } from 'react'
// Path: src\components\screens\expenses\expenseTracker.jsx
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import MenuItem from '@mui/material/MenuItem'
import { MobileDatePicker } from '@mui/x-date-pickers-pro'
import { child, getDatabase, onValue, ref } from 'firebase/database'
import 'lightgallery/css/lightgallery.css'
import LightGallery from 'lightgallery/react'
import moment from 'moment'
import { Fade } from 'react-awesome-reveal'
import { AiOutlineFileAdd, AiTwotoneTag } from 'react-icons/ai'
import { FaChildren, FaMinus, FaPlus } from 'react-icons/fa6'
import { GiMoneyStack } from 'react-icons/gi'
import { PiUserCircleDuotone } from 'react-icons/pi'
import { RxUpdate } from 'react-icons/rx'
import { TbCalendarCheck, TbCalendarDollar } from 'react-icons/tb'
import { CgDetailsMore } from 'react-icons/cg'

import NewExpenseForm from '../../forms/newExpenseForm.jsx'
import NavBar from '../../navBar.jsx'
import BottomCard from '../../shared/bottomCard.jsx'
import InputWrapper from '../../shared/inputWrapper.jsx'
import Label from '../../shared/label.jsx'
import NoDataFallbackText from '../../shared/noDataFallbackText.jsx'
import SelectDropdown from '../../shared/selectDropdown.jsx'
import Spacer from '../../shared/spacer'
import PaymentOptions from './paymentOptions.jsx'
import MyConfetti from '/src/components/shared/myConfetti.js'
import DateFormats from '/src/constants/dateFormats.js'
import ExpenseCategories from '/src/constants/expenseCategories'
import globalState from '/src/context.js'
import DB from '../../../database/DB.js'
import AlertManager from '/src/managers/alertManager'
import DatasetManager from '/src/managers/datasetManager'
import DateManager from '/src/managers/dateManager.js'
import DomManager from '/src/managers/domManager'
import ExpenseManager from '/src/managers/expenseManager.js'
import Manager from '/src/managers/manager'
import NotificationManager from '/src/managers/notificationManager'
import ObjectManager from '/src/managers/objectManager'
import SecurityManager from '/src/managers/securityManager'
import StringManager from '/src/managers/stringManager'
import ActivityCategory from '/src/models/activityCategory'
import ModelNames from '/src/models/modelNames'
import ViewSelector from '../../shared/viewSelector.jsx'
import { IoMdAdd } from 'react-icons/io'

const SortByTypes = {
  nearestDueDate: 'Nearest Due Date',
  recentlyAdded: 'Recently Added',
  amountDesc: 'Amount: High to Low',
  amountAsc: 'Amount: Low to High',
}

export default function ExpenseTracker() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [expenses, setExpenses] = useState([])
  const [showPaymentOptionsCard, setShowPaymentOptionsCard] = useState(false)
  const [showNewExpenseCard, setShowNewExpenseCard] = useState(false)
  const [categoriesInUse, setCategoriesInUse] = useState([])
  const [activeExpense, setActiveExpense] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [view, setView] = useState('details')
  const [category, setCategory] = useState('')
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

  const update = async () => {
    // Fill/overwrite
    let updatedExpense = { ...activeExpense }
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
      updatedExpense.dueDate = moment(dueDate).format(DateFormats.dateForDb)
    }
    const cleanedExpense = ObjectManager.cleanObject(updatedExpense, ModelNames.expense)
    cleanedExpense.ownerKey = activeExpense.ownerKey
    await ExpenseManager.updateExpense(currentUser, cleanedExpense, cleanedExpense.id)
    await getSecuredExpenses()
    setActiveExpense(updatedExpense)
    setShowDetails(false)
  }

  const togglePaidStatus = async () => {
    const updatedStatus = activeExpense.paidStatus === 'paid' ? 'unpaid' : 'paid'
    setPaidStatus(updatedStatus)
    activeExpense.paidStatus = updatedStatus
    await ExpenseManager.updateExpense(currentUser, activeExpense, activeExpense.id).then(async () => {
      NotificationManager.sendNotification(
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

  const getSecuredExpenses = async () => {
    let allExpenses = await SecurityManager.getExpenses(currentUser)
    allExpenses = DatasetManager.getUniqueArray(allExpenses, 'id')
    let categories = allExpenses.map((x) => x.category).filter((x) => x !== '')
    categories.unshift('None')
    setCategoriesInUse(categories)
    setExpenses(allExpenses)
    return allExpenses
  }

  const sendReminder = async (expense) => {
    const message = `This is a reminder to pay the ${expense?.name} expense?.  ${
      Manager.isValid(expense?.dueDate) ? 'Due date is: ' + expense?.dueDate : ''
    }`
    NotificationManager.sendNotification(`Expense Reminder`, message, expense?.payer?.phone, currentUser, ActivityCategory.expenses)
    AlertManager.successAlert('Reminder Sent')
  }

  const onTableChange = async () => {
    const dbRef = ref(getDatabase())

    onValue(child(dbRef, `${DB.tables.expenses}/${currentUser?.key}`), async () => {
      await getSecuredExpenses()
    })
  }

  const handleExpenseTypeSelection = async (selectionType) => {
    const allExpenses = await getSecuredExpenses()

    if (selectionType === 'single') {
      setExpenses(allExpenses.filter((x) => x.isRepeating === false))
      setExpenseDateType('single')
    }
    if (selectionType === 'repeating') {
      setExpenses(allExpenses.filter((x) => x.isRepeating === true))
      setExpenseDateType('repeating')
    }
    if (selectionType === 'all') {
      setExpenses(allExpenses)
      setExpenseDateType('all')
    }
  }

  const handlePaidStatusSelection = async (status) => {
    const allExpenses = await getSecuredExpenses()
    if (status === 'all') {
      setExpenses(allExpenses)
      setPaidStatus('all')
    } else {
      setPaidStatus(status)
      setExpenses(allExpenses.filter((x) => x.paidStatus === status))
    }
  }

  const handleSortBySelection = (e) => {
    const sortByName = e.target.value
    const expensesAsNumbers = expenses.map((expense) => {
      expense.amount = parseInt(expense?.amount)
      return expense
    })
    if (sortByName === SortByTypes.recentlyAdded) {
      setExpenses(expenses.sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded)).reverse())
      setSortMethod(SortByTypes.recentlyAdded)
    }
    if (sortByName === SortByTypes.recentlyAdded) {
      const sortedByDateAsc = DatasetManager.sortByProperty(expenses, 'dateAdded', 'asc', true)
      setExpenses(sortedByDateAsc)
    }
    if (sortByName === SortByTypes.nearestDueDate) {
      const sortedByDueDateDesc = DatasetManager.sortByProperty(expenses, 'dueDate', 'desc', true)
      setExpenses(sortedByDueDateDesc)
    }
    // High -> Low
    if (sortByName === SortByTypes.amountDesc) {
      const sortByAmountDesc = DatasetManager.sortByProperty(expensesAsNumbers, 'amount', 'desc')
      setExpenses(sortByAmountDesc)
      setSortMethod(SortByTypes.amountDesc)
    }
    // Low -> High
    if (sortByName === SortByTypes.amountAsc) {
      const sortedByAmountAsc = DatasetManager.sortByProperty(expensesAsNumbers, 'amount', 'asc')
      setExpenses(sortedByAmountAsc)
      setSortMethod(SortByTypes.amountAsc)
    }
  }

  const handleCategorySelection = async (element) => {
    const allExpenses = await getSecuredExpenses()
    const category = element.target.textContent
    let expensesByCategory = allExpenses.filter((x) => x.category === category)
    if (element.target.classList.contains('active')) {
      expensesByCategory = allExpenses.filter((x) => x.category !== category)
    }
    DomManager.toggleActive(element.target)
    if (category === 'None') {
      setExpenses(allExpenses)
    } else {
      setExpenses(expensesByCategory)
    }
    setCategory(category)
  }

  const setDefaults = () => {
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
  }

  const deleteExpense = async () => {
    await DB.deleteById(`${DB.tables.expenses}/${currentUser?.key}`, activeExpense?.id)
  }

  useEffect(() => {
    if (activeExpense) {
      setDefaults()
    }
  }, [activeExpense])

  useEffect(() => {
    onTableChange().then((r) => r)
    setView('details')
    const catsAsArray = Object.keys(ExpenseCategories)
    catsAsArray.unshift('None')
    setCategoriesAsArray(catsAsArray)
  }, [])

  return (
    <>
      {/* NEW EXPENSE FORM */}
      <NewExpenseForm showCard={showNewExpenseCard} hideCard={() => setShowNewExpenseCard(false)} />

      {/* PAYMENT OPTIONS */}
      <PaymentOptions onClose={() => setShowPaymentOptionsCard(false)} showPaymentOptionsCard={showPaymentOptionsCard} />

      {/* DETAILS CARD */}
      <BottomCard
        submitText={'Update'}
        title={`${StringManager.uppercaseFirstLetterOfAllWords(activeExpense?.name || '')}`}
        submitIcon={<RxUpdate className={'fs-16'} />}
        onSubmit={update}
        className="expense-tracker form"
        wrapperClass="expense-tracker"
        onClose={() => {
          setActiveExpense(null)
          setShowDetails(false)
        }}
        onDelete={deleteExpense}
        showCard={showDetails}>
        <div id="details" className={`content ${activeExpense?.reason?.length > 20 ? 'long-text' : ''}`}>
          <ViewSelector labels={['Details', 'Edit']} updateState={(e) => setView(e.toLowerCase())} />

          {/* DETAILS */}
          {view === 'details' && (
            <>
              {/* AMOUNT */}
              <div className="flex">
                <b>
                  <GiMoneyStack />
                  Amount
                </b>
                <span>${activeExpense?.amount}</span>
              </div>

              {activeExpense?.repeating && (
                <>
                  {/* IS RECURRING */}
                  <div className="flex">
                    <b>Recurring</b> <span>{activeExpense?.repeating ? 'Yes' : 'No'}</span>
                  </div>

                  {/* RECURRING INTERVAL */}
                  <div className="flex">
                    <b>Recurring Frequency</b> <span>{StringManager.uppercaseFirstLetterOfAllWords(activeExpense?.repeatInterval)}</span>
                  </div>
                </>
              )}

              {/* CATEGORY */}
              {Manager.isValid(activeExpense?.category) && (
                <div className="flex">
                  <b>
                    <AiTwotoneTag />
                    Category
                  </b>
                  <span>{activeExpense?.category}</span>
                </div>
              )}

              {/* SENT TO */}
              <div className="flex">
                <b>
                  <PiUserCircleDuotone />
                  Sent to
                </b>
                <span>{StringManager.getFirstNameOnly(currentUser?.coparents?.filter((x) => x?.key === activeExpense?.payer?.key)[0]?.name)}</span>
              </div>

              {/* PAY TO */}
              <div className="flex">
                <b>
                  <PiUserCircleDuotone />
                  Pay to
                </b>
                <span> {StringManager.getFirstNameOnly(activeExpense?.recipientName)}</span>
              </div>

              {/* DUE DATE */}
              {activeExpense?.dueDate && activeExpense?.dueDate?.length > 0 && (
                <div className="flex">
                  <b>
                    <TbCalendarDollar />
                    Due Date
                  </b>
                  <span>
                    {DateManager.formatDate(activeExpense?.dueDate)} ({moment(moment(activeExpense?.dueDate).startOf('day')).fromNow().toString()})
                  </span>
                </div>
              )}

              {/* CHILDREN */}
              {Manager.isValid(activeExpense?.children) && (
                <div className="flex children">
                  <b>
                    <FaChildren />
                    Children
                  </b>
                  <div id="children">
                    {Manager.isValid(activeExpense?.children) &&
                      activeExpense?.children.map((child, index) => {
                        return <span key={index}>{child}</span>
                      })}
                  </div>
                </div>
              )}

              {/* DATE ADDED */}
              <div className="flex">
                <b>
                  <TbCalendarCheck />
                  Created on
                </b>
                <span>{moment(activeExpense?.dateAdded).format(DateFormats.monthDayYear)}</span>
              </div>

              {/* NOTES */}
              {Manager.isValid(activeExpense?.notes) && (
                <div className={`flex ${StringManager.addLongTextClass(activeExpense?.notes)}`}>
                  <b>
                    <CgDetailsMore />
                    Notes
                  </b>
                  <span className="notes">{activeExpense?.notes}</span>
                </div>
              )}

              {/* EXPENSE IMAGE */}
              {Manager.isValid(activeExpense?.imageUrl) && (
                <>
                  <Label text={'Expense Images'} />
                  <div id="expense-image">
                    <LightGallery elementClassNames={'light-gallery'} speed={500} selector={'#img-container'}>
                      <div
                        style={{ backgroundImage: `url(${activeExpense?.imageUrl})` }}
                        data-src={activeExpense?.imageUrl}
                        id="img-container"
                        className="flex"></div>
                    </LightGallery>
                  </div>
                </>
              )}
            </>
          )}

          {/* EDIT */}
          {view === 'edit' && (
            <>
              <InputWrapper
                isDebounced={false}
                inputType="input"
                labelText={'Name'}
                defaultValue={activeExpense?.name}
                onChange={(e) => setName(e.target.value)}
              />

              {/* AMOUNT */}
              <InputWrapper
                inputValueType="number"
                defaultValue={activeExpense?.amount}
                labelText={'Amount'}
                onChange={(e) => setAmount(e.target.value)}
              />

              {/* DUE DATE */}
              <InputWrapper inputType={'date'} labelText={'Due Date'}>
                <MobileDatePicker
                  value={moment(activeExpense?.dueDate)}
                  className="mt-0 w-100"
                  onAccept={(e) => setDueDate(moment(e).format('MM/DD/yyyy'))}
                />
              </InputWrapper>

              {/* CATEGORY */}
              <SelectDropdown labelClasses={'mb-5'} selectValue={category} onChange={(e) => setCategory(e.target.value)} labelText={'Category'}>
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
                inputType={'textarea'}
                labelText={'Notes'}></InputWrapper>

              {/* BUTTONS */}
              <div className="action-buttons">
                {activeExpense?.paidStatus === 'unpaid' && (
                  <button className="button green default" onClick={() => togglePaidStatus()}>
                    Mark Paid
                  </button>
                )}

                {activeExpense?.paidStatus === 'paid' && (
                  <button className="button red default" onClick={() => togglePaidStatus()}>
                    Mark Unpaid
                  </button>
                )}

                <button className="button default submit blue center" onClick={() => sendReminder(activeExpense)}>
                  Send Reminder
                </button>
              </div>
            </>
          )}
        </div>
      </BottomCard>

      {/* PAGE CONTAINER */}
      <div id="expense-tracker" className={`${theme} page-container form`}>
        {expenses.length === 0 && <NoDataFallbackText text={'There are currently no expenses'} />}
        <Fade direction={'up'} duration={1000} triggerOnce={true} className={'expense-tracker-fade-wrapper'}>
          <div className="flex" id="screen-title-wrapper">
            <p className="screen-title">Expense Tracker </p>
            {!DomManager.isMobile() && <AiOutlineFileAdd onClick={() => setShowNewExpenseCard(true)} id={'add-new-button'} />}
          </div>
          <p className={`${theme} text-screen-intro`}>
            Incorporate expenses that your co-parent is responsible for. Should a new expense arise that requires your payment, you will have the
            option to either approve or decline it.
          </p>
          <Spacer height={8} />

          {/* PAYMENT OPTIONS */}
          <p className="payment-options-link" onClick={() => setShowPaymentOptionsCard(true)}>
            Bill Payment & Money Transfer Options
          </p>
          <Spacer height={8} />

          {/* FILTERS */}
          <Accordion expanded={showFilters} id={'filters-accordion'} className={showFilters ? 'open' : 'closed'}>
            <AccordionSummary onClick={() => setShowFilters(!showFilters)} className={showFilters ? 'open' : 'closed'}>
              <p id="actions-button" className="expenses">
                Filters {showFilters && <FaMinus />}
                {!showFilters && <FaPlus />}
              </p>
            </AccordionSummary>
            <AccordionDetails>
              <div id="filters">
                <div className="filter-row">
                  <Label isBold={true} text={'Type'} classes="mb-5"></Label>
                  <div className="buttons flex type">
                    <button
                      className={`${expenseDateType === 'all' ? 'active' : ''} button default`}
                      onClick={() => handleExpenseTypeSelection('all')}>
                      All
                    </button>
                    <button
                      className={`${expenseDateType === 'single' ? 'active' : ''} button default`}
                      onClick={() => handleExpenseTypeSelection('single')}>
                      One-time
                    </button>
                    <button
                      className={`${expenseDateType === 'repeating' ? 'active' : ''} button default`}
                      onClick={() => handleExpenseTypeSelection('repeating')}>
                      Recurring
                    </button>
                  </div>
                </div>
                <div className="filter-row">
                  <Label isBold={true} text={'Payment Status'} classes="mb-5"></Label>
                  <div className="buttons type flex">
                    <button
                      className={paidStatus === 'all' ? 'active button default' : 'button default'}
                      onClick={() => handlePaidStatusSelection('all')}>
                      All
                    </button>
                    <button
                      className={paidStatus === 'unpaid' ? 'active button default' : 'button default'}
                      onClick={() => handlePaidStatusSelection('unpaid')}>
                      Unpaid
                    </button>
                    <button
                      className={paidStatus === 'paid' ? 'active button default' : 'button default'}
                      onClick={() => handlePaidStatusSelection('paid')}>
                      Paid
                    </button>
                  </div>
                </div>
                {categoriesInUse.length > 0 && <Label isBold={true} text={'Category'} classes="mb-5"></Label>}

                {/* CATEGORIES */}
                {Manager.isValid(categoriesInUse) && (
                  <div className="filter-row">
                    <div className="buttons flex category">
                      {categoriesAsArray.map((cat, index) => {
                        return (
                          <>
                            {categoriesInUse.includes(cat) && Manager.isValid(cat, true) && (
                              <button
                                key={index}
                                onClick={handleCategorySelection}
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
                <SelectDropdown wrapperClasses={'sorting-accordion'} selectValue={sortMethod} labelText={'Sort by'} onChange={handleSortBySelection}>
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
            {Manager.isValid(expenses) &&
              expenses.map((expense) => {
                let dueDate = moment(expense?.dueDate).format(DateFormats.readableMonthAndDay) ?? ''
                const readableDueDate = moment(moment(expense?.dueDate).startOf('day')).fromNow().toString()
                let overdue = Manager.contains(readableDueDate, 'ago')

                if (!Manager.isValid(dueDate)) {
                  dueDate = ''
                }
                return (
                  <div
                    key={expense?.id}
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
                        <p className="name row-title">{StringManager.uppercaseFirstLetterOfAllWords(expense?.name)}</p>
                        <span className={`${expense?.paidStatus} status`} id="request-status">
                          {StringManager.uppercaseFirstLetterOfAllWords(expense?.paidStatus.toUpperCase())}
                        </span>
                      </div>

                      <div className="flex" id="below-title">
                        {Manager.isValid(dueDate, true) && (
                          <>
                            <p className={`due-date ${overdue ? 'red' : ''}`}>
                              {DateManager.formatDate(expense?.dueDate)} ({moment(moment(expense?.dueDate).startOf('day')).fromNow().toString()})
                            </p>
                          </>
                        )}
                        {!Manager.isValid(dueDate, true) && (
                          <>
                            <p className="due-date">no due date</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </Fade>
      </div>
      {!showNewExpenseCard && !showPaymentOptionsCard && !showDetails && (
        <NavBar navbarClass={'child-info'}>
          <IoMdAdd onClick={() => setShowNewExpenseCard(true)} id={'add-new-button'} />
        </NavBar>
      )}
    </>
  )
}
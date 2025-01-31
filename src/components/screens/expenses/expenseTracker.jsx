import React, { useContext, useEffect, useState } from 'react'
import globalState from '/src/context.js'
import DB from '/src/database/DB'
import Manager from '/src/managers/manager'
import { child, getDatabase, onValue, ref } from 'firebase/database'
import NotificationManager from '/src/managers/notificationManager'
import MyConfetti from '/src/components/shared/myConfetti.js'
import DateManager from '/src/managers/dateManager.js'
import DateFormats from '/src/constants/dateFormats.js'
import moment from 'moment'
import BottomCard from '../../shared/bottomCard.jsx'
import { AiOutlineFileAdd } from 'react-icons/ai'
import { MdOutlineFilterAltOff } from 'react-icons/md'
import SecurityManager from '/src/managers/securityManager'
import NewExpenseForm from '../../forms/newExpenseForm.jsx'
import FirebaseStorage from '/src/database/firebaseStorage'
import LightGallery from 'lightgallery/react'
import MenuItem from '@mui/material/MenuItem'
import { MobileDatePicker } from '@mui/x-date-pickers-pro'
import { Fade } from 'react-awesome-reveal'
import { RxUpdate } from 'react-icons/rx'
import 'lightgallery/css/lightgallery.css'
import { BsFilter } from 'react-icons/bs'
import NavBar from '../../navBar.jsx'
import Label from '../../shared/label.jsx'
import ExpenseCategories from '/src/constants/expenseCategories'
import DatasetManager from '/src/managers/datasetManager'
import AlertManager from '/src/managers/alertManager'
import SelectDropdown from '../../shared/selectDropdown.jsx'
import InputWrapper from '../../shared/inputWrapper.jsx'
import DomManager from '/src/managers/domManager'
import NoDataFallbackText from '../../shared/noDataFallbackText.jsx'
import ActivityCategory from '/src/models/activityCategory'
import ObjectManager from '/src/managers/objectManager'
import ModelNames from '/src/models/modelNames'
import StringManager from '/src/managers/stringManager'
import ExpenseManager from '/src/managers/expenseManager.js'
import PaymentOptions from './paymentOptions.jsx'

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
  const [showFilterCard, setShowFilterCard] = useState(false)
  const [refreshKey, setRefreshKey] = useState(Manager.getUid())
  const [filterApplied, setFilterApplied] = useState(false)
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
    cleanedExpense.ownerPhone = activeExpense.ownerPhone
    await ExpenseManager.updateExpense(currentUser, cleanedExpense, cleanedExpense.id)
    await getSecuredExpenses()
    setActiveExpense(updatedExpense)
    setShowDetails(false)
  }

  const togglePaidStatus = async () => {
    const updatedStatus = (activeExpense.paidStatus = 'paid' ? 'unpaid' : 'paid')
    setPaidStatus(updatedStatus)
    activeExpense.paidStatus = updatedStatus
    await ExpenseManager.updateExpense(currentUser, activeExpense, activeExpense.id).then(async () => {
      NotificationManager.sendNotification(
        `Expense Paid`,
        `An expense has been PAID by ${currentUser?.name} \nExpense Name: ${activeExpense.name} \nYou can delete the expense now`,
        activeExpense?.ownerPhone,
        currentUser,
        activeExpense.category
      )
      setShowDetails(false)
      MyConfetti.fire()
    })
  }

  const deleteExpense = async (expense) => {
    let existing = await getSecuredExpenses()

    if (Manager.isValid(expense)) {
      existing = existing.filter((x) => x.name === expense?.name)

      // Delete in Firebase Storage
      if (Manager.isValid(expense) && Manager.isValid(expense?.imageName)) {
        await FirebaseStorage.delete(FirebaseStorage.directories.expenseImages, currentUser?.id, expense?.imageName, expense)
      }

      // Delete Multiple
      if (existing.length > 1) {
        AlertManager.confirmAlert('Are you sure you would like to delete ALL expenses with the same details?', "I'm Sure", true, async () => {
          let existingMultipleExpenses = existing.filter((x) => x.name === expense?.name && x.repeating === true)
          if (Manager.isValid(existingMultipleExpenses)) {
            await DB.deleteMultipleRows(DB.tables.expenses, existingMultipleExpenses)
            AlertManager.successAlert(`All ${expense?.name} expenses have been deleted`)
          }
        })
      }

      // Delete Single
      else {
        AlertManager.confirmAlert(`Are you sure you would like to delete the ${activeExpense?.name} expense?`, "I'm Sure", true, async () => {
          await DB.deleteById(`${DB.tables.expenses}/${currentUser.phone}`, expense?.id)
        })
      }
    }
  }

  const getSecuredExpenses = async () => {
    let allExpenses = await SecurityManager.getExpenses(currentUser)
    allExpenses = DatasetManager.getUniqueArray(allExpenses, 'id')
    const categories = allExpenses.map((x) => x.category).filter((x) => x !== '')
    setCategoriesInUse(categories)
    setFilterApplied(false)
    setShowFilterCard(false)
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

    onValue(child(dbRef, DB.tables.expenses), async (snapshot) => {
      await getSecuredExpenses()
    })
  }

  const handleExpenseTypeSelection = async (type) => {
    const allExpenses = await getSecuredExpenses()
    if (type === 'single') {
      setExpenses(allExpenses.filter((x) => x.repeating === false))
    }
    if (type === 'repeating') {
      setExpenses(allExpenses.filter((x) => x.repeating === true))
    }
    if (type === 'all') {
      setExpenses(allExpenses)
    }
    setShowFilterCard(false)
    setFilterApplied(true)
  }

  const handlePaidStatusSelection = async (status) => {
    const allExpenses = await getSecuredExpenses()
    setExpenses(allExpenses.filter((x) => x.paidStatus === status))
    setShowFilterCard(false)
    setFilterApplied(true)
  }

  const setToUnpaidAsDefault = async () => {
    const allExpenses = await getSecuredExpenses()
    setExpenses(allExpenses.filter((x) => x.paidStatus === 'unpaid'))
    setShowFilterCard(false)
    setFilterApplied(true)
  }

  const handleSortBySelection = (e) => {
    const sortByName = e.target.value
    if (sortByName === SortByTypes.recentlyAdded) {
      const sortedByDateAsc = DatasetManager.sortByProperty(expenses, 'dateAdded', 'asc', true)
      setExpenses(sortedByDateAsc)
      setFilterApplied(true)
    }
    if (sortByName === SortByTypes.nearestDueDate) {
      const sortedByDueDateDesc = DatasetManager.sortByProperty(expenses, 'dueDate', 'desc', true)
      setExpenses(sortedByDueDateDesc)
      setFilterApplied(true)
    }
    if (sortByName === SortByTypes.amountDesc) {
      const sortByAmountDesc = DatasetManager.sortByProperty(expenses, 'amount', 'desc')
      setExpenses(sortByAmountDesc)
      setFilterApplied(true)
    }
    if (sortByName === SortByTypes.amountAsc) {
      const sortedByAmountAsc = DatasetManager.sortByProperty(expenses, 'amount', 'asc')
      setExpenses(sortedByAmountAsc)
      setFilterApplied(true)
    }
    setShowFilterCard(false)
  }

  const handleCategorySelection = async (category) => {
    const expensesByCategory = expenses.filter((x) => x.category === category)
    setExpenses(expensesByCategory)
    setFilterApplied(true)
    setShowFilterCard(false)
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

  useEffect(() => {
    if (activeExpense) {
      setDefaults()
    }
  }, [activeExpense])

  useEffect(() => {
    onTableChange().then((r) => r)
    setView('details')
    setToUnpaidAsDefault('unpaid').then((r) => r)
  }, [])

  return (
    <>
      {/* NEW EXPENSE FORM */}
      <NewExpenseForm showCard={showNewExpenseCard} hideCard={(e) => setShowNewExpenseCard(false)} />

      {/* CARDS */}
      {/* FILTER CARD */}
      <BottomCard
        refreshKey={refreshKey}
        hasSubmitButton={false}
        className="filter-card"
        wrapperClass="filter-card"
        title={'Filter Expenses'}
        submitIcon={<BsFilter />}
        showCard={showFilterCard}
        onClose={() => {
          setShowFilterCard(false)
          setRefreshKey(Manager.getUid())
        }}
        submitText={'View Expenses'}>
        <>
          <div className="filter-row">
            <Label isBold={true} text={'Expense Type'} classes="mb-5"></Label>
            <div className="pills type">
              <div className="pill" onClick={() => handleExpenseTypeSelection('all')}>
                All
              </div>
              <div className="pill" onClick={() => handleExpenseTypeSelection('single')}>
                Single Date
              </div>
              <div className="pill" onClick={() => handleExpenseTypeSelection('repeating')}>
                Repeating
              </div>
            </div>
          </div>
          <div className="filter-row">
            <Label isBold={true} text={'Payment Status'} classes="mb-5"></Label>
            <div className="pills type">
              <div className="pill" onClick={() => handlePaidStatusSelection('unpaid')}>
                Unpaid
              </div>
              <div className="pill" onClick={() => handlePaidStatusSelection('paid')}>
                Paid
              </div>
            </div>
          </div>
          {categoriesInUse.length > 0 && <Label isBold={true} text={'Expense Category'} classes="mb-5"></Label>}
          <div className="filter-row">
            <div className="pills category">
              {ExpenseCategories.sort().map((cat, index) => {
                return (
                  <div key={index}>
                    {categoriesInUse.includes(cat) && (
                      <div onClick={() => handleCategorySelection(cat)} key={index} className="pill">
                        {cat}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          <SelectDropdown selectValue={SortByTypes.recentlyAdded} labelText={'Sort by'} onChange={handleSortBySelection}>
            <MenuItem value={SortByTypes.recentlyAdded}>{SortByTypes.recentlyAdded}</MenuItem>
            <MenuItem value={SortByTypes.nearestDueDate}>{SortByTypes.nearestDueDate}</MenuItem>
            <MenuItem value={SortByTypes.amountDesc}>{SortByTypes.amountDesc}</MenuItem>
            <MenuItem value={SortByTypes.amountAsc}>{SortByTypes.amountAsc}</MenuItem>
          </SelectDropdown>
        </>
      </BottomCard>

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
        showCard={showDetails}>
        <div id="details" className={`content ${activeExpense?.reason?.length > 20 ? 'long-text' : ''}`}>
          <div className="flex views-wrapper mb-15" id="views">
            <p onClick={() => setView('details')} className={view === 'details' ? 'view active' : 'view'}>
              Details
            </p>
            <p onClick={() => setView('edit')} className={view === 'edit' ? 'view active' : 'view'}>
              Edit
            </p>
          </div>

          {/* DETAILS */}
          {view === 'details' && (
            <>
              {/* NAME */}
              <div id="row" className="flex-start">
                <p id="title">
                  <b>Name</b>: {StringManager.uppercaseFirstLetterOfAllWords(activeExpense?.name)}
                </p>
              </div>
              {/* AMOUNT */}
              <div id="row" className="flex-start">
                <p id="title">
                  <b>Amount</b>: ${activeExpense?.amount}
                </p>
              </div>

              {/* CATEGORY */}
              {Manager.isValid(activeExpense?.category) && (
                <div id="row" className="flex-start">
                  <p id="category">
                    <b>Category</b>: {activeExpense?.category}
                  </p>
                </div>
              )}

              {/* SENT TO */}
              <div id="row" className="flex-start">
                <p id="title">
                  <b>Sent to: </b>
                  {StringManager.formatNameFirstNameOnly(currentUser?.coparents?.filter((x) => x?.phone === activeExpense?.payer?.phone)[0]?.name)}
                </p>
              </div>

              {/* PAY TO */}
              <div id="row" className="flex-start">
                <p id="title">
                  <b>Pay to: </b>
                  {StringManager.formatNameFirstNameOnly(activeExpense?.recipientName)}
                </p>
              </div>

              {/* DUE DATE */}
              {activeExpense?.dueDate && activeExpense?.dueDate?.length > 0 && (
                <div className="flex-start" id="row">
                  <p id="title">
                    <b>Due Date: </b>
                    <span>
                      {DateManager.formatDate(activeExpense?.dueDate)} ({moment(moment(activeExpense?.dueDate).startOf('day')).fromNow().toString()})
                    </span>
                  </p>
                </div>
              )}

              {/* CHILDREN */}
              {Manager.isValid(activeExpense?.children) && (
                <div className="flex wrap" id="row">
                  <p id="title" className="mr-auto">
                    <b>Children</b>
                  </p>
                  <p
                    className="w-100 mb-5"
                    dangerouslySetInnerHTML={{
                      __html: `${activeExpense?.children?.join('|').replaceAll('|', '<span class="divider">|</span>')}`,
                    }}></p>
                </div>
              )}

              {/* DATE ADDED */}
              <div id="row" className="flex-start flex">
                <p id="title">
                  <b>Created on: </b> <span>{moment(activeExpense?.dateAdded).format(DateFormats.monthDayYear)}</span>
                </p>
              </div>

              {/* NOTES */}
              {activeExpense?.notes && activeExpense?.notes?.length > 0 && (
                <div className="flex wrap" id="row">
                  <p id="title" className="mr-auto mb-5">
                    <b>Notes: </b>
                  </p>
                  <p className="notes neg-10">{activeExpense?.notes}</p>
                </div>
              )}

              {/* EXPENSE IMAGE */}
              {Manager.isValid(activeExpense?.imageUrl) && (
                <>
                  <Label text={'Expense Images'} classes="mb-5" />
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
              <SelectDropdown
                labelClasses={'mb-5'}
                wrapperClasses={'mb-15'}
                selectValue={category}
                onChange={(e) => setCategory(e.target.value)}
                labelText={'Category'}>
                {ExpenseCategories.map((cat, index) => {
                  return (
                    <MenuItem key={index} value={cat}>
                      {cat}
                    </MenuItem>
                  )
                })}
              </SelectDropdown>

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

                {/* DELETE */}
                {activeExpense?.ownerPhone === currentUser?.phone && (
                  <button
                    onClick={async () => {
                      await deleteExpense(activeExpense)
                      setShowDetails(false)
                    }}
                    className="default red"
                    id="delete-button">
                    Delete
                  </button>
                )}
                {/*{activeExpense?.paidStatus === 'unpaid' && activeExpense?.ownerPhone === currentUser?.phone && (*/}
                <button className="button default submit blue center" onClick={() => sendReminder(activeExpense)}>
                  Send Reminder
                </button>
                {/*)}*/}
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
            Add expenses to be paid by your co-parent. If a new expense is created for you to pay, you will have the opportunity to approve or reject
            it.
          </p>
          <p className="payment-options-link mt-10" onClick={() => setShowPaymentOptionsCard(true)}>
            Bill Payment & Money Transfer Options
          </p>

          {/* FILTER BUTTON */}
          {!filterApplied && expenses.length > 0 && (
            <button onClick={() => setShowFilterCard(true)} id="filter-button">
              Filter <BsFilter />
            </button>
          )}

          {/* CLEAR FILTER BUTTON */}
          {filterApplied && (
            <button onClick={async () => await getSecuredExpenses()} id="filter-button">
              Clear Filter <MdOutlineFilterAltOff />
            </button>
          )}

          {/* LOOP EXPENSES */}
          <div id="expenses-container">
            {Manager.isValid(expenses) &&
              expenses.map((expense, index) => {
                let dueDate = moment(expense?.dueDate).format(DateFormats.readableMonthAndDay) ?? ''
                if (!Manager.isValid(dueDate)) {
                  dueDate = ''
                }
                return (
                  <div
                    key={expense?.id}
                    className="mt-20"
                    id="row"
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
                        <p id="title" className="name row-title">
                          {StringManager.uppercaseFirstLetterOfAllWords(expense?.name)}
                        </p>
                        <span className={`${expense?.paidStatus} status`} id="request-status">
                          {StringManager.uppercaseFirstLetterOfAllWords(expense?.paidStatus.toUpperCase())}
                        </span>
                      </div>

                      <div className="flex" id="below-title">
                        {Manager.isValid(dueDate, true) && (
                          <>
                            <p className="due-date">
                              {DateManager.formatDate(expense?.dueDate)} ({moment(moment(expense?.dueDate).startOf('day')).fromNow().toString()})
                            </p>
                          </>
                        )}
                        {!Manager.isValid(dueDate, true) && (
                          <>
                            <p className="due-date">No due date</p>
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
      {!showNewExpenseCard && !showPaymentOptionsCard && !showFilterCard && !showDetails && (
        <NavBar navbarClass={'child-info'}>
          <AiOutlineFileAdd onClick={() => setShowNewExpenseCard(true)} id={'add-new-button'} />
        </NavBar>
      )}
    </>
  )
}
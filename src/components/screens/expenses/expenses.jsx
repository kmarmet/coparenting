import Accordion from "@mui/material/Accordion"
import AccordionDetails from "@mui/material/AccordionDetails"
import AccordionSummary from "@mui/material/AccordionSummary"
import moment from "moment"
import React, {useContext, useEffect, useRef, useState} from "react"
import {FaBookReader, FaClinicMedical, FaPlaneDeparture, FaTooth} from "react-icons/fa"
import {FaGasPump, FaHandsHoldingChild, FaMoneyCheckDollar} from "react-icons/fa6"
import {GiClothes} from "react-icons/gi"
import {HiGift} from "react-icons/hi"
import {MdLocalActivity, MdPets, MdSportsFootball} from "react-icons/md"
import ButtonThemes from "../../../constants/buttonThemes"
import DatetimeFormats from "../../../constants/datetimeFormats.js"
import ExpenseCategories from "../../../constants/expenseCategories"
import InputTypes from "../../../constants/inputTypes"
import ScreenNames from "../../../constants/screenNames"
import ActivityCategory from "../../../constants/updateCategory"
import globalState from "../../../context.js"
import DB from "../../../database/DB.js"
import useChildren from "../../../hooks/useChildren"
import useCurrentUser from "../../../hooks/useCurrentUser"
import useExpenses from "../../../hooks/useExpenses"
import DatasetManager from "../../../managers/datasetManager"
import DomManager from "../../../managers/domManager"
import DropdownManager from "../../../managers/dropdownManager"
import ExpenseManager from "../../../managers/expenseManager.js"
import Manager from "../../../managers/manager"
import ObjectManager from "../../../managers/objectManager"
import StringManager from "../../../managers/stringManager"
import UpdateManager from "../../../managers/updateManager"
import NewExpenseForm from "../../forms/newExpenseForm.jsx"
import NavBar from "../../navBar.jsx"
import AccordionTitle from "../../shared/accordionTitle"
import Button from "../../shared/button"
import CardButton from "../../shared/cardButton"
import DetailBlock from "../../shared/detailBlock"
import Form from "../../shared/form.jsx"
import InputField from "../../shared/inputField.jsx"
import Label from "../../shared/label.jsx"
import LazyImage from "../../shared/lazyImage"
import MyConfetti from "../../shared/myConfetti"
import Screen from "../../shared/screen"
import ScreenHeader from "../../shared/screenHeader"
import SelectDropdown from "../../shared/selectDropdown.jsx"
import Slideshow from "../../shared/slideshow"
import Spacer from "../../shared/spacer"
import ViewDropdown from "../../shared/viewDropdown.jsx"
import PaymentOptions from "./paymentOptions.jsx"

const ExpenseIcons = {
      Miscellaneous: <FaMoneyCheckDollar className={"category-icon misc"} />,
      Entertainment: <MdLocalActivity className={"category-icon entertainment"} />,
      Clothing: <GiClothes className={"category-icon clothing"} />,
      Medical: <FaClinicMedical className={"category-icon medical"} />,
      Childcare: <FaHandsHoldingChild className={"category-icon childcare"} />,
      Sports: <MdSportsFootball className={"category-icon sports"} />,
      Educational: <FaBookReader className={"category-icon educational"} />,
      Travel: <FaPlaneDeparture className={"category-icon travel"} />,
      Transportation: <FaGasPump className={"category-icon transportation"} />,
      Dental: <FaTooth className={"category-icon dental"} />,
      Gifting: <HiGift className={"category-icon gifting"} />,
      Pet: <MdPets className={"category-icon pet"} />,
}

export default function Expenses() {
      const {state, setState} = useContext(globalState)
      const {theme} = state

      // STATE
      const [showPaymentOptionsCard, setShowPaymentOptionsCard] = useState(false)
      const [showNewExpenseCard, setShowNewExpenseCard] = useState(false)
      const [activeExpense, setActiveExpense] = useState(null)
      const [showDetails, setShowDetails] = useState(false)
      const [view, setView] = useState({label: "Details", value: "details"})
      const [selectedChildren, setSelectedChildren] = useState([])
      const [selectedCategory, setSelectedCategory] = useState([])
      const [categoriesAsArray, setCategoriesAsArray] = useState([])
      const [expenseDateType, setExpenseDateType] = useState("all")
      const [showFilters, setShowFilters] = useState(false)
      const [sortedExpenses, setSortedExpenses] = useState([])
      const [showSlideshow, setShowSlideshow] = useState(false)

      // HOOKS
      const {expenses, expensesAreLoading} = useExpenses()
      const {children, childrenAreLoading} = useChildren()
      const {currentUser, currentUserIsLoading} = useCurrentUser()

      // DROPDOWN OPTIONS
      const [defaultSortByTypes, setDefaultSortByTypes] = useState(DropdownManager.GetDefault.ExpenseSortByTypes)
      const [selectedSortMethod, setSelectedSortMethod] = useState()

      const formRef = useRef(null)

      const Update = async () => {
            // Fill/overwrite
            let updatedExpense = ObjectManager.Merge(formRef.current, activeExpense, "deep")
            formRef.current.children = DropdownManager.MappedForDatabase.ChildrenFromArray(selectedChildren)
            const cleanedExpense = ObjectManager.CleanObject(updatedExpense)
            const updateIndex = DB.GetTableIndexById(expenses, activeExpense?.id)
            await ExpenseManager.UpdateExpense(currentUser?.key, updateIndex, cleanedExpense)
            setActiveExpense(updatedExpense)
            setShowDetails(false)
            setView({label: "Details", value: "details"})
            setState({...state, successAlertMessage: "Expense Updated"})
      }

      const TogglePaidStatus = async () => {
            const updatedStatus = activeExpense.paidStatus === "paid" ? "unpaid" : "paid"
            const updatedExpense = {
                  ...activeExpense,
                  paidStatus: updatedStatus,
            }

            const updateIndex = DB.GetTableIndexById(expenses, activeExpense?.id)
            await ExpenseManager.UpdateExpense(`${DB.tables.expenses}/${currentUser?.key}/${updateIndex}`, updatedExpense).then(async () => {
                  UpdateManager.SendUpdate(
                        `Expense Paid`,
                        `An expense has been marked ${updatedStatus.toUpperCase()} by ${currentUser?.name} \nExpense Name: ${activeExpense?.name}`,
                        // payer?.key,
                        currentUser,
                        activeExpense.category
                  )
                  setShowDetails(false)
                  if (updatedStatus === "paid") {
                        MyConfetti.fire()
                  }
            })
      }

      const SendReminder = async (expense) => {
            const message = `This is a reminder to pay the ${expense?.name} expense?.  ${
                  Manager.IsValid(expense?.dueDate) ? "Due date is: " + expense?.dueDate : ""
            }`
            UpdateManager.SendUpdate(`Expense Reminder`, message, expense?.payer?.phone, currentUser, ActivityCategory.expenses)
            setState({...state, successAlertMessage: "Reminder Sent"})
            setShowDetails(false)
      }

      const HandleExpenseTypeSelection = async (element, selectionType) => {
            DomManager.ToggleActive(element.target, ".filter-button.expense-type", true)
            if (selectionType === "single") {
                  setSortedExpenses(expenses.filter((x) => x.isRecurring === false))
                  setExpenseDateType("single")
            }
            if (selectionType === "recurring") {
                  setSortedExpenses(expenses.filter((x) => x.isRecurring === true))
                  setExpenseDateType("recurring")
            }
            if (selectionType === "all") {
                  setSortedExpenses(expenses)
                  setExpenseDateType("all")
            }
      }

      const HandlePaidStatusSelection = async (element, status) => {
            DomManager.ToggleActive(element.target, ".filter-button.paid-status", true)
            if (status === "all") {
                  setSortedExpenses(expenses)
                  // setPaidStatus('all')
            } else {
                  // setPaidStatus(status)
                  setSortedExpenses(expenses.filter((x) => x.paidStatus === status))
            }
      }

      const HandleSortBySelection = () => {
            const sortByMethodName = selectedSortMethod?.value
            const expensesAsNumbers = expenses.map((expense) => ({
                  ...expense,
                  amount: parseInt(expense.amount ?? 0, 10),
            }))

            if (sortByMethodName === "recentlyAdded") {
                  setSortedExpenses(DatasetManager.SortExpenses(expenses, "date", "desc"))
            }

            if (sortByMethodName === "nearestDueDate") {
                  const sortedByNearestDueDate = DatasetManager.sortByProperty(expenses, "dueDate", "asc")
                  setSortedExpenses(sortedByNearestDueDate)
            }

            if (sortByMethodName === "oldestCreationDate") {
                  const sortedByDateAsc = DatasetManager.sortByProperty(expenses, "creationDate", "asc", true)
                  setSortedExpenses(sortedByDateAsc)
            }

            if (sortByMethodName === "nearestDueDate") {
                  const sortedByDueDateDesc = DatasetManager.sortByProperty(expenses, "dueDate", "desc", true)
                  setSortedExpenses(sortedByDueDateDesc)
            }
            // High -> Low
            if (sortByMethodName === "amountDesc") {
                  const sortByAmountDesc = DatasetManager.sortByProperty(expensesAsNumbers, "amount", "desc")
                  setSortedExpenses(sortByAmountDesc)
            }

            // Low -> High
            if (sortByMethodName === "amountAsc") {
                  const sortedByAmountAsc = DatasetManager.sortByProperty(expensesAsNumbers, "amount", "asc")
                  setSortedExpenses(sortedByAmountAsc)
            }

            // Name Ascending
            if (sortByMethodName === "nameAsc") {
                  const sortedByNameAsc = DatasetManager.sortByProperty(expenses, "name", "asc")
                  setSortedExpenses(sortedByNameAsc)
            }

            // Name Descending
            if (sortByMethodName === "nameDesc") {
                  const sortedByNameDesc = DatasetManager.sortByProperty(expenses, "name", "desc")
                  setSortedExpenses(sortedByNameDesc)
            }
      }

      useEffect(() => {
            if (Manager.IsValid(expenses)) {
                  HandleSortBySelection()
            }
      }, [selectedSortMethod, expenses])

      const DeleteExpense = async () => await DB.deleteById(`${DB.tables.expenses}/${currentUser?.key}`, activeExpense?.id)

      const GetRecurringDateText = (expense) => {
            switch (expense?.recurringFrequency) {
                  case "daily":
                        return "Every Day"
                  case "weekly":
                        return `Every Week on the ${moment(expense?.dueDate).format("Do")}`
                  case "monthly":
                        return `Every Month on the ${moment(expense?.dueDate).format("Do")}`
                  case "biweekly":
                        return `Every Two Weeks on the ${moment(expense?.dueDate).format("Do")}`
            }
      }

      const GetShortRecurringDateText = () => {
            switch (activeExpense?.recurringFrequency) {
                  case "daily":
                        return "Every Day"
                  case "weekly":
                        return `Every Week`
                  case "monthly":
                        return `Every Month`
                  case "biweekly":
                        return `Every 2 Weeks`
            }
      }

      // Set Categories
      useEffect(() => {
            const catsAsArray = Object.keys(ExpenseCategories)
            catsAsArray.unshift("None")
            setCategoriesAsArray(catsAsArray)
      }, [])

      // Set Sorted Expenses
      useEffect(() => {
            if (Manager.IsValid(expenses)) {
                  setSortedExpenses(expenses)
            }
      }, [expenses])

      useEffect(() => {
            if (view) {
                  console.log(view)
            }
      }, [view])

      return (
            <Screen
                  stopLoadingBool={!currentUserIsLoading && !expensesAreLoading && !childrenAreLoading}
                  activeScreen={ScreenNames.expenses}
                  loadingByDefault={true}>
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
                        submitText={"Update"}
                        title={`${StringManager.UppercaseFirstLetterOfAllWords(activeExpense?.name)}`}
                        onSubmit={Update}
                        hasSubmitButton={view?.label === "Edit"}
                        className="expense-tracker"
                        wrapperClass="expense-tracker"
                        onClose={() => {
                              setActiveExpense(null)
                              setShowDetails(false)
                              setView({label: "Details", value: "details"})
                        }}
                        onDelete={DeleteExpense}
                        viewDropdown={<ViewDropdown dropdownPlaceholder="Details" selectedView={view} onSelect={setView} />}
                        extraButtons={[
                              <>
                                    {activeExpense?.paidStatus === "unpaid" && (
                                          <CardButton
                                                text={"Mark as <br/> Paid"}
                                                buttonTheme={ButtonThemes.green}
                                                classes="multi-line default"
                                                onClick={TogglePaidStatus}
                                          />
                                    )}

                                    {activeExpense?.paidStatus === "paid" && (
                                          <CardButton text={"Mark Unpaid"} classes="default" onClick={TogglePaidStatus} />
                                    )}

                                    <CardButton text={"Send <br/> Reminder"} classes="multi-line" onClick={SendReminder} />
                              </>,
                        ]}
                        showCard={showDetails}>
                        <div className={`details content ${activeExpense?.reason?.length > 20 ? "long-text" : ""}`}>
                              <Spacer height={5} />
                              {/* DETAILS */}
                              {view?.label === "Details" && (
                                    <>
                                          <div className="blocks">
                                                {/*  Amount */}
                                                <DetailBlock
                                                      title={"Amount"}
                                                      text={`$${activeExpense?.amount}`}
                                                      valueToValidate={activeExpense?.amount}
                                                />

                                                {/*  Date Added */}
                                                <DetailBlock
                                                      title={"Date Added"}
                                                      text={moment(activeExpense?.creationDate).format(
                                                            DatetimeFormats.readableMonthAndDayWithDayDigitOnly
                                                      )}
                                                      valueToValidate={moment(activeExpense?.creationDate).format(
                                                            DatetimeFormats.readableMonthAndDayWithDayDigitOnly
                                                      )}
                                                />

                                                {/*  Due Date */}
                                                {!activeExpense?.isRecurring && (
                                                      <DetailBlock
                                                            title={"Due Date"}
                                                            text={moment(activeExpense?.dueDate).format(
                                                                  DatetimeFormats.readableMonthAndDayWithDayDigitOnly
                                                            )}
                                                            valueToValidate={moment(
                                                                  activeExpense?.dueDate,
                                                                  DatetimeFormats.readableMonthAndDayWithDayDigitOnly
                                                            )}
                                                      />
                                                )}

                                                {/*  Due Date - Recurring */}
                                                {activeExpense?.isRecurring && (
                                                      <DetailBlock
                                                            title={"Due Date"}
                                                            text={moment(activeExpense?.dueDate).format(
                                                                  DatetimeFormats.readableMonthAndDayWithDayDigitOnly
                                                            )}
                                                            valueToValidate={moment(activeExpense?.dueDate).format(
                                                                  DatetimeFormats.readableMonthAndDayWithDayDigitOnly
                                                            )}
                                                      />
                                                )}

                                                {/*  Frequency */}
                                                <DetailBlock
                                                      title={"Frequency"}
                                                      text={GetShortRecurringDateText(activeExpense)}
                                                      valueToValidate={activeExpense?.recurringFrequency}
                                                />

                                                {/*  Time Remaining */}
                                                {!activeExpense?.isRecurring && (
                                                      <DetailBlock
                                                            classes={
                                                                  moment(moment(activeExpense?.dueDate).startOf("day"))
                                                                        .fromNow()
                                                                        .toString()
                                                                        .includes("ago")
                                                                        ? "red"
                                                                        : "green"
                                                            }
                                                            title={"Time Remaining"}
                                                            text={`${moment(moment(activeExpense?.dueDate).startOf("day")).fromNow().toString()}`}
                                                            valueToValidate={moment(moment(activeExpense?.dueDate).startOf("day"))
                                                                  .fromNow()
                                                                  .toString()}
                                                      />
                                                )}

                                                {/*  Pay To */}
                                                <DetailBlock
                                                      title={"Pay To"}
                                                      text={StringManager.GetFirstNameOnly(currentUser?.name)}
                                                      valueToValidate={StringManager.GetFirstNameOnly(currentUser?.name)}
                                                />

                                                {/*  Payer */}
                                                <DetailBlock
                                                      title={"Payer"}
                                                      text={StringManager.GetFirstNameOnly(formRef?.current?.payer?.name)}
                                                      valueToValidate={StringManager.GetFirstNameOnly(formRef?.current?.payer?.name)}
                                                />

                                                {/*  Recurring */}
                                                <DetailBlock
                                                      title={"Recurring"}
                                                      text={activeExpense?.isRecurring ? "Yes" : "No"}
                                                      valueToValidate={activeExpense?.isRecurring}
                                                />

                                                {/*  Category */}
                                                <DetailBlock
                                                      title={"Category"}
                                                      text={activeExpense?.category}
                                                      valueToValidate={activeExpense?.category}
                                                />

                                                {/*  Recurring Frequency */}
                                                <DetailBlock
                                                      title={"Recurring Frequency"}
                                                      text={StringManager.UppercaseFirstLetterOfAllWords(activeExpense?.recurringFrequency)}
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
                                                <DetailBlock
                                                      title={"Notes"}
                                                      text={activeExpense?.notes}
                                                      isFullWidth={true}
                                                      valueToValidate={activeExpense?.notes}
                                                />

                                                {/* EXPENSE IMAGE */}
                                                {Manager.IsValid(activeExpense?.imageUrl) && (
                                                      <div id="expense-image" className="block">
                                                            <LazyImage
                                                                  src={activeExpense?.imageUrl}
                                                                  classes="flex"
                                                                  onClick={() => {
                                                                        setShowDetails(false)
                                                                        setShowSlideshow(true)
                                                                  }}
                                                            />
                                                            <p className="block-text">Image</p>
                                                      </div>
                                                )}

                                                <Spacer height={5} />
                                          </div>
                                    </>
                              )}

                              {/* EDIT */}
                              {view?.label === "Edit" && (
                                    <>
                                          <InputField
                                                inputType={InputTypes.text}
                                                placeholder={"Name"}
                                                defaultValue={activeExpense?.name}
                                                onChange={(e) => (formRef.current.name = e.target.value)}
                                          />

                                          <Spacer height={5} />

                                          {/* AMOUNT */}
                                          <InputField
                                                placeholder={"Amount"}
                                                defaultValue={activeExpense?.amount}
                                                inputType={InputTypes.number}
                                                onChange={(e) => (formRef.current.amount = e.target.value)}
                                          />

                                          <Spacer height={5} />

                                          {/* DUE DATE */}
                                          <InputField
                                                defaultValue={moment(activeExpense?.dueDate)}
                                                inputType={"date"}
                                                placeholder={"Due Date"}
                                                uidClass="expense-tracker-due-date"
                                                onDateOrTimeSelection={(e) => (formRef.current.dueDate = moment(e).format("MM/DD/yyyy"))}
                                          />

                                          <Spacer height={5} />

                                          {/* CATEGORY */}
                                          <SelectDropdown
                                                value={DropdownManager.GetSelected.ExpenseCategory(activeExpense?.category)}
                                                onSelect={(e) => (formRef.current.category = e.value)}
                                                options={DropdownManager.GetDefault.ExpenseCategories()}
                                                placeholder={"Category"}
                                          />

                                          <Spacer height={5} />

                                          {/* INCLUDING WHICH CHILDREN */}
                                          <SelectDropdown
                                                options={DropdownManager.GetDefault.Children(children)}
                                                value={selectedChildren}
                                                placeholder={"Select Children to Include"}
                                                onSelect={(e) => setSelectedChildren(DropdownManager.GetSelected.Children(e.map((x) => x.label)))}
                                                isMultiple={true}
                                          />

                                          <Spacer height={5} />

                                          {/* NOTES */}
                                          <InputField
                                                defaultValue={activeExpense?.notes}
                                                onChange={(e) => (formRef.current.notes = e.target.value)}
                                                inputType={InputTypes.textarea}
                                                placeholder={"Notes"}
                                          />
                                    </>
                              )}
                        </div>
                  </Form>

                  {/* PAGE CONTAINER */}
                  <div id="expense-tracker" className={`${theme} page-container`}>
                        <ScreenHeader
                              title={"Expenses"}
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
                              <Accordion
                                    expanded={showFilters}
                                    id={"expenses-accordion"}
                                    className={`${showFilters ? "open" : "closed"} ${theme} white-bg`}>
                                    <AccordionSummary onClick={() => setShowFilters(!showFilters)} className={showFilters ? "open" : "closed"}>
                                          <AccordionTitle
                                                titleText={"Filters"}
                                                toggleState={showFilters}
                                                onClick={() => setShowFilters(!showFilters)}
                                          />
                                    </AccordionSummary>
                                    <AccordionDetails>
                                          <div id="filters">
                                                <div className="filter-row">
                                                      <Label text={"Type"} classes="toggle always-show" />
                                                      <div className="buttons flex type">
                                                            <Button
                                                                  classes={`filter-button expense-type`}
                                                                  onClick={(e) => HandleExpenseTypeSelection(e, "all")}
                                                                  text={"All"}
                                                            />
                                                            <Button
                                                                  theme={ButtonThemes.blend}
                                                                  text={"One-time"}
                                                                  classes={`filter-button expense-type`}
                                                                  onClick={(e) => HandleExpenseTypeSelection(e, "single")}
                                                            />
                                                            <Button
                                                                  text={"Recurring"}
                                                                  classes={`filter-button expense-type`}
                                                                  onClick={(e) => HandleExpenseTypeSelection(e, "recurring")}
                                                            />
                                                      </div>
                                                </div>
                                                <div className="filter-row">
                                                      <Label isBold={true} text={"Payment Status"} classes="mb-5 toggle always-show" />
                                                      <div className="buttons type flex">
                                                            <Button
                                                                  classes={"button filter-button paid-status"}
                                                                  onClick={(e) => HandlePaidStatusSelection(e, "all")}
                                                                  text={"All"}
                                                            />
                                                            <Button
                                                                  classes={"button filter-button paid-status"}
                                                                  onClick={(e) => HandlePaidStatusSelection(e, "unpaid")}
                                                                  text={"Unpaid"}
                                                            />
                                                            <Button
                                                                  classes={"button filter-button paid-status"}
                                                                  onClick={(e) => HandlePaidStatusSelection(e, "paid")}
                                                                  text={"Paid"}
                                                            />
                                                      </div>
                                                </div>

                                                {/*{categoriesInUse.length > 0 && <Label isBold={true} text={'Category'} classes="mb-5" />}*/}

                                                {/*/!* CATEGORIES *!/*/}
                                                {/*{Manager.IsValid(categoriesInUse) && (*/}
                                                {/*  <div className="filter-row">*/}
                                                {/*    <div className="buttons category">*/}
                                                {/*      {categoriesAsArray.map((cat, index) => {*/}
                                                {/*        return (*/}
                                                {/*          <>*/}
                                                {/*            {categoriesInUse.includes(cat) && Manager.IsValid(cat, true) && (*/}
                                                {/*              <button*/}
                                                {/*                key={index}*/}
                                                {/*                onClick={HandleCategorySelection}*/}
                                                {/*                className={category === cat ? 'button default active' : 'button default'}>*/}
                                                {/*                {cat}*/}
                                                {/*              </button>*/}
                                                {/*            )}*/}
                                                {/*          </>*/}
                                                {/*        )*/}
                                                {/*      })}*/}
                                                {/*    </div>*/}
                                                {/*  </div>*/}
                                                {/*)}*/}
                                                <Label text={""} classes="sorting" />
                                                <SelectDropdown
                                                      wrapperClasses={"sorting-accordion white-bg"}
                                                      placeholder={"Sort by"}
                                                      options={defaultSortByTypes}
                                                      onSelect={setSelectedSortMethod}
                                                />
                                          </div>
                                    </AccordionDetails>
                              </Accordion>

                              {/* LOOP EXPENSES */}
                              <div id="expenses-container">
                                    {Manager.IsValid(sortedExpenses) &&
                                          sortedExpenses.map((expense, index) => {
                                                let dueDate =
                                                      moment(expense?.dueDate).format(DatetimeFormats.readableMonthAndDayWithDayDigitOnly) ?? ""
                                                const readableDueDate = moment(moment(expense?.dueDate).startOf("day")).fromNow().toString()
                                                const isPastDue = readableDueDate.toString().includes("ago")
                                                const dueInADay = readableDueDate.toString().includes("in a day")
                                                const dueInHours = readableDueDate.toString().includes("hours")

                                                if (!Manager.IsValid(dueDate)) {
                                                      dueDate = ""
                                                }
                                                return (
                                                      <div
                                                            key={Manager.GetUid()}
                                                            style={DomManager.AnimateDelayStyle(index, 0.1)}
                                                            className={`row ${DomManager.Animate.FadeInUp(sortedExpenses)}`}
                                                            onClick={() => {
                                                                  formRef.current = expense
                                                                  setActiveExpense(expense)
                                                                  setShowDetails(true)
                                                            }}>
                                                            {/* EXPENSE ICON */}
                                                            {Manager.IsValid(expense?.category) && ExpenseIcons[expense?.category]}
                                                            {!Manager.IsValid(expense?.category) && ExpenseIcons?.Miscellaneous}

                                                            <div className="expenses content" data-expense-id={expense?.id}>
                                                                  {/* EXPENSE NAME */}
                                                                  <div className="content-columns">
                                                                        <div className={"left"}>
                                                                              <p
                                                                                    className={`name ${!Manager.IsValid(expense?.category) ? "no-category lightest" : ""}`}>
                                                                                    {StringManager.UppercaseFirstLetterOfAllWords(expense?.name)}
                                                                              </p>
                                                                              {/* DATE */}
                                                                              <div className="flex below-title">
                                                                                    <p className={"category lightest"}>
                                                                                          {expense?.category ? expense?.category : "Miscellaneous"}
                                                                                    </p>
                                                                                    {/*{Manager.IsValid(dueDate, true) && (*/}
                                                                                    {/*  <>*/}
                                                                                    {/*    {!expense?.isRecurring && (*/}
                                                                                    {/*      <p className={`due-date`}>*/}
                                                                                    {/*        {moment(expense?.dueDate).format(DatetimeFormats.readableMonthAndDay)} ({readableDueDate.toString()})*/}
                                                                                    {/*      </p>*/}
                                                                                    {/*    )}*/}
                                                                                    {/*    {expense?.isRecurring && <p className={`due-date`}>{GetRecurringDateText(expense)}</p>}*/}
                                                                                    {/*  </>*/}
                                                                                    {/*)}*/}
                                                                                    {/*{!Manager.IsValid(dueDate, true) && <p className="due-date no-due-date">no due date</p>}*/}
                                                                              </div>
                                                                        </div>

                                                                        <div className={"right"}>
                                                                              <p className="amount">${expense?.amount}</p>
                                                                              <p
                                                                                    className={`due-date${isPastDue ? " past-due" : ""}${dueInADay || dueInHours ? " soon" : ""}`}>
                                                                                    Due: {dueDate}
                                                                              </p>
                                                                              {/*{expense?.isRecurring && <MdOutlineEventRepeat />}*/}
                                                                              {/*{Manager.IsValid(expense?.imageName) && <BsCardImage />}*/}
                                                                        </div>

                                                                        {/*  STATUS */}
                                                                        {/*{!expense?.isRecurring && (*/}
                                                                        {/*  <>*/}
                                                                        {/*    {!dueInADay && !dueInHours && (*/}
                                                                        {/*      <span className={`${expense?.paidStatus} status`} id="request-status">*/}
                                                                        {/*        {isPastDue ? 'PAST DUE' : StringManager.UppercaseFirstLetterOfAllWords(expense?.paidStatus.toUpperCase())}*/}
                                                                        {/*      </span>*/}
                                                                        {/*    )}*/}
                                                                        {/*    {dueInADay ||*/}
                                                                        {/*      (dueInHours && (*/}
                                                                        {/*        <span className={`status soon`} id="request-status">*/}
                                                                        {/*          Soon*/}
                                                                        {/*        </span>*/}
                                                                        {/*      ))}*/}
                                                                        {/*  </>*/}
                                                                        {/*)}*/}
                                                                  </div>
                                                            </div>
                                                      </div>
                                                )
                                          })}
                              </div>
                        </div>
                  </div>

                  <NavBar navbarClass={"expenses"} />

                  {expenses?.length === 0 && <p className={"no-data-fallback-text"}>No Expenses</p>}
            </Screen>
      )
}
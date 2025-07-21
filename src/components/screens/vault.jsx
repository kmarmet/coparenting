// Path: src\components\screens\archives.jsx
import moment from "moment"
import React, {useContext, useEffect, useState} from "react"
import {PiVaultFill} from "react-icons/pi"
import {RiFileExcel2Fill} from "react-icons/ri"
import DatetimeFormats from "../../constants/datetimeFormats.coffee"
import ScreenNames from "../../constants/screenNames"
import globalState from "../../context"
import useChatMessages from "../../hooks/useChatMessages"
import useChats from "../../hooks/useChats"
import useCoParents from "../../hooks/useCoParents"
import useCurrentUser from "../../hooks/useCurrentUser"
import useExpenses from "../../hooks/useExpenses"
import DatasetManager from "../../managers/datasetManager.coffee"
import DomManager from "../../managers/domManager"
import DropdownManager from "../../managers/dropdownManager"
import Manager from "../../managers/manager"
import StringManager from "../../managers/stringManager.coffee"
import VaultManager from "../../managers/vaultManager"
import NavBar from "../navBar"
import Screen from "../shared/screen"
import ScreenHeader from "../shared/screenHeader"
import SelectDropdown from "../shared/selectDropdown"
import Spacer from "../shared/spacer"

export default function Vault() {
      const {state, setState} = useContext(globalState)
      const {theme} = state

      // State
      const [recordType, setRecordType] = useState("Expenses")
      const [sortMethod, setSortMethod] = useState({label: "Recently Added", value: "recentlyAdded"})
      const [payer, setPayer] = useState([])
      const [sortedExpenses, setSortedExpenses] = useState([])
      const [selectedChatId, setSelectedChatId] = useState()

      // Hooks
      const {coParents, coParentsAreLoading} = useCoParents()
      const {expenses, expensesAreLoading} = useExpenses()
      const {currentUser, currentUserIsLoading} = useCurrentUser()
      const {chats, chatsAreLoading} = useChats()
      const {chatMessages, chatMessagesAreLoading} = useChatMessages(selectedChatId)

      // Dropdown State
      const [defaultNamedChatOptions, setDefaultNamedChatOptions] = useState([])
      const [selectedNamedChatOptions, setSelectedNamedChatOptions] = useState(null)

      const GetExpenses = async () => {
            if (Manager.IsValid(expenses)) {
                  const expensesByPayer = expenses?.filter((x) => x?.payer?.key === payer?.key)

                  if (Manager.IsValid(expensesByPayer)) {
                        const _sortedExpenses = DatasetManager.SortByDate(expensesByPayer, "desc", "creationDate")
                        setSortedExpenses(_sortedExpenses)
                  } else {
                        const _sortedExpenses = DatasetManager.SortByDate(expenses, "desc", "creationDate")

                        setSortedExpenses(_sortedExpenses)
                  }
            }
      }

      const HandleSortBySelection = (e) => {
            const expenseTypes = DatasetManager.ConvertToObject(ExpenseSortByTypes)
            const label = StringManager.RemoveLeadingAndTrailingSpaces(e.label)
            setSortMethod(e)

            // if (label === expenseTypes.recentlyAdded) {
            //       setSortedExpenses(DatasetManager?.SortByDate(expenses, "desc", "creationDate"))
            // }
            //
            // // Amount: High -> Low
            // if (label === expenseTypes.amountDesc) {
            //       const sortByAmountDesc = DatasetManager.SortExpenses(expenses, "int", "desc")
            //       setSortedExpenses(sortByAmountDesc)
            // }
            //
            // // Amount: Low -> High
            // if (label === expenseTypes.amountAsc) {
            //       const sortedByAmountAsc = DatasetManager.SortExpenses(expenses, "int", "asc")
            //       setSortedExpenses(sortedByAmountAsc)
            // }
            //
            // // Name Ascending
            // if (label === expenseTypes.nameAsc) {
            //       const sortedByNameAsc = DatasetManager.SortExpenses(expenses, "string", "asc")
            //       setSortedExpenses(sortedByNameAsc)
            // }
            //
            // // Name Descending
            // if (label === expenseTypes.nameDesc) {
            //       const sortedByNameDesc = DatasetManager.SortExpenses(expenses, "string", "desc")
            //       setSortedExpenses(sortedByNameDesc)
            // }
            //
            // if (label === expenseTypes.nearestDueDate) {
            //       const sortedByNearestDueDate = DatasetManager.SortExpenses(expenses, "string", "asc")
            //       setSortedExpenses(sortedByNearestDueDate)
            // }
      }

      const ExportExpenses = () => VaultManager.createCSV(expenses, "Peaceful_coParenting_Exported_Expenses", "expenses")

      const ExportChat = () => VaultManager.createCSV(chatMessages, "Peaceful_coParenting_Exported_Chat", "chat")

      const DefineChatCheckboxes = () => {
            let activeChats = []
            if (Manager.IsValid(chats)) {
                  for (const chat of chats) {
                        let coParent = chat.members.find((x) => x.key !== currentUser?.key)
                        activeChats.push({
                              label: StringManager.GetFirstNameOnly(coParent?.name),
                              value: chat.id,
                        })
                  }
                  setDefaultNamedChatOptions(activeChats)
            }
      }

      const GetDefaultPayerOptions = () => {
            let defaultPayerOptions = []
            if (Manager.IsValid(expenses)) {
                  for (const expense of expenses) {
                        defaultPayerOptions.push({
                              label: StringManager.GetFirstNameOnly(expense?.payer?.name),
                              value: expense?.payer?.key,
                        })
                  }
                  return DatasetManager.getUniqueByPropValue(defaultPayerOptions, "label")
            }

            return defaultPayerOptions
      }

      useEffect(() => {
            GetExpenses().then((r) => r)
      }, [payer])

      useEffect(() => {
            if (Manager.IsValid(expenses) && Manager.IsValid(coParents)) {
                  GetExpenses().then((r) => r)
                  DomManager.ToggleAnimation("add", "record-row", DomManager.AnimateClasses.names.fadeInRight, 85)
            }
            if (Manager.IsValid(coParents)) {
                  DefineChatCheckboxes()
            }
      }, [expenses, coParents])

      useEffect(() => {
            setSelectedChatId(selectedNamedChatOptions?.value)
      }, [selectedNamedChatOptions])

      return (
            <Screen
                  stopLoadingBool={!currentUserIsLoading && !coParentsAreLoading && !chatsAreLoading}
                  activeScreen={ScreenNames.vault}
                  loadingByDefault={true}>
                  <div id="records-wrapper" className={`${theme} page-container`}>
                        <ScreenHeader
                              titleIcon={<PiVaultFill />}
                              title={"The Vault"}
                              screenName={ScreenNames.vault}
                              screenDescription="Inside the vault&#39;s storage you can access and export apiResults generated by you or your co-parent. This information can be utilized for personal reference, legal proceedings, or any other purpose you may require."
                        />

                        <Spacer height={10} />
                        <div className="screen-content">
                              {/* EXPORT TEXT */}
                              <p className={"export-text"}>
                                    Data can be exported as an Excel spreadsheet format, with options to apply filters or sorting as needed.
                              </p>
                              <Spacer height={10} />

                              {/* RECORD TYPE */}
                              <SelectDropdown
                                    value={[{label: "Expenses", value: "Expenses"}]}
                                    wrapperClasses={"white-bg"}
                                    options={DropdownManager.GetDefault.ValueRecordTypes()}
                                    placeholder={"Select Record Type"}
                                    onSelect={(e) => setRecordType(e.label)}
                              />
                              <Spacer height={5} />

                              {/* PAYERS */}
                              {recordType === "Expenses" && (
                                    <SelectDropdown
                                          wrapperClasses={"white-bg"}
                                          options={GetDefaultPayerOptions()}
                                          placeholder={"Select Payer"}
                                          onSelect={(e) => setPayer(e)}
                                    />
                              )}

                              <Spacer height={5} />

                              {/* SORTING */}
                              {recordType === "Expenses" && Manager.IsValid(expenses) && (
                                    <div id="sorting-wrapper">
                                          <SelectDropdown
                                                wrapperClasses={"white-bg"}
                                                placeholder={"Select Sorting Method"}
                                                options={DropdownManager.GetDefault.ExpenseSortByTypes()}
                                                value={sortMethod}
                                                onSelect={(e) => HandleSortBySelection(e)}
                                          />
                                    </div>
                              )}

                              {/* EXPENSES EXPORT BUTTON */}
                              {recordType === "Expenses" && Manager.IsValid(expenses) && (
                                    <p id="export-button" onClick={ExportExpenses}>
                                          Export <RiFileExcel2Fill />
                                    </p>
                              )}

                              {/* CHATS EXPORT BUTTON */}
                              {recordType === "Chats" && Manager.IsValid(selectedNamedChatOptions) && (
                                    <p id="export-button" onClick={ExportChat}>
                                          Export <RiFileExcel2Fill />
                                    </p>
                              )}

                              {/* EXPENSES */}
                              {Manager.IsValid(sortedExpenses) &&
                                    recordType === "Expenses" &&
                                    sortedExpenses.map((expense, index) => {
                                          return (
                                                <div
                                                      key={index}
                                                      className={`${recordType.toLowerCase()} ${DomManager.Animate.FadeInUp(expense, ".record-row")} record-row`}
                                                      style={DomManager.AnimateDelayStyle(index)}>
                                                      <p className="title">
                                                            {StringManager.FormatTitle(expense?.name)}
                                                            <span className={`amount ${expense?.paidStatus === "paid" ? "paid" : "unpaid"}`}>
                                                                  ${expense?.amount}
                                                            </span>
                                                      </p>
                                                      <p className="date">
                                                            Date Added{" "}
                                                            <span>{moment(expense?.creationDate).format(DatetimeFormats.monthDayYear)}</span>
                                                      </p>
                                                </div>
                                          )
                                    })}

                              {/* CHATS */}
                              {recordType === "Chats" && (
                                    <SelectDropdown
                                          options={defaultNamedChatOptions}
                                          wrapperClasses={"white-bg"}
                                          placeholder={"Select Chat to Export"}
                                          onSelect={setSelectedNamedChatOptions}
                                    />
                              )}
                        </div>
                  </div>
                  <NavBar navbarClass={"activity no-Add-new-button"}></NavBar>
            </Screen>
      )
}
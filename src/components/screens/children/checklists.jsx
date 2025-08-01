import React, {useContext, useEffect, useState} from "react"
import {MdOutlineChecklist} from "react-icons/md"
import {PiListChecksFill, PiTrashSimpleFill} from "react-icons/pi"
import globalState from "../../../context"
import DB from "../../../database/DB"
import useCurrentUser from "../../../hooks/useCurrentUser"
import DomManager from "../../../managers/domManager"
import Manager from "../../../managers/manager"
import StringManager from "../../../managers/stringManager"
import Checklist from "../../../models/new/checklist.js"
// Path: src\components\screens\childInfo\checklists.jsx
import Form from "../../shared/form"
import Spacer from "../../shared/spacer"
import ViewDropdown from "../../shared/viewDropdown"

export default function Checklists({showCard, hideCard}) {
      const {state, setState} = useContext(globalState)
      const {activeChild} = state
      const [checkboxTextList, setCheckboxTextList] = useState([])
      const [view, setView] = useState("from")
      const [checklist, setChecklist] = useState(null)
      const [activeItems, setActiveItems] = useState([])
      const [destinationLabels, setDestinationLabels] = useState(["From Co-Parent", "To Co-Parent"])
      const {currentUser, currentUserIsLoading} = useCurrentUser()

      const AddToDb = async () => {
            const childKey = DB.GetChildIndex(currentUser?.children, activeChild?.id)

            const newChecklist = new Checklist()
            newChecklist.items = checkboxTextList
            newChecklist.ownerKey = currentUser?.key
            newChecklist.fromOrTo = view
            await DB.Add(`${DB.tables.users}/${currentUser?.key}/children/${childKey}/checklists`, newChecklist)
            await DB.GetTableData(`${DB.tables.users}/${currentUser?.key}/children/${childKey}`)
      }

      const toggleActive = (el) => {
            const filtered = activeItems.filter((x) => x !== el.target.textContent.toLowerCase())
            if (el.target.classList.contains("active")) {
                  setActiveItems(filtered)
            } else {
                  setActiveItems([...activeItems, el.target.textContent.toLowerCase()])
            }
            DomManager.ToggleActive(el.target)
      }

      const deleteItem = async (el) => {
            const element = el.currentTarget
            const checklistItem = element.previousElementSibling
            const childKey = DB.GetChildIndex(currentUser?.children, activeChild?.id)
            const updatePath = `${DB.tables.users}/${currentUser?.key}/children/${childKey}/checklists`
            const childChecklists = activeChild?.checklists

            if (Manager.IsValid(childChecklists)) {
                  const activeChecklist = childChecklists.filter((x) => x.fromOrTo === view)[0]

                  if (activeChecklist) {
                        const items = activeChecklist.items
                        const text = checklistItem.textContent.toLowerCase()
                        const filteredText = items.filter((x) => x.toLowerCase() !== text.toLowerCase())
                        const newChecklist = {...activeChecklist}
                        newChecklist.items = filteredText
                        const updated = {...activeChecklist, ...newChecklist}

                        if (filteredText.length === 0) {
                              const deleteIndex = DB.GetIndexById(activeChild?.checklists, activeChecklist?.id)
                              const deletePath = `${DB.tables.users}/${currentUser?.key}/children/${childKey}/checklists/${deleteIndex}`
                              await DB.Delete(deletePath)
                              hideCard()
                        } else {
                              await DB.updateEntireRecord(`${updatePath}`, updated, activeChecklist.id)
                        }
                  }
                  checklistItem.remove()
                  element.remove()
            }
      }

      const setActiveChildChecklist = async () => {
            if (Manager.IsValid(activeChild)) {
                  const childKey = DB.GetChildIndex(currentUser?.children, activeChild?.id)
                  const updatedActiveChild = await DB.GetTableData(`${DB.tables.users}/${currentUser?.key}/children/${childKey}`)
                  const checklists = updatedActiveChild?.checklists?.map((x) => x)
                  if (Manager.IsValid(checklists)) {
                        const fromDest = checklists?.find((x) => x?.fromOrTo === "from")
                        const toDest = checklists?.find((x) => x?.fromOrTo === "to")
                        const checklistDestinations = checklists?.map((x) => x?.fromOrTo)
                        let labels = []

                        if (Manager.IsValid(checklistDestinations)) {
                              for (let destination of checklistDestinations) {
                                    if (destination === "from") {
                                          labels.push("From Co-Parent")
                                    }
                                    if (destination === "to") {
                                          labels.push("To Co-Parent")
                                    }
                              }
                              setDestinationLabels(labels)
                        }
                        // Set view based on which checklist is present
                        if (Manager.IsValid(toDest) && !Manager.IsValid(fromDest)) {
                              setView("to")
                        }
                        if (Manager.IsValid(fromDest) && !Manager.IsValid(toDest)) {
                              setView("from")
                        }

                        // Set checklist based on view
                        if (Manager.IsValid(checklists)) {
                              const checklist = checklists.find((x) => x?.fromOrTo === view)
                              if (checklist) {
                                    setCheckboxTextList(checklist.items)
                                    setChecklist(checklist)
                              } else {
                                    setCheckboxTextList([])
                                    setChecklist(null)
                              }
                        }
                  }
            }
      }
      useEffect(() => {
            setActiveChildChecklist().then((r) => r)
      }, [view])

      useEffect(() => {
            if (showCard) {
                  setActiveChildChecklist().then((r) => r)
            }
      }, [showCard])

      return (
            <Form
                  onSubmit={AddToDb}
                  wrapperClass="child-info-checklists"
                  submitIcon={<MdOutlineChecklist />}
                  showCard={showCard}
                  hasSubmitButton={false}
                  title={"Checklists"}
                  viewDropdown={
                        <ViewDropdown
                              dropdownPlaceholder="To Co-Parent's Home"
                              selectedView={view}
                              onSelect={(view) => {
                                    setView(view)
                              }}
                        />
                  }
                  subtitle={`Review handoff checklists to guarantee that all items are accounted for during transitions to or from a co-parent's home.  ${DomManager.tapOrClick(
                        true
                  )} each item to mark completed. ${DomManager.tapOrClick(true)} the delete icon to remove the item from the checklist permanently.`}
                  onClose={hideCard}>
                  <Spacer height={5} />

                  {Manager.IsValid(checklist) &&
                        Manager.IsValid(checklist?.items) &&
                        checklist?.items?.map((item, index) => {
                              return (
                                    <div key={index} id="checklist-item-row" className="flex">
                                          <p onClick={toggleActive} className="row">
                                                {activeItems.includes(item.toLowerCase()) && <PiListChecksFill />}
                                                {StringManager.UppercaseFirstLetterOfAllWords(item)}
                                          </p>
                                          <PiTrashSimpleFill className={"close-x"} onClick={deleteItem} />
                                    </div>
                              )
                        })}
            </Form>
      )
}
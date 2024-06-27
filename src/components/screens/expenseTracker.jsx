import React, { useState, useEffect, useContext, useRef } from "react";
import NewExpenseForm from "../newExpenseForm.jsx";
import db from "../../db.js";
import Modal from "../shared/modal.jsx";
import util from "../../util.js";
import globalState from "../../context.js";
import screenNames from "../../constants/screenNames.js";
import { getDatabase, ref, set, get, child, onValue } from "firebase/database";
import SmsUtil from "../../smsUtil.js";
import FirebaseStorage from "../../firebaseStorage.js";

export default function ExpenseTracker() {
  const [expenseLog, setExpenseLog] = useState([]);
  const { state, setState } = useContext(globalState);
  const { viewExpenseForm, currentScreenTitle, currentUser } = state;
  const [currentExpense, setCurrentExpense] = useState(null);
  const [openDetailsId, setOpenDetailsId] = useState("");
  const imgRef = useRef();
  const showExpenseForm = () => {
    document.getElementById("add-expense-form").classList.add("show");
    setState({
      ...state,
      viewExpenseForm: true,
      currentScreenTitle: "Add New Expense",
    });
  };

  const viewExpenseDetails = (expense) => {
    const img = document.querySelector(`[data-img-id='${expense.id}']`);
    const expenseCard = document.querySelector(`div[data-expense-id='${expense.id}']`);

    expenseCard.scrollIntoView({
      behavior: "smooth",
      block: "start",
      inline: "nearest",
    });
    const expenseDetails = document.getElementById(expense.id);
    FirebaseStorage.getImage(FirebaseStorage.directories.expenseImages, expense.id, img);
    setCurrentExpense(expense);

    if (openDetailsId !== expense.id) {
      const expenses = document.querySelectorAll(".details");
      expenses.forEach((el) => {
        el.classList.remove("show");
      });
      const topDetails = document.querySelectorAll(".expense");
      topDetails.forEach((el) => {
        el.classList.remove("open");
      });
      expenseCard.classList.add("open");
      expenseDetails.classList.add("show");
      setOpenDetailsId(expense.id);
    }
  };

  const markAsPaid = () => {
    let arr = [];
    expenseLog.forEach((expense) => {
      let thisExpense = expense;
      if (thisExpense.id === currentExpense.id) {
        currentExpense.paidStatus = "paid";
        expense = currentExpense;
      }
      arr.push(expense);
    });
    setExpenseLog(arr);
    db.updateRecord(db.tables.expenseTracker, currentExpense, "paidStatus", "paid").then(() => {
      const smsMessage = SmsUtil.getMarkAsPaidTemplate(util.getName(currentUser.name), currentExpense.name);
      SmsUtil.send(currentExpense.phone, smsMessage);
    });
  };

  const closeDetails = (e) => {
    const expenseId = e.target.getAttribute("data-expense-id");
    const detailsElement = document.getElementById(expenseId);
    const topExpenseContainer = document.querySelector(`div[data-expense-id='${expenseId}']`);
    detailsElement.classList.remove("show");
    topExpenseContainer.classList.remove("show");
    topExpenseContainer.classList.remove("open");
    setOpenDetailsId("");
  };

  const expandImage = (e) => {
    const thisImg = e.target;
    const src = thisImg.getAttribute("src");
    document.querySelector(".image-modal").classList.add("show");
    document.querySelector(".image-modal img").setAttribute("src", src);
  };

  const deleteExpense = (expense, el) => {
    const expenseContainer = el.currentTarget.closest(".content");
    util.scrollToTopOfPage();
    const img = expenseContainer.querySelector("[data-img-id]");
    const imgId = img.dataset.imgId;
    db.delete(db.tables.expenseTracker, expense.id);
    FirebaseStorage.delete(FirebaseStorage.directories.expenseImages, imgId);
  };

  const updateLogFromDb = async (expensesFromDb) => {
    let allExpenses = await db.getFilteredRecords(expensesFromDb, currentUser).then((x) => x);
    allExpenses = util.getUniqueArrayOfObjects(allExpenses, "id");

    setExpenseLog(allExpenses);
    setState({
      ...state,
      currentScreen: screenNames.expenseTracker,
      currentScreenTitle: "Expense Tracker",
      menuIsOpen: false,
    });
  };

  useEffect(() => {
    console.log("HERE");
    util.scrollToTopOfPage();
    setState({ ...state, currentScreenTitle: "Expense Tracker" });
    const dbRef = ref(getDatabase());

    onValue(child(dbRef, db.tables.expenseTracker), (snapshot) => {
      const tableData = snapshot.val();
      updateLogFromDb(tableData);
    });
  }, []);

  useEffect(() => {
    if (currentExpense) {
      const img = document.querySelector(`[data-img-id='${currentExpense.id}']`);
      FirebaseStorage.getImage(FirebaseStorage.directories.expenseImages, currentExpense.id, img);
    }
  }, [currentExpense]);

  const chooseImage = () => {
    const img = document.querySelector("#upload-input").files[0];
    const blobText = FirebaseStorage.imageToBlob(img);
    if (blobText && img) {
      blobText.then((base64Image) => {
        // setExpenseImage(img);
      });
    }
  };

  // const uploadImage = (uid) => FirebaseStorage.upload(FirebaseStorage.directories.expenseImages, uid, expenseImage);

  return (
    <div id="expense-tracker" className="page-container">
      <Modal
        elClass="image-modal"
        onClose={(e) => {
          document.querySelector(".image-modal").classList.remove("show");
        }}>
        <img src="" />
      </Modal>

      {!viewExpenseForm && (
        <div className="action-pills add">
          <div className="flex" onClick={showExpenseForm}>
            <span className="material-icons-round">add_circle</span>
          </div>
        </div>
      )}
      {!viewExpenseForm && expenseLog.length > 0 && <p className="instructions">Click an expense to view details or take action</p>}
      {!viewExpenseForm && expenseLog.length === 0 && <p className="instructions center">There are currently no expenses</p>}
      <NewExpenseForm />
      <div id="expenses-container">
        <div id="expenses-card-container">
          {expenseLog &&
            expenseLog.length > 0 &&
            expenseLog.map((expense, index) => {
              if (Array.isArray(expense.child)) {
                expense.child = util.uppercaseFirstLetterInWord(expense.child).join(", ");
              }
              return (
                <div key={index} data-expense-id={expense.id} className="expense" onClick={() => viewExpenseDetails(expense)}>
                  <div className="content">
                    <div className="flex top-details">
                      <div className="amount-block">${expense.amount}</div>
                      <div className="top-details-text">
                        <div className="flex">
                          <p className="name">{expense.name}</p>
                          <p className={`status subtext ${expense.paidStatus === undefined || expense.paidStatus === null || expense.paidStatus === "unpaid" ? "unpaid" : "paid"}`}>{expense.paidStatus === undefined || expense.paidStatus === null || expense.paidStatus === "unpaid" ? "UNPAID" : "PAID"}</p>
                        </div>
                        <p className="recipient subtext">Pay to: {util.getName(expense.payee).charAt(0).toUpperCase() + expense.payee.slice(1)}</p>
                      </div>
                    </div>
                    <div id={expense.id} className="flex details">
                      <div className="text">
                        {expense && expense.children && expense.children.length > 0 && (
                          <div className="group">
                            <p>
                              <b>Relevant Children </b>
                            </p>
                            <p>{expense.children.join(", ")}</p>
                          </div>
                        )}
                        <div className="group">
                          <p>
                            <b>Due Date </b>
                          </p>
                          <p>{expense.dueDate && expense.dueDate.length > 0 && expense.dueDate.toLowerCase() !== "invalid date" ? expense.dueDate : "N/A"}</p>
                        </div>
                        <div className="group">
                          <p>
                            <b>Date Added </b>
                          </p>
                          <p>{util.formatDate(expense.dateAdded)}</p>
                        </div>
                        {expense.notes && expense.notes.length > 0 && (
                          <div className="group notes">
                            <p>
                              <b>Notes</b>
                            </p>
                            <p>{expense.notes}</p>
                          </div>
                        )}
                      </div>
                      <div id="img-container" className="flex">
                        <img src={require("../../img/fallback-image.png")} data-img-id={expense.id} id="expense-image" onClick={(e) => expandImage(e)} />
                        <p id="img-expand-text">tap image to expand</p>
                      </div>
                      <div id="button-group" className="flex">
                        <button onClick={markAsPaid} className="mark-as-paid">
                          Mark Paid
                        </button>
                        <button onClick={(e) => deleteExpense(expense, e)} className="delete">
                          Delete
                        </button>
                        <button data-expense-id={expense.id} onClick={(e) => closeDetails(e)} className="close">
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

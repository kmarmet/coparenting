import React, { useState, useEffect, useContext } from "react";
import db from "../../db.js";
import Modal from "../shared/modal.jsx";
import util from "../../util.js";
import globalState from "../../context.js";
import "rsuite/dist/rsuite.min.css";
import moment from "moment";
import NewSwapRequest from "../newSwapRequest.jsx";
import screenNames from "../../constants/screenNames.js";
import { getDatabase, ref, set, get, child, onValue } from "firebase/database";
import swapLengths from "../../constants/swapLengths.js";
import SmsUtil from "../../smsUtil.js";

export default function SwapRequests() {
  const { state, setState } = useContext(globalState);
  const [existingRequests, setExistingRequests] = useState([]);
  const { viewSwapRequestForm, currentUser } = state;
  const [rejectionReason, setRejectionReason] = useState("");

  const updateRequestsFromDb = async (requestsFromDb) => {
    let allRequests = await db.getFilteredRecords(requestsFromDb, currentUser).then((x) => x);

    setExistingRequests(allRequests);
    setState({
      ...state,
      currentScreen: screenNames.swapRequests,
      menuIsOpen: false,
    });
  };

  const reject = (request) => {
    db.delete(db.tables.swapRequests, request.id).finally(() => {
      db.getCoparent(request.recipient).then((cop) => {
        if (request.length === swapLengths.multiple) {
          SmsUtil.send(cop.phone, SmsUtil.getSwapRequestDecisionTemplate(`${request.fromDate}`.replace(",", " to "), "rejected", rejectionReason, currentUser.name));
        } else if (request.length === swapLengths.intra) {
          SmsUtil.send(cop.phone, SmsUtil.getSwapRequestDecisionTemplate(`(${request.fromHour}) to ${request.toDate} (${request.toHour})`, "rejected", rejectionReason, currentUser.name));
        } else {
          SmsUtil.send(cop.phone, SmsUtil.getSwapRequestDecisionTemplate(`${request.fromDate}`, "rejected", rejectionReason, currentUser.name));
        }
      });
    });
  };

  const approve = (request) => {
    db.delete(db.tables.swapRequests, request.id);
    db.getCoparent(request.recipient).then((cop) => {
      if (request.length === swapLengths.multiple) {
        SmsUtil.send(cop.phone, SmsUtil.getSwapRequestDecisionTemplate(`${request.fromDate}`.replace(",", " to "), "approved", null, currentUser.name));
      } else if (request.length === swapLengths.intra) {
        SmsUtil.send(cop.phone, SmsUtil.getSwapRequestDecisionTemplate(`(${request.fromHour}) to ${request.toDate} (${request.toHour})`, "approved", null, currentUser.name));
      } else {
        SmsUtil.send(cop.phone, SmsUtil.getSwapRequestDecisionTemplate(`${request.fromDate}`, "approved", null, currentUser.name));
      }
    });
  };

  const close = (e) => {
    e.stopPropagation();
    const requestContainer = e.currentTarget.parentNode.parentNode;
    requestContainer.classList.remove("open");
  };

  useEffect(() => {
    util.scrollToTopOfPage();
    const dbRef = ref(getDatabase());

    onValue(child(dbRef, db.tables.swapRequests), async (snapshot) => {
      const tableData = snapshot.val();
      updateRequestsFromDb(await db.getFilteredRecords(tableData, currentUser).then((x) => x));
    });

    setState({
      ...state,
      currentScreen: screenNames.swapRequests,
      currentScreenTitle: "Swap Requests",
      menuIsOpen: false,
    });
  }, []);

  return (
    <div id="swap-requests" className="page-container">
      {!viewSwapRequestForm && (
        <>
          {" "}
          <div className="action-pills">
            <div className="flex" onClick={() => setState({ ...state, viewSwapRequestForm: true })}>
              <p>New Request</p>
              <ion-icon name="add-outline"></ion-icon>
            </div>
          </div>
          <p className="instructions">Click request to view details/take action</p>
        </>
      )}
      {viewSwapRequestForm && <NewSwapRequest />}

      {!viewSwapRequestForm && (
        <div id="swap-requests-container">
          {existingRequests &&
            existingRequests.length > 0 &&
            existingRequests.map((request, index) => {
              return (
                <div
                  key={index}
                  data-request-id={request.id}
                  className="request"
                  onClick={(e) => {
                    const clickedEl = e.currentTarget;
                    let allRequestEls = document.querySelectorAll(".request");
                    allRequestEls.forEach((x) => x.classList.remove("open"));
                    if (!clickedEl.classList.contains("button")) {
                      clickedEl.classList.add("open");
                    }
                  }}>
                  <div className="name-container">
                    <ion-icon name="calendar-outline"></ion-icon>
                    <p className="name">
                      {request.length === swapLengths.single && util.formatDate(request.fromDate)}
                      {request.length === swapLengths.intra && (
                        <>
                          <span>{util.formatDate(request.fromDate)}</span>
                          <span>
                            {request.fromHour.replace(" ", "")} - {request.toHour.replace(" ", "")}
                          </span>
                        </>
                      )}
                      {request.length === swapLengths.multiple && `${util.formatDate(request.fromDate)} - ${util.formatDate(request.toDate)}`}
                    </p>
                  </div>
                  <div className={`content ${request.reason.length > 20 ? "long-text" : ""}`}>
                    <div className="flex top-details">
                      <p>
                        <b>Request Sent to&nbsp;</b>
                      </p>
                      <p>{util.getName(request.forCoparent).includes(util.getName(currentUser.name)) ? "Me" : request.forCoparent}</p>
                      {request.reason && request.reason.length > 0 && (
                        <p className={`reason`}>
                          <b>Reason</b>
                        </p>
                      )}
                      <p className="reason-text">{request.reason}</p>
                    </div>
                    <button className="button close" onClick={(e) => close(e)}>
                      Close
                    </button>
                  </div>
                  {util.getName(request.forCoparent).includes(util.getName(currentUser.name)) && (
                    <>
                      <div id="button-group" className="flex">
                        <div className="flex approve green">
                          <button
                            onClick={(e) => {
                              approve(request);
                            }}
                            className="approve">
                            Approve
                          </button>
                        </div>
                        <div className="flex reject">
                          <button
                            data-request-id={request.id}
                            onClick={(e) => {
                              reject(request);
                            }}
                            className="reject red">
                            Reject
                          </button>
                        </div>
                      </div>
                      <textarea placeholder="Rejection reason" onChange={(e) => setRejectionReason(e.target.value)}></textarea>
                    </>
                  )}
                </div>
              );
            })}
        </div>
      )}

      <Modal
        elClass="swap-requests-modal"
        onClose={() => {
          document.querySelector(".swap-requests-modal").classList.remove("show");
        }}></Modal>
    </div>
  );
}

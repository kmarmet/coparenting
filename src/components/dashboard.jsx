import React, { useState, useEffect, useContext } from "react";
import Menu from "./menu";
import globalState from "../context";
import ExpenseTracker from "./screens/expenseTracker";
import screenNames from "../constants/screenNames";
import SwapRequest from "./screens/swapRequests";

export default function Dashboard(props) {
  const { state, setState } = useContext(globalState);
  const { menuIsOpen, currentScreen } = state;
  const [screenToUse, setScreenToUse] = useState(screenNames.expenseTracker);

  return (
    <div id="dashboard-container">
      {screenToUse === screenNames.swapRequests && <SwapRequest />}
      {screenToUse === screenNames.expenseTracker && <ExpenseTracker />}
    </div>
  );
}

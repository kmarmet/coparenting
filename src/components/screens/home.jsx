// Path: src\components\screens\help.jsx
import React, {useContext, useEffect, useState} from 'react'
import {LiaFileInvoiceDollarSolid} from 'react-icons/lia'
import {LuBellRing} from 'react-icons/lu'
import {PiSwap} from 'react-icons/pi'
import {TbTransferIn} from 'react-icons/tb'
import ScreenNames from '../../constants/screenNames'
import globalState from '../../context'
import useCurrentUser from '../../hooks/useCurrentUser'
import useExpenses from '../../hooks/useExpenses'
import useNotifications from '../../hooks/useNotifications'
import useSwapRequests from '../../hooks/useSwapRequests'
import useTransferRequests from '../../hooks/useTransferRequests'
import NavBar from '../navBar'
import Spacer from '../shared/spacer'

export default function Home() {
  const {state, setState} = useContext(globalState)
  const {theme, currentScreen, refreshKey} = state

  // HOOKS
  const {currentUser, currentUserIsLoading} = useCurrentUser()
  const {expenses, expensesAreLoading} = useExpenses()
  const {notifications, notificationsAreLoading} = useNotifications()
  const {swapRequests, swapRequestsAreLoading} = useSwapRequests()
  const {transferRequests, transferRequestsAreLoading} = useTransferRequests()

  // STATE
  const [unpaidExpensesCount, setUnpaidExpensesCount] = useState(0)
  const [notificationCount, setNotificationCount] = useState(0)
  const [pendingSwapRequestCount, setPendingSwapRequestCount] = useState(0)
  const [declinedSwapRequestCount, setDeclinedSwapRequestCount] = useState(0)
  const [pendingTransferRequestCount, setPendingTransferRequestCount] = useState(0)
  const [declinedTransferRequestCount, setDeclinedTransferRequestCount] = useState(0)

  const SetValues = () => {
    // EXPENSES
    if (!expensesAreLoading && !currentUserIsLoading) {
      const allUnpaid = expenses?.filter((x) => x?.paidStatus === 'unpaid' && x?.payer?.key === currentUser?.key)
      setUnpaidExpensesCount(allUnpaid.length)
    }

    // SWAP REQUESTS - PENDING
    if (!swapRequestsAreLoading && !currentUserIsLoading) {
      const allPending = swapRequests?.filter((x) => x?.status === 'pending' && x?.ownerKey === currentUser?.key)
      setPendingSwapRequestCount(allPending?.length)
    }

    // SWAP REQUESTS - DECLINED
    if (!swapRequestsAreLoading && !currentUserIsLoading) {
      const allDeclined = swapRequests?.filter((x) => x?.status === 'declined' && x?.ownerKey === currentUser?.key)
      setDeclinedSwapRequestCount(allDeclined?.length ?? 0)
    }

    // TRANSFER REQUESTS - PENDING
    if (!transferRequestsAreLoading && !currentUserIsLoading) {
      const allPending = transferRequests?.filter((x) => x?.status === 'pending' && x?.ownerKey === currentUser?.key)
      setPendingTransferRequestCount(allPending?.length ?? 0)
    }

    // TRANSFER REQUESTS - DECLINED
    if (!transferRequestsAreLoading && !currentUserIsLoading) {
      const allDeclined = transferRequests?.filter((x) => x?.status === 'declined' && x?.ownerKey === currentUser?.key)
      setDeclinedTransferRequestCount(allDeclined?.length)
    }

    // NOTIFICATIONS
    if (!notificationsAreLoading && !currentUserIsLoading) {
      setNotificationCount(notifications?.length)
    }
  }

  useEffect(() => {
    if (!notificationsAreLoading && !expensesAreLoading && !swapRequestsAreLoading && !transferRequestsAreLoading && !currentUserIsLoading) {
      SetValues()
    }
  }, [notifications, expenses, swapRequests, transferRequests])

  return (
    <>
      <div id="home-wrapper" className={`${theme} page-container`}>
        <p className="screen-title">Home</p>
        <Spacer height={10} />

        {/* SECTIONS */}
        <div className="sections">
          {/* NOTIFICATIONS */}
          <div
            className={`${notificationCount > 0 ? 'red' : 'green'} section notifications`}
            onClick={() => setState({...state, currentScreen: ScreenNames.notifications})}>
            <p className="section-title">Notifications</p>
            <p className="number"> {notificationCount}</p>
            <p className="bottom-text">Unread</p>
            <LuBellRing />
          </div>

          {/* EXPENSES */}
          <div
            className={`${unpaidExpensesCount > 0 ? 'red' : 'green'} section expenses`}
            onClick={() => setState({...state, currentScreen: ScreenNames.expenseTracker})}>
            <p className="section-title">Expenses</p>
            <p className="number">{unpaidExpensesCount || 0}</p>
            <p className="bottom-text">Unpaid</p>
            <LiaFileInvoiceDollarSolid />
          </div>

          {/* SWAP REQUESTS - PENDING*/}
          <div
            className={`${pendingSwapRequestCount > 0 ? 'pending' : 'green'} section swap-requests`}
            onClick={() => setState({...state, currentScreen: ScreenNames.swapRequests})}>
            <p className="section-title">Swap Requests</p>
            <p className="number">{pendingSwapRequestCount || 0}</p>
            <p className="bottom-text">pending</p>
            <PiSwap />
          </div>

          {/* SWAP REQUESTS - DECLINED*/}
          <div
            className={`${declinedSwapRequestCount > 0 ? 'red' : 'green'} section swap-requests`}
            onClick={() => setState({...state, currentScreen: ScreenNames.swapRequests})}>
            <p className="section-title">Swap Requests</p>
            <p className="number">{declinedSwapRequestCount || 0}</p>
            <p className="bottom-text">declined</p>
            <PiSwap />
          </div>

          {/* TRANSFER REQUESTS - PENDING*/}
          <div
            className={`${pendingTransferRequestCount > 0 ? 'pending' : 'green'} section transfer-requests`}
            onClick={() => setState({...state, currentScreen: ScreenNames.transferRequests})}>
            <p className="section-title">Transfer Requests</p>
            <p className="number">{pendingTransferRequestCount || 0}</p>
            <p className="bottom-text">pending</p>
            <TbTransferIn />
          </div>

          {/* TRANSFER REQUESTS - DECLINED*/}
          <div
            className={`${declinedTransferRequestCount > 0 ? 'red' : 'green'} section transfer-requests`}
            onClick={() => setState({...state, currentScreen: ScreenNames.transferRequests})}>
            <p className="section-title">Transfer Requests</p>
            <p className="number">{declinedTransferRequestCount || 0}</p>
            <p className="bottom-text">declined</p>
            <TbTransferIn />
          </div>
        </div>
      </div>
      <NavBar navbarClass={'no-Add-new-button'}></NavBar>
    </>
  )
}
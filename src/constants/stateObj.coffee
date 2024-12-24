import ScreenNames from "./screenNames"
import ActivitySet from "../models/activitySet"

StateObj =
  activeInfoChild: null
  activityCount: 0,
  currentScreen: ScreenNames.home
  currentUser: {}
  activeInfoCoparent: [],
  docToView: ''
  firebaseUser: null,
  isLoading: true
  menuIsOpen: false
  messageToUser: null
  modalIsOpen: false
  refreshKey: 0,
  selectedChild: null
  selectedNewEventDay: null
  swapRequestToRevise: null
  showNavbar: true
  showCenterNavbarButton: true
  theme: 'light'
  transferRequestToEdit: {}
  unreadMessageCount: 0
  userIsLoggedIn: false
  users: []
  viewExpenseForm: false
  viewSwapRequestForm: false
  viewTransferRequestForm: false
  setActivityCount: (count) ->
  setActiveInfoChild: (child) ->
  setActiveInfoCoparent: (coparent) ->
  setContactInfoToUpdateType: ->
  setCurrentScreen: (screen) ->
  setCurrentUser: (user) ->
  setDateToEdit: (date) ->
  setDocToView: (doc) ->
  setEventToEdit: (event) ->
  setFirebaseUser: (user) ->
  setIsLoading: (bool) ->
  setMenuIsOpen: (isOpen) ->
  setMessageToUser: (user) ->
  setModalIsOpen: (bool) ->
  setRefreshKey: (num) ->
  setSelectedChild: (child) ->
  setSelectedNewEventDay: (day) ->
  setSwapRequestToRevise: (request) ->
  setShowCenterNavbarButton: (bool) ->
  setShowOverlay: (bool) ->
  setTheme: (theme) ->
  setTransferRequestToEdit: (request) ->
  setUnreadMessageCount: (num) ->
  setUserIsLoggedIn: (isLoggedIn) ->
  setUsers: (users) ->
  setViewExpenseForm: (show) ->
  setViewSwapRequestForm: (show) ->
  setViewTransferRequestForm: (show) ->

export default StateObj
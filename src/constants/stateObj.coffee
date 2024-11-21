import ScreenNames from "./screenNames"
import ActivitySet from "../models/activitySet"

StateObj =
  activeInfoChild: null
  activitySet: new ActivitySet(),
  currentScreen: ScreenNames.login
  currentUser: {}
  activeInfoCoparent: [],
  docToView: ''
  firebaseUser: null,
  isLoading: false
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
  updateAvailable: false,
  viewExpenseForm: false
  viewSwapRequestForm: false
  viewTransferRequestForm: false
  setActivitySet: (set) ->
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
  setUpdateAvailable: (bool) ->
  setUnreadMessageCount: (num) ->
  setUserIsLoggedIn: (isLoggedIn) ->
  setUsers: (users) ->
  setViewExpenseForm: (show) ->
  setViewSwapRequestForm: (show) ->
  setViewTransferRequestForm: (show) ->

export default StateObj
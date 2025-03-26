import ScreenNames from "./screenNames"
import DateFormats from "./dateFormats"
import moment from "moment"
import DateManager from "../managers/dateManager"

StateObj =
  activeInfoChild: null
  activeInfoCoparent: [],
  authUser: null
  childAccessGranted: false,
  creationFormToShow: ''
  currentScreen: ScreenNames.home
  currentUser: {}
  docToView: ''
  firebaseUser: null,
  defaultDate: moment().format('YYYY-MM-DD')
  isLoading: true
  loadingText: 'Preparing your pathway to peace...'
  menuIsOpen: false
  messageToUser: null
  modalIsOpen: false
  notificationCount: 0,
  parentAccessGranted: false
  refreshKey: 0,
  showCreationMenu: false
  showScreenActions: false
  registrationUserName: ''
  selectedChild: null
  selectedNewEventDay: null
  setShowScreenActions: (bool) ->
  setActiveInfoChild: (child) ->
  setActiveInfoCoparent: (coparent) ->
  setAuthUser: (user) ->
  setChildAccessGranted: (bool) ->
  setContactInfoToUpdateType: ->
  setCreationFormToShow: (form) ->
  setCurrentScreen: (screen) ->
  setCurrentUser: (user) ->
  setDateToEdit: (date) ->
  setDocToView: (doc) ->
  setEventToEdit: (event) ->
  setFirebaseUser: (user) ->
  setIsLoading: (bool) ->
  setLoadingText: (text) ->
  setMenuIsOpen: (isOpen) ->
  setMessageToUser: (user) ->
  setModalIsOpen: (bool) ->
  setNotificationCount: (count) ->
  setParentAccessGranted: (bool) ->
  setRefreshKey: (num) ->
  setRegistrationUserName: (name) ->
  setDefaultDate: (date) ->
  setSelectedChild: (child) ->
  setSelectedNewEventDay: (day) ->
  setShowBottomMenu: (bool) ->
  setShowCenterNavbarButton: (bool) ->
  setShowOverlay: (bool) ->
  setSwapRequestToRevise: (request) ->
  setTheme: (theme) ->
  setTransferRequestToEdit: (request) ->
  setUnreadMessageCount: (num) ->
  setUserIsLoggedIn: (isLoggedIn) ->
  setUsers: (users) ->
  setViewExpenseForm: (show) ->
  setViewSwapRequestForm: (show) ->
  setViewTransferRequestForm: (show) ->
  showBottomMenu: false
  showCenterNavbarButton: true
  showNavbar: true
  swapRequestToRevise: null
  theme: 'light'
  transferRequestToEdit: {}
  unreadMessageCount: 0
  userIsLoggedIn: false
  users: []
  viewExpenseForm: false
  viewSwapRequestForm: false
  viewTransferRequestForm: false

export default StateObj
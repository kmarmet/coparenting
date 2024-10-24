import ScreenNames from "./screenNames"

StateObj =
  alertMessage: ''
  alertType: ''
  activeInfoChild: null
  confirmMessage: ''
  contactInfoToUpdateType: 'email'
  currentScreen: ScreenNames.login
  currentUser: {}
  activeInfoCoparent: [],
  docToView: ''
  formToShow: ''
  firebaseUser: null,
  changeKey: 0,
  isLoading: true
  menuIsOpen: false
  messageToUser: null
  modalIsOpen: false
  navbarButton:
    action: null
    icon: 'add'
    color: 'green'
  previousScreen: ''
  selectedChild: null
  selectedNewEventDay: null
  swapRequestToRevise: null
  showAlert: false
  showBackButton: false
  showConfirm: false
  showMenuButton: false
  showOverlay: false
  showNavbar: true
  showCenterNavbarButton: true
  theme: 'light'
  transferRequestToEdit: {}
  unreadMessages: null
  unreadMessagesCountSet: false
  userIsLoggedIn: false
  users: []
  viewExpenseForm: false
  viewSwapRequestForm: false
  viewTransferRequestForm: false
  setAlertMessage: (alertMessage) ->
  setAlertType: (type) ->
  setActiveInfoChild: (child) ->
  setActiveInfoCoparent: (coparent) ->
  setConfirmMessage: (message) ->
  setContactInfoToUpdateType: ->
  setCurrentScreen: (screen) ->
  setCurrentUser: (user) ->
  setChangeKey: (key) ->
  setDateToEdit: (date) ->
  setDocToView: (doc) ->
  setEventToEdit: (event) ->
  setFormToShow: (form) ->
  setFirebaseUser: (user) ->
  setGoBackScreen: (screen) ->
  setIsLoading: (bool) ->
  setMenuIsOpen: (isOpen) ->
  setMessageToUser: (user) ->
  setModalIsOpen: (bool) ->
  setNavbarButton: (button) ->
  setSelectedChild: (child) ->
  setSelectedNewEventDay: (day) ->
  setShowAlert: (bool) ->
  setSwapRequestToRevise: (request) ->
  setShowBackButton: (bool) ->
  setShowCenterNavbarButton: (bool) ->
  setShowMenuButton: ->
  setShowOverlay: (bool) ->
  setShowShortcutMenu: (bool) ->
  setTheme: (theme) ->
  setTransferRequestToEdit: (request) ->
  setUnreadMessages: (count) ->
  setUnreadMessagesCountSet: (bool) ->
  setUserIsLoggedIn: (isLoggedIn) ->
  setUsers: (users) ->
  setViewExpenseForm: (show) ->
  setViewSwapRequestForm: (show) ->
  setViewTransferRequestForm: (show) ->

export default StateObj
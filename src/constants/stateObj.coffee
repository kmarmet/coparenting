import ScreenNames from "./screenNames"

StateObj =
  alertMessage: ''
  alertType: ''
  calEventToEdit: {}
  confirmMessage: ''
  contactInfoToUpdateType: 'email'
  currentScreen: ScreenNames.login
  currentUser: {}
  docToView: ''
  formToShow: ''
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
  showAlert: false
  showBackButton: false
  showConfirm: false
  showMenuButton: false
  showOverlay: false
  showNavbar: true
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
  setConfirmMessage: (message) ->
  setContactInfoToUpdateType: ->
  setCurrentScreen: (screen) ->
  setCurrentUser: (user) ->
  setDateToEdit: (date) ->
  setDocToView: (doc) ->
  setEventToEdit: (event) ->
  setFormToShow: (form) ->
  setGoBackScreen: (screen) ->
  setIsLoading: (bool) ->
  setMenuIsOpen: (isOpen) ->
  setMessageToUser: (user) ->
  setModalIsOpen: (bool) ->
  setNavbarButton: (button) ->
  setSelectedChild: (child) ->
  setSelectedNewEventDay: (day) ->
  setShowAlert: (bool) ->
  setShowBackButton: (bool) ->
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
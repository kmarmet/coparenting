// Path: src\components\forms\newExpenseForm.jsx
import moment from 'moment'
import React, {useContext, useEffect, useRef, useState} from 'react'
import Form from '../../components/shared/form'
import SelectDropdown from '../../components/shared/selectDropdown'
import Spacer from '../../components/shared/spacer.jsx'
import ButtonThemes from '../../constants/buttonThemes'
import CreationForms from '../../constants/creationForms'
import DatetimeFormats from '../../constants/datetimeFormats'
import InputTypes from '../../constants/inputTypes'
import ActivityCategory from '../../constants/updateCategory'
import globalState from '../../context'
import DB from '../../database/DB'
import DB_UserScoped from '../../database/db_userScoped'
import Storage from '../../database/storage'
import useChildren from '../../hooks/useChildren'
import useCoParents from '../../hooks/useCoParents'
import useCurrentUser from '../../hooks/useCurrentUser'
import useExpenses from '../../hooks/useExpenses'
import useUsers from '../../hooks/useUsers'
import AlertManager from '../../managers/alertManager'
import DateManager from '../../managers/dateManager'
import DropdownManager from '../../managers/dropdownManager'
import ImageManager from '../../managers/imageManager'
import Manager from '../../managers/manager'
import ObjectManager from '../../managers/objectManager'
import StringManager from '../../managers/stringManager.coffee'
import UpdateManager from '../../managers/updateManager'
import CalendarMapper from '../../mappers/calMapper'
import Expense from '../../models/new/expense.js'
import Button from '../shared/button'
import FormDivider from '../shared/formDivider'
import InputField from '../shared/inputField'
import Label from '../shared/label'
import ToggleButton from '../shared/toggleButton'
import UploadButton from '../shared/uploadButton'

export default function NewExpenseForm() {
    const {state, setState} = useContext(globalState)
    const {theme, refreshKey, authUser, creationFormToShow} = state

    // HOOKS
    const {currentUser} = useCurrentUser()
    const {children, childrenDropdownOptions} = useChildren()
    const {coParents} = useCoParents()
    const {users} = useUsers()

    // STATE
    const [recurringFrequency, setRecurringFrequency] = useState('')
    const [repeatingEndDate, setRepeatingEndDate] = useState('')
    const [isRecurring, setIsRecurring] = useState(false)
    const [categorySelection, setCategorySelection] = useState()

    // HOOKS
    const {expenses} = useExpenses()

    // DROPDOWN STATE
    const [selectedChildrenOptions, setSelectedChildrenOptions] = useState([])
    const [selectedShareWithOptions, setSelectedShareWithOptions] = useState([])
    const [defaultShareWithOptions, setDefaultShareWithOptions] = useState([])
    const [recurringIntervals, setRecurringIntervals] = useState([
        {label: 'Daily', value: 'Daily'},
        {label: 'Weekly', value: 'Weekly'},
        {label: 'Biweekly', value: 'Biweekly'},
        {label: 'Monthly', value: 'Monthly'},
    ])

    // Ref
    const formRef = useRef({...new Expense()})

    const ResetForm = (showAlert) => {
        Manager.ResetForm('expenses-wrapper')
        setRecurringFrequency('')
        setRepeatingEndDate('')
        setTimeout(() => {
            setState({
                ...state,
                creationFormToShow: '',
                successAlertMessage: showAlert ? `${StringManager.FormatTitle(formRef.current.name)} Added` : null,
            })
        }, 10)
    }

    const SubmitNewExpense = async () => {
        //#region VALIDATION
        const validAccounts = currentUser?.sharedDataUsers
        if (validAccounts === 0) {
            AlertManager.throwError(
                'No co-parent to \n assign expenses to',
                'You have not added any co-parents. Or, it is also possible they have closed their profile.'
            )
            return false
        }
        if (!Manager.IsValid(formRef.current.payer.name, true)) {
            AlertManager.throwError('Please select will be paying the expense')
            return false
        }
        if (!Manager.IsValid(formRef.current.name, true)) {
            AlertManager.throwError('Please add an expense name')
            return false
        }
        if (formRef.current.amount <= 0) {
            AlertManager.throwError('Please add an expense amount')
            return false
        }
        //#endregion VALIDATION

        const newExpense = {...formRef.current}
        // Mappers
        formRef.current.shareWith = DropdownManager.MappedForDatabase.ShareWithFromArray(selectedShareWithOptions)
        formRef.current.name = StringManager.FormatTitle(formRef.current.name)
        formRef.current.dueDate = DateManager.GetValidDate(formRef.current.dueDate)
        formRef.current.paidStatus = 'unpaid'
        formRef.current.imageName = formRef?.current?.image?.name ?? ''
        formRef.current.recurringFrequency = recurringFrequency
        formRef.current.isRecurring = isRecurring
        formRef.current.category = categorySelection?.value
        formRef.current.owner = {
            key: currentUser?.key,
            name: currentUser?.name,
        }
        formRef.current.recipient = {
            key: currentUser?.key,
            name: currentUser?.name,
        }

        // If expense has image
        if (formRef.current.image) {
            formRef.current.imageName = formRef.current.image.name
            formRef.current.image = await ImageManager.compressImage(formRef.current.image)
        }

        const activeRepeatIntervals = document.querySelectorAll('.repeat-interval .box.active')

        if (Manager.IsValid(activeRepeatIntervals) && activeRepeatIntervals.length > 0 && !formRef.current.dueDate) {
            AlertManager.throwError('When selecting a recurring frequency, you must also set a due date')
            return false
        }

        // IMAGE UPLOAD
        if (Manager.IsValid(formRef?.current?.image?.name)) {
            await Storage.upload(Storage.directories.expenseImages, currentUser?.key, formRef.current.image, formRef.current.image.name).then(
                (url) => {
                    formRef.current.imageUrl = url
                }
            )
        }

        const cleanObject = ObjectManager.CleanObject(newExpense)
        cleanObject.category = categorySelection

        // Add to DB
        await DB.Add(`${DB.tables.expenses}/${currentUser?.key}`, expenses, cleanObject).finally(async () => {
            // Add repeating expense to DB
            if (recurringFrequency.length > 0 && repeatingEndDate.length > 0) {
                await AddRepeatingExpensesToDb()
            }

            // Send notification
            if (Manager.IsValid(formRef.current.shareWith)) {
                UpdateManager.SendToShareWith(
                    formRef.current.shareWith,
                    currentUser,
                    `${StringManager.GetFirstNameOnly(currentUser?.name)} has created a new expense`,
                    `${formRef.current.name} - $${formRef.current.amount}`,
                    ActivityCategory.expenses
                )
            }

            ResetForm(true)
        })
    }

    const AddRepeatingExpensesToDb = async () => {
        let expensesToPush = []
        let datesToRepeat = CalendarMapper.recurringEvents(recurringFrequency, formRef.current.dueDate, repeatingEndDate)

        if (Manager.IsValid(datesToRepeat)) {
            datesToRepeat.forEach((date) => {
                let newExpense = new Expense({...formRef.current})
                formRef.current.owner = {
                    key: currentUser?.key,
                    name: StringManager.GetFirstNameOnly(currentUser?.name),
                    phone: currentUser?.phone,
                }
                formRef.current.recipient = {
                    key: currentUser?.key,
                    name: StringManager.GetFirstNameOnly(currentUser?.name),
                }
                formRef.current.imageName = ''
                formRef.current.dueDate = Manager.IsValid(date) ? moment(date).format(DatetimeFormats.dateForDb) : ''
                formRef.current.creationDate = DateManager.GetCurrentJavascriptDate()
                formRef.current.paidStatus = 'unpaid'
                formRef.current.isRecurring = true
                const cleaned = ObjectManager.CleanObject(newExpense)
                expensesToPush.push(cleaned)
            })
            await DB_UserScoped.addMultipleExpenses(currentUser, expensesToPush)
        }
    }

    const OnDefaultAmountPress = (e) => {
        const numberButton = e.target
        const asNumber = parseInt(e.target.textContent.replace('$', ''))
        const currentNumber = parseInt(formRef.current.amount || 0)
        const total = asNumber + currentNumber
        formRef.current.amount = total
        const activeForm = document.querySelector('.form-wrapper.active')
        const inputField = activeForm.querySelector('.input-field')
        const amountInput = inputField.querySelector('input')
        amountInput.value = total
    }

    useEffect(() => {
        if (Manager.IsValid(children) || Manager.IsValid(coParents) || Manager.IsValid(users)) {
            setDefaultShareWithOptions(DropdownManager.GetDefault.ShareWith(children, coParents))
        }
    }, [children, coParents, users])

    return (
        <Form
            refreshKey={refreshKey}
            hasDelete={false}
            onSubmit={SubmitNewExpense}
            submitText={'Done'}
            title={'Create Expense'}
            className="new-expense-card"
            wrapperClass="new-expense-card at-top"
            showCard={creationFormToShow === CreationForms.expense}
            extraButtons={[
                <UploadButton
                    useAttachmentIcon={true}
                    uploadType="image"
                    getImages={(input) => {
                        if (input.target.files.length === 0) {
                            AlertManager.throwError('Please choose an image first')
                        } else {
                            formRef.current.image = input.target.files[0]
                        }
                    }}
                    containerClass={`${theme} new-expense-card`}
                    actualUploadButtonText={'Upload'}
                    uploadButtonText="Choose"
                />,
            ]}
            onClose={() => ResetForm()}>
            <div className="expenses-wrapper">
                {/* PAGE CONTAINER */}
                <div id="add-expense-form" className={`${theme} at-top`}>
                    {/* AMOUNT */}
                    <div id="amount-input-field">
                        <span className="flex">
                            <InputField
                                wrapperClass="currency"
                                isCurrency={true}
                                id="amount-input"
                                hasBottomSpacer={false}
                                inputType={InputTypes.number}
                                onChange={(e) => {
                                    const numbersOnly = StringManager.RemoveAllLetters(e.target.value).replaceAll('.', '')
                                    e.target.value = numbersOnly
                                    formRef.current.amount = numbersOnly
                                }}
                                placeholder={'0'}
                            />
                        </span>
                    </div>
                    {/* DEFAULT EXPENSE AMOUNTS */}
                    <div id="default-expense-amounts">
                        <Button theme={ButtonThemes.translucent} text={'$5'} className="default-amount-button" onClick={OnDefaultAmountPress} />
                        <Button theme={ButtonThemes.translucent} text={'$10'} className="default-amount-button" onClick={OnDefaultAmountPress} />
                        <Button theme={ButtonThemes.translucent} text={'$20'} className="default-amount-button" onClick={OnDefaultAmountPress} />
                        <Button theme={ButtonThemes.translucent} text={'$30'} className="default-amount-button" onClick={OnDefaultAmountPress} />
                        <Button theme={ButtonThemes.translucent} text={'$40'} className="default-amount-button" onClick={OnDefaultAmountPress} />
                        <Button theme={ButtonThemes.translucent} text={'$50'} className="default-amount-button" onClick={OnDefaultAmountPress} />
                        <Button theme={ButtonThemes.translucent} text={'$60'} className="default-amount-button" onClick={OnDefaultAmountPress} />
                        <Button theme={ButtonThemes.translucent} text={'$70'} className="default-amount-button" onClick={OnDefaultAmountPress} />
                        <Button theme={ButtonThemes.translucent} text={'$80'} className="default-amount-button" onClick={OnDefaultAmountPress} />
                        <Button theme={ButtonThemes.translucent} text={'$90'} className="default-amount-button" onClick={OnDefaultAmountPress} />
                        <Button theme={ButtonThemes.translucent} text={'$100'} className="default-amount-button" onClick={OnDefaultAmountPress} />
                        <Button
                            text={'Reset'}
                            className="default-amount-button reset"
                            onClick={() => {
                                const inputField = document.getElementById('amount-input-field')
                                const amountInput = inputField.querySelector('input')
                                amountInput.value = null
                                formRef.current.amount = 0
                            }}
                        />
                    </div>

                    <FormDivider text={'Required'} />

                    {/* EXPENSE NAME */}
                    <InputField
                        onChange={(e) => (formRef.current.name = e.target.value)}
                        inputType={InputTypes.text}
                        placeholder={'Expense Title'}
                        required={true}
                    />

                    <Spacer height={3} />

                    {/* PAYER */}
                    {Manager.IsValid(coParents) && (
                        <SelectDropdown
                            options={DropdownManager.GetDefault.CoParents(coParents)}
                            placeholder={'Select Expense Payer'}
                            onSelect={(e) => {
                                formRef.current.payer = {
                                    name: e.label,
                                    key: e.value,
                                }
                            }}
                        />
                    )}

                    <Spacer height={3} />

                    {/* CATEGORY */}
                    <SelectDropdown
                        options={DropdownManager.GetDefault.ExpenseCategories()}
                        value={DropdownManager.GetSelected.ExpenseCategory(categorySelection)}
                        onSelect={(e) => setCategorySelection(e.value)}
                        placeholder={'Select a Category'}
                        required={true}
                        show={true}
                    />

                    <Spacer height={3} />

                    {/* DUE DATE */}
                    <InputField
                        inputType={InputTypes.date}
                        uidClass="new-expense-date"
                        placeholder={'Due Date'}
                        onDateOrTimeSelection={(date) => (formRef.current.dueDate = moment(date).format(DatetimeFormats.dateForDb))}
                    />

                    <Spacer height={3} />
                    {/* NOTES */}
                    <InputField onChange={(e) => (formRef.current.notes = e.target.value)} inputType={'textarea'} placeholder={'Notes'} />

                    <FormDivider text={'Optional'} />

                    {/* SHARE WITH */}
                    <SelectDropdown
                        options={defaultShareWithOptions}
                        selectMultiple={true}
                        placeholder={'Select Contacts to Share With'}
                        onSelect={setSelectedShareWithOptions}
                    />

                    <Spacer height={3} />

                    {/* INCLUDING WHICH CHILDREN */}
                    {Manager.IsValid(children) && (
                        <SelectDropdown
                            options={childrenDropdownOptions}
                            placeholder={'Select Children to Include'}
                            onSelect={setSelectedChildrenOptions}
                            selectMultiple={true}
                        />
                    )}
                    <Spacer height={3} />

                    <SelectDropdown
                        selectMultiple={true}
                        placeholder={'Select Interval'}
                        options={recurringIntervals}
                        onSelect={setRecurringIntervals}
                    />

                    <Spacer height={8} />
                    {/* RECURRING? */}
                    <div className="flex">
                        <Label text={'Recurring'} classes="always-show" />
                        <ToggleButton onCheck={() => setIsRecurring(true)} onUncheck={() => setIsRecurring(false)} />
                    </div>
                </div>
            </div>
        </Form>
    )
}
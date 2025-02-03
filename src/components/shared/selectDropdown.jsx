import FormControl from '@mui/material/FormControl'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import InputLabel from '@mui/material/InputLabel'
import Label from './label.jsx'
import Manager from '../../managers/manager.js'

export default function SelectDropdown({ wrapperClasses, onChange, labelText, id, children, selectValue }) {
  return (
    <div className={wrapperClasses}>
      {Manager.isValid(labelText) && <Label text={labelText} />}
      <FormControl fullWidth>
        <Select id={id} className={'w-100'} value={selectValue} onChange={onChange}>
          {children}
        </Select>
      </FormControl>
    </div>
  )
}
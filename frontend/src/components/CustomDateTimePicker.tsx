import React from 'react';

interface CustomDateTimePickerProps {
  value: string; // "YYYY-MM-DDTHH:mm" format or empty string
  onChange: (value: string) => void;
  required?: boolean;
}

const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({ value, onChange, required }) => {
  // value is expected to be "YYYY-MM-DDTHH:mm"
  const [datePart, timePart] = value ? value.split('T') : ['', ''];
  const [hour24Str, minStr] = timePart ? timePart.split(':') : ['12', '00'];
  
  const hour24 = parseInt(hour24Str, 10) || 12;
  const ampmPart = timePart ? (hour24 >= 12 ? 'PM' : 'AM') : 'PM';
  let hour12 = timePart ? (hour24 % 12) : 12;
  if (hour12 === 0) hour12 = 12;
  const hourPart = hour12.toString();

  const updateDateTime = (d: string, h: string, m: string, a: string) => {
    if (!d) {
      onChange('');
      return;
    }
    let hr = parseInt(h, 10);
    if (a === 'PM' && hr < 12) hr += 12;
    if (a === 'AM' && hr === 12) hr = 0;
    
    // Fallback to exactly 2 digits for everything
    const hrStr = hr.toString().padStart(2, '0');
    const minStr = m.padStart(2, '0');
    
    const isoString = `${d}T${hrStr}:${minStr}`;
    onChange(isoString);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <input 
        type="date" 
        required={required}
        value={datePart}
        onChange={(e) => updateDateTime(e.target.value, hourPart, minStr, ampmPart)}
        className="border border-border-strong rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 shrink-0 h-[38px]"
      />
      <div className="flex items-center gap-1 shrink-0">
        <select 
          value={hourPart} 
          onChange={(e) => updateDateTime(datePart, e.target.value, minStr, ampmPart)}
          className="border border-border-strong rounded-md px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 appearance-none text-center min-w-[3.5rem] h-[38px] cursor-pointer"
          disabled={!datePart}
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
            <option key={h} value={h.toString()}>{h.toString()}</option>
          ))}
        </select>
        <span className="font-bold text-slate-500">:</span>
        <select 
          value={minStr} 
          onChange={(e) => updateDateTime(datePart, hourPart, e.target.value, ampmPart)}
          className="border border-border-strong rounded-md px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 appearance-none text-center min-w-[3.5rem] h-[38px] cursor-pointer"
          disabled={!datePart}
        >
          {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select 
          value={ampmPart} 
          onChange={(e) => updateDateTime(datePart, hourPart, minStr, e.target.value)}
          className="border border-border-strong rounded-md px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 appearance-none text-center min-w-[4rem] h-[38px] cursor-pointer ml-1"
          disabled={!datePart}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
};

export default CustomDateTimePicker;

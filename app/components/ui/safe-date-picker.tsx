"use client";

import { useEffect, useState } from "react";
import DatePicker, { type DatePickerProps } from "react-datepicker";

export default function SafeDatePicker(props: DatePickerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <input
        type="text"
        className={props.className as string}
        readOnly
        placeholder={props.placeholderText}
        value=""
      />
    );
  }

  return <DatePicker {...props} />;
}

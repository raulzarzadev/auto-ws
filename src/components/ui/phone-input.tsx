'use client'

import * as React from 'react'
import PhoneInput from 'react-phone-number-input'
import type { Country } from 'react-phone-number-input'

import { cn } from '@/lib/utils'

type PhoneInputHandle = React.ComponentRef<typeof PhoneInput>

export interface PhoneNumberInputProps
  extends React.ComponentProps<typeof PhoneInput> {
  error?: boolean
}

export const PhoneNumberInput = React.forwardRef<
  PhoneInputHandle,
  PhoneNumberInputProps
>(
  (
    {
      className,
      error,
      defaultCountry,
      countrySelectProps,
      onChange,
      ...props
    },
    ref
  ) => {
    const mergedCountrySelectProps = {
      className: 'PhoneInputCountrySelect',
      ...countrySelectProps
    }

    return (
      <PhoneInput
        ref={ref}
        international
        countryCallingCodeEditable={false}
        defaultCountry={(defaultCountry ?? 'MX') as Country}
        className={cn('PhoneInput', error && 'PhoneInputError', className)}
        inputClassName="PhoneInputInput"
        countrySelectProps={mergedCountrySelectProps}
        onChange={onChange}
        {...props}
      />
    )
  }
)

PhoneNumberInput.displayName = 'PhoneNumberInput'

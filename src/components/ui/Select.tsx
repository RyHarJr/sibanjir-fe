"use client";
import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface SelectProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function Select({ options, value, onChange, placeholder = "Pilih...", disabled = false }: SelectProps) {
  const selected = options.find((o) => o.value === value) || null;

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <div className="relative">
        <ListboxButton className={`relative w-full px-3 py-2.5 text-left rounded-lg border border-outline-variant bg-surface text-on-surface focus:outline-none focus:border-primary transition-colors cursor-pointer sm:text-[14px] ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <span className="block truncate font-medium">{selected ? selected.label : placeholder}</span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-on-surface-variant">
            <ChevronDown className="w-5 h-5" />
          </span>
        </ListboxButton>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-surface-container py-1.5 text-base shadow-xl border border-outline-variant focus:outline-none sm:text-sm ambient-shadow-sm">
            {options.map((opt) => (
              <ListboxOption
                key={opt.value}
                className={({ active }) =>
                  `relative cursor-default select-none py-2.5 pl-10 pr-4 transition-colors mx-1.5 rounded-lg ${
                    active ? 'bg-primary text-on-primary' : 'text-on-surface'
                  }`
                }
                value={opt.value}
              >
                {({ selected, active }) => (
                  <>
                    <span className={`block truncate ${selected ? 'font-bold' : 'font-medium'}`}>
                      {opt.label}
                    </span>
                    {selected ? (
                      <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-on-primary' : 'text-primary'}`}>
                        <Check className="w-5 h-5" />
                      </span>
                    ) : null}
                  </>
                )}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </Transition>
      </div>
    </Listbox>
  )
}

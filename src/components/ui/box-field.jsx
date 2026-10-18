'use client';

import * as React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const BoxFieldContext = React.createContext({
  isSelect: false,
  isOpen: false,
  setIsOpen: () => {},
  setHasSelect: () => {},
});

const BoxField = React.forwardRef(
  ({ className, label, required, error, children, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [hasSelect, setHasSelect] = React.useState(false);
    const containerRef = React.useRef(null);

    // Close inline expanded select on outside click or Escape key
    React.useEffect(() => {
      if (!isOpen) return;

      const handlePointerDownOutside = (e) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target)
        ) {
          setIsOpen(false);
        }
      };

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handlePointerDownOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handlePointerDownOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [isOpen]);

    return (
      <BoxFieldContext.Provider
        value={{
          isSelect: hasSelect,
          isOpen,
          setIsOpen,
          setHasSelect,
        }}
      >
        <div
          ref={(node) => {
            containerRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          className={cn(
            'group relative rounded-lg border bg-white px-3.5 py-2.5 transition-all duration-150',
            hasSelect && 'select-none',
            error
              ? 'border-[#A61C1C] bg-white focus-within:border-[#A61C1C]'
              : isOpen
              ? 'border-[#7B1E2B] ring-2 ring-[#7B1E2B]/15'
              : 'border-[#D8D5CE] hover:border-[#B8B2A6] focus-within:border-[#7B1E2B] focus-within:ring-2 focus-within:ring-[#7B1E2B]/15',
            className
          )}
          {...props}
        >
          {label && (
            <label
              onClick={() => {
                if (hasSelect) setIsOpen((prev) => !prev);
              }}
              className={cn(
                'block text-[11px] font-extrabold text-[#1C242B] leading-tight mb-1 select-none',
                hasSelect && 'cursor-pointer pr-8'
              )}
            >
              {label}
              {required && <span> *</span>}
            </label>
          )}
          <div className="min-w-0">{children}</div>
          {error && (
            <p className="mt-1 text-[11px] font-medium text-[#A61C1C] leading-snug">
              {error}
            </p>
          )}
        </div>
      </BoxFieldContext.Provider>
    );
  }
);
BoxField.displayName = 'BoxField';

const BoxInput = React.forwardRef(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'w-full border-0 bg-transparent p-0 text-xs text-[#3E4852] placeholder:text-[#7A8590] focus:text-[#1C242B] focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60',
      className
    )}
    {...props}
  />
));
BoxInput.displayName = 'BoxInput';

/**
 * Inline-expanding BoxSelect:
 * Clicking the field expands the BoxField container itself downward to show
 * the selectable options inside the same rounded box (matching the user's sketch).
 */
const BoxSelect = React.forwardRef(
  ({ className, value, onChange, disabled, children }, ref) => {
    const { isOpen, setIsOpen, setHasSelect } =
      React.useContext(BoxFieldContext);

    React.useEffect(() => {
      setHasSelect(true);
      return () => setHasSelect(false);
    }, [setHasSelect]);

    const options = React.useMemo(() => {
      const list = [];
      React.Children.forEach(children, (child) => {
        if (!React.isValidElement(child)) return;
        const optValue =
          child.props.value !== undefined ? String(child.props.value) : '';
        const optLabel = child.props.children;
        list.push({ value: optValue, label: optLabel });
      });
      return list;
    }, [children]);

    const currentStr =
      value !== undefined && value !== null ? String(value) : '';
    const selectedOption =
      options.find((o) => o.value === currentStr) || options[0];

    const handleSelect = (nextVal) => {
      if (disabled) return;
      if (onChange) {
        onChange({ target: { value: nextVal } });
      }
      setIsOpen(false);
    };

    return (
      <div className="w-full">
        <button
          ref={ref}
          type="button"
          disabled={disabled}
          aria-expanded={isOpen}
          onClick={() => {
            if (!disabled) setIsOpen((prev) => !prev);
          }}
          className={cn(
            'flex w-full items-center justify-between pr-8 border-0 bg-transparent p-0 text-left text-xs text-[#5A6570] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer',
            isOpen && 'text-[#1C242B] font-semibold',
            className
          )}
        >
          <span className="truncate leading-snug">
            {selectedOption ? selectedOption.label : 'Seleccionar...'}
          </span>

          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-md transition-colors duration-150',
              isOpen
                ? 'bg-[#F5E4E6] text-[#7B1E2B]'
                : 'bg-[#F4F2EE] text-[#5A6570] group-hover:bg-[#EAE6DF] group-hover:text-[#1C242B]'
            )}
          >
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-200',
                isOpen && 'rotate-180'
              )}
            />
          </span>
        </button>

        {/* Inline expanding options list inside the same BoxField container */}
        {isOpen && (
          <div
            role="listbox"
            className="mt-2.5 pt-2 border-t border-[#EBE8E1] space-y-1 animate-in fade-in-0 duration-150"
          >
            {options.map((opt) => {
              const isSelected = opt.value === currentStr;
              return (
                <button
                  key={`${opt.value}-${String(opt.label)}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(opt.value);
                  }}
                  className={cn(
                    'flex w-full cursor-pointer select-none items-center justify-between gap-2.5 rounded-md px-3 py-2 text-left text-xs transition-colors',
                    isSelected
                      ? 'border border-[#7B1E2B]/30 bg-[#F5E4E6] font-bold text-[#7B1E2B]'
                      : 'border border-transparent font-medium text-[#2E3842] hover:bg-[#F4F2EE] hover:text-[#1C242B]'
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-[#7B1E2B]" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }
);
BoxSelect.displayName = 'BoxSelect';

const BoxTextarea = React.forwardRef(({ className, rows = 2, ...props }, ref) => (
  <textarea
    ref={ref}
    rows={rows}
    className={cn(
      'w-full resize-y border-0 bg-transparent p-0 text-xs text-[#3E4852] placeholder:text-[#7A8590] focus:text-[#1C242B] focus:outline-none focus:ring-0 leading-relaxed disabled:cursor-not-allowed disabled:opacity-60',
      className
    )}
    {...props}
  />
));
BoxTextarea.displayName = 'BoxTextarea';

export { BoxField, BoxInput, BoxSelect, BoxTextarea };

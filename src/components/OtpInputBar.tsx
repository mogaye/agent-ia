import React, { useRef, useEffect } from 'react';

interface OtpInputBarProps {
  value: string;
  onChange: (val: string) => void;
  colorScheme?: 'sky' | 'emerald';
  autoFocus?: boolean;
}

export const OtpInputBar: React.FC<OtpInputBarProps> = ({
  value,
  onChange,
  colorScheme = 'emerald',
  autoFocus = false
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array(6).fill('').map((_, i) => value[i] || '');

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const char = e.target.value.slice(-1);
    if (!/^\d*$/.test(char)) return;

    const newDigits = [...digits];
    newDigits[index] = char;
    const combined = newDigits.join('');
    onChange(combined);

    if (char && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      onChange(pasted);
      const targetIdx = Math.min(pasted.length, 5);
      inputRefs.current[targetIdx]?.focus();
    }
  };

  const activeRing = colorScheme === 'sky' ? 'focus:border-[#0052CC]' : 'focus:border-emerald-500';

  return (
    <div className="grid grid-cols-6 gap-1.5 sm:gap-2 max-w-[280px] mx-auto w-full">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={handlePaste}
          className={`w-full h-11 sm:h-12 text-center text-base sm:text-lg font-extrabold font-mono rounded-xl bg-[#F8FAFC] focus:bg-white text-[#0A0A0A] border-2 border-slate-200 transition-all outline-none ${activeRing}`}
        />
      ))}
    </div>
  );
};

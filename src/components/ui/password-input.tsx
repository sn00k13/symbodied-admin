"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "./input";
import type { InputHTMLAttributes } from "react";

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
  helper?: string;
  leadingIcon?: React.ReactNode;
}

export function PasswordInput({ ...props }: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <Input
      {...props}
      type={show ? "text" : "password"}
      trailingIcon={
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="text-ink-400 hover:text-ink transition-colors focus:outline-none"
          tabIndex={-1}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      }
    />
  );
}

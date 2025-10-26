import { useState } from "react";
import { cn } from "../lib/utils";

const Input = (props: React.ComponentProps<"input">) => {
  return (
    <input
      {...props}
      className={cn(
        "px-4 py-2 rounded-full border border-neutral-700",
        "focus:outline-none focus:ring-2 focus:ring-yellow-500",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        props.className
      )}
    />
  );
};

const PasswordInput = (props: React.ComponentProps<"input">) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  return (
    <div className="relative">
      {/* Password input */}
      <Input
        {...props}
        className="w-full pr-14"
        type={isPasswordVisible ? "text" : "password"}
      />

      {/* Toggle password visibility */}
      <div
        className={cn(
          "absolute right-0 w-14",
          "flex justify-center items-center top-1/2 -translate-y-1/2"
        )}
      >
        <button
          type="button"
          onClick={() => setIsPasswordVisible((prev) => !prev)}
          className="text-neutral-500 cursor-pointer"
        >
          {isPasswordVisible ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
};

export { Input, PasswordInput };

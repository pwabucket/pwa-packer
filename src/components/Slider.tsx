import { Slider as SliderPrimitive } from "radix-ui";
import { cn } from "../lib/utils";

interface SliderProps extends SliderPrimitive.SliderProps {
  trackClassName?: string;
  rangeClassName?: string;
  thumbClassName?: string;
}

const Slider = ({
  trackClassName,
  rangeClassName,
  thumbClassName,
  value,
  ...props
}: SliderProps) => {
  return (
    <SliderPrimitive.Slider
      {...props}
      className={cn(
        "relative flex items-center select-none touch-none",
        "w-full h-6"
      )}
    >
      <SliderPrimitive.Track
        className={cn(
          "relative h-2  rounded-full grow",
          "border border-neutral-800 rounded-full",
          trackClassName
        )}
      >
        <SliderPrimitive.Range
          className={cn(
            "absolute h-full bg-yellow-500 rounded-full",
            rangeClassName
          )}
        />
      </SliderPrimitive.Track>
      {value?.map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          className={cn(
            "relative size-6 rounded-full",
            "flex items-center justify-center text-xs",
            "bg-yellow-500 shadow-xs",
            "border-4 border-white",
            "focus:outline-hidden",
            "cursor-pointer",
            thumbClassName
          )}
        />
      ))}
    </SliderPrimitive.Slider>
  );
};

export { Slider };

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200 focus:ring-blue-500",
        secondary:
          "border-transparent bg-slate-100 text-slate-800 hover:bg-slate-200 focus:ring-slate-500",
        destructive:
          "border-transparent bg-red-100 text-red-800 hover:bg-red-200 focus:ring-red-500",
        outline: "text-slate-950 border-slate-200 hover:bg-slate-100 focus:ring-slate-500",
        success:
          "border-transparent bg-green-100 text-green-800 hover:bg-green-200 focus:ring-green-500",
        warning:
          "border-transparent bg-amber-100 text-amber-800 hover:bg-amber-200 focus:ring-amber-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
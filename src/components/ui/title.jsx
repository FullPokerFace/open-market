import { cn } from "@/lib/utils";

// Heading ported from ResumeFromSpace's Typography/Title, with colors mapped to this app's
// tokens so they follow light / dark mode. `className` wins over the defaults (e.g. "mb-0").
// `highlight` picks out part of a text title in blue: <Title highlight="sentiment">Market sentiment</Title>
const SIZES = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
  "4xl": "text-4xl",
};

const COLORS = {
  primary: "text-blue",
  secondary: "text-muted-foreground",
  dark: "text-foreground",
  light: "text-background",
  blue: "text-blue",
  green: "text-beat",
  red: "text-miss",
};

const WEIGHTS = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
  extrabold: "font-extrabold",
};

const ALIGNS = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

// Wraps the first match of `highlight` in blue; titles that aren't plain text are left alone
function withHighlight(children, highlight) {
  if (!highlight || typeof children !== "string") return children;
  const at = children.indexOf(highlight);
  if (at === -1) return children;
  return (
    <>
      {children.slice(0, at)}
      <span className="text-blue">{highlight}</span>
      {children.slice(at + highlight.length)}
    </>
  );
}

export function Title({
  children,
  highlight,
  level = 1,
  size = "xl",
  color = "dark",
  weight = "bold",
  align = "left",
  className,
  ...rest
}) {
  const Heading = `h${level}`;
  return (
    <Heading
      className={cn(SIZES[size], COLORS[color], WEIGHTS[weight], ALIGNS[align], "mb-4", className)}
      {...rest}
    >
      {withHighlight(children, highlight)}
    </Heading>
  );
}

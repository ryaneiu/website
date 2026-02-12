import { type ReactNode } from "react";
import { motion } from "framer-motion";

// Get motion.div props properly
type MotionDivProps = React.ComponentProps<typeof motion.div>;

interface FadeUpProps extends MotionDivProps {
  children: ReactNode;
  duration?: number; // optional shorthand for transition duration
}

const FadeUp: React.FC<FadeUpProps> = ({
  children,
  duration = 0.3,
  initial,
  animate,
  exit,
  transition,
  ...props
}) => {
  return (
    <motion.div
      initial={initial ?? { opacity: 0, y: 20 }}
      animate={animate ?? { opacity: 1, y: 0 }}
      exit={exit ?? { opacity: 0, y: 20 }}
      transition={transition ?? { duration }}
      {...props} // now includes className, style, onClick, etc.
    >
      {children}
    </motion.div>
  );
};

export default FadeUp;

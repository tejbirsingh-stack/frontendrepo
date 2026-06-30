import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Tooltip, Typography, type TypographyProps } from '@mui/material';

export interface TruncatedTextProps extends Omit<TypographyProps, 'children' | 'noWrap'> {
  text?: string;
  tooltip?: string;
  children?: ReactNode;
}

export default function TruncatedText({
  text,
  tooltip,
  children,
  sx,
  ...typographyProps
}: TruncatedTextProps) {
  const ref = useRef<HTMLElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const tooltipTitle = tooltip ?? text ?? '';

  const checkTruncation = useCallback(() => {
    const element = ref.current;
    if (!element) return;
    setIsTruncated(element.scrollWidth > element.clientWidth);
  }, []);

  useLayoutEffect(() => {
    checkTruncation();
  }, [checkTruncation, text, children, tooltipTitle]);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const resizeObserver = new ResizeObserver(() => {
      checkTruncation();
    });
    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, [checkTruncation]);

  const content = (
    <Typography
      ref={ref}
      noWrap
      sx={{
        display: 'block',
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        ...sx,
      }}
      {...typographyProps}
    >
      {children ?? text}
    </Typography>
  );

  if (!tooltipTitle || !isTruncated) {
    return content;
  }

  return (
    <Tooltip title={tooltipTitle} arrow placement="top">
      {content}
    </Tooltip>
  );
}

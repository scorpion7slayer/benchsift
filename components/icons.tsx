// Rune Icons normal (outline), Apache-2.0. See public/licenses/rune-icons.txt.
// Adapted from upstream SVGs: currentColor + accessible React props.
import type { ComponentType, SVGProps } from "react";
export type RuneIconProps = SVGProps<SVGSVGElement> & { size?: number | string };
export type RuneIcon = ComponentType<RuneIconProps>;

/** Rune normal/activity. */
export function Activity({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M22 12H19.52C19.083 11.9991 18.6577 12.1413 18.3091 12.405C17.9606 12.6686 17.708 13.0392 17.59 13.46L15.24 21.82C15.2249 21.8719 15.1933 21.9175 15.15 21.95C15.1067 21.9825 15.0541 22 15 22C14.9459 22 14.8933 21.9825 14.85 21.95C14.8067 21.9175 14.7751 21.8719 14.76 21.82L9.24 2.18C9.22485 2.12807 9.19327 2.08246 9.15 2.05C9.10673 2.01754 9.05409 2 9 2C8.94591 2 8.89327 2.01754 8.85 2.05C8.80673 2.08246 8.77515 2.12807 8.76 2.18L6.41 10.54C6.29246 10.9592 6.04138 11.3285 5.69486 11.592C5.34835 11.8555 4.92532 11.9988 4.49 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/arrow-right. */
export function ArrowRight({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M5 12H19M12 19L19 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/arrow-up. */
export function ArrowUp({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M19 12L12 5L5 12M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/arrow-up-down. */
export function ArrowUpDown({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M13 16L17 20L21 16M17 20V4M11 8L7 4L3 8M7 4V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/volume-2. */
export function AudioLines({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M16 9C16.6491 9.86548 17 10.9181 17 12C17 13.0819 16.6491 14.1345 16 15M19.364 18.3642C20.1998 17.5285 20.8627 16.5363 21.315 15.4444C21.7673 14.3525 22.0001 13.1821 22.0001 12.0002C22.0001 10.8183 21.7673 9.64799 21.315 8.55605C20.8627 7.46412 20.1998 6.47196 19.364 5.63623M11 4.70203C10.9998 4.56274 10.9583 4.42663 10.8809 4.31088C10.8034 4.19514 10.6934 4.10493 10.5647 4.05166C10.436 3.99838 10.2944 3.98442 10.1577 4.01154C10.0211 4.03866 9.89559 4.10564 9.797 4.20403L6.413 7.58703C6.2824 7.7184 6.12703 7.82256 5.95589 7.89345C5.78475 7.96435 5.60124 8.00057 5.416 8.00003H3C2.73478 8.00003 2.48043 8.10539 2.29289 8.29292C2.10536 8.48046 2 8.73481 2 9.00003V15C2 15.2652 2.10536 15.5196 2.29289 15.7071C2.48043 15.8947 2.73478 16 3 16H5.416C5.60124 15.9995 5.78475 16.0357 5.95589 16.1066C6.12703 16.1775 6.2824 16.2817 6.413 16.413L9.796 19.797C9.8946 19.8958 10.0203 19.9631 10.1572 19.9904C10.2941 20.0177 10.436 20.0037 10.5649 19.9503C10.6939 19.8968 10.804 19.8063 10.8815 19.6902C10.959 19.5741 11.0002 19.4376 11 19.298V4.70203Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/chart-bar. */
export function BarChart3({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M3 3V19C3 19.5304 3.21071 20.0391 3.58579 20.4142C3.96086 20.7893 4.46957 21 5 21H21M7 16H15M7 11H19M7 6H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/layers-2. */
export function Blocks({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><g clipPath="url(#clip0_1_3467)"><path d="M20 14.2849L21.5 15.1299C21.6539 15.2171 21.7819 15.3436 21.871 15.4965C21.96 15.6493 22.0069 15.823 22.0069 15.9999C22.0069 16.1768 21.96 16.3505 21.871 16.5034C21.7819 16.6562 21.6539 16.7827 21.5 16.8699L13 21.7399C12.696 21.9154 12.3511 22.0079 12 22.0079C11.6489 22.0079 11.304 21.9154 11 21.7399L2.49999 16.8699C2.34609 16.7827 2.21808 16.6562 2.12902 16.5034C2.03997 16.3505 1.99304 16.1768 1.99304 15.9999C1.99304 15.823 2.03997 15.6493 2.12902 15.4965C2.21808 15.3436 2.34609 15.2171 2.49999 15.1299L3.99999 14.2849M13 13.7399C12.696 13.9154 12.3511 14.0078 12 14.0078C11.6489 14.0078 11.304 13.9154 11 13.7399L2.49999 8.86989C2.34609 8.78267 2.21808 8.65619 2.12902 8.50335C2.03997 8.35051 1.99304 8.17679 1.99304 7.99989C1.99304 7.823 2.03997 7.64927 2.12902 7.49643C2.21808 7.34359 2.34609 7.21711 2.49999 7.12989L11 2.25989C11.304 2.08436 11.6489 1.99194 12 1.99194C12.3511 1.99194 12.696 2.08436 13 2.25989L21.5 7.12989C21.6539 7.21711 21.7819 7.34359 21.871 7.49643C21.96 7.64927 22.0069 7.823 22.0069 7.99989C22.0069 8.17679 21.96 8.35051 21.871 8.50335C21.7819 8.65619 21.6539 8.78267 21.5 8.86989L13 13.7399Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></g><defs ><clipPath id="clip0_1_3467"><rect width="24" height="24" fill="white" /></clipPath></defs></svg>;
}

/** Rune normal/file-text. */
export function BookOpen({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M14 2H6C5.46957 2 4.96086 2.21072 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8M14 2C14.3166 1.99949 14.6301 2.06161 14.9225 2.18277C15.215 2.30394 15.4806 2.48176 15.704 2.706L19.292 6.294C19.5168 6.51751 19.6952 6.78335 19.8167 7.07616C19.9382 7.36898 20.0005 7.68297 20 8M14 2V7C14 7.26522 14.1054 7.51957 14.2929 7.70711C14.4804 7.89464 14.7348 8 15 8L20 8M10 9H8M16 13H8M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/box. */
export function Boxes({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M3.30005 7L12 12M12 12L20.7001 7M12 12L12 22M21 7.9999C20.9996 7.64918 20.9071 7.30471 20.7315 7.00106C20.556 6.69742 20.3037 6.44526 20 6.2699L13 2.2699C12.696 2.09437 12.3511 2.00195 12 2.00195C11.6489 2.00195 11.304 2.09437 11 2.2699L4 6.2699C3.69626 6.44526 3.44398 6.69742 3.26846 7.00106C3.09294 7.30471 3.00036 7.64918 3 7.9999V15.9999C3.00036 16.3506 3.09294 16.6951 3.26846 16.9987C3.44398 17.3024 3.69626 17.5545 4 17.7299L11 21.7299C11.304 21.9054 11.6489 21.9979 12 21.9979C12.3511 21.9979 12.696 21.9054 13 21.7299L20 17.7299C20.3037 17.5545 20.556 17.3024 20.7315 16.9987C20.9071 16.6951 20.9996 16.3506 21 15.9999V7.9999Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/sparkles. */
export function Brain({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><g clipPath="url(#clip0_1_2467)"><path d="M20 2V6M22 4H18M11.017 2.81395C11.0598 2.58456 11.1815 2.37737 11.3611 2.22827C11.5406 2.07917 11.7666 1.99756 12 1.99756C12.2333 1.99756 12.4593 2.07917 12.6389 2.22827C12.8184 2.37737 12.9401 2.58456 12.983 2.81395L14.034 8.37195C14.1086 8.7671 14.3006 9.13057 14.585 9.41492C14.8693 9.69928 15.2328 9.89131 15.628 9.96595L21.186 11.017C21.4153 11.0598 21.6225 11.1815 21.7716 11.3611C21.9207 11.5406 22.0023 11.7666 22.0023 12C22.0023 12.2333 21.9207 12.4593 21.7716 12.6389C21.6225 12.8184 21.4153 12.9401 21.186 12.983L15.628 14.034C15.2328 14.1086 14.8693 14.3006 14.585 14.585C14.3006 14.8693 14.1086 15.2328 14.034 15.628L12.983 21.186C12.9401 21.4153 12.8184 21.6225 12.6389 21.7716C12.4593 21.9207 12.2333 22.0023 12 22.0023C11.7666 22.0023 11.5406 21.9207 11.3611 21.7716C11.1815 21.6225 11.0598 21.4153 11.017 21.186L9.96595 15.628C9.89131 15.2328 9.69928 14.8693 9.41492 14.585C9.13057 14.3006 8.7671 14.1086 8.37195 14.034L2.81395 12.983C2.58456 12.9401 2.37737 12.8184 2.22827 12.6389C2.07917 12.4593 1.99756 12.2333 1.99756 12C1.99756 11.7666 2.07917 11.5406 2.22827 11.3611C2.37737 11.1815 2.58456 11.0598 2.81395 11.017L8.37195 9.96595C8.7671 9.89131 9.13057 9.69928 9.41492 9.41492C9.69928 9.13057 9.89131 8.7671 9.96595 8.37195L11.017 2.81395ZM6 20C6 21.1046 5.10457 22 4 22C2.89543 22 2 21.1046 2 20C2 18.8954 2.89543 18 4 18C5.10457 18 6 18.8954 6 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></g><defs ><clipPath id="clip0_1_2467"><rect width="24" height="24" fill="white" /></clipPath></defs></svg>;
}

/** Rune normal/message-square-text. */
export function Captions({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M7 11H17M7 15H13M7 7H15M22 17C22 17.5304 21.7893 18.0391 21.4142 18.4142C21.0391 18.7893 20.5304 19 20 19H6.828C6.29761 19.0001 5.78899 19.2109 5.414 19.586L3.212 21.788C3.1127 21.8873 2.9862 21.9549 2.84849 21.9823C2.71077 22.0097 2.56803 21.9956 2.43831 21.9419C2.30858 21.8881 2.1977 21.7971 2.11969 21.6804C2.04167 21.5637 2.00002 21.4264 2 21.286V5C2 4.46957 2.21071 3.96086 2.58579 3.58579C2.96086 3.21071 3.46957 3 4 3H20C20.5304 3 21.0391 3.21071 21.4142 3.58579C21.7893 3.96086 22 4.46957 22 5V17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/check. */
export function Check({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/check. */
export function CheckIcon({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/chevron-down. */
export function ChevronDown({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/chevron-down. */
export function ChevronDownIcon({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/chevron-left. */
export function ChevronLeft({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/chevron-right. */
export function ChevronRight({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/chevron-right. */
export function ChevronUpIcon({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M18 15L12 9L6 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/dollar-sign. */
export function CircleDollarSign({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/heart. */
export function Coffee({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M2 9.49998C2.00002 8.38718 2.33759 7.30056 2.96813 6.38364C3.59867 5.46672 4.49252 4.76264 5.53161 4.36438C6.5707 3.96612 7.70616 3.89242 8.78801 4.15302C9.86987 4.41362 10.8472 4.99626 11.591 5.82398C11.6434 5.87999 11.7067 5.92465 11.7771 5.95518C11.8474 5.98571 11.9233 6.00146 12 6.00146C12.0767 6.00146 12.1526 5.98571 12.2229 5.95518C12.2933 5.92465 12.3566 5.87999 12.409 5.82398C13.1504 4.99088 14.128 4.40335 15.2116 4.13958C16.2952 3.87581 17.4335 3.94833 18.4749 4.34746C19.5163 4.7466 20.4114 5.45343 21.0411 6.37388C21.6708 7.29433 22.0053 8.38474 22 9.49998C22 11.79 20.5 13.5 19 15L13.508 20.313C13.3217 20.527 13.0919 20.6989 12.834 20.8173C12.5762 20.9357 12.296 20.9978 12.0123 20.9996C11.7285 21.0014 11.4476 20.9428 11.1883 20.8277C10.9289 20.7126 10.697 20.5436 10.508 20.332L5 15C3.5 13.5 2 11.8 2 9.49998Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/server. */
export function Cpu({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M6 6H6.01M6 18H6.01M4 2H20C21.1046 2 22 2.89543 22 4V8C22 9.10457 21.1046 10 20 10H4C2.89543 10 2 9.10457 2 8V4C2 2.89543 2.89543 2 4 2ZM4 14H20C21.1046 14 22 14.8954 22 16V20C22 21.1046 21.1046 22 20 22H4C2.89543 22 2 21.1046 2 20V16C2 14.8954 2.89543 14 4 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/dollar-sign. */
export function DollarSign({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/square-arrow-out-up-right. */
export function ExternalLink({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M21 13V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H11M21 3L12 12M21 9V3H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/activity. */
export function Gauge({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M22 12H19.52C19.083 11.9991 18.6577 12.1413 18.3091 12.405C17.9606 12.6686 17.708 13.0392 17.59 13.46L15.24 21.82C15.2249 21.8719 15.1933 21.9175 15.15 21.95C15.1067 21.9825 15.0541 22 15 22C14.9459 22 14.8933 21.9825 14.85 21.95C14.8067 21.9175 14.7751 21.8719 14.76 21.82L9.24 2.18C9.22485 2.12807 9.19327 2.08246 9.15 2.05C9.10673 2.01754 9.05409 2 9 2C8.94591 2 8.89327 2.01754 8.85 2.05C8.80673 2.08246 8.77515 2.12807 8.76 2.18L6.41 10.54C6.29246 10.9592 6.04138 11.3285 5.69486 11.592C5.34835 11.8555 4.92532 11.9988 4.49 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/arrow-left-right. */
export function GitCompareArrows({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M8 11L4 7L8 3M4 7H20M16 13L20 17L16 21M20 17H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/heart. */
export function Heart({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M2 9.49998C2.00002 8.38718 2.33759 7.30056 2.96813 6.38364C3.59867 5.46672 4.49252 4.76264 5.53161 4.36438C6.5707 3.96612 7.70616 3.89242 8.78801 4.15302C9.86987 4.41362 10.8472 4.99626 11.591 5.82398C11.6434 5.87999 11.7067 5.92465 11.7771 5.95518C11.8474 5.98571 11.9233 6.00146 12 6.00146C12.0767 6.00146 12.1526 5.98571 12.2229 5.95518C12.2933 5.92465 12.3566 5.87999 12.409 5.82398C13.1504 4.99088 14.128 4.40335 15.2116 4.13958C16.2952 3.87581 17.4335 3.94833 18.4749 4.34746C19.5163 4.7466 20.4114 5.45343 21.0411 6.37388C21.6708 7.29433 22.0053 8.38474 22 9.49998C22 11.79 20.5 13.5 19 15L13.508 20.313C13.3217 20.527 13.0919 20.6989 12.834 20.8173C12.5762 20.9357 12.296 20.9978 12.0123 20.9996C11.7285 21.0014 11.4476 20.9428 11.1883 20.8277C10.9289 20.7126 10.697 20.5436 10.508 20.332L5 15C3.5 13.5 2 11.8 2 9.49998Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/house. */
export function Home({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M15 21V13C15 12.7348 14.8946 12.4804 14.7071 12.2929C14.5196 12.1054 14.2652 12 14 12H10C9.73478 12 9.48043 12.1054 9.29289 12.2929C9.10536 12.4804 9 12.7348 9 13V21M3 9.99999C2.99993 9.70906 3.06333 9.42161 3.18579 9.15771C3.30824 8.8938 3.4868 8.65979 3.709 8.47199L10.709 2.47199C11.07 2.1669 11.5274 1.99951 12 1.99951C12.4726 1.99951 12.93 2.1669 13.291 2.47199L20.291 8.47199C20.5132 8.65979 20.6918 8.8938 20.8142 9.15771C20.9367 9.42161 21.0001 9.70906 21 9.99999V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V9.99999Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/image. */
export function ImageIcon({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M21 14.9999L17.914 11.9139C17.5389 11.539 17.0303 11.3284 16.5 11.3284C15.9697 11.3284 15.4611 11.539 15.086 11.9139L6 20.9999M5 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3ZM11 9C11 10.1046 10.1046 11 9 11C7.89543 11 7 10.1046 7 9C7 7.89543 7.89543 7 9 7C10.1046 7 11 7.89543 11 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/info. */
export function Info({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/folders. */
export function LibraryBig({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M3.00001 8.26807C2.6951 8.44411 2.44206 8.69752 2.26647 9.00269C2.09088 9.30787 1.99896 9.65398 2.00001 10.0061V19.0001C2.00001 19.5305 2.21072 20.0392 2.5858 20.4143C2.96087 20.7894 3.46958 21.0001 4.00001 21.0001H15C15.3511 21.0001 15.696 20.9076 16 20.7321C16.304 20.5566 16.5565 20.3041 16.732 20.0001M20 5C20.5304 5 21.0391 5.21071 21.4142 5.58579C21.7893 5.96086 22 6.46957 22 7V14C22 14.5304 21.7893 15.0391 21.4142 15.4142C21.0391 15.7893 20.5304 16 20 16H9C8.46957 16 7.96086 15.7893 7.58579 15.4142C7.21071 15.0391 7 14.5304 7 14V5C7 4.46957 7.21071 3.96086 7.58579 3.58579C7.96086 3.21071 8.46957 3 9 3H11.5C11.7329 3 11.9625 3.05422 12.1708 3.15836C12.3791 3.2625 12.5603 3.41371 12.7 3.6L13.3 4.4C13.4397 4.58629 13.6209 4.7375 13.8292 4.84164C14.0375 4.94578 14.2671 5 14.5 5H20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/clipboard-list. */
export function List({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M16 4H18C18.5304 4 19.0391 4.21071 19.4142 4.58579C19.7893 4.96086 20 5.46957 20 6V20C20 20.5304 19.7893 21.0391 19.4142 21.4142C19.0391 21.7893 18.5304 22 18 22H6C5.46957 22 4.96086 21.7893 4.58579 21.4142C4.21071 21.0391 4 20.5304 4 20V6C4 5.46957 4.21071 4.96086 4.58579 4.58579C4.96086 4.21071 5.46957 4 6 4H8M12 11H16M12 16H16M8 11H8.01M8 16H8.01M9 2H15C15.5523 2 16 2.44772 16 3V5C16 5.55228 15.5523 6 15 6H9C8.44772 6 8 5.55228 8 5V3C8 2.44772 8.44772 2 9 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/refresh-cw. */
export function Loader2({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M3 12C3 9.61305 3.94821 7.32387 5.63604 5.63604C7.32387 3.94821 9.61305 3 12 3C14.516 3.00947 16.931 3.99122 18.74 5.74L21 8M16 8H21V3M21 12C21 14.3869 20.0518 16.6761 18.364 18.364C16.6761 20.0518 14.3869 21 12 21C9.48395 20.9905 7.06897 20.0088 5.26 18.26L3 16M3 21V16H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/lock. */
export function Lock({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11M5 11H19C20.1046 11 21 11.8954 21 13V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V13C3 11.8954 3.89543 11 5 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/menu. */
export function Menu({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M4 5H20M4 12H20M4 19H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/message-square. */
export function MessageSquarePlus({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M22 17C22 17.5304 21.7893 18.0391 21.4142 18.4142C21.0391 18.7893 20.5304 19 20 19H6.828C6.29761 19.0001 5.78899 19.2109 5.414 19.586L3.212 21.788C3.1127 21.8873 2.9862 21.9549 2.84849 21.9823C2.71077 22.0097 2.56803 21.9956 2.43831 21.9419C2.30858 21.8881 2.1977 21.7971 2.11969 21.6804C2.04167 21.5637 2.00002 21.4264 2 21.286V5C2 4.46957 2.21071 3.96086 2.58579 3.58579C2.96086 3.21071 3.46957 3 4 3H20C20.5304 3 21.0391 3.21071 21.4142 3.58579C21.7893 3.96086 22 4.46957 22 5V17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/mic. */
export function Mic({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M12 19V22M5 10V12C5 13.8565 5.7375 15.637 7.05025 16.9497C8.36301 18.2625 10.1435 19 12 19C13.8565 19 15.637 18.2625 16.9497 16.9497C18.2625 15.637 19 13.8565 19 12V10M12 2C13.6569 2 15 3.34315 15 5V12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12V5C9 3.34315 10.3431 2 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/moon. */
export function Moon({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M20.985 12.486C20.8912 14.2221 20.2966 15.894 19.273 17.2994C18.2494 18.7048 16.8406 19.7837 15.217 20.4055C13.5933 21.0274 11.8243 21.1656 10.1237 20.8035C8.42318 20.4414 6.86392 19.5945 5.63442 18.3651C4.40493 17.1358 3.55785 15.5766 3.19558 13.8761C2.83331 12.1756 2.97136 10.4065 3.59304 8.78279C4.21472 7.15906 5.29342 5.75016 6.69874 4.72641C8.10406 3.70265 9.77583 3.10788 11.512 3.01397C11.917 2.99197 12.129 3.47397 11.914 3.81697C11.1949 4.96753 10.8869 6.32784 11.0405 7.67592C11.194 9.024 11.7999 10.2803 12.7593 11.2396C13.7187 12.199 14.9749 12.805 16.323 12.9585C17.6711 13.112 19.0314 12.8041 20.182 12.085C20.526 11.87 21.007 12.081 20.985 12.486Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/panel-top. */
export function PanelsTopLeft({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M3 9H21M5 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/plus. */
export function Plus({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M5 12H19M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/refresh-cw. */
export function RefreshCw({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M3 12C3 9.61305 3.94821 7.32387 5.63604 5.63604C7.32387 3.94821 9.61305 3 12 3C14.516 3.00947 16.931 3.99122 18.74 5.74L21 8M16 8H21V3M21 12C21 14.3869 20.0518 16.6761 18.364 18.364C16.6761 20.0518 14.3869 21 12 21C9.48395 20.9905 7.06897 20.0088 5.26 18.26L3 16M3 21V16H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/git-branch. */
export function Route({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M15 6C12.6131 6 10.3239 6.94821 8.63604 8.63604C6.94821 10.3239 6 12.6131 6 15M15 6C15 7.65685 16.3431 9 18 9C19.6569 9 21 7.65685 21 6C21 4.34315 19.6569 3 18 3C16.3431 3 15 4.34315 15 6ZM6 15V3M6 15C4.34315 15 3 16.3431 3 18C3 19.6569 4.34315 21 6 21C7.65685 21 9 19.6569 9 18C9 16.3431 7.65685 15 6 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/search. */
export function Search({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M20.9999 21.0002L16.6599 16.6602M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/sliders-horizontal. */
export function SlidersHorizontal({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M10 5H3M12 19H3M14 3V7M16 17V21M21 12H12M21 19H16M21 5H14M8 10V14M8 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/sparkles. */
export function Sparkles({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><g clipPath="url(#clip0_1_2467)"><path d="M20 2V6M22 4H18M11.017 2.81395C11.0598 2.58456 11.1815 2.37737 11.3611 2.22827C11.5406 2.07917 11.7666 1.99756 12 1.99756C12.2333 1.99756 12.4593 2.07917 12.6389 2.22827C12.8184 2.37737 12.9401 2.58456 12.983 2.81395L14.034 8.37195C14.1086 8.7671 14.3006 9.13057 14.585 9.41492C14.8693 9.69928 15.2328 9.89131 15.628 9.96595L21.186 11.017C21.4153 11.0598 21.6225 11.1815 21.7716 11.3611C21.9207 11.5406 22.0023 11.7666 22.0023 12C22.0023 12.2333 21.9207 12.4593 21.7716 12.6389C21.6225 12.8184 21.4153 12.9401 21.186 12.983L15.628 14.034C15.2328 14.1086 14.8693 14.3006 14.585 14.585C14.3006 14.8693 14.1086 15.2328 14.034 15.628L12.983 21.186C12.9401 21.4153 12.8184 21.6225 12.6389 21.7716C12.4593 21.9207 12.2333 22.0023 12 22.0023C11.7666 22.0023 11.5406 21.9207 11.3611 21.7716C11.1815 21.6225 11.0598 21.4153 11.017 21.186L9.96595 15.628C9.89131 15.2328 9.69928 14.8693 9.41492 14.585C9.13057 14.3006 8.7671 14.1086 8.37195 14.034L2.81395 12.983C2.58456 12.9401 2.37737 12.8184 2.22827 12.6389C2.07917 12.4593 1.99756 12.2333 1.99756 12C1.99756 11.7666 2.07917 11.5406 2.22827 11.3611C2.37737 11.1815 2.58456 11.0598 2.81395 11.017L8.37195 9.96595C8.7671 9.89131 9.13057 9.69928 9.41492 9.41492C9.69928 9.13057 9.89131 8.7671 9.96595 8.37195L11.017 2.81395ZM6 20C6 21.1046 5.10457 22 4 22C2.89543 22 2 21.1046 2 20C2 18.8954 2.89543 18 4 18C5.10457 18 6 18.8954 6 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></g><defs ><clipPath id="clip0_1_2467"><rect width="24" height="24" fill="white" /></clipPath></defs></svg>;
}

/** Rune normal/sun. */
export function Sun({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M12 2V4M12 20V22M4.93005 4.93018L6.34005 6.34018M17.66 17.6602L19.07 19.0702M2 12H4M20 12H22M6.34005 17.6602L4.93005 19.0702M19.07 4.93018L17.66 6.34018M16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/terminal. */
export function Terminal({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M12 19H20M4 17L10 11L4 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/clock. */
export function Timer({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M12 6V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/trending-up. */
export function TrendingUp({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M22 13V7H16M22 7L13.5 15.5L8.5 10.5L2 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/triangle-alert. */
export function TriangleAlert({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M12 9V13M12 17H12.01M21.7301 18.0002L13.7301 4.00022C13.5556 3.69243 13.3027 3.43641 12.997 3.25829C12.6913 3.08017 12.3438 2.98633 11.9901 2.98633C11.6363 2.98633 11.2888 3.08017 10.9831 3.25829C10.6774 3.43641 10.4245 3.69243 10.2501 4.00022L2.25005 18.0002C2.07373 18.3056 1.98128 18.6521 1.98206 19.0047C1.98284 19.3573 2.07683 19.7035 2.2545 20.008C2.43217 20.3126 2.6872 20.5648 2.99375 20.7391C3.30029 20.9133 3.64746 21.0034 4.00005 21.0002H20.0001C20.351 20.9999 20.6956 20.9072 20.9993 20.7315C21.3031 20.5558 21.5553 20.3033 21.7306 19.9993C21.9059 19.6954 21.9981 19.3506 21.998 18.9997C21.9979 18.6488 21.9055 18.3041 21.7301 18.0002Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/star. */
export function Trophy({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M11.525 2.29502C11.5688 2.20648 11.6365 2.13195 11.7205 2.07984C11.8044 2.02773 11.9012 2.00012 12 2.00012C12.0988 2.00012 12.1956 2.02773 12.2795 2.07984C12.3635 2.13195 12.4312 2.20648 12.475 2.29502L14.785 6.97402C14.9372 7.28198 15.1618 7.54842 15.4396 7.75047C15.7174 7.95251 16.0401 8.08413 16.38 8.13402L21.546 8.89002C21.6439 8.9042 21.7358 8.94549 21.8115 9.00921C21.8871 9.07294 21.9434 9.15656 21.974 9.25062C22.0046 9.34468 22.0083 9.44542 21.9846 9.54145C21.9609 9.63748 21.9108 9.72497 21.84 9.79402L18.104 13.432C17.8576 13.6721 17.6733 13.9685 17.5668 14.2956C17.4604 14.6228 17.4351 14.9709 17.493 15.31L18.375 20.45C18.3923 20.5479 18.3817 20.6486 18.3445 20.7407C18.3073 20.8328 18.2449 20.9126 18.1645 20.971C18.0842 21.0294 17.989 21.064 17.8899 21.0709C17.7908 21.0778 17.6917 21.0567 17.604 21.01L12.986 18.582C12.6817 18.4222 12.3432 18.3388 11.9995 18.3388C11.6558 18.3388 11.3173 18.4222 11.013 18.582L6.396 21.01C6.30833 21.0564 6.2094 21.0773 6.11045 21.0703C6.0115 21.0632 5.91652 21.0286 5.83629 20.9702C5.75607 20.9119 5.69383 20.8322 5.65666 20.7402C5.61948 20.6483 5.60886 20.5477 5.626 20.45L6.507 15.311C6.5652 14.9717 6.53998 14.6234 6.43354 14.2961C6.32709 13.9687 6.14261 13.6722 5.896 13.432L2.16 9.79502C2.08859 9.72605 2.03799 9.63841 2.01396 9.54209C1.98993 9.44577 1.99344 9.34463 2.02408 9.25021C2.05472 9.15578 2.11127 9.07186 2.18728 9.008C2.26329 8.94414 2.3557 8.90291 2.454 8.88902L7.619 8.13402C7.95926 8.08451 8.28239 7.95307 8.56058 7.751C8.83878 7.54893 9.0637 7.28229 9.216 6.97402L11.525 2.29502Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/file-text. */
export function Type({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M14 2H6C5.46957 2 4.96086 2.21072 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8M14 2C14.3166 1.99949 14.6301 2.06161 14.9225 2.18277C15.215 2.30394 15.4806 2.48176 15.704 2.706L19.292 6.294C19.5168 6.51751 19.6952 6.78335 19.8167 7.07616C19.9382 7.36898 20.0005 7.68297 20 8M14 2V7C14 7.26522 14.1054 7.51957 14.2929 7.70711C14.4804 7.89464 14.7348 8 15 8L20 8M10 9H8M16 13H8M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/lock-open. */
export function Unlock({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M7 10.9999V6.99991C6.99876 5.75996 7.45828 4.56378 8.28938 3.64358C9.12047 2.72338 10.2638 2.14481 11.4975 2.0202C12.7312 1.89558 13.9671 2.23381 14.9655 2.96922C15.9638 3.70463 16.6533 4.78476 16.9 5.99991M5 11H19C20.1046 11 21 11.8954 21 13V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V13C3 11.8954 3.89543 11 5 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/video. */
export function Video({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M16 12.9998L21.223 16.4818C21.2983 16.5319 21.3858 16.5606 21.4761 16.5649C21.5664 16.5693 21.6563 16.549 21.736 16.5063C21.8157 16.4636 21.8824 16.4001 21.9289 16.3225C21.9754 16.245 22 16.1562 22 16.0658V7.86978C22 7.7818 21.9768 7.69537 21.9328 7.61922C21.8887 7.54308 21.8253 7.4799 21.7491 7.43608C21.6728 7.39225 21.5863 7.36933 21.4983 7.36963C21.4103 7.36993 21.324 7.39344 21.248 7.43778L16 10.4998M4 6H14C15.1046 6 16 6.89543 16 8V16C16 17.1046 15.1046 18 14 18H4C2.89543 18 2 17.1046 2 16V8C2 6.89543 2.89543 6 4 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/x. */
export function X({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Rune normal/zap. */
export function Zap({ size = 24, ...props }: RuneIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}><path d="M3.99999 14C3.81076 14.0007 3.62522 13.9476 3.46495 13.847C3.30467 13.7464 3.17623 13.6024 3.09454 13.4317C3.01286 13.261 2.98129 13.0706 3.00349 12.8827C3.0257 12.6948 3.10077 12.517 3.21999 12.37L13.12 2.17004C13.1943 2.08432 13.2955 2.0264 13.407 2.00577C13.5185 1.98515 13.6337 2.00305 13.7337 2.05654C13.8337 2.11004 13.9126 2.19594 13.9573 2.30015C14.0021 2.40436 14.0101 2.52069 13.98 2.63004L12.06 8.65004C12.0034 8.80156 11.9844 8.96456 12.0046 9.12505C12.0248 9.28553 12.0837 9.43872 12.1761 9.57147C12.2685 9.70421 12.3918 9.81256 12.5353 9.8872C12.6788 9.96185 12.8382 10.0006 13 10H20C20.1892 9.9994 20.3748 10.0525 20.535 10.1531C20.6953 10.2537 20.8238 10.3977 20.9054 10.5684C20.9871 10.7391 21.0187 10.9295 20.9965 11.1174C20.9743 11.3053 20.8992 11.4831 20.78 11.63L10.88 21.83C10.8057 21.9158 10.7045 21.9737 10.593 21.9943C10.4815 22.0149 10.3663 21.997 10.2663 21.9435C10.1663 21.89 10.0874 21.8041 10.0427 21.6999C9.99791 21.5957 9.98991 21.4794 10.02 21.37L11.94 15.35C11.9966 15.1985 12.0156 15.0355 11.9954 14.875C11.9752 14.7145 11.9163 14.5614 11.8239 14.4286C11.7315 14.2959 11.6082 14.1875 11.4647 14.1129C11.3212 14.0382 11.1617 13.9995 11 14H3.99999Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

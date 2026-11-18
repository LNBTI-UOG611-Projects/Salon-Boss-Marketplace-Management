export const VERIFICATION_STATUSES = [
  'NOT_SUBMITTED',
  'PENDING_REVIEW',
  'VERIFIED',
  'CLARIFICATION_REQUIRED',
  'REJECTED',
] as const;

export type VerificationStatus =
  (typeof VERIFICATION_STATUSES)[number];

export const VERIFICATION_STATUS_LABELS: Record<
  VerificationStatus,
  string
> = {
  NOT_SUBMITTED: 'Not submitted',
  PENDING_REVIEW: 'Pending review',
  VERIFIED: 'Verified',
  CLARIFICATION_REQUIRED: 'Clarification required',
  REJECTED: 'Rejected',
};
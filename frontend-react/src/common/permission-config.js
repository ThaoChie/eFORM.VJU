import { ROLES } from './constants';

export const PERMISSIONS = {
  [ROLES.ADMIN]: ['/admin', '/fields', '/forms', '/semesters', '/criteria'],
  [ROLES.STUDENT]: ['/student', '/editor/my-form'],
  [ROLES.CLASS_LEADER]: ['/class-leader', '/workflow/pending-queue'],
  [ROLES.DEAN]: ['/dean', '/workflow/pending-queue'],
};

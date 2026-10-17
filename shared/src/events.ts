export const PERMISSIONS_CHANNEL = "cowrite:permissions";

export interface PermissionChange {
  documentId: string;
  userId: string; 
}
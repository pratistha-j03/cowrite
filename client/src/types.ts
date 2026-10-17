export type Role = "owner" | "editor" | "viewer";

export interface User {
  id: string;
  email: string;
  name: string;
}
export interface DocumentSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  role: Role;
}
export interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
}
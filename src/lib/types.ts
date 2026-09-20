import type { Priority, Role } from "@/db/schema";

/** Plain, serialisable objects passed from server components to clients. */

export type UserDTO = {
  id: string;
  name: string;
  email: string;
  color: string;
};

export type MemberDTO = UserDTO & {
  membershipId: string;
  role: Role;
  joinedAt: string;
  openTasks: number;
  doneTasks: number;
};

export type LabelDTO = {
  id: string;
  name: string;
  color: string;
};

export type CommentDTO = {
  id: string;
  body: string;
  createdAt: string;
  author: UserDTO;
};

export type TaskDTO = {
  id: string;
  number: number;
  title: string;
  description: string | null;
  priority: Priority;
  dueDate: string | null;
  position: number;
  columnId: string;
  assignee: UserDTO | null;
  creator: UserDTO | null;
  labels: LabelDTO[];
  comments: CommentDTO[];
  completedAt: string | null;
  createdAt: string;
};

export type ColumnDTO = {
  id: string;
  name: string;
  tasks: TaskDTO[];
};

export type ProjectDTO = {
  id: string;
  name: string;
  key: string;
  description: string | null;
  color: string;
  dueDate: string | null;
  createdAt: string;
};

export type BoardData = {
  project: ProjectDTO;
  columns: ColumnDTO[];
  labels: LabelDTO[];
  members: UserDTO[];
};

export type ActivityDTO = {
  id: string;
  action: string;
  meta: string | null;
  createdAt: string;
  user: UserDTO | null;
  project: { id: string; name: string; key: string; color: string } | null;
};

export type SearchResults = {
  tasks: {
    id: string;
    title: string;
    number: number;
    projectId: string;
    projectKey: string;
    projectColor: string;
  }[];
  projects: {
    id: string;
    name: string;
    key: string;
    color: string;
  }[];
};

import type { Category, Role, Visibility } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export interface UserDto {
  id: string;
  email: string;
  role: Role;
}

export interface AuthResponseDto {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: UserDto;
}

export interface AdminUserDto {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface CipherRecordListItemDto {
  id: string;
  title: string;
  description: string | null;
  category: Category;
  visibility: Visibility;
  createdAt: string;
  senderEmail: string;
}

export interface CipherRecordDetailsDto extends CipherRecordListItemDto {
  recipientEmail: string | null;
  content: string | null;
}

export interface CipherRecordPageDto {
  items: CipherRecordListItemDto[];
  page: number;
  pageSize: number;
  totalCount: number;
}

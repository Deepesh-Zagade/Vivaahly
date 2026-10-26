export type OrganizerUser = {
  id: string;
  name: string;
  email: string;
  emailNormalized: string;
  passwordHash: string;
  status: "ACTIVE" | "DISABLED";
  createdAt: Date;
  updatedAt: Date;
};

export type OrganizerSession = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  lastSeenAt: Date;
};

export type AuthenticatedOrganizer = {
  user: OrganizerUser;
  membership: null;
};

export type OrganizerUserDto = {
  id: string;
  name: string;
  email: string;
};

export function mapOrganizerUserDto(user: OrganizerUser): OrganizerUserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

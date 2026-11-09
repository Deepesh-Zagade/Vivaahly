import "server-only";

import { cache } from "react";
import { getWeddingService } from "@/modules/wedding/wedding.server";
import type { OrganizerMembershipContext } from "@/modules/wedding/wedding.types";

export const getWorkspaceWedding = cache(
  async (membership: OrganizerMembershipContext) =>
    (await getWeddingService()).getWeddingForOrganizer(membership),
);

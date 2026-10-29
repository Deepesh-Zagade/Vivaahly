import {
  updateWeddingSchema,
  type UpdateWeddingInput,
} from "@/modules/wedding/wedding.schemas";

export type WeddingSettingsFieldName =
  | "couple.bride.name.en"
  | "couple.bride.name.mr"
  | "couple.groom.name.en"
  | "couple.groom.name.mr"
  | "title.en"
  | "mainWeddingDate"
  | "timezone"
  | "primaryVenue.city.en";

export type WeddingSettingsFormValues = {
  brideNameEn: string;
  brideNameMr: string;
  groomNameEn: string;
  groomNameMr: string;
  titleEn: string;
  mainWeddingDate: string;
  timezone: string;
  cityEn: string;
};

export const fieldNameByValueKey: Record<
  keyof WeddingSettingsFormValues,
  WeddingSettingsFieldName
> = {
  brideNameEn: "couple.bride.name.en",
  brideNameMr: "couple.bride.name.mr",
  groomNameEn: "couple.groom.name.en",
  groomNameMr: "couple.groom.name.mr",
  titleEn: "title.en",
  mainWeddingDate: "mainWeddingDate",
  timezone: "timezone",
  cityEn: "primaryVenue.city.en",
};

export function buildWeddingUpdateInput(
  values: WeddingSettingsFormValues,
): UpdateWeddingInput {
  return {
    couple: {
      bride: {
        name: {
          en: values.brideNameEn,
          ...(values.brideNameMr ? { mr: values.brideNameMr } : {}),
        },
      },
      groom: {
        name: {
          en: values.groomNameEn,
          ...(values.groomNameMr ? { mr: values.groomNameMr } : {}),
        },
      },
    },
    title: { en: values.titleEn },
    mainWeddingDate: values.mainWeddingDate,
    timezone: values.timezone,
    primaryVenue: { city: { en: values.cityEn } },
  };
}

export function changedWeddingFieldError(
  values: WeddingSettingsFormValues,
  key: keyof WeddingSettingsFormValues,
  minimumWeddingDate: string,
) {
  const field = fieldNameByValueKey[key];
  const result = updateWeddingSchema.safeParse(buildWeddingUpdateInput(values));

  if (!result.success) {
    const issue = result.error.issues.find(
      (candidate) => candidate.path.join(".") === field,
    );
    if (issue) return issue.message;
  }

  if (
    field === "mainWeddingDate" &&
    values.mainWeddingDate < minimumWeddingDate
  ) {
    return "Choose today or a future wedding date.";
  }

  return undefined;
}

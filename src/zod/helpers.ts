import { z } from "zod";

export const enumKeys = <T extends Record<string, string>>(e: T) =>
  Object.keys(e) as [keyof T, ...Array<keyof T>];

export function zOptional<T extends z.ZodTypeAny>(schema: T) {
  return z
    .union([schema, z.literal("")])
    .transform((value) => (value === "" ? undefined : value))
    .optional();
}

export function zOptionalObject<T extends z.ZodRawShape>(schema: T) {
  return z.object(schema).partial();
}

export const phoneValidationRegex = /^\(\d{3}\) \d{3}-\d{4}$/;

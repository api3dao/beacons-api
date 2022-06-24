/**
 * This schema is a copy of the Zod schema at https://github.com/api3dao/api3-explorer/blob/df6cc3a267d05261b5a99aa9119f7955e1030acf/src/utils/api.ts
 *
 * This should ideally be exported from a common package at a later stage.
 */

import { z } from 'zod';

export enum EContactOption {
  TELEGRAM = 'telegram',
  DISCORD = 'discord',
  EMAIL = 'email',
}

export const contactOptionSchema = z.nativeEnum(EContactOption);

export const evmBeaconIdSchema = z.string().regex(/^0x[a-fA-F\d]{64}$/);

export const contactUsPayloadSchema = z
  .object({
    contactOption: contactOptionSchema,
    userName: z.string(),
    groupName: z.string().optional(),
    token: z.string().nullable(),
    order: z.object({
      chainId: z.string(),
      chainName: z.string(),
      items: z.array(
        z.object({
          beaconId: evmBeaconIdSchema,
          beaconName: z.string(),
          coverage: z.number(),
          months: z.number(),
          fee: z.number(),
        })
      ),
    }),
  })
  .strict();

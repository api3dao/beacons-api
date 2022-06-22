import { GoAsyncOptions } from "@api3/promise-utils";

export const goQueryConfig: GoAsyncOptions = { 
    attemptTimeoutMs: 5_000, 
    retries: 2, 
    totalTimeoutMs: 15_000 
}
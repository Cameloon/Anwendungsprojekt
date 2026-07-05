/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as deadlines from "../deadlines.js";
import type * as feedback from "../feedback.js";
import type * as forums from "../forums.js";
import type * as groups from "../groups.js";
import type * as hateSpeech from "../hateSpeech.js";
import type * as migrations from "../migrations.js";
import type * as moderationLog from "../moderationLog.js";
import type * as notifications from "../notifications.js";
import type * as postReports from "../postReports.js";
import type * as posts from "../posts.js";
import type * as profiles from "../profiles.js";
import type * as scripts from "../scripts.js";
import type * as sections from "../sections.js";
import type * as semesterLectures from "../semesterLectures.js";
import type * as userReports from "../userReports.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  deadlines: typeof deadlines;
  feedback: typeof feedback;
  forums: typeof forums;
  groups: typeof groups;
  hateSpeech: typeof hateSpeech;
  migrations: typeof migrations;
  moderationLog: typeof moderationLog;
  notifications: typeof notifications;
  postReports: typeof postReports;
  posts: typeof posts;
  profiles: typeof profiles;
  scripts: typeof scripts;
  sections: typeof sections;
  semesterLectures: typeof semesterLectures;
  userReports: typeof userReports;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

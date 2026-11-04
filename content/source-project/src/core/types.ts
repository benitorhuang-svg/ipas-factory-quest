/**
 * types.ts — Shared Domain Types for iPAS 智慧生產工程師 PWA
 */

export interface Subject {
  readonly code: string;
  readonly name: string;
  readonly label: string;
  readonly themes: readonly Theme[];
}

export interface Theme {
  readonly code: string;
  readonly name: string;
}

export interface Topic {
  readonly code: string;
  readonly name: string;
  readonly themeCode: string;
  readonly subjectCode: string;
  readonly icon: string;
  readonly keywords: string;
  readonly filePath?: string;
}

export interface StudyMaterial {
  readonly topicCode: string;
  readonly summary: string;
  readonly coreConcepts: readonly string[];
  readonly details: string;
}

export type RouteParams = Record<string, string>;
export type RouteHandler = (params: RouteParams) => HTMLElement | Promise<HTMLElement>;

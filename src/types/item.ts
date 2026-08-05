export type SourcePlatform = "dribbble" | "pinterest" | "awwwards" | "other";

export interface DesignItem {
  id: string;
  sourceUrl: string;
  sourcePlatform: SourcePlatform;
  title: string;
  description: string;
  screenshotFileId: string;
  screenshotUrl: string;
  tags: string[];
  replicationPrompt: string;
  colorPalette: string[];
  createdAt: string;
}

export interface CreateItemInput {
  url: string;
}

export interface CreateItemResponse {
  item: DesignItem;
  warning?: string;
}

export interface AnalysisResult {
  title: string;
  description: string;
  tags: string[];
  colorPalette: string[];
  replicationPrompt: string;
}

export interface RaindropLink {
  _id: number;
  title: string;
  link: string;
  excerpt: string;
  note: string;
  type: "link" | "article" | "image" | "video" | "document" | "audio";
  user: {
    $id: number;
  };
  cover: string;
  media: Array<{
    link: string;
    type: string;
  }>;
  tags: string[];
  important: boolean;
  reminder?: {
    date: string;
  };
  removed: boolean;
  created: string;
  lastUpdate: string;
  domain: string;
  creatorRef: string;
  sort: number;
  collectionId: number;
}

export interface RaindropCollection {
  _id: number;
  title: string;
  description: string;
  user: {
    $id: number;
  };
  public: boolean;
  view: string;
  count: number;
  cover: string[];
  sort: number;
  expanded: boolean;
  creatorRef: string;
  lastAction: string;
  created: string;
  lastUpdate: string;
}

export interface RaindropApiResponse<T> {
  result: boolean;
  items: T[];
  count: number;
  collectionId?: number;
}

export interface RaindropUserInfo {
  _id: number;
  name: string;
  email: string;
  avatar: string;
  pro: boolean;
  premium: boolean;
  groups: Array<{
    title: string;
    collections: number[];
  }>;
}

export interface FetchLinksOptions {
  collectionId?: number;
  page?: number;
  perpage?: number;
  sort?:
    | "title"
    | "-title"
    | "domain"
    | "-domain"
    | "created"
    | "-created"
    | "score"
    | "-score";
  search?: string;
  important?: boolean;
  tags?: string[];
}

export interface PaginationInfo {
  page: number;
  perpage: number;
  total: number;
  hasMore: boolean;
}

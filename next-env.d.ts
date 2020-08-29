/// <reference types="next" />
/// <reference types="next/types/global" />
import "styled-components";

declare global {
  interface Window {
    gtag: Function;
  }
}
declare module "styled-components" {
  export interface DefaultTheme {
    borderRadius: string;
    body: string;
    invertBody: string;
    text: string;
    invertText: string;
    toggleBorder: string;
    gradient: string;
    inputFill: string;

    colors: {
      primary: string;
      secondary: string;
      link: string;
    };

    card: {
      backgroundColor: string;
    };
  }
}

export interface Blog {
  id: number;
  description: string;
  created_at: string;
  updated_at: string;
  posts: Post[];
}

export interface Post {
  title: string;
  excerpt: string;
  private: boolean;
  slug: string;
  content: string;
  type: PostType;
  hero: Media;
  posted_at: string;
}

export enum PostType {
  til,
  personal,
  public,
  finance,
  tech,
  music,
  arts,
}

export interface Media {}

export interface JobHistory {
  id: number;
  created_at: string;
  updated_at: string;
  Jobs: Job[];
}

export interface Job {
  id: number;
  company: string;
  website: string;
  position: string;
  start: string;
  end: string;
  description: string;
  descriptionHtml: string;
  logo: Logo;
}

interface Logo {
  id: number;
  name: string;
  alternativeText: string;
  caption: string;
  width: number;
  height: number;
  formats: any;
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl: string;
  provider: string;
  created_at: string;
  updated_at: string;
}

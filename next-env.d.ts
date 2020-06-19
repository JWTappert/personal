/// <reference types="next" />
/// <reference types="next/types/global" />
// import original module declarations
import "styled-components";

// and extend them!
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
    };

    card: {
      backgroundColor: string;
    };
  }
}

export interface Post {
  title: string;
  slug: string;
  content: string;
  type: PostType;
  created_at: string;
  updated_at: string;
}

export enum PostType {
  til,
  personal,
  public,
}

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

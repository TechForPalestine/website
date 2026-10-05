export interface Tag {
  id: number;
  name: string;
  type: string;
}

export interface ProjectItem {
  id: number;
  name: string;
  description: string;
  impactStatement?: string;
  elevatorPitch?: string;
  websiteUrl?: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
  leadName?: string;
  leaderPhoto?: string;
  leaderBio?: string;
  publicEmail?: string;
  donationUrl?: string;
  involvementUrl?: string;
  categoryName?: string;
  discordUsername?: string;
  mentor?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  youtubeUrl?: string;
  telegramUrl?: string;
  mastodonUrl?: string;
  blueskyUrl?: string;
  tiktokUrl?: string;
  signalUrl?: string;
  upscrolledUrl?: string;
  tags?: Tag[];
  featured?: boolean;
}

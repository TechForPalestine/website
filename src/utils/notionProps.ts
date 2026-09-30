/** Builders for the Notion page property shapes the write routes send. */

const text = (content: string) => [{ text: { content } }];

export const titleProp = (content: string) => ({ title: text(content) });
export const richTextProp = (content: string) => ({ rich_text: text(content) });
export const urlProp = (url: string) => ({ url });
export const emailProp = (email: string) => ({ email });

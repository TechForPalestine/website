import axios from 'axios';


const NOTION_SECRET = import.meta.env.NOTION_SECRET;
const NOTION_DB_ID = import.meta.env.NOTION_DB_ID;

const notionAxios = axios.create({
    baseURL: "https://api.notion.com/v1/",
    headers: {
        "Authorization": `Bearer ${NOTION_SECRET}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
    },
});
export const fetchNotionEvents = async () => {
    const response = await notionAxios.post(`databases/${NOTION_DB_ID}/query`);

    console.log("res",response.data.results)
    return response.data.results.map((page: any) => {
        const props = page.properties;

        return {
            title: props.Name?.title?.[0]?.plain_text || "Untitled",
            date: props.Date?.date?.start || "",
            status: props.Status?.select?.name || "",
            location: props.Location?.select?.name || "",
            image:
                page.cover?.external?.url ||
                page.cover?.file?.url ||
                "/images/default.jpg",
            link: page.url,
        };
    });
};

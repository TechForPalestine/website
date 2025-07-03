import axios from 'axios';


const NOTION_SECRET = import.meta.env.NOTION_SECRET;
const NOTION_DB_ID = import.meta.env.NOTION_DB_ID;
const NOTION_PROJECTS_DB_ID = import.meta.env.NOTION_PROJECTS_DB_ID;

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

    if (!NOTION_DB_ID) console.warn("NOTION_DB_ID is missing");
    const events = response.data.results.map((page: any) => {
        const props = page.properties;

        let headerImage = "";
        if (props["Header"]?.files?.length > 0) {
            const file = props["Header"].files[0];
            if (file.type === "external") {
                headerImage = file.external.url;
            } else if (file.type === "file") {
                headerImage = file.file.url;
            }
        }

        const description =
            props["Description"]?.rich_text?.[0]?.plain_text || "";

        const registerLink = props["Link to registration"]?.url || "";
        const recordingLink = props["Link to recording"]?.url || "";
        return {
            id: page.id,
            title: props["Title"]?.title?.[0]?.plain_text || "Untitled",
            date: props["Date of event"]?.date?.start || "",
            status: props["Stage"]?.select?.name || "",
            location: props["Type of event"]?.multi_select?.[0]?.name || "",
            image: headerImage || "/images/default.jpg",
            link: page.url,
            description,
            registerLink,
            recordingLink,
        };
    });

    // Sort by date (ascending)
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};
export const fetchProjectsFromNotion = async () => {
    if (!NOTION_DB_ID) {
        throw new Error("Missing Notion credentials");
    }

    const res  = await notionAxios.post(
        `databases/${NOTION_PROJECTS_DB_ID}/query`,

    );
    const results = res.data.results;

    return results.map((page: any) => {
        const props = page.properties;

        const title = props["Project Name"]?.rich_text?.[0]?.plain_text ?? "Untitled Project";

        const description = props["Project Description"]?.rich_text?.[0]?.plain_text ?? "";

        const website = props["Website URL"]?.url ?? "";

        const discord_channel = props["Co-Founders Discord Username(s)"]?.rich_text?.[0]?.plain_text ?? "";

        return {
            project_name: title,
            elevator_pitch: description,
            website,
            discord_channel,
        };
    });
};
export const fetchNotionEventById = async (pageId: string) => {

    const response = await notionAxios.get(`pages/${pageId}`);

    const props = response.data.properties;

    // Image from "Header" files property
    let headerImage = "";
    if (props["Header"]?.files?.length > 0) {
        const file = props["Header"].files[0];
        if (file.type === "external") {
            headerImage = file.external.url;
        } else if (file.type === "file") {
            headerImage = file.file.url;
        }
    }

    const description = props["Description"]?.rich_text?.[0]?.plain_text || "";
    const registerLink = props["Link to registration"]?.url || "";
    const recordingLink = props["Link to recording"]?.url || "";

    return {
        id: response.data.id,
        title: props["Title"]?.title?.[0]?.plain_text || "Untitled",
        date: props["Date of event"]?.date?.start || "",
        status: props["Stage"]?.select?.name || "",
        location: props["Type of event"]?.multi_select?.[0]?.name || "",
        image: headerImage || "/images/default.jpg",
        link: response.data.url,
        description,
        registerLink,
        recordingLink,
    };
};

import { OpenAI } from "openai";
import { DECIDE_TOOLKIT_SYSTEM_TEMPLATE } from "./prompt";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});


export const decide_toolkit = async (user_prompt: string) => {

    const toolkits = "GMAIL, GOOGLE_DRIVE, GOOGLE_SPREADSHEET, GITHUB, BRAVE_SEARCH";

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: DECIDE_TOOLKIT_SYSTEM_TEMPLATE.replace("{toolkits}", toolkits) },
            { role: "user", content: user_prompt }
        ],
    });

    console.log(response.choices[0].message.content);
}

decide_toolkit("Research a company online and draft an investment memo.");
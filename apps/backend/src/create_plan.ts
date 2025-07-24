import { OpenAI } from "openai";
import { PLAN_SYSTEM_TEMPLATE, PLAN_CHAT_EXAMPLE, PLAN_EXAMPLE_LIST } from "./prompt";
import { decide_toolkit } from "./decide_toolkit";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const user_prompt = "I want to convert the JD's in my google drive to linkedin format";

const toolkits = await decide_toolkit(user_prompt);


const createPlan = async (user_prompt: string) => {

    const system_prompt = PLAN_SYSTEM_TEMPLATE.replace("{example_prompt}", PLAN_CHAT_EXAMPLE).replace("{tools}", toolkits ?? "");


    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: system_prompt },
            { role: "user", content: user_prompt },
        ],
    });

    console.log(response.choices[0].message.content);

}

createPlan(user_prompt);

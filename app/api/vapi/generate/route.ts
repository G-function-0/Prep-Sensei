import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";
import { GenerateContentResponse, GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});



export async function GET() {
    return Response.json({ success : true, data : 'THANK YOU!'},{ status : 200});
}

export async function POST(request: Request) {
    const { type, role, level, techstack, amount, userid } = await request.json();
    
    try {
        const response : GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Prepare questions for a job interview.
            The job role is ${role}.
            The job experience level is ${level}.
            The tech stack used in the job is: ${techstack}.
            The focus between behavioural and technical questions should lean towards: ${type}.
            The amount of questions required is: ${amount}.
            Please return only the questions, without any additional text.
            The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
            Return the questions formatted like this:
            ["Question 1", "Question 2", "Question 3"]
            
            Thank you! <3`,
        });

        //undefinded check (ONLY FOR TS)
        const normalizedResponse = response.text;
        if(!normalizedResponse){
            return Response.json(
                {  
                    success: false, error: "No text returned from Gemini" },
                        { status: 500 }
                    );
 
        }


        const interview = {
            role: role,
            type: type,
            level: level,
            techstack: techstack.split(","),
            questions: JSON.parse(normalizedResponse),
            userId: userid,
            finalized: true,
            coverImage: getRandomInterviewCover(),
            createdAt: new Date().toISOString(),
        };

        
        await db.collection("interviews").add(interview);
        return Response.json({ success: true }, { status: 200 });

        
    } 
    
    catch (error) {
        
        console.error("Error:", error);
        return Response.json({ success: false, error: error }, { status: 500 });
    }
}





























// import { generateText } from "ai";
// import { google } from "@ai-sdk/google";

// import { db } from "@/firebase/admin";
// import { getRandomInterviewCover } from "@/lib/utils";

// export async function POST(request: Request) {
//   const { type, role, level, techstack, amount, userid } = await request.json();

//   try {
//     const { text: questions } = await generateText({
//       model: google("gemini-2.0-flash-001"),
//       prompt: `Prepare questions for a job interview.
//         The job role is ${role}.
//         The job experience level is ${level}.
//         The tech stack used in the job is: ${techstack}.
//         The focus between behavioural and technical questions should lean towards: ${type}.
//         The amount of questions required is: ${amount}.
//         Please return only the questions, without any additional text.
//         The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
//         Return the questions formatted like this:
//         ["Question 1", "Question 2", "Question 3"]
        
//         Thank you! <3
//     `,
//     });

//     const interview = {
//       role: role,
//       type: type,
//       level: level,
//       techstack: techstack.split(","),
//       questions: JSON.parse(questions),
//       userId: userid,
//       finalized: true,
//       coverImage: getRandomInterviewCover(),
//       createdAt: new Date().toISOString(),
//     };

//     await db.collection("interviews").add(interview);

//     return Response.json({ success: true }, { status: 200 });
//   } catch (error) {
//     console.error("Error:", error);
//     return Response.json({ success: false, error: error }, { status: 500 });
//   }
// }

// export async function GET() {
//   return Response.json({ success: true, data: "Thank you!" }, { status: 200 });
// }






































// import { getRandomInterviewCover } from "@/lib/utils";
// import { db } from "@/firebase/admin";
// import { GoogleGenAI } from "@google/genai";


// export async function GET() {
//     return Response.json({ success : true, data : 'THANK YOU!'},{ status : 200});
// }


// export async function POST(request : Request) {
//     const { type , role, userid, level, techstack, amount} = await request.json();
//     const API_KEY = process.env.GEMINI_API_KEY;
//     if(!API_KEY){
//         return ;
//     }
//     const ai = new GoogleGenAI({apiKey : API_KEY as string});

//     try {
//         const { text : questions } = await ai.models.generateContent({
//             model: "gemini-2.0-flash",
//             contents: `Prepare questions for a job interview.The job role is ${role}.The job experience level is ${level}.
//                     The tech stack used in the job is: ${techstack}.
//                     The focus between behavioural and technical questions should lean towards: ${type}.
//                     The amount of questions required is: ${amount}.
//                     Please return only the questions, without any additional text.
//                     The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
//                     Return the questions formatted like this:
//                     ["Question 1", "Question 2", "Question 3"]
                    
//                     Thank you! <3`
//         })

//         const interview = { 
//             role, type, level,
//             techstack : techstack.split(','),
//             questions : JSON.parse(questions),
//             userId : userid,
//             finalized : true,
//             coverImage : getRandomInterviewCover(),
//             createdAt: new Date().toISOString(),
//         }

//         await db.collection("interviews").add(interview);

//         return Response.json({success : true} , {status : 200})
//     } catch (error) {
//         console.error("Error:", error);
//         return Response.json({ success: false, error: error }, { status: 500 });
//     }
// }
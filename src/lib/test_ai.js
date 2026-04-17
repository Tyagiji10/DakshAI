import { conductInterviewStep, generateProjectRoadmap } from './src/lib/ai.js';
import dotenv from 'dotenv';
dotenv.config();

async function testAI() {
    console.log("Testing Interview Step...");
    try {
        const interview = await conductInterviewStep(
            [{ role: 'user', content: 'Hi, I am ready for the Medium level interview for the Frontend Developer role.' }],
            'Frontend Developer',
            'Medium'
        );
        console.log("Interview Response:", JSON.stringify(interview, null, 2));
    } catch (e) {
        console.error("Interview Test Failed:", e);
    }

    console.log("\nTesting Project Roadmap...");
    try {
        const roadmap = await generateProjectRoadmap('Frontend Developer', ['React', 'TypeScript']);
        console.log("Roadmap Response:", JSON.stringify(roadmap, null, 2));
    } catch (e) {
        console.error("Roadmap Test Failed:", e);
    }
}

testAI();

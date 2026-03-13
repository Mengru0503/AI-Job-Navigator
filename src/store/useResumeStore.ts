import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ResumeData } from "../types";

// Lai Mengru 的履歷資料（預設已載入）
const MENGRU_RESUME_TEXT = `Name: Lai Mengru
Location: Taiwan
Target Role: Front-End Developer / Web Front-End Engineer / UI Engineer
Portfolio: https://mengru0503.github.io/Resume/
GitHub: https://github.com/Mengru0503

== Summary ==
Front-end developer with a background in design, digital content planning, and multimedia production.
Skilled in HTML, CSS, JavaScript and React.
Experienced in building responsive web interfaces, interactive UI components, and collaborating on web projects using Git and GitHub.
Strong ability to bridge design and engineering by translating UI concepts into functional web applications.

== Skills ==

Frontend: HTML5, CSS3, JavaScript, React
Web Development: Responsive Web Design (RWD), Flexbox, CSS Grid, Bootstrap
Tools: Git, GitHub, VS Code, Figma
Design: UI Design, Web Visual Design, Multimedia Design, Video Editing

== Projects ==

1. InnerSoul
   Description: An emotion interaction web application that visualizes users' emotional states through interactive UI elements.
   Responsibilities: UI design, Frontend development, Interactive animation implementation
   Tech Stack: React, JavaScript, CSS
   Repository: https://github.com/aitong0113/InnerSoul

2. InsightCard
   Description: Interactive card application that allows users to draw cards randomly with animated visual effects.
   Responsibilities: Frontend implementation, UI interaction design, Animation effects
   Tech Stack: JavaScript, HTML, CSS
   Repository: https://github.com/Mengru0503/insightCard

3. URBNSTEP E-commerce Website
   Description: Front-end implementation of an e-commerce website based on a design mockup.
   Responsibilities: Layout implementation, Responsive design, Product listing page UI
   Tech Stack: HTML, CSS, Bootstrap
   Repository: https://github.com/Mengru0503/week4

4. Happiness Cookie E-commerce Website
   Description: Team project for developing an online cookie shop website.
   Responsibilities: Frontend development, UI design, Website structure planning
   Tech Stack: HTML, CSS, JavaScript
   Repository: https://github.com/happinesscookie530/Happinesscookie

== Background ==
Previous experience includes marketing planning, multimedia design, video production, and administrative coordination.
This background helps bridge communication between design and engineering teams and improves user experience design thinking.

== Strengths ==
- Design and engineering hybrid background
- Ability to translate UI design into functional web interfaces
- Experience collaborating on GitHub projects
- Strong interest in AI-driven applications and modern web development

== Career Goal ==
Seeking a front-end developer position where design thinking and engineering skills can be combined to build interactive and user-friendly web products.
`;

const defaultResume: ResumeData = {
    resumeText: MENGRU_RESUME_TEXT,
    sourceType: "text",
    parsedAt: Date.now(),
};

interface ResumeStore {
    resume: ResumeData | null;
    setResume: (data: ResumeData) => void;
    clearResume: () => void;
}

export const useResumeStore = create<ResumeStore>()(
    persist(
        (set) => ({
            resume: defaultResume,
            setResume: (data) => set({ resume: data }),
            clearResume: () => set({ resume: null }),
        }),
        {
            name: "ai-job-navigator-resume",
            // 若 localStorage 中 resume 為 null（舊快取），自動補上預設履歷
            merge: (persisted, current) => {
                const p = persisted as Partial<ResumeStore> | null;
                if (!p || p.resume === null || p.resume === undefined) {
                    return { ...current, resume: defaultResume };
                }
                return { ...current, ...p };
            },
        }
    )
);

// The only material Qubiq (the portfolio assistant) may use as facts about Razib.
// Small, single-topic entries retrieve far better than a few long ones: a question about one project
// pulls in that project, not all of them. `keys` adds words a visitor might use that the text does not
// (synonyms, and Bangla, so questions in Bangla find the right facts too). Keep every fact in step with the page.
module.exports = [
  {
    id: 'overview', label: 'Razib at a glance', href: '#about',
    keys: 'who overview summary introduce introduction tell about him profile রাজিব কে পরিচয় সম্পর্কে',
    text: `Razib Miah is a full-stack engineer in Dhaka, Bangladesh, who also works in AI/ML and quantum machine learning (QML). He builds fast web products end to end, trains ML models, and explores how quantum computing can make machine learning smarter. He studies Computer Science and Engineering at Daffodil International University. His featured projects are DLAS, FieldShift 360, KormoPath, Kotha and ShasthoGrid. He was 2nd Runner-up at the Legal-Tech Hackathon 2026, a Top 20 finalist at the YUNet AIgnite Buildathon 2026, and a prize winner at Agent X.`
  },
  {
    id: 'contact', label: 'Contact and availability', href: '#contact',
    keys: 'contact email mail hire hiring available availability job role freelance full-time work together reach message time zone remote যোগাযোগ ইমেইল চাকরি ফ্রিল্যান্স নিয়োগ কাজ',
    text: `Razib is based in Dhaka, Bangladesh (UTC+6) and works remotely with teams in other time zones. He is open to full-time roles, freelance projects and research collaborations. His email is razibmiah2003@gmail.com, and the Contact section has a form; he usually replies within a day.`
  },
  {
    id: 'skills-core', label: 'Skills: languages, web and backend', href: '#skills',
    keys: 'skills stack tech technologies programming languages frontend backend web api database দক্ষতা স্কিল প্রোগ্রামিং ভাষা',
    text: `Languages: TypeScript, Python, Go, C# and Rust. Frontend: React, Next.js, TypeScript, Tailwind CSS, Storybook and Playwright; design systems, Core Web Vitals and performance, accessibility, and state and data fetching. Backend: Python with FastAPI, Django, Flask, Pydantic, SQLAlchemy, Celery and Uvicorn, plus Go, C#, Rust, Node.js, Fastify, gRPC, Redis Streams and OpenTelemetry; REST and GraphQL API design, async Python APIs, background jobs and task queues, event-driven services, payments and auth, and observability.`
  },
  {
    id: 'skills-data', label: 'Skills: data, infrastructure and leadership', href: '#skills',
    keys: 'devops cloud infrastructure database data docker kubernetes aws terraform ci cd deploy leadership mentoring team tools ডেটা ক্লাউড',
    text: `Data and infrastructure: PostgreSQL, PostGIS, Docker, Kubernetes, AWS and Terraform; schema design and query tuning, caching and read replicas, CI/CD with preview deploys, and infrastructure as code. Leadership: mentoring and code review, RFCs and incident reports, honest estimates, and hackathon team lead, using GitHub Projects, Linear, Notion, Slack and Figma.`
  },
  {
    id: 'skills-ai', label: 'Skills: AI/ML and quantum', href: '#skills',
    keys: 'ai ml machine learning deep learning llm rag nlp vision pytorch tensorflow hugging face quantum qiskit pennylane cirq এআই মেশিন লার্নিং কোয়ান্টাম',
    text: `AI/ML: machine learning models, deep learning, NLP and computer vision, and LLM apps and RAG, with Python, PyTorch, TensorFlow, scikit-learn, Hugging Face and pgvector. Quantum ML: quantum circuits and gates, variational quantum algorithms, quantum kernels and neural networks, and hybrid quantum-classical models, with Qiskit, PennyLane, Cirq, NumPy and PyTorch.`
  },
  {
    id: 'project-dlas', label: 'Project: DLAS', href: '#projects',
    keys: 'dlas digital legal aid system voice agent law legal justice bangla voice project built প্রজেক্ট আইন আইনি সহায়তা',
    text: `DLAS (Digital Legal Aid System) is a Bangla voice-first legal aid platform, a gov-tech project from 2026. A citizen calls a Bangla voice agent to report a legal problem and gets a case ID, then tracks the case online while legal aid officers, panel lawyers and mediators handle it in their own portals. It uses Next.js, TypeScript and Cloudflare Workers. It won 2nd Runner-up at the Legal-Tech Hackathon 2026. Live site: legal-voice-agent.adribmahmud.workers.dev; code: github.com/razibr246/Digital-Legal-Aid-System.`
  },
  {
    id: 'project-fieldshift', label: 'Project: FieldShift 360', href: '#projects',
    keys: 'fieldshift field shift 360 crop rotation farming agriculture farmer nasa earth observation satellite space apps project প্রজেক্ট কৃষি ফসল',
    text: `FieldShift 360 is a crop-rotation decision tool for Bangladesh, built for the NASA Space Apps challenge in 2026. It combines 25 seasons of NASA Earth observations to compare soil health, water use, income and weather risk, with farmer and officer views in Bangla and English. Live site: fieldshift360.vercel.app; code: github.com/razibr246/fieldshift360.`
  },
  {
    id: 'project-kormopath', label: 'Project: KormoPath', href: '#projects',
    keys: 'kormopath kormo path tools platform life work study money budget health farming safety bangla-first local-first aignite project প্রজেক্ট কর্মপথ',
    text: `KormoPath is a Bangla-first platform with 12 tools for the journey from study to work and everyday life: opportunities, contracts and payouts, household budgets, health, farming and safety. It needs no sign-up, keeps personal data on the device, and money calculations follow fixed rules with their sources shown. Razib pitched it at the YUNet AIgnite Buildathon 2026, where it made the Top 20. Live site: kormopath.vercel.app; code: github.com/razibr246/Kormopath.`
  },
  {
    id: 'project-kotha', label: 'Project: Kotha', href: '#projects',
    keys: 'kotha support agent chatbot shop orders customer service bilingual grounded answers rag project প্রজেক্ট কথা',
    text: `Kotha is a bilingual shop support agent from 2026. It answers order questions in Bangla and English using help documents and order data, and shows the sources behind each answer. It uses Python and PostgreSQL. Code: github.com/razibr246/Kotha.`
  },
  {
    id: 'project-shasthogrid', label: 'Project: ShasthoGrid', href: '#projects',
    keys: 'shasthogrid shastho grid health healthcare hospital clinical medical icu blood antibiotic who aware news2 ventilator or-tools project প্রজেক্ট স্বাস্থ্য হাসপাতাল',
    text: `ShasthoGrid is a clinical decision-support platform for Bangladesh from 2026. It checks antibiotics against WHO AWaRe guidance, scores patients with NEWS2, and matches critical patients to a staffed ICU bed and compatible blood with Google OR-Tools CP-SAT, using race-proof bookings (PostgreSQL row locks and idempotency keys) so the last bed is never given twice. It works offline and in Bangla and English, and licensed clinicians always make the final decision. Live site: shasthogrid.vercel.app.`
  },
  {
    id: 'research', label: 'Research interests', href: '#research',
    keys: 'research interests paper study collaborate collaboration quantum machine learning variational kernels applied ai ar vr গবেষণা',
    text: `Razib's research interests sit where machine learning meets quantum computing: variational quantum circuits, quantum kernels and hybrid quantum-classical models. He also works on applied AI for Bangladesh, such as the DLAS voice agent, and on AR/VR as an Executive Member of the Research Wing at DIU's AR/VR & Game Development Lab. He is open to research collaborations.`
  },
  {
    id: 'ach-aignite', label: 'Achievement: YUNet AIgnite Buildathon 2026', href: '#achievements',
    keys: 'aignite yunet ostad buildathon finalist top 20 hackathon competition award certificate presidency kormopath won win অর্জন হ্যাকাথন প্রতিযোগিতা পুরস্কার',
    text: `Razib was a Top 20 finalist at Ostad Presents YUNet AIgnite Buildathon 2026, a national AI hackathon for consumer (B2C) solutions with 425 participants. He pitched KormoPath at the Grand Finale on 21 November 2026 at Presidency University, Dhaka, and received a Certificate of Excellence.`
  },
  {
    id: 'ach-legaltech', label: 'Achievement: Legal-Tech Hackathon 2026', href: '#achievements',
    keys: 'legal-tech legal tech hackathon undp runner-up 2nd prize award won win team law debuggers dlas competition national অর্জন হ্যাকাথন পুরস্কার জিতেছে',
    text: `With Team Law Debuggers, an inter-university team with three Daffodil International University students, Razib won 2nd Runner-up at the Legal-Tech Hackathon 2026 (26–27 September 2026, Krishibid Institution Bangladesh, Dhaka), placing in the Top 10 of 194 teams with DLAS. It was run by the Directorate of Bangladesh Legal Aid with support from UNDP Bangladesh and the European Union. The prize was BDT 15,000, trophies and certificates.`
  },
  {
    id: 'ach-agentx', label: 'Achievement: Agent X', href: '#achievements',
    keys: 'agent x agentx prompting prompt competition netcom microsoft prize winner 30th top 50 award won win অর্জন প্রতিযোগিতা পুরস্কার',
    text: `Razib ranked 30th nationwide among the Top 50 prize winners of Agent X, an AI prompting competition by NetCom Learning Bangladesh and Microsoft, with more than 50,000 participants from 47+ universities. He received his prize at the ceremony on 16 November 2025 at Daffodil International University.`
  },
  {
    id: 'experience', label: 'Experience and learning journey', href: '#experience',
    keys: 'experience journey career history learning since years background অভিজ্ঞতা',
    text: `Razib has been learning full-stack development since 2025 (React, Next.js and TypeScript on the frontend; Python FastAPI and Node.js on the backend), learning AI/ML and building projects since 2026, and exploring quantum computing and quantum machine learning since 2026.`
  },
  {
    id: 'clubs', label: 'Clubs and leadership', href: '#experience',
    keys: 'club clubs society lab executive member leadership ar vr game development daffodil ai club volunteer ক্লাব',
    text: `At DIU's AR/VR & Game Development Lab (hybrid), Razib has been an Executive Member of the Research Wing since July 2026, after being a member from May 2025 to June 2026. He was an Executive Member of Daffodil AI Club from January to October 2026, selected for the executive body through the club's recruitment interview process.`
  },
  {
    id: 'education', label: 'Education', href: '#education',
    keys: 'education study studies university degree bachelor bsc cse diu daffodil college student year শিক্ষা পড়াশোনা বিশ্ববিদ্যালয় ড্যাফোডিল',
    text: `Razib is studying for a B.Sc. in Computer Science and Engineering at Daffodil International University (DIU) in Dhaka, from January 2025 to December 2028.`
  },
  {
    id: 'beyond', label: 'Beyond the Code: hobbies', href: '#beyond',
    keys: 'hobby hobbies free time outside work stories story poetry poems poem books reading photography photos blog writing শখ গল্প কবিতা বই ছবি ফটোগ্রাফি ব্লগ লেখা',
    text: `Outside code, Razib writes stories and poetry, reads books, and takes photographs. The Beyond the Code section collects his stories, poems, reading list and photos, and his blog posts appear there automatically.`
  },
  {
    id: 'creative-lab', label: 'Creative lab', href: '#beyond',
    keys: 'creative lab experiments animation canvas heartbeat heart particles science universe simulations physics chemistry maths mathematics geometry biology quantum astronomy sorting climate engineering',
    text: `The Creative lab holds Razib's experiments in code and motion, each on its own page and built with plain Canvas and JavaScript. Heartbeat is a 3D heart drawn by thousands of glowing particles that beats, reacts to the pointer, and bursts and rebuilds itself when tapped. The Infinite Science Universe has ten interactive worlds built on real formulas: gravity and Kepler's laws, hydrogen orbitals, the Mandelbrot set, Platonic solids and a 4D tesseract, DNA, the double-slit experiment, star colour from Planck's and Wien's laws, sorting algorithms, Earth's climate as an energy balance, and a car suspension as a damped spring.`
  },
  {
    id: 'portfolio-site', label: 'About this portfolio', href: '#hero',
    keys: 'website site portfolio built how made qubiq assistant you yourself rust webassembly wasm vercel',
    text: `This portfolio is a static site in plain HTML, CSS and JavaScript on Vercel, with a small Rust module compiled to WebAssembly for the turning Bloch sphere on the Quantum ML card. Qubiq, the assistant, answers from the portfolio's own content using Gemini.`
  }
];
